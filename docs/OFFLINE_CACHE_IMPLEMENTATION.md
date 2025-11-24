# Offline Cache Implementation Guide

## Overview

This document describes the offline cache implementation for WorkPhotoPro V2, including offline media caching and cache preloading features.

## ✅ Implemented Features

### 1. Offline Cache Utility (`utils/offlineCache.ts`)

**Purpose:** Download and cache media files for offline access

**Features:**
- ✅ Cache-first strategy (returns cached URI if available)
- ✅ Automatic media download and caching
- ✅ Metadata storage (tracks cached files)
- ✅ Integration with cache manager (respects size limits)
- ✅ Background preloading support

**Key Methods:**
- `getCachedUri(url)` - Get cached URI or return original URL
- `cacheMedia(url, fileId, type)` - Download and cache media
- `preloadRecentMedia(urls, type)` - Preload multiple media files
- `getCacheStats()` - Get offline cache statistics

### 2. React Hooks (`hooks/useOfflineCache.ts`)

**Hooks Provided:**
- `useCachedMedia(url)` - Simple hook for cache-first image display
- `useOfflineCache(url, fileId, type)` - Full-featured hook with cache status
- `usePreloadMedia()` - Hook for preloading multiple media files

### 3. Cached Image Component (`components/CachedImage.tsx`)

**Purpose:** Drop-in replacement for React Native Image with offline cache support

**Features:**
- ✅ Cache-first display (shows cached version immediately)
- ✅ Automatic caching when viewed
- ✅ Fallback to original URL if cache fails
- ✅ Loading indicator support

**Usage:**
```tsx
import CachedImage from '@/components/CachedImage';

<CachedImage
    source={{ uri: imageUrl }}
    fileId={fileId}
    style={{ width: 200, height: 200 }}
    autoCache={true}
/>
```

### 4. Cache Preloading

**Where Implemented:**
- ✅ App start (`app/_layout.tsx`) - Initializes offline cache
- ✅ Message loading (`app/(jobs)/[job].tsx`) - Preloads images from recent messages

**Behavior:**
- Preloads last 20 viewed images (configurable)
- Only preloads on WiFi (configurable)
- Runs in background (non-blocking)
- Respects cache size limits

### 5. Cache Settings Integration

**Updated:** `app/(jobs)/settings/cache.tsx`

**New Features:**
- ✅ Shows offline cache statistics
- ✅ Displays cached media count by type
- ✅ Shows offline cache size
- ✅ Integrated with existing cache management

## 📊 How It Works

### Cache-First Strategy

```
User Views Image
    ↓
Check Cache
    ↓
┌─────────────┬──────────────┐
│ Cached?     │ Not Cached? │
│             │              │
│ Show Cache  │ Show Original│
│ (instant)   │ (network)    │
│             │              │
│ Auto-cache  │ Auto-cache   │
│ in bg       │ in bg        │
└─────────────┴──────────────┘
```

### Preloading Flow

```
App Start / Message Load
    ↓
Extract Image URLs
    ↓
Check Network (WiFi?)
    ↓
Check Cache Size
    ↓
Download & Cache (Background)
    ↓
Update Metadata
```

## 🔧 Configuration

### Default Settings

```typescript
{
    enableOfflineCache: true,
    maxCacheSizeBytes: 100MB, // Uses cacheManager's limit
    preloadOnWifi: true,
    preloadRecentCount: 20,
}
```

### Updating Configuration

```typescript
import { offlineCache } from '@/utils/offlineCache';

await offlineCache.updateConfig({
    preloadRecentCount: 30, // Preload 30 items instead of 20
    preloadOnWifi: false, // Preload on any network
});
```

## 📱 Usage Examples

### Example 1: Simple Image Display (Cache-First)

```tsx
import CachedImage from '@/components/CachedImage';

<CachedImage
    source={{ uri: imageUrl }}
    style={{ width: 200, height: 200 }}
/>
```

### Example 2: Manual Caching

```tsx
import { useOfflineCache } from '@/hooks/useOfflineCache';

const { cachedUri, isCached, cacheMedia } = useOfflineCache(
    imageUrl,
    fileId,
    'image'
);

// Cache manually
await cacheMedia();

// Use cached URI
<Image source={{ uri: cachedUri }} />
```

### Example 3: Preload Multiple Images

```tsx
import { usePreloadMedia } from '@/hooks/useOfflineCache';

const { preloadMedia } = usePreloadMedia();

// Preload images from messages
const imageUrls = messages
    .filter(m => m.imageUrl || m.imageUrls)
    .flatMap(m => m.imageUrls || [m.imageUrl])
    .filter(Boolean);

await preloadMedia(imageUrls, 'image');
```

## 🎯 Integration Points

### Current Integration

1. **App Start** (`app/_layout.tsx`)
   - Initializes offline cache
   - Logs cache statistics

2. **Message Loading** (`app/(jobs)/[job].tsx`)
   - Preloads images from recent messages
   - Runs in background

3. **Cache Settings** (`app/(jobs)/settings/cache.tsx`)
   - Shows offline cache statistics
   - Displays cached media by type

### Future Integration Opportunities

1. **Image Display Components**
   - Replace `Image` with `CachedImage` in message display
   - Add cache-first to image viewer

2. **Video/Audio Players**
   - Add cache-first support to VideoPlayer
   - Add cache-first support to AudioPlayer

3. **Job Uploads Screen**
   - Preload images when viewing uploads
   - Cache frequently accessed media

## 📈 Performance Impact

### Memory Usage
- **RAM:** +20-50MB (for metadata and active downloads)
- **Disk:** Controlled by cache size limits (100MB default)

### Network Usage
- **Preloading:** Only on WiFi (configurable)
- **Auto-caching:** Only when viewing (configurable)
- **Background:** Non-blocking downloads

### Storage Impact
- **Metadata:** ~1-5MB (stored in SecureStore)
- **Media Files:** Controlled by cache size limits
- **Auto-eviction:** Respects LRU and TTL policies

## 🔍 Monitoring

### Cache Statistics

```typescript
import { offlineCache } from '@/utils/offlineCache';

const stats = await offlineCache.getCacheStats();
console.log({
    totalCached: stats.totalCached,
    totalSize: stats.totalSize,
    byType: stats.byType, // { image: { count, size }, video: {...} }
});
```

### Logging

All cache operations are logged:
```
[OfflineCache] ✅ Cached successfully: https://...
[OfflineCache] 🚀 Preloading 20 items...
[OfflineCache] ✅ Using cached file for: https://...
```

## ⚙️ Best Practices

1. **Use CachedImage Component**
   - Drop-in replacement for Image
   - Automatic cache-first behavior
   - Handles errors gracefully

2. **Preload Strategically**
   - Only preload frequently accessed content
   - Respect WiFi-only setting
   - Limit preload count

3. **Monitor Cache Size**
   - Check cache statistics regularly
   - Adjust limits based on usage
   - Clean up when needed

4. **Handle Errors Gracefully**
   - Cache failures are non-critical
   - Always fallback to original URL
   - Log errors for debugging

## 🐛 Troubleshooting

### Cache Not Working

1. **Check Initialization**
   ```typescript
   await offlineCache.initialize();
   ```

2. **Check Cache Stats**
   ```typescript
   const stats = await offlineCache.getCacheStats();
   console.log('Cache stats:', stats);
   ```

3. **Check File Existence**
   ```typescript
   const cachedUri = await offlineCache.getCachedUri(url);
   const fileInfo = await FileSystem.getInfoAsync(cachedUri);
   console.log('File exists:', fileInfo.exists);
   ```

### Preload Not Working

1. **Check Network**
   - Preload only works on WiFi (if configured)
   - Check network connection

2. **Check Cache Size**
   - Cache might be full
   - Check cache statistics

3. **Check Logs**
   - Look for preload errors in console
   - Check for network errors

## 📚 Related Files

- `utils/offlineCache.ts` - Core offline cache implementation
- `hooks/useOfflineCache.ts` - React hooks for offline cache
- `components/CachedImage.tsx` - Cached image component
- `utils/cacheManager.ts` - Cache management (eviction, cleanup)
- `app/_layout.tsx` - App start initialization
- `app/(jobs)/[job].tsx` - Message preloading
- `app/(jobs)/settings/cache.tsx` - Cache settings screen

## 🎉 Benefits

1. **Faster Loading** - Cached media loads instantly
2. **Offline Access** - View cached media without network
3. **Reduced Data Usage** - Less network requests
4. **Better UX** - Smooth, responsive media display
5. **Industry Standard** - Follows patterns from Instagram, WhatsApp

---

**Status:** ✅ Implemented  
**Next Steps:** Integrate CachedImage into message display components

