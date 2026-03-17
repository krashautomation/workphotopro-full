import React, { useRef } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions } from 'react-native';
import { WatermarkOptions } from '@/utils/watermark';
import { getFormattedTimestamp } from '@/utils/watermark';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';

interface WatermarkedPhotoProps {
  image: {
    uri: string;
    width: number;
    height: number;
  };
  options: WatermarkOptions;
  onDone: (processedImageUri: string) => void;
  onCancel: () => void;
  isCapturing: boolean;
}

export function WatermarkedPhoto({ image, options, onDone, onCancel, isCapturing }: WatermarkedPhotoProps) {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [isHiddenImageLoaded, setIsHiddenImageLoaded] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = React.useState<{ width: number; height: number } | null>(
    image ? { width: image.width, height: image.height } : null
  );
  const screenDimensions = Dimensions.get('window');

  // Guard against undefined options or image
  if (!options) {
    console.error('❌ WatermarkedPhoto: options is undefined');
    return null;
  }

  if (!image?.uri) {
    console.error('❌ WatermarkedPhoto: image is undefined or missing uri');
    return null;
  }

  // Initialize dimensions
  React.useEffect(() => {
    const { width, height } = screenDimensions;
    setDimensions({ width, height });
  }, []);

  React.useEffect(() => {
    setIsImageLoaded(false);
    setIsHiddenImageLoaded(false);
    if (image?.uri && image.width && image.height) {
      setImageSize({ width: image.width, height: image.height });
    } else if (image?.uri) {
      Image.getSize(
        image.uri,
        (width, height) => {
          setImageSize({ width, height });
        },
        (error) => {
          console.error('❌ Failed to get image size:', error);
          setImageSize(null);
        }
      );
    } else {
      setImageSize(null);
    }
  }, [image]);

  const handleDone = async () => {
    // If image is already annotated (from annotation editor), use it directly
    if (image?.uri && image.uri.includes('annotated_')) {
      onDone(image.uri);
      return;
    }

    const viewShot = viewShotRef.current;
    
    if (!viewShot || !viewShot.capture) {
      console.error('❌ ViewShot ref not available');
      if (image?.uri) {
        onDone(image.uri); // Fallback to original image
      }
      return;
    }

    try {
      setIsProcessing(true);
      
      // Wait for image to load if not already loaded
      if (!isImageLoaded || !isHiddenImageLoaded) {
        console.log('⏳ Waiting for image to load...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Wait a bit for the view to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📸 Attempting to capture view with dimensions:', {
        captureWidth,
        captureHeight,
        displayWidth,
        displayHeight,
      });
      // Capture the view with watermark and timestamp
      const fileUri = await viewShot.capture();
      
      console.log('✅ Captured watermarked image:', fileUri);
      Image.getSize(
        fileUri,
        (width, height) => {
          console.log('📸 Watermarked image size:', { width, height });
        },
        (error) => {
          console.error('❌ Failed to get watermarked image size:', error);
        }
      );
      onDone(fileUri);
    } catch (error) {
      console.error('❌ Error capturing view:', error);
      // If ViewShot fails, just return the original image
      console.log('⚠️ Using original image without watermark');
      if (image?.uri) {
        onDone(image.uri);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  console.log('✅ WatermarkedPhoto: Rendering with options:', options);
  console.log('✅ WatermarkedPhoto: imageUri:', image?.uri ? 'exists' : 'missing');
  console.log('🔍 Watermark enabled:', options.watermarkEnabled);
  console.log('🔍 Timestamp enabled:', options.timestampEnabled);

  // Calculate available height (screen minus footer)
  const footerHeight = 100; // Approximate footer height
  const availableHeight = dimensions.height - footerHeight;

  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.White }}>Loading...</Text>
      </View>
    );
  }

  const captureWidth = imageSize?.width || image?.width || dimensions.width;
  const captureHeight = imageSize?.height || image?.height || availableHeight;
  const maxDisplayWidth = dimensions.width;
  const maxDisplayHeight = availableHeight;

  const aspectRatio = captureWidth / captureHeight || 1;

  let displayWidth = maxDisplayWidth;
  let displayHeight = displayWidth / aspectRatio;

  if (displayHeight > maxDisplayHeight) {
    displayHeight = maxDisplayHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  try {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <View style={styles.previewImageArea}>
            <View
              style={[
                styles.previewImageWrapper,
                { width: displayWidth, height: displayHeight },
              ]}
            >
              <Image
                source={{ uri: image?.uri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                onLoad={() => {
                  console.log('✅ Image loaded successfully');
                  setIsImageLoaded(true);
                }}
                onError={(error) => {
                  console.error('❌ Image load error:', error);
                }}
              />

              {/* Watermark at the top */}
              {options.watermarkEnabled && (
                <View style={styles.watermarkContainer}>
                  <View style={styles.watermarkBox}>
                    <Text style={styles.watermarkText}>Work Photo Pro</Text>
                  </View>
                </View>
              )}

              {/* Timestamp with emulator mask */}
              {options.timestampEnabled && (
                <View style={styles.timestampOverlay}>
                  <Text style={styles.timestampText}>
                    {getFormattedTimestamp(options.timestampFormat)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer with controls - outside the ViewShot so it doesn't get captured */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {/* Cancel button */}
          <Pressable 
            onPress={onCancel} 
            style={styles.cancelButton}
            disabled={isCapturing || isProcessing}
          >
            <IconSymbol name="xmark" color={Colors.White} size={24} />
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>

          {/* Annotate button */}
          <Pressable 
            onPress={() => {
              if (image?.uri) {
                router.push({
                  pathname: '/(jobs)/photo-annotation-editor' as any,
                  params: { photoUri: image.uri },
                });
              }
            }}
            style={styles.annotateButton}
            disabled={isCapturing || isProcessing}
          >
            <IconSymbol name="pencil" color={Colors.White} size={20} />
            <Text style={styles.annotateButtonText}>Annotate</Text>
          </Pressable>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Done button */}
          <Pressable 
            onPress={handleDone} 
            style={styles.doneButton}
            disabled={isCapturing || isProcessing}
          >
            <IconSymbol name="checkmark" color={Colors.White} size={24} />
            <Text style={styles.buttonText}>{isProcessing ? 'Processing...' : 'Done'}</Text>
          </Pressable>
        </View>

        {/* Hidden high-resolution capture view */}
        <View style={styles.hiddenCaptureContainer} pointerEvents="none">
          <ViewShot
            ref={viewShotRef}
            style={{
              width: captureWidth,
              height: captureHeight,
            }}
            options={{
              format: 'jpg',
              quality: 1.0,
              result: 'tmpfile',
              width: captureWidth,
              height: captureHeight,
            }}
          >
            <Image
              source={{ uri: image?.uri }}
              style={{
                width: captureWidth,
                height: captureHeight,
              }}
              resizeMode="cover"
              onLoad={() => {
                console.log('✅ Hidden capture image loaded');
                setIsHiddenImageLoaded(true);
              }}
              onError={(error) => {
                console.error('❌ Hidden capture image load error:', error);
              }}
            />

            {options.watermarkEnabled && (
              <View style={styles.watermarkContainer}>
                <View style={styles.watermarkBox}>
                  <Text style={styles.watermarkText}>Work Photo Pro</Text>
                </View>
              </View>
            )}

            {options.timestampEnabled && (
              <View style={styles.timestampOverlay}>
                <Text style={styles.timestampText}>
                  {getFormattedTimestamp(options.timestampFormat)}
                </Text>
              </View>
            )}
          </ViewShot>
        </View>
      </View>
    );
  } catch (error) {
    console.error('❌ Error rendering WatermarkedPhoto:', error);
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Error loading photo</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.Secondary,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImageArea: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImageWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  hiddenCaptureContainer: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    opacity: 0,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 20,
    left: 10, // Changed from left to right for better placement
    zIndex: 10,
    elevation: 10,
  },
  watermarkBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.60)', // Slightly reduced opacity for less intrusion
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watermarkText: {
    color: 'rgba(0, 0, 0, 0.60)', // White with 90% opacity
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestampOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 4,
  },
  timestampText: {
    color: 'rgba(255, 107, 53, 0.65)', // Orange color with opacity
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  spacer: {
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    minHeight: 50,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: 25,
    minHeight: 50,
  },
  buttonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  annotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 25,
    minHeight: 44,
  },
  annotateButtonText: {
    color: Colors.White,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
