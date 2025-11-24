/**
 * Offline Cache Utility
 * 
 * Handles downloading and caching media files for offline access
 * Implements cache-first strategy for media display
 */

import * as FileSystemLegacy from 'expo-file-system/legacy';
import { cacheManager, CacheFileInfo } from './cacheManager';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface CachedMediaMetadata {
    originalUrl: string;
    cachedUri: string;
    fileId?: string; // Appwrite file ID
    type: 'image' | 'video' | 'audio' | 'document';
    size: number;
    cachedAt: number;
    lastAccessed: number;
    accessCount: number;
}

export interface OfflineCacheConfig {
    enableOfflineCache: boolean;
    maxCacheSizeBytes: number;
    preloadOnWifi: boolean; // Only preload on WiFi
    preloadRecentCount: number; // Number of recent items to preload
}

const DEFAULT_CONFIG: OfflineCacheConfig = {
    enableOfflineCache: true,
    maxCacheSizeBytes: 100 * 1024 * 1024, // 100MB (uses cacheManager's limit)
    preloadOnWifi: true,
    preloadRecentCount: 20, // Preload last 20 viewed items
};

const METADATA_KEY = 'offline_cache_metadata';
const CONFIG_KEY = 'offline_cache_config';

class OfflineCache {
    private metadata: Map<string, CachedMediaMetadata> = new Map();
    private config: OfflineCacheConfig;
    private isInitialized = false;

    constructor() {
        this.config = DEFAULT_CONFIG;
    }

    /**
     * Initialize offline cache (load metadata from storage)
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load metadata
            const metadataJson = await SecureStore.getItemAsync(METADATA_KEY);
            if (metadataJson) {
                const metadataArray = JSON.parse(metadataJson) as CachedMediaMetadata[];
                this.metadata = new Map(
                    metadataArray.map(item => [item.originalUrl, item])
                );
            }

            // Load config
            const configJson = await SecureStore.getItemAsync(CONFIG_KEY);
            if (configJson) {
                this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configJson) };
            }

            // Sync with cache manager's config
            const cacheConfig = cacheManager.getConfig();
            this.config.maxCacheSizeBytes = cacheConfig.maxSizeBytes;

            this.isInitialized = true;
            console.log('[OfflineCache] ✅ Initialized with', this.metadata.size, 'cached items');
        } catch (error) {
            console.error('[OfflineCache] ❌ Error initializing:', error);
            this.isInitialized = true; // Mark as initialized to prevent retry loops
        }
    }

    /**
     * Save metadata to persistent storage
     */
    private async saveMetadata(): Promise<void> {
        try {
            const metadataArray = Array.from(this.metadata.values());
            await SecureStore.setItemAsync(METADATA_KEY, JSON.stringify(metadataArray));
        } catch (error) {
            console.error('[OfflineCache] ❌ Error saving metadata:', error);
        }
    }

    /**
     * Get cached URI for a media URL (cache-first strategy)
     * Returns cached URI if available, otherwise returns original URL
     */
    async getCachedUri(originalUrl: string): Promise<string> {
        await this.initialize();

        const metadata = this.metadata.get(originalUrl);
        if (!metadata) {
            return originalUrl; // Not cached, return original URL
        }

        // Check if cached file still exists
        try {
            const fileInfo = await FileSystemLegacy.getInfoAsync(metadata.cachedUri);
            if (fileInfo.exists) {
                // Update access stats
                metadata.lastAccessed = Date.now();
                metadata.accessCount++;
                await this.saveMetadata();

                console.log('[OfflineCache] ✅ Using cached file for:', originalUrl);
                return metadata.cachedUri;
            } else {
                // File was deleted (by OS or cache cleanup), remove from metadata
                console.log('[OfflineCache] ⚠️ Cached file missing, removing from metadata');
                this.metadata.delete(originalUrl);
                await this.saveMetadata();
            }
        } catch (error) {
            console.error('[OfflineCache] ❌ Error checking cached file:', error);
        }

        return originalUrl; // Fallback to original URL
    }

    /**
     * Download and cache a media file
     */
    async cacheMedia(
        originalUrl: string,
        fileId?: string,
        type: CachedMediaMetadata['type'] = 'image'
    ): Promise<string | null> {
        await this.initialize();

        // Check if already cached
        const existing = this.metadata.get(originalUrl);
        if (existing) {
            const fileInfo = await FileSystemLegacy.getInfoAsync(existing.cachedUri);
            if (fileInfo.exists) {
                console.log('[OfflineCache] ✅ Already cached:', originalUrl);
                return existing.cachedUri;
            }
        }

        // Network check is optional - download will fail gracefully if offline
        // For production, you might want to add @react-native-community/netinfo

        try {
            // Check cache size before downloading
            const stats = await cacheManager.getCacheStats();
            if (stats.totalSize >= this.config.maxCacheSizeBytes) {
                console.log('[OfflineCache] ⚠️ Cache size limit reached, cleaning up...');
                await cacheManager.cleanupBySizeLimit();
            }

            // Generate cache file path
            const urlHash = this.hashUrl(originalUrl);
            const extension = this.getFileExtension(originalUrl, type);
            const fileName = `${type}_${urlHash}${extension}`;
            const cachedUri = `${cacheManager.getCacheDirectory()}${fileName}`;

            console.log('[OfflineCache] 📥 Downloading:', originalUrl);

            // Download file
            const downloadResult = await FileSystemLegacy.downloadAsync(originalUrl, cachedUri);

            if (!downloadResult || downloadResult.status !== 200) {
                throw new Error(`Download failed with status ${downloadResult?.status}`);
            }

            // Get file size
            const fileInfo = await FileSystemLegacy.getInfoAsync(cachedUri);
            const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size || 0 : 0;

            // Create metadata
            const metadata: CachedMediaMetadata = {
                originalUrl,
                cachedUri,
                fileId,
                type,
                size,
                cachedAt: Date.now(),
                lastAccessed: Date.now(),
                accessCount: 1,
            };

            // Save metadata
            this.metadata.set(originalUrl, metadata);
            await this.saveMetadata();

            console.log('[OfflineCache] ✅ Cached successfully:', originalUrl, `(${cacheManager.formatBytes(size)})`);

            return cachedUri;
        } catch (error) {
            console.error('[OfflineCache] ❌ Error caching media:', error);
            return null;
        }
    }

    /**
     * Preload recent media items
     */
    async preloadRecentMedia(urls: string[], type: CachedMediaMetadata['type'] = 'image'): Promise<void> {
        await this.initialize();

        if (!this.config.enableOfflineCache) {
            return;
        }

        // Network check is optional - preload will fail gracefully if offline
        // For production, you might want to add @react-native-community/netinfo

        // Limit to recent count
        const urlsToPreload = urls.slice(0, this.config.preloadRecentCount);

        console.log(`[OfflineCache] 🚀 Preloading ${urlsToPreload.length} items...`);

        // Preload in background (don't await)
        Promise.all(
            urlsToPreload.map(url => this.cacheMedia(url, undefined, type))
        ).then(() => {
            console.log('[OfflineCache] ✅ Preload complete');
        }).catch(error => {
            console.error('[OfflineCache] ❌ Preload error:', error);
        });
    }

    /**
     * Remove cached media
     */
    async removeCachedMedia(originalUrl: string): Promise<boolean> {
        await this.initialize();

        const metadata = this.metadata.get(originalUrl);
        if (!metadata) {
            return false;
        }

        try {
            // Delete file
            await cacheManager.deleteCacheFile(metadata.cachedUri);

            // Remove from metadata
            this.metadata.delete(originalUrl);
            await this.saveMetadata();

            console.log('[OfflineCache] ✅ Removed cached media:', originalUrl);
            return true;
        } catch (error) {
            console.error('[OfflineCache] ❌ Error removing cached media:', error);
            return false;
        }
    }

    /**
     * Get all cached media metadata
     */
    getCachedMedia(): CachedMediaMetadata[] {
        return Array.from(this.metadata.values());
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{
        totalCached: number;
        totalSize: number;
        byType: Record<string, { count: number; size: number }>;
    }> {
        await this.initialize();

        const cached = this.getCachedMedia();
        const byType: Record<string, { count: number; size: number }> = {};

        let totalSize = 0;

        for (const item of cached) {
            totalSize += item.size;
            if (!byType[item.type]) {
                byType[item.type] = { count: 0, size: 0 };
            }
            byType[item.type].count++;
            byType[item.type].size += item.size;
        }

        return {
            totalCached: cached.length,
            totalSize,
            byType,
        };
    }

    /**
     * Clear all cached media
     */
    async clearAllCache(): Promise<number> {
        await this.initialize();

        const cached = this.getCachedMedia();
        let deletedCount = 0;

        for (const item of cached) {
            const deleted = await this.removeCachedMedia(item.originalUrl);
            if (deleted) {
                deletedCount++;
            }
        }

        console.log(`[OfflineCache] ✅ Cleared ${deletedCount} cached items`);
        return deletedCount;
    }

    /**
     * Update configuration
     */
    async updateConfig(config: Partial<OfflineCacheConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        
        // Sync with cache manager's config
        const cacheConfig = cacheManager.getConfig();
        this.config.maxCacheSizeBytes = cacheConfig.maxSizeBytes;

        try {
            await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(this.config));
        } catch (error) {
            console.error('[OfflineCache] ❌ Error saving config:', error);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): OfflineCacheConfig {
        return { ...this.config };
    }

    /**
     * Hash URL to create unique filename
     */
    private hashUrl(url: string): string {
        // Simple hash function (for production, consider using crypto)
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get file extension from URL or type
     */
    private getFileExtension(url: string, type: CachedMediaMetadata['type']): string {
        // Try to get extension from URL
        const urlMatch = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
        if (urlMatch) {
            return `.${urlMatch[1]}`;
        }

        // Fallback to type-based extension
        const extensions: Record<CachedMediaMetadata['type'], string> = {
            image: '.jpg',
            video: '.mp4',
            audio: '.m4a',
            document: '.pdf',
        };

        return extensions[type] || '.bin';
    }
}

// Export singleton instance
export const offlineCache = new OfflineCache();

// Export for testing or custom instances
export default OfflineCache;

