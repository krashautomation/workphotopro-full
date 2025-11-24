/**
 * Cached Image Component
 * 
 * Image component with offline cache support (cache-first strategy)
 */

import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useCachedMedia } from '@/hooks/useOfflineCache';
import { offlineCache } from '@/utils/offlineCache';
import { Colors } from '@/utils/colors';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
    source: { uri: string } | string;
    fileId?: string; // Appwrite file ID for caching
    autoCache?: boolean; // Automatically cache when viewed (default: true)
    showLoadingIndicator?: boolean; // Show loading indicator while caching
}

export default function CachedImage({
    source,
    fileId,
    autoCache = true,
    showLoadingIndicator = false,
    ...imageProps
}: CachedImageProps) {
    const uri = typeof source === 'string' ? source : source.uri;
    const cachedUri = useCachedMedia(uri);
    const [isCaching, setIsCaching] = useState(false);

    useEffect(() => {
        // Auto-cache when image is viewed (if enabled and not already cached)
        if (autoCache && uri && cachedUri === uri) {
            setIsCaching(true);
            offlineCache.initialize().then(() => {
                offlineCache.cacheMedia(uri, fileId, 'image').finally(() => {
                    setIsCaching(false);
                });
            });
        }
    }, [uri, cachedUri, autoCache, fileId]);

    return (
        <View style={styles.container}>
            <Image
                {...imageProps}
                source={{ uri: cachedUri }}
                onError={(error) => {
                    // Fallback to original URL if cached version fails
                    if (cachedUri !== uri) {
                        console.warn('[CachedImage] Cached image failed, using original');
                    }
                    imageProps.onError?.(error);
                }}
            />
            {showLoadingIndicator && isCaching && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.Primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
});

