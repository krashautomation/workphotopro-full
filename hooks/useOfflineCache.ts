/**
 * React Hook for Offline Cache
 * 
 * Provides easy-to-use hooks for cache-first media display
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineCache, CachedMediaMetadata } from '@/utils/offlineCache';

export interface UseOfflineCacheResult {
    cachedUri: string | null;
    isCached: boolean;
    isCaching: boolean;
    cacheError: Error | null;
    cacheMedia: () => Promise<void>;
}

/**
 * Hook to get cached URI for a media URL (cache-first)
 * Automatically returns cached URI if available, otherwise returns original URL
 */
export function useCachedMedia(originalUrl: string | null | undefined): string {
    const [cachedUri, setCachedUri] = useState<string>(originalUrl || '');

    useEffect(() => {
        if (!originalUrl) {
            setCachedUri('');
            return;
        }

        // Initialize offline cache
        offlineCache.initialize().then(() => {
            // Get cached URI (returns original if not cached)
            offlineCache.getCachedUri(originalUrl).then(uri => {
                setCachedUri(uri);
            });
        });
    }, [originalUrl]);

    return cachedUri;
}

/**
 * Hook to cache media and get cache status
 */
export function useOfflineCache(
    originalUrl: string | null | undefined,
    fileId?: string,
    type: 'image' | 'video' | 'audio' | 'document' = 'image'
): UseOfflineCacheResult {
    const [cachedUri, setCachedUri] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [isCaching, setIsCaching] = useState(false);
    const [cacheError, setCacheError] = useState<Error | null>(null);

    useEffect(() => {
        if (!originalUrl) {
            setCachedUri(null);
            setIsCached(false);
            return;
        }

        // Initialize and check cache
        offlineCache.initialize().then(() => {
            offlineCache.getCachedUri(originalUrl).then(uri => {
                setCachedUri(uri);
                setIsCached(uri !== originalUrl); // Cached if URI changed
            });
        });
    }, [originalUrl]);

    const cacheMedia = useCallback(async () => {
        if (!originalUrl || isCaching) return;

        setIsCaching(true);
        setCacheError(null);

        try {
            await offlineCache.initialize();
            const uri = await offlineCache.cacheMedia(originalUrl, fileId, type);
            
            if (uri) {
                setCachedUri(uri);
                setIsCached(true);
            } else {
                setCacheError(new Error('Failed to cache media'));
            }
        } catch (error) {
            setCacheError(error instanceof Error ? error : new Error('Unknown error'));
        } finally {
            setIsCaching(false);
        }
    }, [originalUrl, fileId, type, isCaching]);

    return {
        cachedUri: cachedUri || originalUrl || null,
        isCached,
        isCaching,
        cacheError,
        cacheMedia,
    };
}

/**
 * Hook to preload multiple media URLs
 */
export function usePreloadMedia() {
    const [preloading, setPreloading] = useState(false);
    const [preloadProgress, setPreloadProgress] = useState(0);

    const preloadMedia = useCallback(async (
        urls: string[],
        type: 'image' | 'video' | 'audio' | 'document' = 'image'
    ) => {
        if (preloading || urls.length === 0) return;

        setPreloading(true);
        setPreloadProgress(0);

        try {
            await offlineCache.initialize();
            
            // Preload in background
            offlineCache.preloadRecentMedia(urls, type).then(() => {
                setPreloadProgress(100);
                setPreloading(false);
            });

            // Simulate progress (since preload is async)
            const interval = setInterval(() => {
                setPreloadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 500);
        } catch (error) {
            console.error('[usePreloadMedia] Error:', error);
            setPreloading(false);
            setPreloadProgress(0);
        }
    }, [preloading]);

    return {
        preloading,
        preloadProgress,
        preloadMedia,
    };
}

