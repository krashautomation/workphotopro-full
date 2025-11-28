# 🔔 Firebase Cloud Messaging (FCM) Setup for Android - Expo Guide

## Overview

This guide covers setting up Firebase Cloud Messaging (FCM) for Android push notifications in your Expo app. **With Expo, this is much simpler than native Android development** - Expo handles most of the complexity for you!

## Prerequisites

- ✅ Expo account (free)
- ✅ Google account (for Firebase)
- ✅ Android package name: `com.workphotopro.app` (already configured)

## Step-by-Step Process

### Step 1: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Enter project name: `WorkPhotoPro` (or any name)
   - Click "Continue"
   - **Disable Google Analytics** (optional, not needed for FCM)
   - Click "Create project"
   - Wait for project creation (~30 seconds)

### Step 2: Register Android App (3 minutes)

1. **Add Android App**
   - In Firebase Console, click the Android icon (or "Add app" → Android)
   - **Android package name:** `com.workphotopro.app`
   - **App nickname:** `WorkPhotoPro Android` (optional)
   - **Debug signing certificate SHA-1:** Leave blank for now (optional)
   - Click "Register app"

2. **Download `google-services.json`**
   - Firebase will generate a `google-services.json` file
   - **DO NOT download it yet** - Expo handles this differently!
   - Click "Next" → "Next" → "Continue to console"

### Step 3: Get Firebase Configuration (2 minutes)

**Important:** There are **two different files** you might need:

#### File 1: `google-services.json` (Client-side config)
- **What it is:** Firebase client configuration file
- **Contains:** Project ID, API keys, app identifiers
- **Used for:** Configuring Firebase in your app
- **Where:** Firebase Console → Project Settings → Your apps → Android app → Download

#### File 2: Google Service Account Key (Server-side credentials)
- **What it is:** Server credentials for FCM V1 API
- **Contains:** `type`, `private_key`, `client_email` fields
- **Used for:** Sending push notifications from backend/server
- **Where:** Firebase Console → Project Settings → Service Accounts → Generate new private key

### Which One Do You Need?

**For EAS "Push Notifications (Legacy)" setup, you have TWO options:**

#### Option A: Use `google-services.json` in `app.config.js` (Simpler) ✅

1. **Download `google-services.json`** from Firebase Console
2. **Place it in project root**
3. **Reference it in `app.config.js`** (already done for you!)
4. **Skip EAS credentials upload** - the file will be used automatically during builds

#### Option B: Upload Service Account Key to EAS (For Backend Push)

**Only if you want to send push notifications from your backend/Appwrite Functions:**

📖 **See detailed guide:** `BACKEND_PUSH_NOTIFICATIONS_SETUP.md`

**Quick steps:**
1. **Create Service Account Key:**
   - Firebase Console → Project Settings → **Service Accounts** tab
   - Click "Generate new private key"
   - Download the JSON file (has `type`, `private_key`, `client_email` fields)
   - **This is different from `google-services.json`!**

2. **Upload to EAS:**
   - Run `eas credentials`
   - Select "Push Notifications (Legacy)"
   - Choose "Upload a Google Service Account Key"
   - Upload the Service Account JSON file (NOT google-services.json)

3. **Store in Appwrite Functions:**
   - Add as secret in Appwrite Functions → Settings
   - Use in your Appwrite Functions to send push notifications

**Recommendation:** 
- Use Option A for basic client-side push notifications
- Use Option B if you need to send notifications from your backend (e.g., when tasks are created)

### Step 4: Configure Expo/EAS (5 minutes)

#### Option A: Using EAS (Recommended for Production)

1. **Install EAS CLI** (if not already installed)
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**
   ```bash
   eas login
   ```

3. **Configure Push Notifications**

   **You have TWO options:**

   #### Option A: Use `google-services.json` (Recommended - Already Configured!) ✅

   **This is already set up!** Your `app.config.js` references `google-services.json`, so:
   - ✅ Place `google-services.json` in your project root
   - ✅ EAS Build will automatically use it during builds
   - ✅ **No need to upload to EAS credentials!**
   - ✅ Works for basic push notifications

   #### Option B: Upload Service Account Key to EAS (For Backend Push)

   **Only if you need to send push notifications from your backend/Appwrite Functions:**

   ```bash
   eas credentials
   ```
   - Select your project
   - Select "Android"
   - Select **"Push Notifications (Legacy)"**
   - Choose **"Upload a Google Service Account Key"**
   - Upload the **Service Account JSON file** (NOT google-services.json!)
     - This file has `type`, `private_key`, `client_email` fields
     - Download from: Firebase Console → Service Accounts → Generate new private key
   - EAS will securely store it

   **Note:** If you see an error about `google-services.json`, you're uploading the wrong file! You need the Service Account Key JSON file instead.

   **Note:** If you see "credentials.json does not exist" error, you're in the wrong menu. Go back and select "Set up a new FCM key" instead.

#### Option B: Manual Configuration (Alternative Method)

If you prefer to configure Firebase manually in your code:

1. **Add Firebase Config to `app.config.js`**
   ```javascript
   module.exports = {
     expo: {
       // ... existing config
       android: {
         // ... existing android config
         googleServicesFile: "./google-services.json", // Path to downloaded file
       },
       plugins: [
         // ... existing plugins
         [
           'expo-notifications',
           {
             icon: './assets/images/icon.png',
             color: '#22c55e',
           },
         ],
       ],
     },
   };
   ```

   **Note:** This method requires you to download `google-services.json` from Firebase Console (see Step 3, Option A).

### Step 5: Build with EAS (Required for Push Notifications)

**Important:** Push notifications **only work with EAS Build**, not Expo Go!

1. **Create `eas.json`** (if not exists)
   ```bash
   eas build:configure
   ```

2. **Build Android App**
   ```bash
   eas build --platform android
   ```

   This will:
   - Use your Firebase credentials
   - Generate an APK/AAB with FCM configured
   - Push notifications will work in this build

### Step 6: Test Push Notifications

1. **Get Expo Push Token** (in your app)
   ```typescript
   import * as Notifications from 'expo-notifications';
   
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'c27e77a1-19c8-4d7a-b2a7-0b8012878bfd', // Your EAS project ID
   });
   ```

2. **Test via Expo Dashboard**
   - Go to: https://expo.dev/notifications
   - Enter your push token
   - Send a test notification
   - Should appear on your Android device!

3. **Test via Firebase Console** (Alternative)
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Enter notification title and text
   - Click "Send test message"
   - Enter your FCM token (different from Expo push token)

## Important Notes

### ✅ What Expo Handles for You

- **No `google-services.json` needed** in managed workflow
- **No native Android code** required
- **No Gradle configuration** needed
- **No Firebase SDK installation** - Expo includes it

### ⚠️ Requirements

- **EAS Build required** - Push notifications don't work in Expo Go
- **Firebase Server Key** - Must be configured in EAS
- **Production build** - Test notifications work, but production requires proper setup

### 🔐 Security Best Practices

- **Never commit** Firebase Server Key to git
- Store it securely in EAS credentials
- Use environment variables for sensitive data
- Rotate keys periodically

## How Expo Connects to Firebase

**The Connection Process:**

1. **Package Name Matching**
   - Your app's package name (`com.workphotopro.app`) must match the Android app registered in Firebase
   - This is how Firebase identifies which project to use

2. **Configuration File**
   - `google-services.json` contains your Firebase project credentials
   - It includes: project ID, API keys, and app identifiers
   - Expo reads this file during build to connect to Firebase

3. **EAS Credentials Storage**
   - When you run `eas credentials`, you upload `google-services.json`
   - EAS stores it securely and uses it during builds
   - This way you don't commit sensitive credentials to git

4. **Build Time Integration**
   - During EAS Build, Expo:
     - Reads `google-services.json` (from EAS or your project)
     - Configures the Android app with Firebase
     - Enables FCM push notifications

**Summary:** Expo connects to Firebase through the `google-services.json` file, which links your Android package name to your Firebase project.

## Troubleshooting

### "Push notifications not working"
- ✅ Make sure you're using EAS Build, not Expo Go
- ✅ Verify `google-services.json` is configured in EAS credentials or `app.config.js`
- ✅ Check that `expo-notifications` is installed
- ✅ Ensure app has notification permissions
- ✅ Verify Firebase Cloud Messaging API (V1) is enabled in Firebase Console

### "Oops! Looks like you uploaded a google-services.json instead of your service account key"

**This error means you're trying to upload the wrong file type!**

- ❌ **`google-services.json`** = Client-side Firebase config (what you have)
- ✅ **Service Account Key JSON** = Server-side credentials (what EAS is asking for)

**Two solutions:**

**Solution 1: Skip EAS Upload (Recommended) ✅**
- You already have `google-services.json` configured in `app.config.js`
- **Just place the file in your project root**
- EAS Build will use it automatically - **no need to upload to EAS credentials!**
- This works for basic push notifications

**Solution 2: Create Service Account Key (For Backend Push)**
- Only needed if you want to send push notifications from your backend
- Firebase Console → Project Settings → **Service Accounts** tab
- Click "Generate new private key"
- Download the JSON file (has `type`, `private_key`, `client_email` fields)
- Upload **this file** to EAS (NOT google-services.json)

**For now:** Use Solution 1 - skip EAS upload and just use `google-services.json` in your project!

### "EAS only shows Legacy option"

**This is normal!** EAS currently only shows "Push Notifications (Legacy)" option, but it works fine with Firebase V1.

- ✅ **It's safe to use** - The "Legacy" label is just about the API key format in EAS
- ✅ Your Firebase V1 API is still enabled and will work correctly
- ✅ Select "Push Notifications (Legacy)" and proceed with setup
- ✅ Upload `google-services.json` or enter Firebase Server Key when prompted

### "credentials.json does not exist" Error

**This error means you selected the wrong option in EAS!**

- ❌ **Don't** choose "Upload credentials from credentials.json" 
- ✅ **Do** choose "Push Notifications (Legacy)" (this is the correct option for FCM)
- The `credentials.json` file is for **app signing credentials**, not Firebase
- For Firebase push notifications, use the **"Push Notifications (Legacy)"** option

**Correct flow:**
1. Run `eas credentials`
2. Select "Android" → "Push Notifications (Legacy)"
3. Upload `google-services.json` or enter Firebase Server Key
4. Complete the setup

### "Can't configure FCM credentials"
- ✅ Download `google-services.json` from Firebase Console (Project Settings → Your apps → Android app)
- ✅ Make sure Firebase Cloud Messaging API (V1) is enabled (it should be by default)
- ✅ Run `eas credentials` and choose **"Set up a new FCM key"** (not credentials.json upload)
- ✅ Upload the `google-services.json` file when prompted
- ✅ Or manually add `googleServicesFile: "./google-services.json"` to `app.config.js`
- If you need Service Account Key for backend: Firebase Console → Project Settings → Service Accounts → Generate new private key

### "Notifications work in dev but not production"
- Verify EAS credentials are set correctly
- Check Firebase project settings
- Ensure production build uses correct credentials

## Next Steps

After FCM is set up:

1. ✅ Install `expo-notifications` package
2. ✅ Create notification service in Appwrite
3. ✅ Set up push token storage
4. ✅ Implement notification hooks
5. ✅ Create Appwrite Function to send notifications

See `NOTIFICATIONS_IMPLEMENTATION_GUIDE.md` for the full implementation.

## Quick Reference

| Item | Value |
|------|-------|
| Android Package | `com.workphotopro.app` |
| EAS Project ID | `c27e77a1-19c8-4d7a-b2a7-0b8012878bfd` |
| Firebase Console | https://console.firebase.google.com/ |
| Expo Notifications Tool | https://expo.dev/notifications |
| Documentation | https://docs.expo.dev/push-notifications/push-notifications-setup/ |

