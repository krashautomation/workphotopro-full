import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
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
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // Use retryKey to force player recreation on retry
    const playerUri = retryKey > 0 ? `${uri}?retry=${retryKey}` : uri;
    const player = useVideoPlayer(playerUri, (player) => {
        player.loop = false;
    });

    useEffect(() => {
        if (!player) return;

        if (autoPlay) {
            player.play();
        }

        const subscription = player.addListener('statusChange', (status) => {
            if (status.status === 'readyToPlay') {
                setIsLoading(false);
                setHasError(false);
            } else if (status.status === 'error') {
                setIsLoading(false);
                setHasError(true);
                if (onError) {
                    onError(new Error(status.error?.message || 'Unknown video error'));
                }
            } else if (status.status === 'loading') {
                setIsLoading(true);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [player, autoPlay, onError]);

    const togglePlayPause = () => {
        if (hasError || !player) return;
        
        try {
            if (player.playing) {
                player.pause();
            } else {
                player.play();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            setHasError(true);
        }
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
                        // Force player recreation by incrementing retryKey
                        setRetryKey(prev => prev + 1);
                    }}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (!player) {
        return (
            <View style={[styles.container, style, styles.errorContainer]}>
                <ActivityIndicator size="large" color={Colors.Primary} />
                <Text style={styles.loadingText}>Initializing video...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} key={retryKey}>
            <VideoView
                player={player}
                style={styles.video}
                nativeControls={showControls}
                contentFit="contain"
            />
            
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.Primary} />
                    <Text style={styles.loadingText}>Loading video...</Text>
                </View>
            )}

            {!showControls && !isLoading && !hasError && (
                <Pressable
                    style={styles.playButtonOverlay}
                    onPress={togglePlayPause}
                >
                    <View style={styles.playButton}>
                        <IconSymbol 
                            name={player.playing ? "pause.fill" : "play.fill"} 
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

