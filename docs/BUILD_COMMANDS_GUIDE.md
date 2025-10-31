# Build Commands Guide

This document explains all available build commands for the WorkPhotoPro V2 project.

## 📋 Table of Contents
- [Development Commands](#development-commands)
- [Native Build Commands](#native-build-commands)
- [Prebuild Commands](#prebuild-commands)
- [EAS Build Commands](#eas-build-commands)
- [Command Differences Explained](#command-differences-explained)

---

## Development Commands

### `npm start` or `npx expo start`
**Purpose:** Starts the Expo development server (Metro bundler)
- Opens Expo DevTools in your browser
- Shows QR code to scan with Expo Go app (if not using dev client)
- **Note:** This project uses `expo-dev-client`, so you'll need a development build installed on your device/emulator

**Options:**
- `--web` - Start for web development
- `--ios` - Start and open iOS simulator
- `--android` - Start and open Android emulator
- `--tunnel` - Use tunnel connection (slower but works across networks)
- `--lan` - Use LAN connection (default)
- `--localhost` - Use localhost connection only

---

## Native Build Commands

### `npm run android` vs `npx expo run:android`

**They are the SAME!**

- `npm run android` is an npm script defined in `package.json` that runs `expo run:android`
- `npx expo run:android` directly invokes the Expo CLI command

**What it does:**
1. **Checks for native code** - If `android/` folder doesn't exist, runs `prebuild` first
2. **Installs dependencies** - Runs `cd android && ./gradlew` dependencies
3. **Builds the app** - Compiles native Android code
4. **Installs on device/emulator** - Installs the APK
5. **Starts Metro bundler** - Automatically starts the dev server

**Requirements:**
- Android Studio installed
- Android SDK configured
- Either an Android emulator running OR a physical device connected via USB with USB debugging enabled

---

### `npm run ios` or `npx expo run:ios`

**What it does:**
1. **Checks for native code** - If `ios/` folder doesn't exist, runs `prebuild` first
2. **Installs CocoaPods dependencies** - Runs `cd ios && pod install`
3. **Builds the app** - Compiles native iOS code using Xcode
4. **Installs on simulator/device** - Launches the app
5. **Starts Metro bundler** - Automatically starts the dev server

**Requirements:**
- **macOS only** (iOS development requires Mac)
- Xcode installed
- CocoaPods installed (`sudo gem install cocoapods`)
- iOS Simulator or physical device

**Options:**
- `--device` - Build for a connected physical device
- `--scheme <name>` - Use a specific Xcode scheme
- `--configuration <Debug|Release>` - Build configuration

---

## Prebuild Commands

### `npx expo prebuild`

**Purpose:** Generates native `android/` and `ios/` directories from your Expo config (`app.json`)

**When to use:**
- When you need to add custom native code
- When you want to modify native Android/iOS files directly
- After adding Expo modules that require native configuration
- When starting native development (one-time setup)

**What it does:**
1. Reads your `app.json` configuration
2. Generates `android/` directory with Gradle files, manifest, etc.
3. Generates `ios/` directory with Xcode project, Info.plist, etc.
4. Configures all native modules based on your `plugins` array
5. Sets up all permissions from your config

**Options:**
- `--platform android` - Only generate Android native code
- `--platform ios` - Only generate iOS native code
- `--clean` - Remove existing native folders before generating (⚠️ **DESTRUCTIVE** - deletes all custom native code!)
- `--no-install` - Skip installing dependencies (CocoaPods/Gradle)

**⚠️ Important Notes:**
- This project already has `android/` and `ios/` directories
- If you run `prebuild --clean`, it will **DELETE** your existing native code
- Always commit your native code changes before running `prebuild --clean`
- Native folders are gitignored by default, but this project has them committed

---

### `npx expo prebuild --clean`

**Purpose:** Removes existing native folders and regenerates them from scratch

**⚠️ WARNING:** This will DELETE all your custom native code changes!
- Custom Android code in `android/`
- Custom iOS code in `ios/`
- Any manual modifications to native files

**Use case:** When your native config in `app.json` has changed significantly and you want a fresh start

---

## EAS Build Commands (Cloud Builds)

These commands build your app in Expo's cloud infrastructure. No need for local Android Studio or Xcode setup.

### `npx eas build --profile development --platform android`
**Purpose:** Build a development APK in the cloud
- Uses your `eas.json` "development" profile
- Includes `expo-dev-client` for hot reloading
- Distribution: Internal (for testing)
- Build type: APK (direct install)

### `npx eas build --profile development --platform ios`
**Purpose:** Build a development iOS app in the cloud
- Requires Apple Developer account
- Includes `expo-dev-client`
- Distribution: Internal

### `npx eas build --profile preview --platform android`
**Purpose:** Build a preview APK for testing
- No dev client (production-like)
- APK format for easy sharing
- Distribution: Internal

### `npx eas build --profile production --platform android`
**Purpose:** Build production Android App Bundle (AAB) for Play Store
- App Bundle format (required by Play Store)
- Optimized and signed for release
- Ready for Google Play submission

### `npx eas build --profile production --platform ios`
**Purpose:** Build production iOS app for App Store
- Requires Apple Developer account
- Signed with production certificates
- Ready for App Store submission

**Common EAS Build Options:**
- `--local` - Build locally instead of cloud (requires full native setup)
- `--profile <name>` - Use specific build profile from `eas.json`
- `--platform <android|ios|all>` - Target platform(s)
- `--clear-cache` - Clear build cache

---

## Additional Useful Commands

### `npx expo run:android --variant debug`
**Purpose:** Build debug variant specifically
- Faster builds (no optimization)
- Includes debugging symbols
- Default for `run:android`

### `npx expo run:android --variant release`
**Purpose:** Build release variant (production-like)
- Optimized builds
- No debugging symbols
- Smaller APK size
- Testing production builds locally

### `npx expo run:ios --configuration Release`
**Purpose:** Build iOS in Release mode
- Optimized builds
- Testing production builds locally

### `npx expo install --check`
**Purpose:** Check for compatibility issues with Expo SDK version
- Ensures all packages are compatible with Expo SDK 54

### `npx expo-doctor`
**Purpose:** Diagnose common Expo setup issues
- Checks for configuration problems
- Verifies dependencies
- Validates `app.json`

---

## Command Differences Explained

### Why `npm run android` vs `npx expo run:android`?

```json
// package.json
"scripts": {
  "android": "expo run:android"
}
```

**No difference!** Both execute `expo run:android`. The npm script is just a shortcut.

**Recommendation:**
- Use `npm run android` - shorter, consistent with other npm scripts
- Use `npx expo run:android` - when you need to pass additional flags that aren't in the npm script

### When does `expo run:android` run `prebuild` automatically?

`expo run:android` automatically runs `prebuild` if:
- `android/` folder doesn't exist
- Expo detects that `app.json` has changed and native code is out of sync

This means you usually don't need to run `prebuild` manually unless:
- You want to regenerate native code from scratch
- You want to update native code without building/running

---

## Build Flow Summary

### First Time Setup (Development):
```bash
# 1. Install dependencies
npm install

# 2. Generate native code (if not exists)
npx expo prebuild

# 3. Run on device/emulator
npm run android  # or npm run ios
```

### Daily Development:
```bash
# Just run - prebuild runs automatically if needed
npm run android
# or
npm run ios
```

### When Adding New Native Modules:
```bash
# 1. Install the package
npm install expo-camera  # example

# 2. If the module needs native config, it's usually auto-added
# 3. Rebuild native code (if needed)
npm run android  # Automatically updates native code
```

### Production Build:
```bash
# Option 1: Cloud build (recommended)
npx eas build --profile production --platform android

# Option 2: Local build
npx expo run:android --variant release
```

---

## Troubleshooting

### "Command failed: gradlew.bat assembleDebug"
- Ensure Android Studio and SDK are installed
- Check that `ANDROID_HOME` environment variable is set
- Verify Java JDK is installed

### "ios/ folder not found"
- Run `npx expo prebuild --platform ios`
- Or let `expo run:ios` run it automatically

### "CocoaPods not found" (iOS)
```bash
sudo gem install cocoapods
cd ios
pod install
```

### Build keeps failing after config changes
```bash
# Clean and regenerate
npx expo prebuild --clean
npm run android  # or ios
```

---

## Quick Reference

| Command | Purpose | Platform |
|---------|---------|----------|
| `npm start` | Start dev server | All |
| `npm run android` | Build & run Android | Android |
| `npm run ios` | Build & run iOS | iOS (Mac only) |
| `npm run web` | Run web version | Web |
| `npx expo prebuild` | Generate native code | Android/iOS |
| `npx expo prebuild --clean` | Regenerate native code | Android/iOS |
| `npx eas build --profile development` | Cloud dev build | Android/iOS |
| `npx eas build --profile production` | Cloud prod build | Android/iOS |

