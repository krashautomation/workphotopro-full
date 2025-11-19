import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';

interface AudioPlayerProps {
  uri: string;
  duration?: number;
}

export default function AudioPlayer({ uri, duration }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
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
      <Pressable onPress={playSound}>
        <IconSymbol
          name={isPlaying ? "pause.fill" : "play.fill"}
          color={Colors.Primary}
          size={24}
        />
      </Pressable>
      <Text style={{ color: Colors.Text, flex: 1 }}>
        {formatTime(position)} / {duration ? formatTime(duration * 1000) : '--:--'}
      </Text>
    </View>
  );
}

