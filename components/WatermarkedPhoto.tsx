import React, { useRef } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions } from 'react-native';
import { WatermarkOptions } from '@/utils/watermark';
import { getFormattedTimestamp } from '@/utils/watermark';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

interface WatermarkedPhotoProps {
  imageUri: string;
  options: WatermarkOptions;
  onDone: (processedImageUri: string) => void;
  onCancel: () => void;
  isCapturing: boolean;
}

export function WatermarkedPhoto({ imageUri, options, onDone, onCancel, isCapturing }: WatermarkedPhotoProps) {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const screenDimensions = Dimensions.get('window');

  // Guard against undefined options
  if (!options) {
    console.error('❌ WatermarkedPhoto: options is undefined');
    return null;
  }

  // Initialize dimensions
  React.useEffect(() => {
    const { width, height } = screenDimensions;
    setDimensions({ width, height });
  }, []);

  const handleDone = async () => {
    const viewShot = viewShotRef.current;
    
    if (!viewShot || !viewShot.capture) {
      console.error('❌ ViewShot ref not available');
      onDone(imageUri); // Fallback to original image
      return;
    }

    try {
      setIsProcessing(true);
      
      // Wait for image to load if not already loaded
      if (!isImageLoaded) {
        console.log('⏳ Waiting for image to load...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Wait a bit for the view to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📸 Attempting to capture view...');
      // Capture the view with watermark and timestamp
      const fileUri = await viewShot.capture();
      
      console.log('✅ Captured watermarked image:', fileUri);
      onDone(fileUri);
    } catch (error) {
      console.error('❌ Error capturing view:', error);
      // If ViewShot fails, just return the original image
      console.log('⚠️ Using original image without watermark');
      onDone(imageUri);
    } finally {
      setIsProcessing(false);
    }
  };

  console.log('✅ WatermarkedPhoto: Rendering with options:', options);
  console.log('✅ WatermarkedPhoto: imageUri:', imageUri ? 'exists' : 'missing');
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

  try {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <ViewShot 
            ref={viewShotRef}
            style={{
              width: dimensions.width,
              height: availableHeight,
            }}
            options={{
              format: 'jpg',
              quality: 1.0,
              result: 'tmpfile',
            }}
          >
            <Image 
              source={{ uri: imageUri }} 
              style={{
                width: dimensions.width,
                height: availableHeight,
              }} 
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

            {/* Timestamp at the bottom - positioned above the footer area */}
            {options.timestampEnabled && (
              <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                  {getFormattedTimestamp(options.timestampFormat)}
                </Text>
              </View>
            )}
          </ViewShot>
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
  timestampContainer: {
    position: 'absolute',
    bottom: 20, // Position above the footer buttons
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent dark background for readability
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  timestampText: {
    color: '#FF6B35', // Orange color
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
});
