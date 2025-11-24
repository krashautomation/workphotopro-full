# Caching Pipeline Diagram

## Visual Representation of WorkPhotoPro V2 Media Caching Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMAGE CAPTURE & UPLOAD FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Camera  │────▶│ Watermarking │────▶│ SecureStore  │────▶│ Chat Screen│
│  Capture │     │   Process    │     │ (encrypted)  │     │  (retrieve) │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                          │                    │                    │
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
                   │ Temp Files    │     │ URI Storage  │     │ Upload to   │
                   │ (no cleanup) │     │ (deleted)     │     │  Appwrite   │
                   └──────────────┘     └──────────────┘     └─────────────┘
                                                                      │
                                                                      ▼
                                                              ┌─────────────┐
                                                              │   Cloud     │
                                                              │  Storage    │
                                                              └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO CAPTURE & UPLOAD FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Camera  │────▶│  15s Record   │────▶│ SecureStore  │────▶│ Chat Screen │
│  Record  │     │   (temporary)│     │ (encrypted)  │     │  (retrieve) │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                          │                    │                    │
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
                   │ Platform     │     │ URI Storage  │     │ Upload to   │
                   │ Video Cache  │     │ (deleted)     │     │  Appwrite   │
                   │ (temp)       │     └──────────────┘     └─────────────┘
                   └──────────────┘                                  │
                                                                      ▼
                                                              ┌─────────────┐
                                                              │   Cloud     │
                                                              │  Storage    │
                                                              └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIO CAPTURE & UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│ Microphone│────▶│ Record Audio │────▶│ In-Memory    │────▶│ Chat Screen │
│  Record  │     │   (temporary)│     │   URI Only   │     │  (upload)   │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                          │                    │                    │
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
                   │ No Persist    │     │ No Storage   │     │ Upload to   │
                   │ (in-memory)   │     │ (ephemeral)  │     │  Appwrite   │
                   └──────────────┘     └──────────────┘     └─────────────┘
                                                                      │
                                                                      ▼
                                                              ┌─────────────┐
                                                              │   Cloud     │
                                                              │  Storage    │
                                                              └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT PICKER & UPLOAD FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│ Document │────▶│ Copy to Cache│────▶│ Cache Dir    │────▶│ Upload to   │
│  Picker  │     │  Directory   │     │ (no cleanup) │     │  Appwrite   │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                          │                    │                    │
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
                   │ copyToCache  │     │ File Persists │     │   Cloud     │
                   │ = true       │     │ Indefinitely  │     │  Storage    │
                   └──────────────┘     └──────────────┘     └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         MEDIA DISPLAY & CACHING FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Appwrite   │
│  Cloud URL  │
└─────────────┘
      │
      ├─────────────────┬─────────────────┬─────────────────┐
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Image   │    │  Video   │    │  Audio   │    │ Document │
│ Display  │    │ Playback │    │ Playback │    │  View    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ expo-    │    │ expo-    │    │ expo-    │    │ No Cache │
│ image    │    │ video    │    │ audio    │    │ (stream) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │                 │                 │
      ▼                 ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ HTTP     │    │ Native   │    │ Native   │
│ Cache    │    │ Player    │    │ Player   │
│ (platform│    │ Cache     │    │ Cache    │
│ managed) │    │ (temp)    │    │ (temp)   │
└──────────┘    └──────────┘    └──────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMAGE DOWNLOAD & SAVE FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Appwrite   │────▶│ downloadTo   │────▶│ Cache Dir    │────▶│ Media       │
│  Image URL  │     │ Cache()       │     │ (no cleanup) │     │ Library     │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                          │                    │                    │
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
                   │ FileSystem   │     │ File Persists │     │ Permanent   │
                   │ downloadAsync│     │ Indefinitely  │     │ User Storage│
                   └──────────────┘     └──────────────┘     └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHE EVICTION & CLEANUP                            │
└─────────────────────────────────────────────────────────────────────────────┘

Current State: ❌ NO EVICTION LOGIC

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Cache Dir    │     │ SecureStore  │     │ Platform     │
│ Files        │     │ Items        │     │ HTTP Cache   │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │
      │                    │                    │
      ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ ❌ No        │     │ ✅ Manual     │     │ ✅ OS        │
│ Cleanup      │     │ Deletion      │     │ Managed      │
│ (persists    │     │ (after use)   │     │ (LRU/size)   │
│ indefinitely)│     └──────────────┘     └──────────────┘
└──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LOCATIONS SUMMARY                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SecureStore (Encrypted Key-Value Store)                                  │
│    - Temporary image URIs (capturedImageUri)                                │
│    - Temporary video URIs (recordedVideoUri)                                │
│    - Lifetime: Deleted immediately after retrieval                         │
│    - Location: iOS Keychain / Android Keystore                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Cache Directory (FileSystemLegacy.cacheDirectory)                       │
│    - Downloaded images for saving/sharing                                   │
│    - Document picker temporary copies                                       │
│    - Lifetime: NO CLEANUP - persists until OS purges                      │
│    - Location: Platform-specific cache directory                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Media Library (expo-media-library)                                       │
│    - User-saved images (permanent)                                           │
│    - Album: "All WorkPhotoPro"                                               │
│    - Lifetime: Permanent (user-controlled)                                  │
│    - Location: Device photo library                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Platform HTTP Cache (expo-image, expo-video, expo-audio)                  │
│    - Previously viewed images (HTTP cache)                                   │
│    - Previously played videos (native player cache)                          │
│    - Previously played audio (native player cache)                           │
│    - Lifetime: Platform-managed (LRU, size-based)                          │
│    - Location: Platform-specific cache                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Appwrite Cloud Storage                                                    │
│    - All uploaded media (permanent)                                          │
│    - Images, videos, audio, documents                                         │
│    - Lifetime: Permanent (until deleted)                                     │
│    - Location: Appwrite cloud storage bucket                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE ACCESS STATUS                                │
└─────────────────────────────────────────────────────────────────────────────┘

✅ Works Offline:
   - Previously viewed images (HTTP cache)
   - Previously played videos (native cache)
   - Previously played audio (native cache)
   - SecureStore data (encrypted storage)

❌ Requires Network:
   - New media uploads
   - Media downloads
   - Media viewing (if not cached)
   - Document access
   - Real-time chat updates

┌─────────────────────────────────────────────────────────────────────────────┐
│                         RECOMMENDED IMPROVEMENTS                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. Add Cache Eviction Logic
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ LRU Cache    │────▶│ Size Limits   │────▶│ TTL Expiry    │
   │ Manager      │     │ (e.g., 100MB)│     │ (e.g., 7 days)│
   └──────────────┘     └──────────────┘     └──────────────┘

2. Add Offline Media Storage
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Download     │────▶│ Cache Dir    │────▶│ Offline      │
   │ Frequently  │     │ (encrypted)  │     │ Access       │
   │ Accessed    │     │              │     │              │
   └──────────────┘     └──────────────┘     └──────────────┘

3. Add Cache Cleanup
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ After Upload │────▶│ Delete Cache │────▶│ Monitor Size │
   │ After Save   │     │ Files        │     │ & Cleanup    │
   └──────────────┘     └──────────────┘     └──────────────┘

```

