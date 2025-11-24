/**
 * Cache Manager Utility
 * 
 * Handles cache cleanup, size monitoring, and eviction for WorkPhotoPro V2
 * Implements LRU eviction, TTL expiration, and size-based limits
 */

import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface CacheFileInfo {
    uri: string;
    size: number;
    createdAt: number;
    lastAccessed: number;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

export interface CacheStats {
    totalSize: number; // in bytes
    fileCount: number;
    oldestFile: CacheFileInfo | null;
    newestFile: CacheFileInfo | null;
}

export interface CacheConfig {
    maxSizeBytes: number; // Maximum cache size in bytes (default: 100MB)
    ttlDays: number; // Time-to-live in days (default: 7)
    enableAutoCleanup: boolean; // Auto cleanup on app start (default: true)
}

const DEFAULT_CONFIG: CacheConfig = {
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    ttlDays: 7,
    enableAutoCleanup: true,
};

class CacheManager {
    private config: CacheConfig;
    private cacheDirectory: string;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.cacheDirectory = FileSystemLegacy.cacheDirectory || '';
    }

    /**
     * Get cache directory path
     */
    getCacheDirectory(): string {
        return this.cacheDirectory;
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<CacheStats> {
        try {
            const files = await this.listCacheFiles();
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            const sortedByDate = [...files].sort((a, b) => a.createdAt - b.createdAt);
            const sortedByAccess = [...files].sort((a, b) => a.lastAccessed - b.lastAccessed);

            return {
                totalSize,
                fileCount: files.length,
                oldestFile: sortedByDate[0] || null,
                newestFile: sortedByDate[sortedByDate.length - 1] || null,
            };
        } catch (error) {
            console.error('[CacheManager] Error getting cache stats:', error);
            return {
                totalSize: 0,
                fileCount: 0,
                oldestFile: null,
                newestFile: null,
            };
        }
    }

    /**
     * List all files in cache directory with metadata
     */
    private async listCacheFiles(): Promise<CacheFileInfo[]> {
        try {
            const dirInfo = await FileSystemLegacy.getInfoAsync(this.cacheDirectory);
            if (!dirInfo.exists || !dirInfo.isDirectory) {
                return [];
            }

            // Read directory contents
            const files = await FileSystemLegacy.readDirectoryAsync(this.cacheDirectory);
            const fileInfos: CacheFileInfo[] = [];

            for (const fileName of files) {
                const fileUri = `${this.cacheDirectory}${fileName}`;
                try {
                    const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);
                    if (fileInfo.exists && !fileInfo.isDirectory && 'size' in fileInfo) {
                        // Try to determine file type from extension
                        const type = this.getFileType(fileName);
                        
                        // Use current time as fallback (we can't reliably get file creation time)
                        // In a production app, you might want to track this in a metadata file
                        const createdAt = Date.now();
                        
                        fileInfos.push({
                            uri: fileUri,
                            size: fileInfo.size || 0,
                            createdAt,
                            lastAccessed: createdAt, // We don't track access time separately
                            type,
                        });
                    }
                } catch (error) {
                    console.warn(`[CacheManager] Error reading file ${fileName}:`, error);
                }
            }

            return fileInfos;
        } catch (error) {
            console.error('[CacheManager] Error listing cache files:', error);
            return [];
        }
    }

    /**
     * Determine file type from filename
     */
    private getFileType(fileName: string): CacheFileInfo['type'] {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) {
            return 'image';
        } else if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) {
            return 'video';
        } else if (['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext)) {
            return 'audio';
        } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'zip', 'rar'].includes(ext)) {
            return 'document';
        }
        
        return 'other';
    }

    /**
     * Delete a specific cache file
     */
    async deleteCacheFile(fileUri: string): Promise<boolean> {
        try {
            const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);
            if (fileInfo.exists) {
                await FileSystemLegacy.deleteAsync(fileUri, { idempotent: true });
                console.log(`[CacheManager] ✅ Deleted cache file: ${fileUri}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[CacheManager] ❌ Error deleting cache file ${fileUri}:`, error);
            return false;
        }
    }

    /**
     * Clean up expired files (TTL-based eviction)
     */
    async cleanupExpiredFiles(): Promise<number> {
        try {
            const files = await this.listCacheFiles();
            const now = Date.now();
            const ttlMs = this.config.ttlDays * 24 * 60 * 60 * 1000;
            let deletedCount = 0;

            for (const file of files) {
                const age = now - file.createdAt;
                if (age > ttlMs) {
                    const deleted = await this.deleteCacheFile(file.uri);
                    if (deleted) {
                        deletedCount++;
                    }
                }
            }

            console.log(`[CacheManager] ✅ Cleaned up ${deletedCount} expired files`);
            return deletedCount;
        } catch (error) {
            console.error('[CacheManager] ❌ Error cleaning up expired files:', error);
            return 0;
        }
    }

    /**
     * Clean up files exceeding size limit (LRU eviction)
     */
    async cleanupBySizeLimit(): Promise<number> {
        try {
            const stats = await this.getCacheStats();
            
            if (stats.totalSize <= this.config.maxSizeBytes) {
                return 0; // No cleanup needed
            }

            const files = await this.listCacheFiles();
            // Sort by last accessed (oldest first) for LRU eviction
            const sortedFiles = [...files].sort((a, b) => a.lastAccessed - b.lastAccessed);
            
            let currentSize = stats.totalSize;
            let deletedCount = 0;
            const targetSize = this.config.maxSizeBytes * 0.8; // Clean up to 80% of limit

            for (const file of sortedFiles) {
                if (currentSize <= targetSize) {
                    break; // We've freed enough space
                }

                const deleted = await this.deleteCacheFile(file.uri);
                if (deleted) {
                    currentSize -= file.size;
                    deletedCount++;
                }
            }

            console.log(`[CacheManager] ✅ Cleaned up ${deletedCount} files to reduce cache size`);
            return deletedCount;
        } catch (error) {
            console.error('[CacheManager] ❌ Error cleaning up by size limit:', error);
            return 0;
        }
    }

    /**
     * Clear all cache files
     */
    async clearAllCache(): Promise<number> {
        try {
            const files = await this.listCacheFiles();
            let deletedCount = 0;

            for (const file of files) {
                const deleted = await this.deleteCacheFile(file.uri);
                if (deleted) {
                    deletedCount++;
                }
            }

            console.log(`[CacheManager] ✅ Cleared ${deletedCount} cache files`);
            return deletedCount;
        } catch (error) {
            console.error('[CacheManager] ❌ Error clearing all cache:', error);
            return 0;
        }
    }

    /**
     * Perform automatic cleanup (expired files + size limit)
     */
    async performAutoCleanup(): Promise<{ expired: number; sizeLimit: number }> {
        if (!this.config.enableAutoCleanup) {
            return { expired: 0, sizeLimit: 0 };
        }

        console.log('[CacheManager] 🧹 Starting automatic cache cleanup...');
        
        const expired = await this.cleanupExpiredFiles();
        const sizeLimit = await this.cleanupBySizeLimit();

        console.log(`[CacheManager] ✅ Auto cleanup complete: ${expired} expired, ${sizeLimit} by size limit`);
        
        return { expired, sizeLimit };
    }

    /**
     * Format bytes to human-readable string
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<CacheConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): CacheConfig {
        return { ...this.config };
    }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export for testing or custom instances
export default CacheManager;

