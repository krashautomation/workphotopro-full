# 📊 Complete Caching and Storage Analysis Report
## WorkPhotoPro V2 - Media File Handling

**Generated:** 2024  
**Platform:** Expo SDK 54 (iOS, Android, Web)  
**Backend:** Appwrite Cloud Storage

---

## Executive Summary

WorkPhotoPro V2 is a React Native/Expo application that handles multiple media types (images, videos, audio, documents) with **minimal local caching**. The app primarily relies on **Appwrite cloud storage** for persistent media storage, with **temporary local storage** used only during capture/upload workflows. There is **no comprehensive offline caching strategy** implemented.

### Key Findings:
- ✅ **Temporary caching** exists for workflow transitions
- ❌ **No persistent offline caching** for media files
- ❌ **No cache eviction/purging logic**
- ❌ **No custom caching library** (relies on Expo defaults)
- ⚠️ **Limited offline access** - media requires network connection

---

## 1. Media Type Breakdown

### 1.1 Images 📸

#### Storage Locations:
1. **Temporary Capture Storage**
   - **Path:** Camera capture → In-memory URI → SecureStore
   - **Location:** `expo-secure-store` (encrypted key-value store)
   - **Purpose:** Temporary storage between camera screen and chat screen
   - **Code:** `app/(jobs)/camera.tsx:505` → `SecureStore.setItemAsync('capturedImageUri', imageToSave)`
   - **Lifetime:** Deleted immediately after retrieval in chat screen

2. **Cache Directory (Download)**
   - **Path:** `FileSystemLegacy.cacheDirectory` (platform-specific)
   - **iOS:** `file:///var/mobile/Containers/Data/Application/[APP_ID]/Library/Caches/`
   - **Android:** `file:///data/data/[PACKAGE]/cache/`
   - **Web:** Browser cache directory
   - **Purpose:** Temporary storage when downloading images for saving/sharing
   - **Code:** `components/SaveImageModal.tsx:174-238`
   - **Pattern:** `photo-${timestamp}.jpg`
   - **Lifetime:** **No cleanup** - relies on OS purging

3. **Permanent Storage (User Photos)**
   - **Path:** Device photo library via `expo-media-library`
   - **Album:** "All WorkPhotoPro" (custom album)
   - **Code:** `components/SaveImageModal.tsx:240-346`
   - **Lifetime:** Permanent (user-controlled)

4. **Cloud Storage (Appwrite)**
   - **Backend:** Appwrite Storage Bucket
   - **URL Pattern:** `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view?project=${projectId}`
   - **Code:** `app/(jobs)/[job].tsx:647-696` (uploadImage function)
   - **Lifetime:** Permanent (until deleted)

#### Caching Behavior:
- **expo-image library** (`expo-image@~3.0.10`) is used for image display
  - **Built-in caching:** expo-image has automatic HTTP caching (browser/OS level)
  - **No explicit cache configuration** found in codebase
  - **Cache location:** Platform-managed (iOS: NSCache, Android: Glide cache, Web: HTTP cache)

#### Functions/Services:
- `uploadImage()` - `app/(jobs)/[job].tsx:647`
- `downloadToCache()` - `components/SaveImageModal.tsx:174`
- `handleSaveToPhotos()` - `components/SaveImageModal.tsx:240`
- `storageService.getFilePreview()` - `lib/appwrite/storage.ts:22`
- `storageService.getFileView()` - `lib/appwrite/storage.ts:46`

#### Image Processing:
- **Watermarking:** `components/WatermarkedPhoto.tsx`
- **Manipulation:** `expo-image-manipulator` for resizing/format conversion
- **Temporary files:** Created during watermarking process, no explicit cleanup

---

### 1.2 Videos 🎥

#### Storage Locations:
1. **Temporary Capture Storage**
   - **Path:** Video recording → In-memory URI → SecureStore
   - **Location:** `expo-secure-store`
   - **Purpose:** Temporary storage between video camera screen and chat screen
   - **Code:** `app/(jobs)/video-camera.tsx:404` → `SecureStore.setItemAsync('recordedVideoUri', recordedVideo)`
   - **Lifetime:** Deleted immediately after retrieval in chat screen

2. **Cloud Storage (Appwrite)**
   - **Backend:** Appwrite Storage Bucket
   - **URL Pattern:** Same as images
   - **Code:** `app/(jobs)/[job].tsx:698-760` (uploadVideo function)
   - **MIME Types:** `video/mp4`, `video/quicktime`, `video/webm`
   - **Lifetime:** Permanent (until deleted)

#### Caching Behavior:
- **expo-video library** (`expo-video@~3.0.14`) is used for playback
  - **Built-in caching:** expo-video uses native video players (AVPlayer on iOS, ExoPlayer on Android)
  - **Native caching:** Platform video players cache streams automatically
  - **No explicit cache configuration** found
  - **No offline caching** - videos stream from URLs

#### Functions/Services:
- `uploadVideo()` - `app/(jobs)/[job].tsx:698`
- `VideoPlayer` component - `components/VideoPlayer.tsx`
- Uses `useVideoPlayer` hook from expo-video

#### Video Recording:
- **Duration:** Fixed 15 seconds (`app/(jobs)/video-camera.tsx:17`)
- **Format:** Platform-dependent (MP4 on most devices)
- **Storage:** Temporary file during recording, uploaded immediately

---

### 1.3 Audio Files 🎤

#### Storage Locations:
1. **Temporary Recording Storage**
   - **Path:** Audio recording → In-memory URI
   - **Location:** Managed by `expo-audio` library
   - **Purpose:** Temporary storage during recording
   - **Code:** `components/AudioRecorder.tsx:83` → `recorder.uri`
   - **Lifetime:** In-memory only, not persisted

2. **Cloud Storage (Appwrite)**
   - **Backend:** Appwrite Storage Bucket
   - **URL Pattern:** Same as images/videos
   - **Code:** `app/(jobs)/[job].tsx:810-860` (uploadAudio function)
   - **Format:** `.m4a` (M4A audio)
   - **MIME Type:** `audio/m4a`
   - **Lifetime:** Permanent (until deleted)

#### Caching Behavior:
- **expo-audio library** (`expo-audio@~1.0.14`) is used for playback
  - **Built-in caching:** Uses native audio players
  - **No explicit cache configuration** found
  - **No offline caching** - audio streams from URLs

#### Functions/Services:
- `uploadAudio()` - `app/(jobs)/[job].tsx:810`
- `AudioPlayer` component - `components/AudioPlayer.tsx`
- `AudioRecorder` component - `components/AudioRecorder.tsx`
- Uses `useAudioPlayer` hook from expo-audio

---

### 1.4 Documents/Attachments 📄

#### Storage Locations:
1. **Temporary Picker Storage**
   - **Path:** Document picker → Cache directory
   - **Location:** `FileSystemLegacy.cacheDirectory` (via `copyToCacheDirectory: true`)
   - **Purpose:** Temporary storage after document selection
   - **Code:** `app/(jobs)/[job].tsx:610` → `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })`
   - **Lifetime:** **No cleanup** - relies on OS purging

2. **Cloud Storage (Appwrite)**
   - **Backend:** Appwrite Storage Bucket
   - **Code:** `app/(jobs)/[job].tsx:762-800` (uploadFile function)
   - **Size Limit:** 10MB (`app/(jobs)/[job].tsx:617`)
   - **Supported Types:** PDF, DOCX, XLSX, PPTX, ZIP, RAR, TXT, RTF
   - **Lifetime:** Permanent (until deleted)

#### Caching Behavior:
- **No caching** - documents are uploaded immediately
- **No offline access** - documents require network

#### Functions/Services:
- `uploadFile()` - `app/(jobs)/[job].tsx:762`
- `pickDocument()` - `app/(jobs)/[job].tsx:595`

---

### 1.5 Temporary Files 🗑️

#### Storage Locations:
1. **Cache Directory**
   - **Path:** `FileSystemLegacy.cacheDirectory`
   - **Usage:**
     - Downloaded images for saving/sharing
     - Document picker temporary copies
   - **Cleanup:** **None** - relies on OS purging

2. **SecureStore**
   - **Path:** Encrypted key-value store
   - **Usage:**
     - Temporary image URIs (`capturedImageUri`)
     - Temporary video URIs (`recordedVideoUri`)
   - **Cleanup:** Manual deletion after retrieval

#### Eviction Strategy:
- **None implemented**
- Relies on:
  - OS cache purging (when device storage is low)
  - Manual deletion in SecureStore (immediate after use)

---

### 1.6 User-Generated Media 📱

#### Capture Flow:
1. **Camera Capture:**
   - Camera → Watermarking → SecureStore → Chat Screen → Upload → Appwrite
   - **Temporary files:** Created during watermarking, no cleanup

2. **Video Recording:**
   - Camera → Record → SecureStore → Chat Screen → Upload → Appwrite
   - **Temporary files:** Platform-managed during recording

3. **Audio Recording:**
   - Microphone → Record → In-memory → Chat Screen → Upload → Appwrite
   - **Temporary files:** In-memory only

#### Storage Pattern:
```
Capture → Temporary Storage → Upload → Cloud Storage
         ↓
    (No local persistence)
```

---

### 1.7 Downloaded Media ⬇️

#### Download Flow:
1. **Image Download:**
   - Appwrite URL → `downloadToCache()` → Cache Directory → Media Library
   - **Code:** `components/SaveImageModal.tsx:174-238`
   - **Cleanup:** None - cache file remains

2. **No Download for Videos/Audio/Documents:**
   - Videos/audio stream directly from URLs
   - Documents are not downloadable (only viewable)

---

## 2. Caching Libraries Analysis

### 2.1 expo-image (`expo-image@~3.0.10`)
- **Purpose:** Image display component
- **Built-in Caching:** ✅ Yes (HTTP caching + native caching)
- **Configuration:** None found
- **Cache Location:**
  - **iOS:** NSCache (in-memory) + HTTP cache (disk)
  - **Android:** HTTP cache (disk) + Glide (if available)
  - **Web:** Browser HTTP cache
- **Eviction:** Platform-managed (LRU, size-based)

### 2.2 expo-video (`expo-video@~3.0.14`)
- **Purpose:** Video playback
- **Built-in Caching:** ✅ Yes (native player caching)
- **Configuration:** None found
- **Cache Location:**
  - **iOS:** AVPlayer cache (temporary)
  - **Android:** ExoPlayer cache (temporary)
- **Eviction:** Platform-managed

### 2.3 expo-audio (`expo-audio@~1.0.14`)
- **Purpose:** Audio playback
- **Built-in Caching:** ✅ Yes (native player caching)
- **Configuration:** None found
- **Cache Location:** Platform audio cache
- **Eviction:** Platform-managed

### 2.4 expo-file-system (`expo-file-system@~19.0.16`)
- **Purpose:** File system access
- **Built-in Caching:** ❌ No (just file I/O)
- **Usage:** Cache directory access, file downloads
- **No cache management:** Files persist until OS purges

### 2.5 expo-secure-store (`expo-secure-store@~15.0.7`)
- **Purpose:** Encrypted key-value storage
- **Built-in Caching:** ❌ No (persistent storage, not cache)
- **Usage:** Temporary URI storage between screens
- **Lifetime:** Manual deletion required

### 2.6 Custom Caching Implementation
- **Status:** ❌ **None found**
- **No LRU cache**
- **No TTL-based eviction**
- **No size-based limits**
- **No manual cache management**

---

## 3. Eviction/Purging Strategy

### Current State: ❌ **No Eviction Logic**

#### What Exists:
1. **OS-Level Purging:**
   - iOS: System purges cache directory when storage is low
   - Android: System purges cache directory when storage is low
   - Web: Browser manages HTTP cache

2. **Manual Cleanup:**
   - SecureStore items deleted after retrieval
   - No cleanup for cache directory files

#### What's Missing:
- ❌ No LRU (Least Recently Used) eviction
- ❌ No TTL (Time-To-Live) expiration
- ❌ No size-based limits
- ❌ No cron jobs or scheduled cleanup
- ❌ No cache size monitoring
- ❌ No manual cache clearing functionality

---

## 4. Offline Access

### Current State: ⚠️ **Limited Offline Access**

#### What Works Offline:
- ✅ **Previously viewed images** (via expo-image HTTP cache)
- ✅ **Previously played videos** (via native player cache)
- ✅ **Previously played audio** (via native player cache)
- ✅ **SecureStore data** (temporary URIs)

#### What Doesn't Work Offline:
- ❌ **New media uploads** (requires network)
- ❌ **Media downloads** (requires network)
- ❌ **Media viewing** (if not previously cached)
- ❌ **Document access** (no caching)

#### Offline Strategy:
- **None implemented**
- Relies entirely on:
  - Platform HTTP caching (unreliable)
  - Native player caching (temporary)

---

## 5. Security Considerations

### Current Security:
1. **SecureStore:**
   - ✅ Encrypted storage for temporary URIs
   - ✅ iOS Keychain / Android Keystore
   - **Location:** `app/(jobs)/camera.tsx:505`, `app/(jobs)/video-camera.tsx:404`

2. **Cache Directory:**
   - ⚠️ Unencrypted files in cache directory
   - ⚠️ Accessible to other apps (on some platforms)
   - **Location:** `FileSystemLegacy.cacheDirectory`

3. **Media Library:**
   - ✅ User permission required
   - ✅ Saved to user's photo library (user-controlled)

4. **Cloud Storage:**
   - ✅ Appwrite authentication required
   - ✅ Bucket permissions enforced

### Security Gaps:
- ⚠️ **Cache directory files are unencrypted**
- ⚠️ **No encryption at rest** for cached media
- ⚠️ **Temporary files may persist** longer than intended

---

## 6. Platform-Specific Behavior

### iOS:
- **Cache Directory:** `file:///var/mobile/Containers/Data/Application/[APP_ID]/Library/Caches/`
- **SecureStore:** iOS Keychain
- **Media Library:** User's Photos app
- **Image Caching:** NSCache (in-memory) + HTTP cache (disk)
- **Video Caching:** AVPlayer cache (temporary)

### Android:
- **Cache Directory:** `file:///data/data/[PACKAGE]/cache/`
- **SecureStore:** Android Keystore
- **Media Library:** User's Gallery app
- **Image Caching:** HTTP cache + Glide (if available)
- **Video Caching:** ExoPlayer cache (temporary)

### Web:
- **Cache Directory:** Browser cache directory
- **SecureStore:** localStorage (encrypted)
- **Media Library:** Browser download
- **Image Caching:** Browser HTTP cache
- **Video Caching:** Browser media cache

---

## 7. Caching Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDIA CAPTURE WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

CAMERA CAPTURE:
  Camera → Image URI → SecureStore → Chat Screen → Upload → Appwrite
                      (temporary)    (retrieved & deleted)

VIDEO RECORDING:
  Camera → Video URI → SecureStore → Chat Screen → Upload → Appwrite
                      (temporary)    (retrieved & deleted)

AUDIO RECORDING:
  Microphone → Audio URI → In-Memory → Chat Screen → Upload → Appwrite
                          (temporary)

DOCUMENT PICKER:
  Picker → File → Cache Directory → Upload → Appwrite
                    (copyToCacheDirectory: true)
                    (no cleanup)

┌─────────────────────────────────────────────────────────────────┐
│                    MEDIA DISPLAY WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

IMAGE DISPLAY:
  Appwrite URL → expo-image → HTTP Cache (platform-managed)
                              → Display

VIDEO PLAYBACK:
  Appwrite URL → expo-video → Native Player Cache (temporary)
                              → Stream & Play

AUDIO PLAYBACK:
  Appwrite URL → expo-audio → Native Player Cache (temporary)
                              → Stream & Play

┌─────────────────────────────────────────────────────────────────┐
│                    MEDIA DOWNLOAD WORKFLOW                      │
└─────────────────────────────────────────────────────────────────┘

IMAGE DOWNLOAD:
  Appwrite URL → downloadToCache() → Cache Directory → Media Library
                                    (no cleanup)      (permanent)

┌─────────────────────────────────────────────────────────────────┐
│                    CACHE EVICTION                                │
└─────────────────────────────────────────────────────────────────┘

Current: ❌ NONE
  - Relies on OS purging (when storage is low)
  - SecureStore items deleted manually after use
  - Cache directory files persist indefinitely
```

---

## 8. Complete Summary

### How Caching Currently Works:

1. **Temporary Workflow Storage:**
   - SecureStore holds URIs between screens (encrypted, short-lived)
   - Cache directory holds downloaded files (unencrypted, no cleanup)

2. **Display Caching:**
   - expo-image: HTTP cache + native caching (platform-managed)
   - expo-video: Native player cache (temporary, platform-managed)
   - expo-audio: Native player cache (temporary, platform-managed)

3. **No Persistent Offline Cache:**
   - Media files are not downloaded for offline access
   - No explicit cache management
   - Relies on platform HTTP caching (unreliable)

4. **No Eviction Logic:**
   - No LRU, TTL, or size-based eviction
   - Cache directory files persist until OS purges
   - No manual cache clearing

---

## 9. Recommendations

### High Priority 🔴

1. **Implement Cache Eviction:**
   - Add LRU cache with size limits (e.g., 100MB for images)
   - Implement TTL for cached files (e.g., 7 days)
   - Add manual cache clearing functionality
   - **Location:** Create `utils/cacheManager.ts`

2. **Add Offline Caching:**
   - Download frequently accessed media for offline use
   - Store metadata about cached files
   - Implement cache-first strategy for media display
   - **Location:** Create `utils/offlineCache.ts`

3. **Clean Up Temporary Files:**
   - Delete cache directory files after use
   - Implement cleanup on app start/background
   - **Location:** `components/SaveImageModal.tsx`, `app/(jobs)/[job].tsx`

### Medium Priority 🟡

4. **Encrypt Cache Directory:**
   - Use expo-file-system encryption for sensitive cached files
   - Or use SecureStore for small cached data
   - **Location:** `utils/cacheManager.ts`

5. **Add Cache Size Monitoring:**
   - Monitor cache directory size
   - Alert user when cache exceeds limits
   - **Location:** `utils/cacheManager.ts`

6. **Implement Cache Preloading:**
   - Preload recent media when app starts
   - Background download for frequently accessed content
   - **Location:** `hooks/useMediaCache.ts`

### Low Priority 🟢

7. **Add Cache Statistics:**
   - Show cache size in settings
   - Show cache hit/miss rates
   - **Location:** `app/(jobs)/settings/cache.tsx`

8. **Optimize Image Caching:**
   - Configure expo-image cache settings
   - Add cache headers for Appwrite URLs
   - **Location:** `lib/appwrite/storage.ts`

---

## 10. Code Locations to Review/Refactor

### Critical Files:
1. **`components/SaveImageModal.tsx`**
   - **Issue:** Downloads to cache but never cleans up
   - **Fix:** Delete cache file after saving to media library

2. **`app/(jobs)/[job].tsx`**
   - **Issue:** Document picker uses `copyToCacheDirectory: true` but never cleans up
   - **Fix:** Delete cached document after upload

3. **`app/(jobs)/camera.tsx`**
   - **Issue:** Watermarked images create temporary files, no cleanup
   - **Fix:** Clean up temporary files after watermarking

### New Files to Create:
1. **`utils/cacheManager.ts`** - Cache eviction and management
2. **`utils/offlineCache.ts`** - Offline media caching
3. **`hooks/useMediaCache.ts`** - React hook for cache management
4. **`app/(jobs)/settings/cache.tsx`** - Cache settings screen

### Libraries to Consider:
- **`react-native-fast-image`** - Better image caching control
- **`@react-native-async-storage/async-storage`** - For cache metadata
- **`expo-file-system`** - Already used, add cleanup logic

---

## 11. Missing Caching Logic

### Critical Gaps:
1. ❌ **No cache size limits**
2. ❌ **No cache expiration**
3. ❌ **No cache cleanup**
4. ❌ **No offline media storage**
5. ❌ **No cache metadata tracking**
6. ❌ **No cache preloading**
7. ❌ **No cache statistics**

### Potential Issues:
1. **Storage Bloat:** Cache directory can grow indefinitely
2. **Performance:** No cache size limits can slow down file system
3. **Offline Access:** Users can't access media without network
4. **Privacy:** Unencrypted cache files may contain sensitive data
5. **User Experience:** No way to clear cache manually

---

## 12. Best Practices Recommendations

### Immediate Actions:
1. ✅ **Add cache cleanup** in `SaveImageModal.tsx` after saving
2. ✅ **Add cache cleanup** in `[job].tsx` after document upload
3. ✅ **Implement cache size monitoring** on app start
4. ✅ **Add manual cache clear** in settings

### Long-term Improvements:
1. ✅ **Implement LRU cache** with configurable size limits
2. ✅ **Add offline media storage** for frequently accessed content
3. ✅ **Encrypt sensitive cached files**
4. ✅ **Add cache preloading** for better UX
5. ✅ **Monitor cache performance** and optimize

---

## Conclusion

WorkPhotoPro V2 currently has **minimal caching infrastructure**. While platform-level caching (HTTP cache, native player cache) provides some offline access, there is **no explicit cache management**, **no eviction logic**, and **no offline media storage**. The app relies heavily on network connectivity for media access.

**Priority:** Implement cache eviction and cleanup logic first, then add offline caching for better user experience.

---

**Report Generated:** 2024  
**Analyzed Files:** 50+  
**Key Components:** SaveImageModal, [job].tsx, camera.tsx, video-camera.tsx, AudioRecorder, VideoPlayer, AudioPlayer

