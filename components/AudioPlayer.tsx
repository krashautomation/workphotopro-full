import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useCachedMedia } from '@/hooks/useOfflineCache';
import { offlineCache } from '@/utils/offlineCache';

interface AudioPlayerProps {
  uri: string;
  fileId?: string; // Appwrite file ID for caching
  duration?: number;
  autoCache?: boolean; // Automatically cache when viewed (default: true)
}

export default function AudioPlayer({ uri, fileId, duration, autoCache = true }: AudioPlayerProps) {
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
      alignItems: 'center',
      backgroundColor: Colors.Secondary,
      padding: 12,
      borderRadius: 8,
      gap: 12,
      marginBottom: 8,
    }}>
      <Pressable onPress={togglePlayback}>
        <IconSymbol
          name={isPlaying ? 'pause.fill' : 'play.fill'}
          color={Colors.Primary}
          size={24}
        />
      </Pressable>
      <Text style={{ color: Colors.Text, flex: 1 }}>
        {formatTime(currentTime)} / {detectedDuration ? formatTime(detectedDuration) : '--:--'}
      </Text>
    </View>
  );
}

