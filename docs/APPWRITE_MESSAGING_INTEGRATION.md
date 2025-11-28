# 🔔 Appwrite Messaging Integration Guide

This guide explains how to properly integrate Appwrite Messaging according to the [official Appwrite documentation](https://appwrite.io/docs/products/messaging/send-push-notifications).

## Overview

Appwrite Messaging provides a unified API for sending push notifications. The recommended approach is:

1. **Register Push Targets** using `account.createPushTarget()` when user logs in
2. **Send Notifications** using Appwrite Messaging API (not Expo Push API directly)
3. **Handle Token Refreshes** by updating push targets when tokens change

## Current Implementation Status

### ✅ What's Implemented

1. **Token Registration** (`hooks/useFCMToken.ts`)
   - Gets Expo push tokens
   - Attempts to register with Appwrite Messaging using `account.createPushTarget()`
   - Falls back to custom collection if API not available

2. **Notification Sending** (`lib/appwrite/messaging.ts`)
   - `sendPushViaAppwriteMessaging()` - Uses Appwrite Messaging API
   - `sendPushNotification()` - Uses Expo Push API (fallback)

### ⚠️ Limitations

**Expo Push Tokens vs Native FCM Tokens:**

- **Current:** Using Expo push tokens (Expo abstraction)
- **Appwrite Expects:** Native FCM tokens (for Android) or APNs tokens (for iOS)

**Solution Options:**

1. **Option A: Use Expo Push API** (Current)
   - ✅ Works with Expo push tokens
   - ✅ Simpler, no native modules needed
   - ❌ Not using Appwrite Messaging directly

2. **Option B: Use Native FCM Tokens** (Recommended for Production)
   - ✅ Works with Appwrite Messaging
   - ✅ Better integration with Appwrite
   - ❌ Requires `@react-native-firebase/messaging`
   - ❌ More complex setup

## Recommended Setup

### Step 1: Configure FCM Provider in Appwrite

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to **Messaging** → **Providers**
3. Click **"Create Provider"**
4. Select **"Push with FCM"**
5. Upload your Firebase Service Account Key
6. Note your **Provider ID** (e.g., `fcm`)

### Step 2: Register Push Targets

When a user logs in, register their push token:

```typescript
import { account } from '@/lib/appwrite/client';
import { ID } from 'react-native-appwrite';

async function registerPushTarget(token: string) {
  try {
    const target = await account.createPushTarget({
      targetId: ID.unique(),
      identifier: token, // FCM token or APNs token
    });
    console.log('✅ Push target registered:', target.$id);
    return target;
  } catch (error) {
    console.error('Failed to register push target:', error);
    throw error;
  }
}
```

**Note:** This is currently implemented in `hooks/useFCMToken.ts` but may require native FCM tokens.

### Step 3: Send Notifications

Use Appwrite Messaging API to send notifications:

```typescript
import { messagingService } from '@/lib/appwrite/messaging';

// Send to a user (Appwrite finds their push targets)
await messagingService.sendPushViaAppwriteMessaging(
  userId,
  'New Task',
  'You have a new task assigned',
  { type: 'task_created', jobId: '...' }
);
```

## Migration Path

### Current State (Expo Push Tokens)

- ✅ Tokens are registered (custom collection)
- ✅ Notifications sent via Expo Push API
- ⚠️ Not using Appwrite Messaging directly

### Target State (Appwrite Messaging)

1. **Get Native FCM Tokens:**
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/messaging
   ```

2. **Update Token Registration:**
   ```typescript
   import messaging from '@react-native-firebase/messaging';
   
   const fcmToken = await messaging().getToken();
   await account.createPushTarget({
     targetId: ID.unique(),
     identifier: fcmToken,
   });
   ```

3. **Use Appwrite Messaging API:**
   ```typescript
   // Send via Appwrite Messaging (not Expo Push API)
   await messagingService.sendPushViaAppwriteMessaging(...);
   ```

## API Reference

### Appwrite Messaging API

**Endpoint:** `POST /v1/messaging/messages`

**Request:**
```json
{
  "providerId": "fcm",
  "targets": ["userId1", "userId2"],
  "title": "Notification Title",
  "body": "Notification Body",
  "data": {
    "custom": "data"
  }
}
```

**Response:**
```json
{
  "$id": "message-id",
  "status": "sent"
}
```

## Testing

1. **Register a push target** (when user logs in)
2. **Send a test notification** via Appwrite Console:
   - Go to **Messaging** → **Messages** → **Create message**
   - Select **Push notification**
   - Choose your test target
   - Click **Send**

3. **Verify notification received** on device

## Troubleshooting

### "Provider not found"
- Make sure FCM provider is configured in Appwrite Console
- Verify Provider ID matches (usually `fcm`)

### "Target not found"
- Ensure push target was created for the user
- Check that user is logged in when creating target

### "Invalid token"
- Verify token format matches what Appwrite expects
- For FCM: Should be a Firebase registration token
- For APNs: Should be an APNs device token

## Next Steps

1. ✅ Code supports Appwrite Messaging API
2. ⏳ Configure FCM provider in Appwrite Console
3. ⏳ Test push target registration
4. ⏳ Test sending notifications via Appwrite Messaging
5. ⏳ (Optional) Migrate to native FCM tokens for better integration

## References

- [Appwrite Messaging Docs](https://appwrite.io/docs/products/messaging/send-push-notifications)
- [FCM Setup Guide](docs/FCM_ANDROID_SETUP_GUIDE.md)
- [Appwrite Messaging Setup](docs/APPWRITE_MESSAGING_SETUP.md)

