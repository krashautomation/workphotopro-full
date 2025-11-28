# 🔔 Backend Push Notifications Setup Guide

## ⚠️ Important: Two Approaches Available

**Option 1: Appwrite Messaging (Recommended - Simpler)** ✅
- Use Appwrite's built-in Messaging service
- Configure FCM provider once
- Use Appwrite Messaging API directly
- **See:** `APPWRITE_MESSAGING_SETUP.md` for this approach

**Option 2: Custom Appwrite Function (More Control)**
- Create custom function to send notifications
- More code to write and maintain
- Full control over notification logic
- **This guide covers Option 2**

## Overview

This guide covers setting up **Service Account Key** for sending push notifications from your **Appwrite Functions** backend. This allows you to send push notifications when events happen (new tasks, messages, etc.).

**Note:** If you want a simpler approach, consider using Appwrite Messaging instead (see `APPWRITE_MESSAGING_SETUP.md`).

## Prerequisites

- ✅ Firebase project created
- ✅ Firebase Cloud Messaging API (V1) enabled
- ✅ `google-services.json` already configured (for client-side)
- ✅ EAS CLI installed

## Step 1: Create Service Account Key in Firebase (5 minutes)

### 1.1 Navigate to Service Accounts

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **workphotopro-7f9ed**
3. Click the gear icon ⚙️ → **Project settings**
4. Click the **Service Accounts** tab at the top

### 1.2 Generate Service Account Key

1. Click **"Generate new private key"** button
2. A dialog will appear warning about keeping the key secure
3. Click **"Generate key"**
4. A JSON file will download (e.g., `workphotopro-7f9ed-xxxxx.json`)
5. **Save this file securely** - you'll need it for:
   - Uploading to EAS
   - Using in Appwrite Functions

### 1.3 Verify the File

The downloaded JSON file should contain these fields:
```json
{
  "type": "service_account",
  "project_id": "workphotopro-7f9ed",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...@...iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**Key fields:**
- ✅ `type`: "service_account"
- ✅ `private_key`: Your private key
- ✅ `client_email`: Service account email

## Step 2: Upload Service Account Key to EAS (3 minutes)

### 2.1 Run EAS Credentials

```bash
eas credentials
```

### 2.2 Navigate to Push Notifications

1. Select your project: **workphotopro-v2**
2. Select **"Android"**
3. Select **"Push Notifications (Legacy)"**

### 2.3 Upload Service Account Key

1. Choose **"Upload a Google Service Account Key"**
2. When prompted for the file path, provide the path to your downloaded Service Account JSON file
   - Example: `C:\Users\capta\Downloads\workphotopro-7f9ed-xxxxx.json`
3. EAS will validate and store the key securely

### 2.4 Verify Upload

EAS should confirm:
```
✅ Google Service Account Key uploaded successfully
```

## Step 3: Store Service Account Key in Appwrite (5 minutes)

**Important:** You'll need the Service Account Key in Appwrite so your Functions can send push notifications.

**Good news:** You can store it **before** creating your function! Appwrite stores secrets at the project level, so all functions can access them.

### Option A: Store as Project-Level Secret (Recommended)

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to your project
3. Go to **Settings** → **Variables** (or **Functions** → **Settings** → **Variables**)
4. Click **"Add Variable"** or **"Create Variable"**
5. Add the secret:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value:** Paste the **entire contents** of your Service Account JSON file
   - **Scope:** Select **"All Functions"** (or specific function if you prefer)
   - Click **"Create"** or **"Add"**

**Note:** The value should be the complete JSON content, like:
```json
{
  "type": "service_account",
  "project_id": "workphotopro-7f9ed",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  ...
}
```

### Option B: Store as Function-Specific Secret (After Creating Function)

If you prefer function-specific secrets:

1. Create your Appwrite Function first (see Step 4)
2. Go to your Function → **Settings** → **Variables**
3. Add the secret with the same key: `FIREBASE_SERVICE_ACCOUNT_KEY`

### Option C: Store as Environment Variable (Local Development)

If you're running Appwrite Functions locally or self-hosted:
- Add the Service Account JSON content to your environment variables
- Name it: `FIREBASE_SERVICE_ACCOUNT_KEY`

## Step 4: Create Appwrite Function for Push Notifications (10 minutes)

**Prerequisites:**
- ✅ Service Account Key stored in Appwrite (Step 3)
- ✅ Firebase Cloud Messaging API (V1) enabled

### 4.1 Create Function in Appwrite Console

1. Go to **Functions** → **Create Function**
2. Name: `send-push-notification`
3. Runtime: **Node.js 18.0** (or latest)
4. Click **"Create"**

### 4.2 Function Code

Create the function code to send push notifications:

```javascript
const { Client } = require('node-appwrite');
const { google } = require('googleapis');

/**
 * Send push notification using Firebase Cloud Messaging V1 API
 * 
 * @param {Object} req - Appwrite function request
 * @param {Object} res - Appwrite function response
 */
module.exports = async (req, res) => {
  try {
    // Parse request body
    const { expoPushToken, title, body, data } = JSON.parse(req.payload || '{}');

    if (!expoPushToken || !title || !body) {
      return res.json({
        success: false,
        error: 'Missing required fields: expoPushToken, title, body'
      }, 400);
    }

    // Get Firebase Service Account Key from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return res.json({
        success: false,
        error: 'FIREBASE_SERVICE_ACCOUNT_KEY not configured'
      }, 500);
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    // Send via Expo Push API (Expo handles FCM conversion)
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
      }),
    });

    const result = await expoResponse.json();

    if (result.data && result.data.status === 'ok') {
      return res.json({
        success: true,
        messageId: result.data.id,
      });
    } else {
      return res.json({
        success: false,
        error: result.errors || 'Failed to send notification',
      }, 500);
    }

  } catch (error) {
    console.error('Push notification error:', error);
    return res.json({
      success: false,
      error: error.message,
    }, 500);
  }
};
```

### 4.3 Install Dependencies

In your Appwrite Function, you'll need to install:
- `googleapis` - For Firebase authentication
- `node-fetch` (if not available) - For HTTP requests

Add to `package.json`:
```json
{
  "dependencies": {
    "googleapis": "^126.0.0"
  }
}
```

### 4.4 Alternative: Direct FCM V1 API (More Complex)

If you want to use FCM V1 API directly instead of Expo Push API:

```javascript
const { google } = require('googleapis');

// ... (same setup code)

// Use FCM V1 API directly
const fcm = google.firebase('v1beta1', { auth: authClient });
const projectId = serviceAccount.project_id;

const message = {
  message: {
    token: fcmToken, // FCM token (different from Expo push token)
    notification: {
      title: title,
      body: body,
    },
    data: data || {},
  },
};

const response = await fcm.projects.messages.send({
  parent: `projects/${projectId}`,
  requestBody: message,
});
```

**Note:** This requires FCM tokens (not Expo push tokens), which is more complex. Using Expo Push API is recommended.

## Step 5: Trigger Function from Your App (Example)

### 5.1 When Task Created in Chat

```typescript
// In your app code (e.g., when creating a task)
import { Functions } from 'react-native-appwrite';

async function createTaskAndNotify(jobId: string, taskTitle: string) {
  // 1. Create task in Appwrite Database
  const task = await databaseService.createDocument('tasks', {
    jobId,
    title: taskTitle,
    // ... other fields
  });

  // 2. Get all team members
  const members = await teamService.getTeamMembers(jobId);

  // 3. Send push notification to each member
  for (const member of members) {
    if (member.expoPushToken) {
      await Functions.createExecution(
        'send-push-notification',
        JSON.stringify({
          expoPushToken: member.expoPushToken,
          title: 'New Task Created',
          body: `${taskTitle} in ${jobName}`,
          data: {
            type: 'task_created',
            taskId: task.$id,
            jobId: jobId,
          },
        })
      );
    }
  }
}
```

### 5.2 Using Appwrite Database Events (Better Approach)

Set up an Appwrite Function trigger on database events:

1. In Appwrite Console → Functions → `send-push-notification`
2. Go to **Settings** → **Events**
3. Add trigger:
   - **Event:** `databases.tasks.documents.create`
   - **Collection:** `tasks`
4. Function will automatically run when a task is created

Then modify your function to:
```javascript
module.exports = async (req, res) => {
  // Get the event data
  const event = JSON.parse(req.payload);
  const task = event.payload; // The created task document

  // Get team members
  // Send notifications
  // ...
};
```

## Step 6: Store Expo Push Tokens (Required)

Users need to register their Expo push tokens. See `NOTIFICATIONS_IMPLEMENTATION_GUIDE.md` for:
- How to get Expo push tokens in your app
- Where to store them (Appwrite Database)
- How to link them to users

## Testing

### Test Push Notification

1. Get an Expo push token from your app
2. Call your Appwrite Function:
   ```bash
   curl -X POST https://cloud.appwrite.io/v1/functions/{functionId}/executions \
     -H "Content-Type: application/json" \
     -H "X-Appwrite-Project: {projectId}" \
     -d '{
       "data": "{\"expoPushToken\":\"ExponentPushToken[...]\",\"title\":\"Test\",\"body\":\"Hello World\"}"
     }'
   ```
3. Check your device for the notification

## Security Best Practices

1. ✅ **Never commit** Service Account Key to git
2. ✅ Store in Appwrite Function secrets
3. ✅ Use environment variables for local development
4. ✅ Rotate keys periodically
5. ✅ Limit Service Account permissions (if possible)

## Troubleshooting

### "FIREBASE_SERVICE_ACCOUNT_KEY not configured"
- Make sure you added the secret in Appwrite Functions → Settings
- Verify the JSON content is valid

### "Failed to send notification"
- Check Expo push token is valid
- Verify Service Account Key has correct permissions
- Check Firebase Cloud Messaging API (V1) is enabled

### "Invalid token"
- Make sure you're using Expo push tokens, not FCM tokens
- Verify token is registered for the correct project

## Next Steps

1. ✅ Service Account Key uploaded to EAS
2. ✅ Service Account Key stored in Appwrite Functions
3. ✅ Appwrite Function created for sending notifications
4. ⏳ Implement push token registration in your app
5. ⏳ Set up database triggers for automatic notifications
6. ⏳ Test end-to-end notification flow

See `NOTIFICATIONS_IMPLEMENTATION_GUIDE.md` for implementing the client-side push token registration.

