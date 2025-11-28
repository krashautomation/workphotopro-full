# 🔧 Fix: expo-notifications Not Available Warning

## Problem
You're seeing warnings like:
```
⚠️ expo-notifications not available (requires development build, not Expo Go)
⚠️ Push notifications not available - requires development build (not Expo Go)
```

## Why This Happens
`expo-notifications` requires **native code** that isn't available in:
- ❌ Expo Go (the standard Expo app)
- ❌ Development builds that were created before `expo-notifications` was added

## Solution: Rebuild Your Development Build

You need to rebuild your native app to include the `expo-notifications` native module.

### Step 1: Stop Your Current Dev Server
Press `Ctrl+C` in your terminal to stop the Expo dev server.

### Step 2: Rebuild the Native App

**For Android:**
```bash
npx expo run:android
```

**For iOS:**
```bash
npx expo run:ios
```

This will:
1. ✅ Build a new development client with all native modules (including notifications)
2. ✅ Install it on your device/emulator
3. ✅ Start the Metro bundler automatically

### Step 3: Verify It Works

After rebuilding, you should see:
- ✅ No more warnings about `expo-notifications`
- ✅ Push notification token registration working
- ✅ Console log: `✅ Push token registered: ...`

## Important Notes

### Don't Use Expo Go
- ❌ Don't scan the QR code with Expo Go app
- ✅ Use the development build that was just installed

### After Rebuilding
- The app will automatically connect to your Metro bundler
- You can still use hot reload and fast refresh
- All native modules (camera, notifications, etc.) will work

### If You Still See Warnings

1. **Make sure you're using the development build, not Expo Go:**
   - Check your device - you should see "WorkPhotoPro" app (not "Expo Go")
   - The deep link should show `exp+workphotopro-v2://expo-development-client/`

2. **Clear and rebuild:**
   ```bash
   # Android
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

3. **Check app.config.js:**
   - Make sure `expo-notifications` plugin is in the `plugins` array
   - It should be there (✅ it is configured)

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm start` | Start Metro bundler (for Expo Go) |
| `npx expo run:android` | Build & install development client (Android) |
| `npx expo run:ios` | Build & install development client (iOS) |

## Next Steps

Once notifications are working:
1. ✅ Test push notification registration
2. ✅ Configure FCM credentials (see `docs/FCM_CREDENTIALS_SETUP.md`)
3. ✅ Test sending a push notification

