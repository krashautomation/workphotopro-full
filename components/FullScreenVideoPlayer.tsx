import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Pressable, 
    ActivityIndicator, 
    Text, 
    Modal, 
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/utils/colors';
import { useCachedMedia } from '@/hooks/useOfflineCache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenVideoPlayerProps {
    uri: string;
    fileId?: string;
    visible: boolean;
    onClose: () => void;
    onError?: (error: Error) => void;
}

export default function FullScreenVideoPlayer({
    uri,
    fileId,
    visible,
    onClose,
    onError,
}: FullScreenVideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isUnmountingRef = useRef(false);

    // Get cached URI
    const cachedUri = useCachedMedia(uri);

    const player = useVideoPlayer(cachedUri, (player) => {
        player.loop = false;
    });

    // Track player state and update current time
    useEffect(() => {
        if (!player || isUnmountingRef.current) return;

        // Update playing state
        const checkPlaying = () => {
            if (isUnmountingRef.current || !player) return;
            try {
                setIsPlaying(player.playing ?? false);
            } catch (error) {
                // Ignore errors
            }
        };

        // Update current time and duration periodically
        const updateTime = () => {
            if (isUnmountingRef.current || !player) return;
            try {
                if (player.currentTime !== undefined) {
                    setCurrentTime(player.currentTime);
                }
                if (player.duration !== undefined && player.duration > 0) {
                    setDuration(player.duration);
                }
            } catch (error) {
                // Ignore errors
            }
        };

        // Initial check
        checkPlaying();
        updateTime();

        // Set up interval to update time
        timeUpdateIntervalRef.current = setInterval(() => {
            checkPlaying();
            updateTime();
        }, 200);

        // Listen for status changes
        let subscription: any = null;
        try {
            subscription = player.addListener('statusChange', (status) => {
                if (isUnmountingRef.current) return;
                checkPlaying();
                updateTime();
            });
        } catch (error) {
            console.warn('[FullScreenVideoPlayer] Error setting up listener:', error);
        }

        return () => {
            if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
            }
            if (subscription) {
                try {
                    subscription.remove();
                } catch (error) {
                    // Ignore
                }
            }
        };
    }, [player]);

    // Auto-hide controls after 3 seconds when playing
    useEffect(() => {
        if (visible && isPlaying) {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                if (!isUnmountingRef.current) {
                    setShowControls(false);
                }
            }, 3000);
        }
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [visible, isPlaying]);

    // Show controls when paused
    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
        }
    }, [isPlaying]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setIsLoading(true);
            setHasError(false);
            setShowControls(true);
        } else {
            if (player && typeof player.pause === 'function') {
                try {
                    player.pause();
                } catch (error) {
                    // Ignore pause errors
                }
            }
        }
    }, [visible]);

    useEffect(() => {
        if (!player || isUnmountingRef.current) return;

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
            console.warn('[FullScreenVideoPlayer] Error setting up listener:', error);
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
    }, [player, onError]);

    useEffect(() => {
        isUnmountingRef.current = false;
        return () => {
            isUnmountingRef.current = true;
        };
    }, []);

    const togglePlayPause = () => {
        if (hasError || !player || isUnmountingRef.current) return;
        
        try {
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

    const handleSeek = (position: number) => {
        if (!player || hasError) return;
        try {
            if (typeof player.seekTo === 'function') {
                player.seekTo(position);
            }
        } catch (error) {
            console.error('Error seeking:', error);
        }
    };


    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? currentTime / duration : 0;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Video View */}
                <VideoView
                    player={player}
                    style={styles.video}
                    contentFit="contain"
                    nativeControls={false}
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.White} />
                    </View>
                )}

                {/* Error Overlay */}
                {hasError && (
                    <View style={styles.errorOverlay}>
                        <IconSymbol name="video.slash" color={Colors.White} size={48} />
                        <Text style={styles.errorText}>Failed to load video</Text>
                    </View>
                )}

                {/* Controls Overlay */}
                {showControls && !isLoading && !hasError && (
                    <Pressable
                        style={styles.controlsOverlay}
                        onPress={() => setShowControls(false)}
                    >
                        {/* Center Play/Pause Button */}
                        <Pressable
                            style={styles.centerPlayButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                togglePlayPause();
                            }}
                        >
                            <View style={styles.playButtonCircle}>
                                <IconSymbol
                                    name={isPlaying ? "pause.fill" : "play.fill"}
                                    color={Colors.White}
                                    size={40}
                                />
                            </View>
                        </Pressable>

                        {/* Bottom Controls */}
                        <View style={styles.bottomControls}>
                            {/* Progress Bar */}
                            <View style={styles.progressBarContainer}>
                                <Pressable
                                    style={styles.progressBar}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        const { locationX } = e.nativeEvent;
                                        const progressBarWidth = SCREEN_WIDTH - 40;
                                        const seekPosition = (locationX / progressBarWidth) * duration;
                                        handleSeek(Math.max(0, Math.min(seekPosition, duration)));
                                    }}
                                >
                                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                                </Pressable>
                            </View>

                            {/* Time Controls */}
                            <View style={styles.timeControls}>
                                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                            </View>
                        </View>
                    </Pressable>
                )}

                {/* Back Arrow Button */}
                {showControls && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onClose}
                    >
                        <IconSymbol name="chevron.left" color={Colors.White} size={24} />
                    </TouchableOpacity>
                )}

                {/* Close Button */}
                {showControls && (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <IconSymbol name="xmark" color={Colors.White} size={24} />
                    </TouchableOpacity>
                )}

                {/* Tap to show controls when hidden */}
                {!showControls && !isLoading && !hasError && (
                    <Pressable
                        style={styles.tapOverlay}
                        onPress={() => setShowControls(true)}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Colors.White,
        marginTop: 16,
        fontSize: 16,
    },
    controlsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerPlayButton: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 120,
        paddingHorizontal: 20,
    },
    progressBarContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.Primary,
        borderRadius: 2,
    },
    timeControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '500',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    tapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

