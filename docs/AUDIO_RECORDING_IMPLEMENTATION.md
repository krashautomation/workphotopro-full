# Audio Recording Implementation Guide

## Overview

**Note**: Video recording currently uses `expo-camera` (CameraView.recordAsync), but audio-only recording now uses `expo-audio`, which provides the modern Audio.Recording API (split out from the deprecated `expo-av` package). This keeps us compatible with Expo SDK 54+.

## Step 1: Install Dependencies

```bash
npx expo install expo-audio
```

Also add the plugin to `app.config.js`:

```js
plugins: [
  // ...
  'expo-audio',
];
```

**Why expo-audio?**
- `expo-audio` carries forward the Audio.Recording and Audio.Sound APIs from `expo-av`
- Optimized for audio-only capture/playback (voice notes)
- Supported going forward; `expo-av` is deprecated in SDK 54+

## Step 2: Appwrite Database Setup

### Create/Update Messages Collection

**Note**: Following the existing pattern (photos use `imageUrl`, videos use `videoFileId`), audio messages will be detected by checking if `audioFileId` exists. No `messageType` field needed - message types are inferred from which fields are present.

1. Go to Appwrite Console → Databases → Your Database → Collections → `messages`
2. Add new attributes if they don't exist:

**Attribute: `audioFileId`**
- Type: String
- Size: 255
- Required: No
- Array: No

**Attribute: `audioUrl`**
- Type: String
- Size: 500
- Required: No
- Array: No

**Attribute: `audioDuration`**
- Type: Integer
- Required: No
- Array: No
- Min: 0

**Note**: `fileMimeType` already exists and is used for file messages. Audio messages will be detected by `audioFileId` presence (same pattern as `videoFileId` for videos).

## Step 3: Update TypeScript Types

In `utils/types.ts`, update the `Message` interface:

```typescript
export interface Message {
  // ... existing fields
  audioFileId?: string;
  audioUrl?: string;
  audioDuration?: number;
  // Note: messageType already exists but is optional and inferred from field presence
  // Audio messages detected by checking if audioFileId exists (like videoFileId for videos)
}
```

The `messageType` field already exists in the interface but is optional. Audio messages will be detected by checking `audioFileId` presence, following the same pattern as videos (`videoFileId`).

## Step 4: Create Audio Recording Component

Create `components/AudioRecorder.tsx`:

```typescript
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
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

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
      if (isRecording) return;

      const hasPermission = await ensureMicrophonePermission();
      if (!hasPermission) return;

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

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ color: Colors.Text, marginBottom: 20 }}>
        {isRecording
          ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
          : 'Ready to record'}
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
```

## Step 5: Create Audio Player Component

Create `components/AudioPlayer.tsx`:

```typescript
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
```

## Step 6: Update [job].tsx

### Add State & Modal

```typescript
const [showAudioRecorder, setShowAudioRecorder] = useState(false);
const [selectedAudio, setSelectedAudio] = useState<{ uri: string; duration: number } | null>(null);
```

### Update handleRecordAudio

```typescript
const handleRecordAudio = () => {
  setShowAudioRecorder(true);
};
```

### Add Audio Upload Function

```typescript
const uploadAudio = async (audioUri: string): Promise<{ fileId: string; fileUrl: string } | null> => {
  try {
    if (!appwriteConfig.bucket) {
      Alert.alert('Error', 'Storage bucket not configured');
      return null;
    }

    const response = await fetch(audioUri);
    const blob = await response.blob();
    const file = new File([blob], `audio_${Date.now()}.m4a`, { type: 'audio/m4a' });

    const fileId = ID.unique();
    await storage.createFile(appwriteConfig.bucket, fileId, file);

    const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

    return { fileId, fileUrl };
  } catch (error) {
    console.error('Error uploading audio:', error);
    Alert.alert('Error', 'Failed to upload audio');
    return null;
  }
};
```

### Update sendMessage to Handle Audio

```typescript
// In sendMessage function, add audio handling (following the video pattern):
// Note: No need to set messageType - it's inferred from audioFileId presence
if (selectedAudio) {
  const audioUpload = await uploadAudio(selectedAudio.uri);
  if (audioUpload) {
    messageData.audioFileId = audioUpload.fileId;
    messageData.audioUrl = audioUpload.fileUrl;
    messageData.audioDuration = selectedAudio.duration;
    // messageType not needed - inferred from audioFileId presence (like videoFileId)
  }
}
```

### Add Audio Recorder Modal

```typescript
<BottomModal2
  visible={showAudioRecorder}
  onClose={() => {
    setShowAudioRecorder(false);
    setSelectedAudio(null);
  }}
>
  <AudioRecorder
    onRecordingComplete={(uri, duration) => {
      setSelectedAudio({ uri, duration });
      setShowAudioRecorder(false);
    }}
    onCancel={() => setShowAudioRecorder(false)}
  />
</BottomModal2>
```

### Display Audio Messages in Chat

In the message rendering section, add (following the video pattern):

```typescript
{/* Audio Message */}
{item.audioFileId && item.content !== 'Message deleted by user' && (
  <AudioPlayer
    uri={item.audioUrl || `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.audioFileId}/view?project=${appwriteConfig.projectId}`}
    duration={item.audioDuration}
  />
)}
```

**Note**: Audio messages are detected by checking `audioFileId` presence (same pattern as `videoFileId` for videos, `imageUrl` for photos). No need to check `messageType`.

## Step 7: Update sendMessage Cleanup

After sending, clear audio selection:

```typescript
setSelectedAudio(null);
```

## Step 8: Test

1. Tap the microphone button
2. Record audio
3. Send message
4. Verify audio appears in chat
5. Test playback functionality

