import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Dimensions, Image } from 'react-native';
import * as Location from 'expo-location';
import BottomModal2 from './BottomModal2';
import { Colors } from '@/utils/colors';
import { IconSymbol } from './IconSymbol';
import { LocationData } from '@/utils/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShareLocationProps {
  visible: boolean;
  onClose: () => void;
  onPostLocation: (locationData: LocationData) => Promise<void>;
}


export default function ShareLocation({ visible, onClose, onPostLocation }: ShareLocationProps) {
  console.log('🔍 [ShareLocation] Component rendered with visible:', visible);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [mapImageLoading, setMapImageLoading] = useState(false);
  const [mapImageError, setMapImageError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 [ShareLocation] useEffect triggered, visible:', visible);
    if (visible) {
      console.log('🔍 [ShareLocation] Modal is visible, getting current location...');
      getCurrentLocation();
    } else {
      console.log('🔍 [ShareLocation] Modal is not visible, resetting state');
      // Reset state when modal closes
      setLocation(null);
      setMapImageUrl(null);
      setMapImageError(null);
    }
  }, [visible]);

  // Monitor map image URL changes
  useEffect(() => {
    if (mapImageUrl) {
      console.log('🗺️ [ShareLocation] Map image URL updated:', mapImageUrl);
      console.log('🗺️ [ShareLocation] Full map URL:', mapImageUrl);
    }
  }, [mapImageUrl]);

  // Monitor location changes
  useEffect(() => {
    if (location) {
      console.log('📍 [ShareLocation] Location state updated:', location);
    }
  }, [location]);

  // Generate Google Maps Static API URL
  const generateMapImageUrl = (lat: number, lng: number): string => {
    console.log('🗺️ [ShareLocation] Generating map image URL for coordinates:', { lat, lng });
    
    // Check if Google Maps API key is configured
    // Note: Environment variables in Expo must start with EXPO_PUBLIC_ to be accessible
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const apiKeyLength = apiKey ? apiKey.length : 0;
    
    // Diagnostic: Check if other EXPO_PUBLIC_ variables are loaded (to verify .env is working)
    const hasAppwriteEnv = !!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    
    console.log('🗺️ [ShareLocation] Google Maps API key check:');
    console.log('🗺️ [ShareLocation] - Key present:', apiKey ? 'YES' : 'NO');
    console.log('🗺️ [ShareLocation] - Key length:', apiKeyLength);
    console.log('🗺️ [ShareLocation] - Diagnostic: Other EXPO_PUBLIC_ vars loaded:', hasAppwriteEnv ? 'YES (.env working)' : 'NO (.env not loaded)');
    
    if (apiKey) {
      console.log('✅ [ShareLocation] - Key preview (first 10 chars):', apiKey.substring(0, 10) + '...');
    } else {
      console.error('❌ [ShareLocation] - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY not found in process.env');
      console.error('❌ [ShareLocation] - Diagnostic check:');
      console.error('❌ [ShareLocation]   - .env file loaded:', hasAppwriteEnv ? 'YES' : 'NO');
      if (!hasAppwriteEnv) {
        console.error('❌ [ShareLocation]   - ACTION: Restart Expo server completely');
        console.error('❌ [ShareLocation]   - 1. Stop server (Ctrl+C)');
        console.error('❌ [ShareLocation]   - 2. Run: npm start (or expo start)');
      } else {
        console.error('❌ [ShareLocation]   - .env is loaded but GOOGLE_MAPS_API_KEY missing');
        console.error('❌ [ShareLocation]   - ACTION: Check .env file for EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
        console.error('❌ [ShareLocation]   - Make sure there are no spaces around the = sign');
        console.error('❌ [ShareLocation]   - Format: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here');
      }
    }
    
    // Google Maps Static API URL
    // Format: https://maps.googleapis.com/maps/api/staticmap?center=lat,lng&zoom=15&size=400x200&markers=color:red|label:P|lat,lng&key=YOUR_API_KEY
    const size = '400x200'; // Width x Height
    const zoom = 15;
    const center = `${lat},${lng}`;
    const markers = `color:red|label:P|${lat},${lng}`;
    
    let mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=${size}&markers=${markers}`;
    
    // Add API key if available
    if (apiKey && apiKey.trim().length > 0) {
      mapUrl += `&key=${encodeURIComponent(apiKey)}`;
      console.log('✅ [ShareLocation] Map URL generated WITH API key');
      console.log('✅ [ShareLocation] Map URL (first 100 chars):', mapUrl.substring(0, 100) + '...');
    } else {
      console.error('❌ [ShareLocation] Map URL generated WITHOUT API key');
      console.error('❌ [ShareLocation] Google Maps Static API REQUIRES an API key');
      console.error('❌ [ShareLocation] Without an API key, Google returns a 1x1 pixel error image (white screen)');
      console.error('❌ [ShareLocation] To fix: Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file');
      console.error('❌ [ShareLocation] Get API key from: https://console.cloud.google.com/google/maps-apis/credentials');
      console.warn('⚠️ [ShareLocation] Map will show as white screen until API key is added');
    }
    
    return mapUrl;
  };

  const getCurrentLocation = async () => {
    console.log('📍 [ShareLocation] getCurrentLocation called');
    try {
      setIsLoading(true);
      setError(null);
      setMapImageError(null);

      console.log('📍 [ShareLocation] Requesting location permissions...');
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 [ShareLocation] Permission status:', status);
      
      if (status !== 'granted') {
        console.error('❌ [ShareLocation] Location permission denied');
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      console.log('📍 [ShareLocation] Getting current position...');
      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      console.log('📍 [ShareLocation] Location result:', {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy
      });

      const { latitude, longitude } = locationResult.coords;
      
      console.log('📍 [ShareLocation] Reverse geocoding coordinates...');
      // Get address from coordinates
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      console.log('📍 [ShareLocation] Reverse geocode result:', addressResult);

      const address = addressResult[0] 
        ? `${addressResult[0].street || ''} ${addressResult[0].city || ''} ${addressResult[0].region || ''}`.trim()
        : 'Unknown location';
      
      console.log('📍 [ShareLocation] Parsed address:', address);

      const locationData: LocationData = {
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
      };
      
      console.log('✅ [ShareLocation] Setting location data:', locationData);
      setLocation(locationData);

      // Generate and set map image URL
      console.log('🗺️ [ShareLocation] Generating map image URL...');
      console.log('🗺️ [ShareLocation] Coordinates:', { latitude, longitude });
      const mapUrl = generateMapImageUrl(latitude, longitude);
      console.log('🗺️ [ShareLocation] Generated map URL (full):', mapUrl);
      console.log('🗺️ [ShareLocation] Map URL length:', mapUrl.length);
      console.log('🗺️ [ShareLocation] Map URL contains "staticmap":', mapUrl.includes('staticmap'));
      console.log('🗺️ [ShareLocation] Map URL contains API key:', mapUrl.includes('key=') ? 'YES' : 'NO');
      setMapImageUrl(mapUrl);
      setMapImageLoading(true);
      
      console.log('🗺️ [ShareLocation] Map image URL set, will attempt to load:', mapUrl);
    } catch (err) {
      console.error('❌ [ShareLocation] Error getting location:', err);
      console.error('❌ [ShareLocation] Error details:', JSON.stringify(err, null, 2));
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostLocation = async () => {
    console.log('📤 [ShareLocation] handlePostLocation called');
    if (!location) {
      console.warn('⚠️ [ShareLocation] No location data available, cannot post');
      return;
    }

    console.log('📤 [ShareLocation] Posting location:', location);
    try {
      await onPostLocation(location);
      console.log('✅ [ShareLocation] Location posted successfully');
      onClose(); // Close the modal after posting
    } catch (err) {
      console.error('❌ [ShareLocation] Error posting location:', err);
      console.error('❌ [ShareLocation] Error details:', JSON.stringify(err, null, 2));
      Alert.alert('Error', 'Failed to post location to chat');
    }
  };

  const handleMapImageLoad = (event: any) => {
    console.log('✅ [ShareLocation] Map image loaded successfully');
    console.log('✅ [ShareLocation] Image load event:', {
      width: event.nativeEvent?.source?.width,
      height: event.nativeEvent?.source?.height,
      uri: mapImageUrl,
    });
    
    // Verify the image actually has dimensions (not a blank/error image)
    if (event.nativeEvent?.source?.width && event.nativeEvent?.source?.height) {
      console.log('✅ [ShareLocation] Image has valid dimensions:', {
        width: event.nativeEvent.source.width,
        height: event.nativeEvent.source.height
      });
    } else {
      console.warn('⚠️ [ShareLocation] Image loaded but no dimensions detected - might be blank/error image');
    }
    
    setMapImageLoading(false);
    setMapImageError(null);
  };

  const handleMapImageError = (error: any) => {
    console.error('❌ [ShareLocation] Map image failed to load:', error);
    console.error('❌ [ShareLocation] Map image error details:', JSON.stringify(error, null, 2));
    console.error('❌ [ShareLocation] Map URL that failed:', mapImageUrl);
    console.error('❌ [ShareLocation] Map URL length:', mapImageUrl?.length);
    console.error('❌ [ShareLocation] Map URL contains API key:', mapImageUrl?.includes('key=') ? 'YES' : 'NO');
    setMapImageLoading(false);
    setMapImageError('Failed to load map image. Check console for details.');
  };



  return (
    <BottomModal2 visible={visible} onClose={onClose}>
      <View style={{ padding: 20 }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: '#333',
          textAlign: 'center',
          marginBottom: 20
        }}>
          Share Location
        </Text>
        
        {/* Google Maps Static Image */}
        <View style={{
          height: 200,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 15,
          position: 'relative',
          backgroundColor: '#E8F4FD',
          borderWidth: 1,
          borderColor: '#B0D4F1',
        }}>
          {mapImageLoading && !mapImageUrl && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#E8F4FD',
            }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
                Loading map...
              </Text>
            </View>
          )}
          
          {mapImageUrl ? (
            <>
              <Image
                source={{ uri: mapImageUrl }}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'cover',
                }}
                onLoadStart={() => {
                  console.log('🖼️ [ShareLocation] Map image load started');
                  console.log('🖼️ [ShareLocation] Loading URL:', mapImageUrl);
                  console.log('🖼️ [ShareLocation] URL length:', mapImageUrl?.length);
                  setMapImageLoading(true);
                }}
                onLoad={handleMapImageLoad}
                onError={handleMapImageError}
                onProgress={(event) => {
                  console.log('🖼️ [ShareLocation] Image load progress:', {
                    loaded: event.nativeEvent.loaded,
                    total: event.nativeEvent.total,
                  });
                }}
                testID="google-map-static-image"
              />
              
              {mapImageLoading && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
                    Loading map image...
                  </Text>
                </View>
              )}
              
              {mapImageError && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 200, 200, 0.9)',
                  padding: 10,
                }}>
                  <IconSymbol name="exclamationmark.triangle.fill" color="#FF3B30" size={32} />
                  <Text style={{ marginTop: 10, color: '#FF3B30', fontSize: 12, textAlign: 'center' }}>
                    {mapImageError}
                  </Text>
                  <Text style={{ marginTop: 5, color: '#666', fontSize: 10, textAlign: 'center' }}>
                    Check console for details
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#E8F4FD',
            }}>
              {/* Fallback placeholder when no map URL */}
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <IconSymbol name="location.fill" color="#B0D4F1" size={48} />
                <Text style={{ marginTop: 10, color: '#666', fontSize: 14, textAlign: 'center' }}>
                  Waiting for location...
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Location Info */}
        {location && (
          <View style={{
            backgroundColor: '#f8f9fa',
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 5 }}>
              {location.address}
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {/* Debug info in development */}
            {__DEV__ && mapImageUrl && (
              <Text style={{ fontSize: 10, color: '#999', marginTop: 5, fontFamily: 'monospace' }}>
                Map URL: {mapImageUrl.substring(0, 60)}...
              </Text>
            )}
          </View>
        )}
        
        {/* Share Button */}
        <Pressable 
          onPress={handlePostLocation}
          style={{
            backgroundColor: '#007AFF',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 10,
            alignItems: 'center',
            opacity: (!location || isLoading) ? 0.6 : 1
          }}
          disabled={!location || isLoading}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Share Now
          </Text>
        </Pressable>
      </View>
    </BottomModal2>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  container: {
    padding: 20,
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.Text,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // Map styles
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapText: {
    fontSize: 12,
    color: Colors.Primary,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Location info styles
  locationInfo: {
    backgroundColor: Colors.Secondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 16,
    color: Colors.Text,
    fontWeight: '600',
    marginBottom: 5,
  },
  coordinatesText: {
    fontSize: 14,
    color: Colors.Gray,
  },
  
  // Button styles
  shareButton: {
    backgroundColor: Colors.Primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: Colors.Gray,
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
