# 🌐 Upload FCM Credentials via Expo.dev Website

## Step-by-Step Guide

### Step 1: Get Firebase Server Key or Service Account Key

**Option A: Get Server Key (Simpler)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **workphotopro-7f9ed**
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Under **Cloud Messaging API (Legacy)**, find **Server key**
5. Copy the key (it's a long string like `AAAA...`)

**Option B: Get Service Account Key (More Complete)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **workphotopro-7f9ed**
3. Go to **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file (contains `type`, `private_key`, `client_email`, etc.)

### Step 2: Upload via Expo.dev Website

1. **Go to Expo.dev**
   - Visit: https://expo.dev/
   - Sign in to your Expo account

2. **Navigate to Your Project**
   - Click on your project: **workphotopro-v2**
   - Or go to: https://expo.dev/accounts/[your-account]/projects/workphotopro-v2

3. **Go to Credentials**
   - In the left sidebar, click **"Credentials"**
   - Or go directly to: https://expo.dev/accounts/[your-account]/projects/workphotopro-v2/credentials

4. **Select Android Platform**
   - Click on **"Android"** tab (if not already selected)

5. **Add Push Notification Credentials**
   - Look for **"Push Notifications"** section
   - Click **"Add FCM API Key"** or **"Configure Push Notifications"**
   - You'll see options:
     - **"Upload Google Service Account Key"** (if you have JSON file)
     - **"Enter Server Key"** (if you have server key)

6. **Upload Your Credentials**
   
   **If uploading Service Account Key:**
   - Click **"Upload Google Service Account Key"**
   - Click **"Choose File"** or drag & drop
   - Select your downloaded JSON file (from Step 1, Option B)
   - Click **"Upload"** or **"Save"**

   **If entering Server Key:**
   - Click **"Enter Server Key"**
   - Paste your server key (from Step 1, Option A)
   - Click **"Save"**

7. **Verify Upload**
   - You should see a success message
   - The credentials should appear in the **"Push Notifications"** section
   - Status should show as **"Configured"** or **"Active"**

### Step 3: Rebuild Your App

After uploading credentials, rebuild your app:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

Or if using EAS Build:

```bash
eas build --platform android
```

## Alternative: Direct Link

If you know your account name, you can go directly to:

```
https://expo.dev/accounts/[YOUR_ACCOUNT]/projects/workphotopro-v2/credentials/android
```

Replace `[YOUR_ACCOUNT]` with your Expo username/account name.

## Troubleshooting

### "Credentials" option not visible
- Make sure you're logged in to Expo.dev
- Verify you have access to the project
- Check that you're on the correct project page

### "Push Notifications" section not showing
- Make sure you've selected the **Android** platform tab
- Try refreshing the page
- Check that your project has `expo-notifications` configured in `app.config.js`

### Upload fails
- Verify the file format is correct (JSON for Service Account Key)
- Check that the server key is complete (no spaces/line breaks)
- Ensure you have the correct Firebase project selected

## Verification

After uploading and rebuilding:

1. **Check console logs:**
   - Should see: `✅ Push token registered` (if successful)
   - Or: `⚠️ Firebase not initialized` (if still not working)

2. **Test push notification:**
   - Use Expo Push Notification Tool: https://expo.dev/notifications
   - Enter your Expo push token
   - Send a test notification

## Next Steps

Once credentials are uploaded:
1. ✅ Rebuild your app
2. ✅ Test push token registration
3. ✅ Verify token is saved in Appwrite Database
4. ✅ Test sending a push notification

## References

- [Expo.dev Credentials](https://expo.dev/accounts/[your-account]/projects/workphotopro-v2/credentials)
- [Expo FCM Credentials Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Firebase Console](https://console.firebase.google.com/)

