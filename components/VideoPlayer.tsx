import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';

interface VideoPlayerProps {
    uri: string;
    style?: any;
    showControls?: boolean;
    autoPlay?: boolean;
    onError?: (error: Error) => void;
}

export default function VideoPlayer({ 
    uri, 
    style, 
    showControls = true,
    autoPlay = false,
    onError 
}: VideoPlayerProps) {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [retryKey, setRetryKey] = useState(0);

    const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
        if (playbackStatus.isLoaded) {
            setIsLoading(false);
            setIsPlaying(playbackStatus.isPlaying);
        } else {
            // Check if it's an error state
            if ('error' in playbackStatus) {
                console.error('Video load error:', playbackStatus.error);
                setHasError(true);
                setIsLoading(false);
                if (onError) {
                    onError(new Error(playbackStatus.error || 'Unknown video error'));
                }
            } else {
                setIsLoading(false);
            }
        }
        setStatus(playbackStatus);
    };

    const togglePlayPause = async () => {
        if (hasError) return;
        
        try {
            if (isPlaying) {
                await videoRef.current?.pauseAsync();
            } else {
                await videoRef.current?.playAsync();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            setHasError(true);
        }
    };

    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    if (hasError) {
        return (
            <View style={[styles.container, style, styles.errorContainer]}>
                <IconSymbol name="video.slash" color={Colors.Gray} size={32} />
                <Text style={styles.errorText}>Failed to load video</Text>
                <Pressable
                    onPress={() => {
                        setHasError(false);
                        setIsLoading(true);
                        // Force re-render by changing key
                        setRetryKey(prev => prev + 1);
                    }}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} key={retryKey}>
            <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri }}
                useNativeControls={showControls}
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoadStart={handleLoadStart}
                onLoad={handleLoad}
            />
            
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.Primary} />
                    <Text style={styles.loadingText}>Loading video...</Text>
                </View>
            )}

            {!showControls && !isLoading && (
                <Pressable
                    style={styles.playButtonOverlay}
                    onPress={togglePlayPause}
                >
                    <View style={styles.playButton}>
                        <IconSymbol 
                            name={isPlaying ? "pause.fill" : "play.fill"} 
                            color={Colors.White} 
                            size={32} 
                        />
                    </View>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.Secondary,
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.White,
        marginTop: 8,
        fontSize: 12,
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: Colors.Gray,
        marginTop: 8,
        fontSize: 12,
    },
    retryButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.Primary,
        borderRadius: 8,
    },
    retryText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '600',
    },
});

