# 🔧 Expo Prebuild Instructions

## What is Prebuild?

Prebuild generates the native `android` and `ios` folders from your `app.config.js`. This is needed when:
- You want to run native builds (`./gradlew assembleRelease`)
- You've added new native modules
- You need to regenerate native code

## How to Run Prebuild

### Option 1: Using Expo CLI (Recommended)

```bash
npx expo prebuild
```

This will:
- Generate `android/` folder (if missing)
- Generate `ios/` folder (if missing)
- Apply all plugins from `app.config.js`
- Configure Firebase, notifications, etc.

### Option 2: Clean Prebuild (If you have issues)

If you already have native folders and want to regenerate them:

```bash
# Remove existing native folders
rm -rf android ios

# Or on Windows:
rmdir /s android
rmdir /s ios

# Then run prebuild
npx expo prebuild
```

### Option 3: Platform-Specific Prebuild

**Android only:**
```bash
npx expo prebuild --platform android
```

**iOS only:**
```bash
npx expo prebuild --platform ios
```

## After Prebuild

Once prebuild completes:

1. **For Android:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **For iOS:**
   ```bash
   cd ios
   pod install
   # Then build in Xcode
   ```

## Important Notes

### Your Current Setup

Since you're already running `./gradlew assembleRelease`, you likely already have the `android/` folder. You may need to run prebuild if:

- ✅ You've updated `app.config.js` plugins
- ✅ You've added new native modules
- ✅ Firebase isn't initializing properly
- ✅ You want to ensure native code is up-to-date

### Firebase Configuration

After prebuild, make sure:
- `google-services.json` is in the project root (✅ you have this)
- FCM credentials are uploaded to Expo.dev (you're doing this now)
- The `android/app/google-services.json` is generated (prebuild does this)

## Troubleshooting

### "android folder already exists"
- If you want to regenerate: Delete `android/` folder first, then run prebuild
- If you want to keep existing: Prebuild will update it

### "Plugin not found"
- Make sure all plugins in `app.config.js` are installed
- Run `npm install` first

### Firebase still not working after prebuild
- Make sure FCM credentials are uploaded to Expo.dev
- Verify `google-services.json` is in project root
- Check that `expo-notifications` plugin is in `app.config.js` (✅ it is)

## Quick Command Reference

```bash
# Standard prebuild
npx expo prebuild

# Clean prebuild (regenerate everything)
rm -rf android ios && npx expo prebuild

# Android only
npx expo prebuild --platform android

# iOS only  
npx expo prebuild --platform ios

# Then build Android
cd android && ./gradlew assembleRelease
```

