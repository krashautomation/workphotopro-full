# 🔥 FCM Credentials Setup - Quick Fix

## The Error

```
Default FirebaseApp is not initialized in this process com.workphotopro.app
Make sure to call FirebaseApp.initializeApp(Context) first.
```

## Solution: Upload FCM Credentials to EAS

According to [Expo's FCM credentials guide](https://docs.expo.dev/push-notifications/fcm-credentials/), you need to upload Firebase credentials to EAS.

### Quick Steps:

1. **Get Firebase Server Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: **workphotopro-7f9ed**
   - Go to **Project Settings** → **Cloud Messaging** tab
   - Find **Server key** (under Cloud Messaging API Legacy)
   - Copy the key

   **OR** get Service Account Key:
   - **Project Settings** → **Service Accounts** tab
   - Click **"Generate new private key"**
   - Download the JSON file

2. **Upload to EAS:**
   ```bash
   eas credentials
   ```
   
   Then:
   - Select: **workphotopro-v2**
   - Platform: **Android**
   - Credential type: **Push Notifications (Legacy)**
   - Choose: **"Upload a Google Service Account Key"** (if you have JSON)
   - OR: **"Enter Server Key"** (if you have server key)
   - Follow prompts to upload

3. **Rebuild:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

## Alternative: Temporary Workaround

The code already handles this gracefully - push notifications will be skipped if Firebase isn't initialized. Your app will work, just without push notifications until you configure FCM credentials.

## Verification

After rebuilding, you should see:
- ✅ `Push token registered` (if configured correctly)
- ⚠️ `Push notifications not available` (if still not configured - app still works)

## References

- [Expo FCM Credentials Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
