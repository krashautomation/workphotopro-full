import { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureMicrophonePermission = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to record audio. Please enable it in your device settings.'
      );
      return false;
    }
    return true;
  };

  const clearDurationInterval = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const startRecording = async () => {
    try {
      if (isRecording) {
        return;
      }

      const hasPermission = await ensureMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      recorder.record();
      setIsRecording(true);
      setDuration(0);

      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    clearDurationInterval();
    setIsRecording(false);
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = recorder.uri ?? recorder.getStatus().url ?? undefined;
      if (uri) {
        onRecordingComplete(uri, duration);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error('Failed to stop recording', err);
    }
  };

  const cancelRecording = async () => {
    clearDurationInterval();

    if (isRecording) {
      try {
        await recorder.stop();
      } catch (err) {
        console.error('Failed to cancel recording', err);
      }
    }

    await setAudioModeAsync({
      allowsRecording: false,
    });

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

