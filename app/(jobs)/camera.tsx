import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { IconSymbol } from '@/components/IconSymbol'
import { Colors } from '@/utils/colors'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import { WatermarkedPhoto } from '@/components/WatermarkedPhoto'
import { getDefaultWatermarkPreferences, WatermarkOptions } from '@/utils/watermark'
import { useAuth } from '@/context/AuthContext'
import { userPreferencesService } from '@/lib/appwrite/database'

export default function CameraPage() {
    const { jobId } = useLocalSearchParams()
    const { user } = useAuth()
    const [facing, setFacing] = React.useState<CameraType>('back')
    const [permission, requestPermission] = useCameraPermissions()
    const [isCapturing, setIsCapturing] = React.useState(false)
    const [capturedPhoto, setCapturedPhoto] = React.useState<string | null>(null)
    const [watermarkOptions, setWatermarkOptions] = React.useState<WatermarkOptions>(getDefaultWatermarkPreferences())
    const cameraRef = React.useRef<any>(null)
    const insets = useSafeAreaInsets()
    const router = useRouter()

    // Load user preferences on mount
    React.useEffect(() => {
        const loadPreferences = async () => {
            if (user?.$id) {
                try {
                    const prefs = await userPreferencesService.getUserPreferences(user.$id)
                    if (prefs) {
                        setWatermarkOptions({
                            watermarkEnabled: prefs.watermarkEnabled,
                            timestampEnabled: prefs.timestampEnabled,
                            timestampFormat: prefs.timestampFormat || 'short',
                        })
                    }
                } catch (error) {
                    console.error('Error loading user preferences:', error)
                }
            }
        }
        loadPreferences()
    }, [user])

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'))
    }

    const takePicture = async () => {
        if (cameraRef.current && !isCapturing) {
            try {
                setIsCapturing(true)
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                })
                if (photo?.uri) {
                    setCapturedPhoto(photo.uri)
                }
            } catch (error) {
                console.error('Error taking picture:', error)
                Alert.alert('Error', 'Failed to take photo. Please try again.')
            } finally {
                setIsCapturing(false)
            }
        }
    }

    const handleDone = async (processedImageUri?: string) => {
        const imageToSave = processedImageUri || capturedPhoto;
        
        if (imageToSave) {
            try {
                // Store the captured image URI in secure store
                await SecureStore.setItemAsync('capturedImageUri', imageToSave)
                console.log('✅ Saved image:', imageToSave)
                // Navigate back to job page
                router.back()
            } catch (error) {
                console.error('Error storing photo:', error)
                Alert.alert('Error', 'Failed to save photo. Please try again.')
            }
        }
    }

    const handleCancel = () => {
        router.back()
    }

    // Request permission on mount
    React.useEffect(() => {
        if (permission && !permission.granted && !permission.canAskAgain) {
            Alert.alert(
                'Camera Permission',
                'Please enable camera access in your device settings to take photos.',
                [{ text: 'OK' }]
            )
        } else if (permission && !permission.granted) {
            requestPermission()
        }
    }, [permission])

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        )
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to use the camera</Text>
                <Pressable 
                    onPress={requestPermission} 
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </Pressable>
                <Pressable 
                    onPress={() => router.back()} 
                    style={[styles.button, styles.closeButton]}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <>
            <StatusBar style="light" backgroundColor="#000" translucent={true} />
            <Stack.Screen 
                options={{
                    headerShown: false,
                }} 
            />
            <View style={styles.container}>
                {/* Show camera view only when no photo is captured */}
                {!capturedPhoto ? (
                    <>
                        <CameraView 
                            ref={cameraRef} 
                            style={styles.camera} 
                            facing={facing}
                        >
                            {/* Header with close button */}
                            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                                <Pressable 
                                    onPress={() => router.back()} 
                                    style={styles.closeButton}
                                    disabled={isCapturing}
                                >
                                    <IconSymbol name="xmark" color={Colors.White} size={28} />
                                </Pressable>
                            </View>

                            {/* Footer with camera controls */}
                            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                                {/* Cancel button */}
                                <Pressable 
                                    onPress={handleCancel} 
                                    style={styles.cancelButton}
                                    disabled={isCapturing}
                                >
                                    <IconSymbol name="xmark" color={Colors.White} size={24} />
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </Pressable>

                                {/* Capture button */}
                                <Pressable 
                                    onPress={takePicture} 
                                    style={styles.captureButton}
                                    disabled={isCapturing}
                                >
                                    {isCapturing ? (
                                        <ActivityIndicator color={Colors.White} size="small" />
                                    ) : (
                                        <View style={styles.captureButtonInner} />
                                    )}
                                </Pressable>

                                {/* Done button - faded until photo is taken */}
                                <Pressable 
                                    onPress={() => handleDone()} 
                                    style={[styles.doneButton, !capturedPhoto && styles.doneButtonDisabled]}
                                    disabled={!capturedPhoto || isCapturing}
                                >
                                    <IconSymbol name="checkmark" color={capturedPhoto ? Colors.White : Colors.Gray} size={24} />
                                    <Text style={[styles.buttonText, !capturedPhoto && styles.buttonTextDisabled]}>Done</Text>
                                </Pressable>
                            </View>
                        </CameraView>
                    </>
                ) : (
                    /* Show preview when photo is captured */
                    <View style={styles.previewContainer}>
                        {capturedPhoto && (
                            <WatermarkedPhoto 
                                imageUri={capturedPhoto} 
                                options={watermarkOptions} 
                                onDone={handleDone} 
                                onCancel={handleCancel} 
                                isCapturing={isCapturing}
                            />
                        )}
                    </View>
                )}
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        color: Colors.Text,
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
    },
    button: {
        backgroundColor: Colors.Primary,
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: Colors.Secondary,
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.White,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.White,
    },
    spacer: {
        width: 80,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 20,
        opacity: 1,
    },
    doneButtonDisabled: {
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        opacity: 0.4,
    },
    buttonText: {
        color: Colors.White,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextDisabled: {
        color: Colors.Gray,
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.Secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
})
