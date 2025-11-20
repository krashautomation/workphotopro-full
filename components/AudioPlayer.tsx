import { View, Text, Pressable } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';

interface AudioPlayerProps {
  uri: string;
  duration?: number;
}

export default function AudioPlayer({ uri, duration }: AudioPlayerProps) {
  const player = useAudioPlayer({ uri }, { updateInterval: 200 });
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

