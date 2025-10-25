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
  console.log('🔍 ShareLocation: Component rendered with visible:', visible);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = locationResult.coords;
      
      // Get address from coordinates
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = addressResult[0] 
        ? `${addressResult[0].street || ''} ${addressResult[0].city || ''} ${addressResult[0].region || ''}`.trim()
        : 'Unknown location';

      setLocation({
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostLocation = async () => {
    if (!location) return;

    try {
      await onPostLocation(location);
      onClose(); // Close the modal after posting
    } catch (err) {
      console.error('Error posting location:', err);
      Alert.alert('Error', 'Failed to post location to chat');
    }
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
        
        {/* Map Placeholder */}
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
          {/* Simple map-like grid pattern */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#E8F4FD',
          }}>
            {/* Horizontal lines */}
            {Array.from({ length: 8 }, (_, i) => (
              <View
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  top: (i + 1) * 25,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: '#B0D4F1',
                  opacity: 0.6,
                }}
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: 6 }, (_, i) => (
              <View
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  left: (i + 1) * 50,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: '#B0D4F1',
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
          
          {/* Location pin overlay */}
          <View style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -50 }, { translateY: -50 }],
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <IconSymbol name="location.fill" color="#FF3B30" size={32} />
            <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 4 }}>
              Current Location
            </Text>
          </View>
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
