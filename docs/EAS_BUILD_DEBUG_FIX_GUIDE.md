# 🔧 Fixing Debug Mode Issue in EAS Builds for Google Play

## 📋 Overview

This guide addresses the issue where Google Play Console detects your AAB file as being in debug mode, even though you built it with EAS using the production profile.

## ⚠️ Critical Issue Found

**The main problem is in `android/app/build.gradle`**: The release build type is configured to use the debug keystore, which causes Google Play to detect it as a debug build.

---

## ✅ Validation of ChatGPT Conversation

### What Was Correct:
1. ✅ Checking `app.config.js` for development flags
2. ✅ Verifying EAS build profile configuration
3. ✅ Ensuring release keystore is used (conceptually correct)
4. ✅ Using `eas build --platform android --profile release`

### What Was Missing/Incorrect:
1. ❌ **CRITICAL**: The actual issue is in `build.gradle`, not just configuration files
2. ❌ Manual keystore configuration in `app.config.js` is **NOT needed** for EAS builds (EAS manages this automatically)
3. ❌ The guide didn't mention checking `build.gradle` for signing configuration
4. ❌ Missing information about Google Play App Signing (EAS handles this automatically)

---

## 🔍 Step-by-Step Diagnostic Process

### Step 1: Check Your EAS Build Profile

**File**: `eas.json`

Verify your production profile is correctly configured:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"  // ✅ Correct - creates AAB file
      }
    },
    "development": {
      "developmentClient": true,    // ✅ Correct - only for dev builds
      "android": {
        "buildType": "apk",        // ✅ Correct - APK for dev
        "gradleCommand": ":app:assembleDebug"
      }
    }
  }
}
```

**✅ Your current configuration is correct.**

---

### Step 2: Check app.config.js for Development Flags

**File**: `app.config.js`

Look for any development-related flags:

```javascript
// ❌ BAD - Should NOT be present in production
expo: {
  developmentClient: true,  // Remove this for production
  // ...
}

// ✅ GOOD - Your current config doesn't have this issue
```

**✅ Your current configuration is correct** - no development flags found.

---

### Step 3: **CRITICAL FIX** - Check build.gradle Signing Configuration

**File**: `android/app/build.gradle`

**🚨 THIS IS THE MAIN ISSUE:**

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug  // ✅ Correct
    }
    release {
        // ❌ PROBLEM: Using debug keystore for release!
        signingConfig signingConfigs.debug  // Line 115 - THIS IS WRONG
        // ...
    }
}
```

**The Fix:**

For EAS builds, you should **remove the signingConfig from the release buildType** and let EAS handle signing automatically. Here's what to change:

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        // Remove signingConfig - EAS will handle signing automatically
        // signingConfig signingConfigs.debug  // ❌ REMOVE THIS LINE
        def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
        shrinkResources enableShrinkResources.toBoolean()
        minifyEnabled enableMinifyInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
        crunchPngs enablePngCrunchInRelease.toBoolean()
    }
}
```

---

### Step 4: Verify Package.json Dependencies

**File**: `package.json`

Check that you're using stable versions (not development/beta):

```json
{
  "dependencies": {
    "expo": "~54.0.25",           // ✅ Stable version
    "react-native": "0.81.5",     // ✅ Stable version
    "expo-dev-client": "~6.0.18"  // ✅ This is fine - can be used in production
  }
}
```

**Note**: `expo-dev-client` is fine to include - it doesn't force debug mode. It's only active when using the development build profile.

**✅ Your current configuration is correct.**

---

## 🛠️ Complete Fix Instructions

### Option A: Fix for EAS Builds (Recommended)

**For EAS builds, you don't need to manually manage keystores.** EAS handles this automatically through Google Play App Signing.

1. **Fix `android/app/build.gradle`**:

   Remove the `signingConfig signingConfigs.debug` line from the release buildType:

   ```gradle
   buildTypes {
       debug {
           signingConfig signingConfigs.debug
       }
       release {
           // EAS will handle signing automatically
           // Remove this line: signingConfig signingConfigs.debug
           def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
           shrinkResources enableShrinkResources.toBoolean()
           minifyEnabled enableMinifyInReleaseBuilds
           proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
           def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
           crunchPngs enablePngCrunchInRelease.toBoolean()
       }
   }
   ```

2. **Verify EAS credentials** (optional but recommended):

   ```bash
   eas credentials:manager
   ```

   This will show your Android credentials. EAS should have automatically created a release keystore for you.

3. **Build with production profile**:

   ```bash
   eas build --platform android --profile production
   ```

4. **Verify the build**:

   After the build completes, download the AAB file and check:
   - File size should be reasonable (not suspiciously small)
   - Upload to Google Play Console - it should NOT show debug mode warning

---

### Option B: Manual Keystore Management (Not Recommended for EAS)

**⚠️ Only use this if you're NOT using EAS builds or need manual control.**

If you need to manually manage keystores (not recommended for EAS):

1. **Generate a release keystore**:

   ```bash
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```

   **Important**: Store this keystore securely and back it up! You'll need it for all future updates.

2. **Upload to EAS**:

   ```bash
   eas credentials:manager
   ```

   Select Android → Production → Upload keystore

3. **Configure in build.gradle** (if building locally):

   ```gradle
   signingConfigs {
       release {
           storeFile file('path/to/my-release-key.jks')
           storePassword 'your-keystore-password'
           keyAlias 'my-key-alias'
           keyPassword 'your-key-password'
       }
   }
   
   buildTypes {
       release {
           signingConfig signingConfigs.release  // Use release keystore
           // ...
       }
   }
   ```

**However, for EAS builds, Option A is recommended** - EAS handles this automatically.

---

## 📚 Additional Resources

### Official Documentation:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://docs.expo.dev/app-signing/app-signing/)
- [EAS Credentials Manager](https://docs.expo.dev/app-signing/managed-credentials/)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

### Key Commands:
```bash
# Check your EAS credentials
eas credentials:manager

# Build for production
eas build --platform android --profile production

# Build for development (for testing)
eas build --platform android --profile development

# Submit directly to Google Play (after fixing the issue)
eas submit --platform android
```

---

## ✅ Verification Checklist

After making the fix, verify:

- [ ] `android/app/build.gradle` - release buildType does NOT use `signingConfig signingConfigs.debug`
- [ ] `eas.json` - production profile uses `"buildType": "app-bundle"`
- [ ] `app.config.js` - no `developmentClient: true` flag
- [ ] Build command uses `--profile production`
- [ ] AAB file uploads to Google Play without debug warning

---

## 🐛 Troubleshooting

### Issue: Still getting debug mode warning

1. **Double-check build.gradle**: Make sure the `signingConfig signingConfigs.debug` line is removed from release buildType
2. **Clear build cache**: 
   ```bash
   eas build --platform android --profile production --clear-cache
   ```
3. **Verify build profile**: Check the EAS build logs to confirm it's using the production profile
4. **Check EAS credentials**: Run `eas credentials:manager` to verify release credentials exist

### Issue: Build fails after removing signingConfig

This shouldn't happen with EAS builds, but if it does:
- EAS should handle signing automatically
- Check EAS build logs for specific errors
- Verify your EAS account has proper permissions

### Issue: Need to use a specific keystore

If you have an existing keystore from a previous build system:
1. Use `eas credentials:manager` to upload it
2. EAS will use it for future builds
3. Still remove `signingConfig signingConfigs.debug` from build.gradle

---

## 📝 Summary

**The Root Cause**: Your `android/app/build.gradle` file has the release buildType configured to use the debug keystore (`signingConfig signingConfigs.debug` on line 115).

**The Solution**: Remove that line and let EAS handle signing automatically through Google Play App Signing.

**Important Notes**:
- ✅ EAS manages keystores automatically - no manual configuration needed in `app.config.js`
- ✅ Google Play App Signing is handled by EAS automatically
- ✅ Your `eas.json` configuration is correct
- ✅ Your `app.config.js` doesn't have development flags
- ❌ The only issue is in `build.gradle` - fix that and rebuild

---

## 🚀 Quick Fix (TL;DR)

1. Open `android/app/build.gradle`
2. Find line 115 in the `release` buildType
3. Remove or comment out: `signingConfig signingConfigs.debug`
4. Save the file
5. Run: `eas build --platform android --profile production --clear-cache`
6. Upload the new AAB to Google Play Console

That's it! The debug warning should be gone.

