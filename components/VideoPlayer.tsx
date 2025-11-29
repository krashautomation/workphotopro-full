import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useCachedMedia } from '@/hooks/useOfflineCache';
import { offlineCache } from '@/utils/offlineCache';

interface VideoPlayerProps {
    uri: string;
    fileId?: string; // Appwrite file ID for caching
    style?: any;
    showControls?: boolean;
    autoPlay?: boolean;
    onError?: (error: Error) => void;
    autoCache?: boolean; // Automatically cache when viewed (default: true)
}

export default function VideoPlayer({ 
    uri, 
    fileId,
    style, 
    showControls = true,
    autoPlay = false,
    onError,
    autoCache = true,
}: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const playerRef = useRef<any>(null);
    const isUnmountingRef = useRef(false);
    
    // Get cached URI (cache-first strategy)
    const cachedUri = useCachedMedia(uri);

    // Auto-cache video when viewed (if enabled and not already cached)
    useEffect(() => {
        if (autoCache && uri && cachedUri === uri) {
            offlineCache.initialize().then(() => {
                offlineCache.cacheMedia(uri, fileId, 'video').catch(err => {
                    console.warn('[VideoPlayer] Cache error (non-critical):', err);
                });
            });
        }
    }, [uri, cachedUri, autoCache, fileId]);

    // Reset state when URI changes
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        setRetryKey(0);
    }, [uri]);

    // Use retryKey and URI to force player recreation on retry or URI change
    // Use a stable key to prevent unnecessary player recreation
    const playerUri = React.useMemo(() => {
        return retryKey > 0 ? `${cachedUri}?retry=${retryKey}` : cachedUri;
    }, [cachedUri, retryKey]);
    
    const player = useVideoPlayer(playerUri, (player) => {
        player.loop = false;
    });

    useEffect(() => {
        if (!player || isUnmountingRef.current) return;

        if (autoPlay) {
            try {
                if (typeof player.play === 'function') {
                    player.play();
                }
            } catch (error) {
                console.warn('[VideoPlayer] Error auto-playing:', error);
            }
        }

        let subscription: any = null;
        try {
            subscription = player.addListener('statusChange', (status) => {
                if (isUnmountingRef.current) return;
                
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
        } catch (error) {
            console.warn('[VideoPlayer] Error setting up listener:', error);
        }

        return () => {
            if (subscription) {
                try {
                    subscription.remove();
                } catch (error) {
                    // Subscription may already be removed
                }
            }
        };
    }, [player, autoPlay, onError]);

    // Store player reference
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    // Cleanup player when component unmounts
    useEffect(() => {
        isUnmountingRef.current = false;
        return () => {
            isUnmountingRef.current = true;
            // Don't try to cleanup player - expo-video handles it automatically
            // Attempting to cleanup can cause errors if player is already released
            playerRef.current = null;
        };
    }, []);

    const togglePlayPause = () => {
        if (hasError || !player || isUnmountingRef.current) return;
        
        try {
            // Check if player methods are available before calling
            if (typeof player.playing !== 'undefined' && typeof player.pause === 'function' && typeof player.play === 'function') {
                if (player.playing) {
                    player.pause();
                } else {
                    player.play();
                }
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

    if (!player || isUnmountingRef.current) {
        return (
            <View style={[styles.container, style, styles.errorContainer]}>
                <ActivityIndicator size="large" color={Colors.Primary} />
                <Text style={styles.loadingText}>Initializing video...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} key={`${fileId || uri}-${retryKey}`}>
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

            {!showControls && !isLoading && !hasError && player && (
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

