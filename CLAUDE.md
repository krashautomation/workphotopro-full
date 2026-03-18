# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WorkPhotoPro V2 is a multi-tenant work photo management app (Expo SDK 54 + React Native + TypeScript) backed by Appwrite BaaS. Key use cases: field workers capture watermarked/annotated photos, organize them into jobs, collaborate via real-time chat, and share PDF reports with clients.

## Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run android              # Run on Android device/emulator
npm run ios                  # Run on iOS simulator (macOS only)
npm run web                  # Run in browser

# Code quality
npm run lint                 # Run ESLint (expo lint)
# Note: No test framework configured

# EAS builds
eas build --profile development   # Dev build with dev-client
eas build --profile preview       # Preview APK
eas build --profile production    # Production AAB
```

## Architecture

### Routing & Navigation (Expo Router)

File-based routing with two route groups:
- `app/(auth)/` — unauthenticated screens (sign-in, sign-up, forgot-password, reset-password, check-email, verify-email, accept-invite)
- `app/(jobs)/` — authenticated screens wrapped in a bottom tab bar + stack navigator

Root `app/_layout.tsx` wraps all screens in `AuthProvider` and `OrganizationProvider`, then redirects to `(auth)` or `(jobs)` based on auth state.

Dynamic routing: `app/(jobs)/[job].tsx` is the job chat screen, `app/(jobs)/settings/[job].tsx` is job settings.

### State Management (React Context)

Three global contexts — no Redux or Zustand:

| Context | Key state | Location |
|---|---|---|
| `AuthContext` | `user`, loading, auth methods | `context/AuthContext.tsx` |
| `OrganizationContext` | `currentOrganization`, `currentTeam`, user orgs/teams | `context/OrganizationContext.tsx` |
| `JobFilterContext` | job filter criteria | `context/JobFilterContext.tsx` |

Access via `useAuth()`, `useOrganization()`, `useJobFilters()` hooks.

### API Layer (Appwrite)

Data flows: UI → custom hook → Context → Service → Appwrite client → backend.

```
lib/appwrite/
  client.ts       # Initializes Account, Databases, Storage, Avatars clients
  auth.ts         # authService: signUp, signIn, signOut, OAuth, password recovery
  database.ts     # databaseService: generic CRUD (createDocument, listDocuments, etc.)
  storage.ts      # File upload/download
  teams.ts        # organizationService: org CRUD

services/
  teamService.ts  # Higher-level team operations abstraction
  inviteService.ts
```

All env vars use `EXPO_PUBLIC_` prefix. Required: `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, `EXPO_PUBLIC_APPWRITE_DATABASE_ID`, `EXPO_PUBLIC_APPWRITE_BUCKET_ID`.

### Feature Areas

- **Camera** (`app/(jobs)/camera.tsx`) — captures photos, applies watermarks via `components/WatermarkedPhoto.tsx`
- **Photo annotation** (`app/(jobs)/photo-annotation-editor.tsx`) — Skia-based drawing using `@shopify/react-native-skia`, screenshots via `react-native-view-shot`
- **Job chat** (`app/(jobs)/[job].tsx`) — real-time via Appwrite Realtime subscriptions, `@legendapp/list` for performance
- **PDF reports** — see `docs/features/REPORT_GENERATION.md`
- **Subscriptions** — RevenueCat (`react-native-purchases`) with 10 premium tiers; feature gating in `utils/permissions.ts`
- **Push notifications** — Expo Notifications + FCM; see `docs/FCM_ANDROID_SETUP_GUIDE.md`
- **Offline support** — `hooks/useOfflineCache.ts`, `utils/offlineCache.ts`, `utils/cacheManager.ts`

### Styling Conventions

- Dark theme only: background `#000`, surface `#1a1a1a`, primary `#22c55e` (green-500)
- Always use `StyleSheet.create()`
- Import colors from `@/utils/colors` or `@/styles/globalStyles`

### Import Order

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';

import { useRouter } from 'expo-router';

import SomeThirdParty from 'some-third-party';

import { useAuth } from '@/context/AuthContext';

import { LocalComponent } from './LocalComponent';
```

### Error Handling Pattern

```typescript
try {
  const result = await someOperation();
} catch (error: any) {
  console.error('[FeatureName] Description:', error.message);
  // handle gracefully
}
```

Log errors with `[FeatureName]` prefix and emoji for visibility. Use non-blocking error handling for non-critical operations.

## Key Docs in `docs/`

- `DATABASE_SCHEMA_AUDIT.md` — collection structure and field definitions
- `FEATURE_INVENTORY.md` — complete feature list with implementation status
- `APPWRITE_COLLECTION_PERMISSIONS.md` — permission model for Appwrite collections
- `v2/SESSION_NOTES.md` — current development notes and known issues

## Path Aliases

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/components/*`, `@/context/*`, `@/lib/appwrite/*`, `@/utils/*`, `@/styles/*`, `@/hooks/*`.
