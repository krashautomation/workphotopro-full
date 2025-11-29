import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useCachedMedia } from '@/hooks/useOfflineCache';
import { offlineCache } from '@/utils/offlineCache';
import Avatar from './Avatar';

interface AudioPlayerProps {
  uri: string;
  fileId?: string; // Appwrite file ID for caching
  duration?: number;
  autoCache?: boolean; // Automatically cache when viewed (default: true)
  senderName?: string; // Sender's name for avatar
  senderPhoto?: string; // Sender's profile picture URL
  showAvatar?: boolean; // Whether to show avatar (default: true)
}

export default function AudioPlayer({ 
  uri, 
  fileId, 
  duration, 
  autoCache = true,
  senderName,
  senderPhoto,
  showAvatar = true,
}: AudioPlayerProps) {
  // Debug: Log avatar props
  useEffect(() => {
    if (showAvatar) {
      console.log('[AudioPlayer] Avatar props:', { senderName, senderPhoto, showAvatar });
    }
  }, [senderName, senderPhoto, showAvatar]);

  // Get cached URI (cache-first strategy)
  const cachedUri = useCachedMedia(uri);

  // Auto-cache audio when viewed (if enabled and not already cached)
  useEffect(() => {
    if (autoCache && uri && cachedUri === uri) {
      offlineCache.initialize().then(() => {
        offlineCache.cacheMedia(uri, fileId, 'audio').catch(err => {
          console.warn('[AudioPlayer] Cache error (non-critical):', err);
        });
      });
    }
  }, [uri, cachedUri, autoCache, fileId]);

  const player = useAudioPlayer({ uri: cachedUri }, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const detectedDuration = status?.duration ?? duration ?? 0;

  // Static waveform heights (varying heights like in the image)
  const waveformHeights = useState(() => 
    Array.from({ length: 20 }, () => 4 + Math.random() * 24)
  )[0];

  // Calculate progress (0 to 1)
  const progress = detectedDuration > 0 ? currentTime / detectedDuration : 0;

  const togglePlayback = () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Error controlling audio playback', error);
    }
  };

  const formatTime = (seconds: number) => {
    const wholeSeconds = Math.floor(seconds);
    const mins = Math.floor(wholeSeconds / 60);
    const secs = wholeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: Colors.Secondary,
      padding: 12,
      borderRadius: 8,
      gap: 12,
      marginBottom: 8,
    }}>
      {/* Avatar with Microphone Badge Overlay */}
      {showAvatar && (
        <View style={{ position: 'relative', marginRight: 0 }}>
          <Avatar
            name={senderName || 'User'}
            imageUrl={senderPhoto || undefined}
            size={42}
          />
          {/* Microphone Icon in Green Dot - Bottom Right Overlay */}
          <View style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: Colors.Primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: Colors.Secondary,
          }}>
            <IconSymbol
              name="mic.fill"
              color={Colors.White}
              size={12}
            />
          </View>
        </View>
      )}
      
      {/* Play/Pause Button */}
      <Pressable onPress={togglePlayback} style={{ marginTop: 4 }}>
        <IconSymbol
          name={isPlaying ? 'pause.fill' : 'play.fill'}
          color={Colors.Primary}
          size={32}
        />
      </Pressable>

      {/* Waveform and Time Container */}
      <View style={{
        flex: 1,
        gap: 2,
      }}>
        {/* Waveform */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 32,
          gap: 2,
          width: '100%',
        }}>
          {waveformHeights.map((height, index) => {
            const barProgress = (index + 1) / waveformHeights.length;
            const isFilled = progress >= barProgress;
            
            return (
              <View
                key={index}
                style={{
                  flex: 1,
                  backgroundColor: Colors.Gray,
                  borderRadius: 1.5,
                  height: height,
                  overflow: 'hidden',
                }}
              >
                {/* Filled portion */}
                {isFilled && (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: Colors.Primary,
                      borderRadius: 1.5,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Time - Show current time when playing, full duration when paused */}
        <Text style={{ 
          color: Colors.Text, 
          fontSize: 12,
          textAlign: 'left',
        }}>
          {isPlaying 
            ? formatTime(currentTime)
            : (detectedDuration ? formatTime(detectedDuration) : '--:--')
          }
        </Text>
      </View>
    </View>
  );
}

