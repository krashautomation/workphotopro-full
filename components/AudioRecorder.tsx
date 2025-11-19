import { useState, useRef } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { PermissionsAndroid } from 'react-native';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        if (!checkResult) {
          const audioPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'WorkPhotoPro needs access to your microphone to record audio.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Microphone permission is required to record audio. Please enable it in your device settings.'
            );
            return;
          }
        }
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to record audio. Please enable it in your device settings.'
          );
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    if (uri) {
      onRecordingComplete(uri, duration);
    }
    setRecording(null);
  };

  const cancelRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    setIsRecording(false);
    setDuration(0);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ padding: 20, alignItems: 'center', backgroundColor: Colors.Secondary, borderRadius: 12 }}>
      <Text style={{ color: Colors.Text, marginBottom: 20, fontSize: 16 }}>
        {isRecording ? formatTime(duration) : 'Ready to record'}
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 20 }}>
        {!isRecording ? (
          <Pressable
            onPress={startRecording}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FF3B30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="mic" color={Colors.White} size={32} />
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={stopRecording}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#22c55e',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="checkmark" color={Colors.White} size={32} />
            </Pressable>
            <Pressable
              onPress={cancelRecording}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: Colors.Secondary,
                borderWidth: 2,
                borderColor: Colors.Gray,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="xmark" color={Colors.Text} size={32} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

