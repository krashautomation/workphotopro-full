# How to Get Android SHA256 Fingerprint for App Links

## 🎯 Overview

The SHA256 fingerprint is needed for Android App Links to work. It verifies that links belong to your app.

## 📋 Method 1: Google Play Console (Recommended - If App is Published)

**Best for:** Apps already published or using Google Play App Signing

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app: **WorkPhotoPro**
3. Navigate to: **Release** → **Setup** → **App signing**
4. Find the **"App signing key certificate"** section
5. Copy the **SHA-256 certificate fingerprint**
   - Format: `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`
6. Remove colons and use it in `assetlinks.json`

**Example:**
```
SHA-256: A1:B2:C3:D4:E5:F6:... (from Google Play)
↓
Use in assetlinks.json: A1B2C3D4E5F6... (remove colons)
```

---

## 📋 Method 2: EAS Credentials Manager

**Best for:** Apps using EAS builds (your case)

### Option A: Check Google Play Console
Even if not published, if you've built with EAS:
1. Upload a build to Google Play Console (internal testing track)
2. Go to **Release** → **Setup** → **App signing**
3. Get the SHA256 fingerprint

### Option B: Use EAS CLI
```bash
# Check your Android credentials
eas credentials:manager

# Select: Android → Production
# Look for certificate information
```

---

## 📋 Method 3: Local Keystore (If Building Locally)

**Best for:** Local development builds

### For Debug Keystore (Development)
```bash
# Navigate to your project
cd C:\Users\capta\Desktop\WorkPhotoProV2

# Get SHA256 from debug keystore
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Look for:**
```
Certificate fingerprints:
     SHA1: XX:XX:XX:...
     SHA256: XX:XX:XX:XX:...  ← Copy this one
```

### For Release Keystore (If You Have One)
```bash
# If you have a release keystore file
keytool -list -v -keystore path/to/your-release-key.jks -alias your-key-alias
```

**Note:** For EAS builds, you typically don't have the release keystore locally - EAS manages it.

---

## 📋 Method 4: From Installed APK/AAB

**Best for:** Getting fingerprint from an existing build

### If you have an APK/AAB file:
```bash
# For APK
keytool -printcert -jarfile your-app.apk

# For AAB (extract first, then check)
# Or use Google Play Console method above
```

---

## 🔧 Using the Fingerprint

Once you have the SHA256 fingerprint:

1. **Remove colons** from the fingerprint
   - `A1:B2:C3:D4:...` → `A1B2C3D4...`

2. **Update `assetlinks.json`:**
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.workphotopro.app",
         "sha256_cert_fingerprints": ["YOUR_SHA256_WITHOUT_COLONS"]
       }
     }
   ]
   ```

3. **Example:**
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.workphotopro.app",
         "sha256_cert_fingerprints": ["A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234"]
       }
     }
   ]
   ```

---

## ⚠️ Important Notes

### For EAS Builds (Your Case):
- **EAS uses Google Play App Signing**
- The SHA256 fingerprint comes from Google Play Console
- You may need to upload at least one build to see it
- Use the **"App signing key certificate"** SHA256, NOT the upload key

### For Development:
- Debug keystore SHA256 works for testing locally
- But production App Links need the production certificate fingerprint

### Multiple Fingerprints:
- You can add multiple fingerprints if you have different signing keys
- Useful for development + production

---

## 🚀 Quick Steps for Your Setup

Since you're using EAS:

1. **Build and upload to Google Play** (internal testing track):
   ```bash
   eas build --platform android --profile production
   ```

2. **Upload to Google Play Console** (internal testing)

3. **Get SHA256 from Google Play Console:**
   - Release → Setup → App signing
   - Copy SHA-256 certificate fingerprint

4. **Update `assetlinks.json`** in your Next.js project

5. **Deploy Next.js** so the file is accessible at:
   `https://web.workphotopro.com/.well-known/assetlinks.json`

---

## ✅ Verification

After updating, verify the file is accessible:
```bash
curl https://web.workphotopro.com/.well-known/assetlinks.json
```

Should return your JSON file with the correct SHA256 fingerprint.

---

## 📚 References

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [EAS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)

