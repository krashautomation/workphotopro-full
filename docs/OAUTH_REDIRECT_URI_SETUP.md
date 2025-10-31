# 🔧 OAuth Redirect URI Setup Guide

## Error: "Invalid `success` param: Invalid URI"

This error occurs when the OAuth redirect URI (`workphotopro://`) is not registered in your Appwrite project settings.

## Solution: Register Redirect URI in Appwrite Console

### Step 1: Go to Appwrite Console
1. Navigate to [https://sfo.cloud.appwrite.io](https://sfo.cloud.appwrite.io)
2. Log in to your account
3. Select your project: **68e9d42100365e14f358**

### Step 2: Navigate to Platform Settings
1. Go to **Settings** in the left sidebar
2. Click on **Platforms** tab

### Step 3: Add or Edit Platform
1. If you already have a platform configured:
   - Click on the existing platform (likely showing package: `com.workphotopro.app`)
   - Edit the platform settings

2. If you don't have a platform:
   - Click **"Add Platform"**
   - Select **"Android App"** or **"iOS App"**
   - Enter package name: `com.workphotopro.app`

### Step 4: Configure OAuth Redirect URIs
1. In the platform settings, find the **OAuth Redirect URIs** section
2. Add the following redirect URIs:
   ```
   workphotopro://
   appwrite-callback-68e9d42100365e14f358://
   ```

3. **Save** the changes

### Step 5: Enable Google OAuth Provider
1. Navigate to **Auth** → **Providers**
2. Find **Google** in the list
3. Enable it if not already enabled
4. Make sure the OAuth configuration is correct:
   - Client ID
   - Client Secret
   - Scopes: `profile`, `email`, `openid`

### Step 6: Test OAuth Flow
1. Restart your Expo development server
2. Try the Google OAuth sign-in again
3. The error should be resolved

## Alternative: Using Appwrite Callback Scheme

If the above doesn't work, you might need to use the Appwrite-specific callback scheme format:
```
appwrite-callback-68e9d42100365e14f358://
```

This scheme is already configured in your `app.json` Android intent filters (line 74).

## Troubleshooting

### Still Getting the Error?
1. **Clear Appwrite Cache**: Sometimes changes take a few minutes to propagate
2. **Check URI Format**: Make sure there are no extra slashes or characters
3. **Verify Project ID**: Confirm you're using the correct project ID (`68e9d42100365e14f358`)
4. **Check OAuth Provider Settings**: Ensure Google OAuth is properly configured in your Google Cloud Console

### Verify Platform Configuration
In Appwrite Console → Settings → Platforms, you should see:
- Platform type: Android App or iOS App
- Package name: `com.workphotopro.app`
- OAuth redirect URIs: Should include `workphotopro://`

## References
- [Appwrite OAuth Documentation](https://appwrite.io/docs/authentication-oauth)
- [Appwrite React Native OAuth Guide](https://appwrite.io/docs/getting-started-for-react-native)

