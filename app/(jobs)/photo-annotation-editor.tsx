import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
    Canvas,
    Path as SkiaPath,
    Skia,
    PaintStyle,
    StrokeCap,
    StrokeJoin,
    useImage,
    Image as SkiaImage,
} from '@shopify/react-native-skia';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors } from '@/utils/colors';

// ToolType: only 'circle' is active. Brush variant is archived below.
type ToolType = 'circle';

interface PathData {
    path: ReturnType<typeof Skia.Path.Make>;
    paint: ReturnType<typeof Skia.Paint>;
}

interface CirclePreview {
    x: number;
    y: number;
    r: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoAnnotationEditor() {
    const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const canvasRef = useRef<any>(null);

    // React state for rendering
    const [brushColor, setBrushColor] = useState('#ef4444');
    const [brushSize, setBrushSize] = useState(5);
    const [paths, setPaths] = useState<PathData[]>([]);
    const [redoStack, setRedoStack] = useState<PathData[]>([]);
    const [previewCircle, setPreviewCircle] = useState<CirclePreview | null>(null);
    const [circleStart, setCircleStart] = useState<{ x: number; y: number } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Shared values for worklet (real-time drawing)
    const brushColorRef = useSharedValue('#ef4444');
    const brushSizeRef = useSharedValue(5);
    const circleStartRef = useSharedValue<{ x: number; y: number } | null>(null);
    const previewCircleRef = useSharedValue<{ x: number; y: number; r: number } | null>(null);

    const skiaImage = useImage(photoUri ?? undefined);

    const createPaint = useCallback((color: string, size: number) => {
        const paint = Skia.Paint();
        paint.setColor(Skia.Color(color));
        paint.setStrokeWidth(size);
        paint.setStyle(PaintStyle.Stroke);
        paint.setStrokeCap(StrokeCap.Round);
        paint.setStrokeJoin(StrokeJoin.Round);
        return paint;
    }, []);

    const canUndo = paths.length > 0;
    const canRedo = redoStack.length > 0;

    const commitCirclePath = useCallback((circleData: CirclePreview, color: string, size: number) => {
        if (circleData.r > 0) {
            const circlePath = Skia.Path.Make();
            circlePath.addCircle(circleData.x, circleData.y, circleData.r);
            const paint = createPaint(color, size);
            setPaths(prev => [...prev, { path: circlePath, paint }]);
            setRedoStack([]);
        }
        setPreviewCircle(null);
    }, [createPaint]);

    const handleCircleGestureStart = useCallback((x: number, y: number) => {
        setCircleStart({ x, y });
        setPreviewCircle({ x, y, r: 0 });
    }, []);

    const handleCircleGestureUpdate = useCallback((x: number, y: number, r: number) => {
        setPreviewCircle({ x, y, r });
    }, []);

    const handleCircleGestureEnd = useCallback(() => {
        setPreviewCircle(null);
        setCircleStart(null);
    }, []);

    // Circle gesture - handles tap-drag circle drawing
    const circleGesture = Gesture.Pan()
        .onStart((e) => {
            'worklet';
            const start = { x: e.x, y: e.y };
            circleStartRef.value = start;
            previewCircleRef.value = { x: e.x, y: e.y, r: 0 };
            runOnJS(handleCircleGestureStart)(e.x, e.y);
        })
        .onUpdate((e) => {
            'worklet';
            const start = circleStartRef.value;
            if (!start) return;
            const radius = Math.sqrt(
                Math.pow(e.x - start.x, 2) +
                Math.pow(e.y - start.y, 2)
            );
            const circle = { x: start.x, y: start.y, r: radius };
            previewCircleRef.value = circle;
            runOnJS(handleCircleGestureUpdate)(start.x, start.y, radius);
        })
        .onEnd(() => {
            'worklet';
            const circle = previewCircleRef.value;
            if (circle && circle.r > 0) {
                const color = brushColorRef.value;
                const size = brushSizeRef.value;
                runOnJS(commitCirclePath)(circle, color, size);
            }
            circleStartRef.value = null;
            previewCircleRef.value = null;
            runOnJS(handleCircleGestureEnd)();
        });

    // BRUSH TOOL REMOVED (see archived section below)
    const drawGesture = circleGesture;

    const handleColorChange = useCallback((color: string) => {
        setBrushColor(color);
        brushColorRef.value = color;
    }, [brushColorRef]);

    const handleSizeChange = useCallback((size: number) => {
        setBrushSize(size);
        brushSizeRef.value = size;
    }, [brushSizeRef]);

    const handleUndo = useCallback(() => {
        if (paths.length === 0) return;
        const lastPath = paths[paths.length - 1];
        setPaths(prev => prev.slice(0, -1));
        setRedoStack(prev => [lastPath, ...prev]);
    }, [paths]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const [first, ...rest] = redoStack;
        setPaths(prev => [...prev, first]);
        setRedoStack(rest);
    }, [redoStack]);

    const handleClear = useCallback(() => {
        setPaths([]);
        setRedoStack([]);
        setPreviewCircle(null);
    }, []);

    const handleSave = useCallback(async () => {
        if (!photoUri || !canvasRef.current) {
            router.back();
            return;
        }

        setIsSaving(true);

        try {
            // Create snapshot from canvas
            const snapshot = canvasRef.current.makeImageSnapshot();
            if (!snapshot) {
                console.error('[PhotoAnnotation] Failed to create snapshot');
                router.replace({
                    pathname: '/(jobs)/camera',
                    params: { annotatedPhotoUri: photoUri }
                });
                return;
            }

            // Encode to base64
            const base64 = snapshot.encodeToBase64();

            // Generate unique filename
            const filename = `annotated_${Date.now()}.png`;
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;

            // Save to filesystem
            await FileSystem.writeAsStringAsync(
                fileUri,
                base64,
                { encoding: FileSystem.EncodingType.Base64 }
            );

            console.log('[PhotoAnnotation] Saved annotated image to:', fileUri);

            // Navigate with new annotated image URI
            router.replace({
                pathname: '/(jobs)/camera',
                params: { annotatedPhotoUri: fileUri }
            });
        } catch (error) {
            console.error('[PhotoAnnotation] Error saving:', error);
            // Fallback to original
            router.replace({
                pathname: '/(jobs)/camera',
                params: { annotatedPhotoUri: photoUri }
            });
        } finally {
            setIsSaving(false);
        }
    }, [photoUri, paths, router]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    const colors = [
        { color: '#ef4444', name: 'Red' },
        { color: '#22c55e', name: 'Green' },
        { color: '#3b82f6', name: 'Blue' },
        { color: '#eab308', name: 'Yellow' },
        { color: '#a855f7', name: 'Purple' },
        { color: '#ffffff', name: 'White' },
    ];

    const sizes = [
        { size: 3, label: 'S' },
        { size: 5, label: 'M' },
        { size: 8, label: 'L' },
        { size: 12, label: 'XL' },
    ];

    // Paint for circle preview rendering
    const previewPaint = createPaint(brushColor, brushSize);

    // Build preview circle path (addCircle returns void, must be done separately)
    const previewCirclePath = previewCircle && previewCircle.r > 0
        ? (() => { const p = Skia.Path.Make(); p.addCircle(previewCircle.x, previewCircle.y, previewCircle.r); return p; })()
        : null;

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar style="light" backgroundColor="#000" translucent={true} />
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Canvas Area */}
            <View style={styles.canvasContainer}>
                {photoUri && skiaImage ? (
                    <Canvas ref={canvasRef} style={styles.canvas}>
                        {/* Background photo */}
                        <SkiaImage
                            image={skiaImage}
                            x={0}
                            y={0}
                            width={SCREEN_WIDTH}
                            height={SCREEN_HEIGHT}
                            fit="contain"
                        />
                        {/* Existing paths - render from React state */}
                        {paths.map((p, i) => (
                            <SkiaPath
                                key={`path-${i}`}
                                path={p.path}
                                paint={p.paint}
                            />
                        ))}
                        {/* Preview circle - render from React state */}
                        {previewCirclePath && (
                            <SkiaPath
                                path={previewCirclePath}
                                paint={previewPaint}
                            />
                        )}
                    </Canvas>
                ) : !photoUri ? (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No image provided</Text>
                        <Text style={styles.subPlaceholderText}>photoUri: missing</Text>
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Loading image...</Text>
                    </View>
                )}

                {/* Gesture detector overlay */}
                <GestureDetector gesture={drawGesture}>
                    <View style={styles.gestureOverlay} />
                </GestureDetector>
            </View>

            {/* Toolbar */}
            <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>
                {/* Color Picker */}
                <View style={styles.colorPicker}>
                    {colors.map((c) => (
                        <Pressable
                            key={c.color}
                            onPress={() => handleColorChange(c.color)}
                            style={[
                                styles.colorButton,
                                { backgroundColor: c.color },
                                brushColor === c.color && styles.colorButtonActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Size Selector */}
                <View style={styles.sizeSelector}>
                    {sizes.map((s) => (
                        <Pressable
                            key={s.size}
                            onPress={() => handleSizeChange(s.size)}
                            style={[
                                styles.sizeButton,
                                brushSize === s.size && styles.sizeButtonActive,
                            ]}
                        >
                            <View
                                style={[
                                    styles.sizeIndicator,
                                    { width: s.size * 1.5, height: s.size * 1.5 },
                                ]}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                    {/* Undo / Redo */}
                    <View style={styles.undoRedoGroup}>
                        <Pressable
                            onPress={handleUndo}
                            style={[styles.actionButton, !canUndo && styles.actionButtonDisabled]}
                            disabled={!canUndo}
                        >
                            <IconSymbol
                                name="arrow.left"
                                size={20}
                                color={canUndo ? Colors.White : Colors.Gray}
                            />
                        </Pressable>

                        <Pressable
                            onPress={handleRedo}
                            style={[styles.actionButton, !canRedo && styles.actionButtonDisabled]}
                            disabled={!canRedo}
                        >
                            <IconSymbol
                                name="arrow.clockwise"
                                size={20}
                                color={canRedo ? Colors.White : Colors.Gray}
                            />
                        </Pressable>
                    </View>

                    {/* Clear All */}
                    <Pressable
                        onPress={handleClear}
                        style={styles.actionButton}
                    >
                        <IconSymbol
                            name="trash"
                            size={20}
                            color={Colors.White}
                        />
                    </Pressable>

                    {/* Spacer */}
                    <View style={styles.spacer} />

                    {/* Cancel */}
                    <Pressable
                        onPress={handleCancel}
                        style={styles.cancelButton}
                        disabled={isSaving}
                    >
                        <IconSymbol name="xmark" size={20} color={Colors.White} />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    {/* Save */}
                    <Pressable
                        onPress={handleSave}
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        disabled={isSaving}
                    >
                        <IconSymbol name="checkmark" size={20} color={Colors.White} />
                        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                    </Pressable>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Secondary,
    },
    canvasContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
    },
    canvas: {
        flex: 1,
    },
    gestureOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: Colors.Gray,
        fontSize: 18,
        fontWeight: '600',
    },
    subPlaceholderText: {
        color: Colors.Gray,
        fontSize: 14,
        marginTop: 8,
    },
    toolbar: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    colorPicker: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    colorButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonActive: {
        borderColor: Colors.White,
        transform: [{ scale: 1.1 }],
    },
    sizeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    sizeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sizeButtonActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderWidth: 1,
        borderColor: Colors.Primary,
    },
    sizeIndicator: {
        borderRadius: 100,
        backgroundColor: Colors.White,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    undoRedoGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonDisabled: {
        opacity: 0.4,
    },
    spacer: {
        flex: 1,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 22,
    },
    cancelButtonText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: Colors.Primary,
        borderRadius: 22,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '600',
    },
});

/*
 * ============================================================
 * BRUSH TOOL (ARCHIVED - DO NOT USE)
 * Archived on: 2026-03-18
 * Reason: Setting aside for future restoration
 * To restore: Move code back to active section and re-enable
 * ============================================================
 *
 * --- ToolType (brush variant) ---
 * type ToolType = 'brush' | 'circle';
 *
 * --- State ---
 * const [selectedTool, setSelectedTool] = useState<ToolType>('brush');
 * const [currentPath, setCurrentPath] = useState<PathData | null>(null);
 *
 * --- Shared Values ---
 * const selectedToolRef = useSharedValue<ToolType>('brush');
 * const currentPaintRef = useSharedValue<ReturnType<typeof Skia.Paint> | null>(null);
 *
 * --- useEffect (initialize currentPaintRef on mount) ---
 * useEffect(() => {
 *     currentPaintRef.value = createPaint(brushColor, brushSize);
 * }, []);
 *
 * --- commitBrushPath ---
 * const commitBrushPath = useCallback((pathData: PathData) => {
 *     setCurrentPath(null);
 *     setPaths(prev => [...prev, pathData]);
 *     setRedoStack([]);
 * }, []);
 *
 * --- updateCurrentPathPoints ---
 * const updateCurrentPathPoints = useCallback((x: number, y: number) => {
 *     setCurrentPath(prev => {
 *         if (!prev) return null;
 *         prev.path.lineTo(x, y);
 *         return { ...prev };
 *     });
 * }, []);
 *
 * --- updateCirclePreview (defined but unused) ---
 * const updateCirclePreview = useCallback((x: number, y: number, radius: number) => {
 *     setPreviewCircle({ x, y, r: radius });
 * }, []);
 *
 * --- brushGesture ---
 * const brushGesture = Gesture.Pan()
 *     .onStart((e) => {
 *         'worklet';
 *         const paint = currentPaintRef.value;
 *         if (!paint) return;
 *         const path = Skia.Path.Make();
 *         path.moveTo(e.x, e.y);
 *         const pathData = { path, paint };
 *         runOnJS(setCurrentPath)(pathData);
 *     })
 *     .onUpdate((e) => {
 *         'worklet';
 *         runOnJS(updateCurrentPathPoints)(e.x, e.y);
 *     })
 *     .onEnd(() => {
 *         'worklet';
 *         // Commit is handled automatically via React state
 *     });
 *
 * --- handleToolChange ---
 * const handleToolChange = useCallback((tool: ToolType) => {
 *     setSelectedTool(tool);
 *     selectedToolRef.value = tool;
 * }, [selectedToolRef]);
 *
 * --- handleColorChange (brush line) ---
 * // Inside handleColorChange, after brushColorRef.value = color:
 * // currentPaintRef.value = createPaint(color, brushSize);
 *
 * --- handleSizeChange (brush line) ---
 * // Inside handleSizeChange, after brushSizeRef.value = size:
 * // currentPaintRef.value = createPaint(brushColor, size);
 *
 * --- drawGesture selection ---
 * // const drawGesture = selectedTool === 'brush' ? brushGesture : circleGesture;
 *
 * --- Canvas: current brush path rendering ---
 * // {currentPath && (
 * //     <SkiaPath
 * //         path={currentPath.path}
 * //         paint={currentPath.paint}
 * //     />
 * // )}
 *
 * --- Toolbar: Tool Selector UI ---
 * // <View style={styles.toolSelector}>
 * //     <Pressable
 * //         onPress={() => handleToolChange('brush')}
 * //         style={[styles.toolButton, selectedTool === 'brush' && styles.toolButtonActive]}
 * //     >
 * //         <IconSymbol name="pencil" size={20} color={selectedTool === 'brush' ? Colors.Primary : Colors.Gray} />
 * //         <Text style={[styles.toolButtonText, selectedTool === 'brush' && styles.toolButtonTextActive]}>Brush</Text>
 * //     </Pressable>
 * //     <Pressable
 * //         onPress={() => handleToolChange('circle')}
 * //         style={[styles.toolButton, selectedTool === 'circle' && styles.toolButtonActive]}
 * //     >
 * //         <IconSymbol name="circle" size={20} color={selectedTool === 'circle' ? Colors.Primary : Colors.Gray} />
 * //         <Text style={[styles.toolButtonText, selectedTool === 'circle' && styles.toolButtonTextActive]}>Circle</Text>
 * //     </Pressable>
 * // </View>
 *
 * --- Styles (tool selector) ---
 * // toolSelector: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
 * // toolButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#2a2a2a' },
 * // toolButtonActive: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1, borderColor: Colors.Primary },
 * // toolButtonText: { color: Colors.Gray, fontSize: 14, fontWeight: '500' },
 * // toolButtonTextActive: { color: Colors.Primary },
 */
