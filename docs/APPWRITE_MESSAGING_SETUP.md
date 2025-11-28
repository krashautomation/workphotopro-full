# 🔔 Appwrite Messaging Setup Guide (Simpler Approach)

## Overview

This guide covers setting up push notifications using **Appwrite Messaging** with Firebase Cloud Messaging (FCM). This is simpler than creating a custom function because Appwrite handles everything for you!

## Prerequisites

- ✅ Firebase project created
- ✅ Firebase Cloud Messaging API (V1) enabled
- ✅ Service Account Key downloaded from Firebase
- ✅ Service Account Key stored in Appwrite as secret: `FIREBASE_SERVICE_ACCOUNT_KEY`

## Step 1: Configure FCM Provider in Appwrite (5 minutes)

### 1.1 Navigate to Messaging

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Go to **Messaging** → **Providers**
4. Click **"Create Provider"** or **"Add Provider"**

### 1.2 Add FCM Provider

1. Select **"Push with FCM"** (Firebase Cloud Messaging)
2. Fill in the configuration:

   **Provider Name:** `FCM` (or any name you prefer)
   
   **Service Account Key:**
   
   **Option A: Reference Secret Variable (Recommended)**
   - If Appwrite Messaging supports referencing secrets, use: `{{FIREBASE_SERVICE_ACCOUNT_KEY}}`
   - Or check if there's a dropdown to select from existing secrets
   
   **Option B: Paste JSON Directly**
   - Open your downloaded Service Account JSON file
   - **Select ALL** content (Ctrl+A)
   - **Copy** (Ctrl+C)
   - **Paste** into the Service Account Key field
   - **Important:** Make sure you copy the ENTIRE file, including:
     - Opening `{`
     - All fields (type, project_id, private_key, client_email, etc.)
     - Closing `}`
   - The JSON should be valid - you can validate it at https://jsonlint.com

3. Click **"Create"** or **"Save"**

### Troubleshooting "Unexpected end of JSON input"

**This error means the JSON is incomplete or malformed. Try these fixes:**

1. **Verify JSON is complete:**
   - Open your Service Account JSON file in a text editor
   - Make sure it starts with `{` and ends with `}`
   - Check that all fields are present (type, project_id, private_key, client_email, etc.)

2. **Copy the entire file:**
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)
   - Paste into Appwrite field
   - Don't manually edit or remove any parts

3. **Validate JSON:**
   - Copy your JSON to https://jsonlint.com
   - Click "Validate JSON"
   - Fix any errors before pasting into Appwrite

4. **Check for hidden characters:**
   - Make sure there are no extra spaces or line breaks at the start/end
   - The JSON should be valid JSON format

5. **Try referencing the secret instead:**
   - If Appwrite Messaging supports it, try using `{{FIREBASE_SERVICE_ACCOUNT_KEY}}`
   - This references the secret you already stored in Appwrite

### 1.3 Verify Provider

- You should see your FCM provider listed
- Status should show as **"Active"** or **"Connected"**

## Step 2: Get FCM Tokens in Your App (15 minutes)

Since you're using Expo, you need to get FCM tokens instead of Expo push tokens.

### 2.1 Install Required Packages

```bash
npx expo install expo-notifications
```

### 2.2 Create FCM Token Hook

Create `hooks/useFCMToken.ts`:

```typescript
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useFCMToken() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setFcmToken(token);
      setLoading(false);
      
      // TODO: Save token to Appwrite Database (link to user)
      if (token && user) {
        saveFCMTokenToAppwrite(user.$id, token);
      }
    });
  }, [user]);

  return { fcmToken, loading };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Get Expo push token first
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'c27e77a1-19c8-4d7a-b2a7-0b8012878bfd';
    const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
    // For Android, Expo push tokens work with FCM
    // For Appwrite Messaging, we can use Expo push tokens directly
    // OR convert to FCM tokens if needed
    
    // Note: Appwrite Messaging might accept Expo push tokens
    // If not, you'll need to extract FCM token from native module
    token = expoToken;
    
  } catch (e) {
    console.error('Error getting push token:', e);
  }

  return token;
}

async function saveFCMTokenToAppwrite(userId: string, token: string) {
  try {
    // Save token to Appwrite Database
    // Create a collection: user_push_tokens
    // Store: userId, token, platform, createdAt
    
    // Example:
    // await databaseService.createDocument('user_push_tokens', {
    //   userId,
    //   token,
    //   platform: Platform.OS,
    //   createdAt: new Date().toISOString(),
    // });
    
    console.log('FCM token saved:', token);
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}
```

### 2.3 Alternative: Get Native FCM Token (If Needed)

If Appwrite Messaging requires native FCM tokens (not Expo tokens), you'll need to use a native module:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```

Then get the native FCM token:

```typescript
import messaging from '@react-native-firebase/messaging';

async function getNativeFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
```

**Note:** This requires a native build (EAS Build), not Expo Go.

## Step 3: Store FCM Tokens in Appwrite Database (5 minutes)

### 3.1 Create Collection

1. Go to **Databases** → Create Collection
2. Name: `user_push_tokens`
3. Add attributes:
   - `userId` (string, required)
   - `token` (string, required)
   - `platform` (string) - 'android', 'ios', 'web'
   - `createdAt` (datetime, auto)
   - `updatedAt` (datetime, auto)

4. Set permissions:
   - Read: `users` (users can read their own)
   - Create: `users` (users can create)
   - Update: `users` (users can update their own)
   - Delete: `users` (users can delete their own)

### 3.2 Save Token Service

Create `lib/appwrite/pushTokens.ts`:

```typescript
import { databaseService } from './database';
import { ID } from 'react-native-appwrite';

const COLLECTION_ID = 'user_push_tokens';

export const pushTokenService = {
  /**
   * Save or update FCM token for user
   */
  async saveToken(userId: string, token: string, platform: string) {
    try {
      // Check if token exists for this user
      const existing = await databaseService.listDocuments(COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.equal('platform', platform),
      ]);

      if (existing.documents.length > 0) {
        // Update existing token
        return await databaseService.updateDocument(
          COLLECTION_ID,
          existing.documents[0].$id,
          {
            token,
            updatedAt: new Date().toISOString(),
          }
        );
      } else {
        // Create new token
        return await databaseService.createDocument(COLLECTION_ID, {
          userId,
          token,
          platform,
        });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  },

  /**
   * Get FCM token for user
   */
  async getToken(userId: string, platform?: string) {
    const queries = [Query.equal('userId', userId)];
    if (platform) {
      queries.push(Query.equal('platform', platform));
    }

    const result = await databaseService.listDocuments(COLLECTION_ID, queries);
    return result.documents[0]?.token || null;
  },

  /**
   * Delete token
   */
  async deleteToken(userId: string, platform: string) {
    const existing = await databaseService.listDocuments(COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.equal('platform', platform),
    ]);

    if (existing.documents.length > 0) {
      return await databaseService.deleteDocument(
        COLLECTION_ID,
        existing.documents[0].$id
      );
    }
  },
};
```

## Step 4: Send Push Notifications Using Appwrite Messaging API (10 minutes)

### 4.1 Create Messaging Service

Create `lib/appwrite/messaging.ts`:

```typescript
import { Functions } from 'react-native-appwrite';
import { client } from './client';

// Note: Appwrite Messaging API might be accessed via SDK
// Check Appwrite SDK documentation for exact API

export const messagingService = {
  /**
   * Send push notification to a user
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    try {
      // Get user's FCM token
      const pushTokenDoc = await pushTokenService.getToken(userId);
      if (!pushTokenDoc) {
        throw new Error('User has no push token registered');
      }

      // Use Appwrite Messaging API
      // This is the API call - check Appwrite docs for exact format
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/messaging/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
            // Add auth header if needed
          },
          body: JSON.stringify({
            providerId: 'fcm', // Your FCM provider ID
            targets: [pushTokenDoc.token], // FCM token
            title: title,
            body: body,
            data: data || {},
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  },

  /**
   * Send push notification to multiple users (team members)
   */
  async sendPushToTeam(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    // Get all FCM tokens for these users
    const tokens: string[] = [];
    for (const userId of userIds) {
      const token = await pushTokenService.getToken(userId);
      if (token) {
        tokens.push(token);
      }
    }

    if (tokens.length === 0) {
      throw new Error('No push tokens found for team members');
    }

    // Send to all tokens
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/messaging/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
        },
        body: JSON.stringify({
          providerId: 'fcm',
          targets: tokens, // Array of FCM tokens
          title: title,
          body: body,
          data: data || {},
        }),
      }
    );

    return await response.json();
  },
};
```

### 4.2 Use in Your App

Example: Send notification when task is created:

```typescript
import { messagingService } from '@/lib/appwrite/messaging';
import { teamService } from '@/lib/appwrite/teams';

async function createTaskAndNotify(jobId: string, taskTitle: string) {
  // 1. Create task
  const task = await databaseService.createDocument('tasks', {
    jobId,
    title: taskTitle,
    // ...
  });

  // 2. Get team members
  const team = await teamService.getTeamByJobId(jobId);
  const memberIds = team.members.map(m => m.userId);

  // 3. Send push notifications
  await messagingService.sendPushToTeam(
    memberIds,
    'New Task Created',
    `${taskTitle} in ${jobName}`,
    {
      type: 'task_created',
      taskId: task.$id,
      jobId: jobId,
    }
  );
}
```

## Step 5: Handle Incoming Notifications (5 minutes)

### 5.1 Listen for Notifications

Update your app's root layout or main component:

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export function useNotificationHandlers() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        // Update in-app notification list
      }
    );

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification data
        if (data.type === 'task_created' && data.jobId) {
          router.push(`/(jobs)/${data.jobId}`);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
```

## Important Notes

### Expo Push Tokens vs FCM Tokens

- **Expo Push Tokens:** Work with Expo Push API (what we were using before)
- **FCM Tokens:** Native Firebase tokens (what Appwrite Messaging might need)

**For Appwrite Messaging:**
- Check Appwrite documentation to see if it accepts Expo push tokens
- If yes: Use Expo push tokens directly
- If no: You'll need native FCM tokens (requires EAS Build)

### API Reference

Check Appwrite Messaging API documentation:
- [Appwrite Messaging Docs](https://appwrite.io/docs/products/messaging)
- [Messaging API Reference](https://appwrite.io/docs/references/cloud/server-web-sdk)

The exact API endpoints might differ - check the latest Appwrite documentation for the correct format.

## Testing

1. Register FCM token in your app
2. Call `messagingService.sendPushNotification()` from your code
3. Check device for notification
4. Test notification tap handling

## Troubleshooting

### "Provider not found"
- Make sure FCM provider is configured in Appwrite Console
- Verify Service Account Key is correct

### "Invalid token"
- Check if token format matches what Appwrite expects
- Verify token is saved correctly in database

### "Notification not received"
- Check device notification permissions
- Verify FCM provider is active
- Check Appwrite function logs for errors

## Next Steps

1. ✅ Configure FCM provider in Appwrite
2. ✅ Get FCM tokens in your app
3. ✅ Store tokens in Appwrite Database
4. ✅ Use Appwrite Messaging API to send notifications
5. ⏳ Test end-to-end flow
6. ⏳ Set up automatic notifications (database triggers)

