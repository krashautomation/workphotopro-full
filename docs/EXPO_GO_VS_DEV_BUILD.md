# 📱 Expo Go vs Development Build

## The Problem

You're seeing this error:
```
ERROR [Error: Cannot find native module 'ExpoPushTokenManager']
```

This happens because **`expo-notifications` requires native code** and doesn't work in **Expo Go**.

## Two Solutions

### Option 1: Use Development Build (Recommended) ✅

**Development builds** include native code and support all Expo modules, including `expo-notifications`.

#### For Android:

```bash
# Build and run on Android device/emulator
npx expo run:android
```

#### For iOS:

```bash
# Build and run on iOS simulator/device
npx expo run:ios
```

**What this does:**
- Creates a custom development build with native modules
- Installs it on your device/emulator
- Supports all Expo modules including `expo-notifications`

**Requirements:**
- Android Studio (for Android)
- Xcode (for iOS, Mac only)
- More setup time (~10-15 minutes first time)

---

### Option 2: Continue with Expo Go (Limited) ⚠️

If you want to keep using Expo Go for now:

**The code is now safe** - it will gracefully handle the missing module and won't crash. However:
- ❌ Push notifications won't work
- ❌ You can't test push notification features
- ✅ Rest of your app works fine

**To test push notifications later:**
- Switch to a development build when ready
- Or test on a production build

---

## Current Status

✅ **Code is now safe** - it won't crash if `expo-notifications` isn't available
- The app will show warnings but continue working
- Push notifications will be skipped gracefully

---

## Quick Test

After building with `npx expo run:android` or `npx expo run:ios`:

1. Sign in to your app
2. Check console for: `✅ Push token registered`
3. Verify token is saved in Appwrite Database
4. Test sending a notification

---

## More Info

- [Expo Development Builds](https://docs.expo.dev/development/introduction/)
- [Expo Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)

