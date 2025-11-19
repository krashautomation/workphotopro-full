# Audio Recording Implementation Guide

## Step 1: Install Dependencies

```bash
npx expo install expo-av
```

## Step 2: Appwrite Database Setup

### Create/Update Messages Collection

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

**Attribute: `messageType`** (if not exists)
- Type: String
- Size: 50
- Required: No
- Array: No
- Default: "text"

## Step 3: Update TypeScript Types

In `utils/types.ts`, update the `Message` interface:

```typescript
export interface Message {
  // ... existing fields
  audioFileId?: string;
  audioUrl?: string;
  audioDuration?: number;
  messageType?: 'text' | 'image' | 'video' | 'location' | 'file' | 'audio';
}
```

## Step 4: Create Audio Recording Component

Create `components/AudioRecorder.tsx`:

```typescript
import { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
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
    }
    setIsRecording(false);
    setDuration(0);
    onCancel();
  };

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ color: Colors.Text, marginBottom: 20 }}>
        {isRecording ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 'Ready to record'}
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
// In sendMessage function, add audio handling:
if (selectedAudio) {
  const audioUpload = await uploadAudio(selectedAudio.uri);
  if (audioUpload) {
    messageData.audioFileId = audioUpload.fileId;
    messageData.audioUrl = audioUpload.fileUrl;
    messageData.audioDuration = selectedAudio.duration;
    messageData.messageType = 'audio';
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

In the message rendering section, add:

```typescript
{/* Audio Message */}
{item.messageType === 'audio' && item.audioUrl && (
  <AudioPlayer
    uri={item.audioUrl}
    duration={item.audioDuration}
  />
)}
```

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

