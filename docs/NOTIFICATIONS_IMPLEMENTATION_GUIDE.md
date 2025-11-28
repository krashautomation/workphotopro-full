# 🔔 Notifications Implementation Guide

## Overview

This guide covers implementing push notifications for WorkPhotoPro using **Expo Notifications** + **Appwrite**.

## Architecture

```
┌─────────────────┐
│  Appwrite DB    │ ← Store notification records
│  (notifications)│
└────────┬────────┘
         │
         │ Appwrite Realtime
         │ (sync in-app)
         ▼
┌─────────────────┐
│  React Native   │ ← Display notifications
│  App            │
└────────┬────────┘
         │
         │ Push via Expo
         ▼
┌─────────────────┐
│  User Device    │ ← Push notifications
│  (iOS/Android)  │
└─────────────────┘
```

## Components Needed

### 1. **Expo Notifications** (`expo-notifications`)
- Handles push notification registration
- Receives and displays push notifications
- Manages notification permissions

### 2. **Appwrite Database Collection** (`notifications`)
- Stores notification records
- Tracks read/unread status
- Links to users, jobs, teams, etc.

### 3. **Appwrite Functions** (Optional but Recommended)
- Server-side function to send push notifications
- Triggered by events (new message, job assignment, etc.)
- Uses Expo Push Notification API

### 4. **Custom React Hooks**
- `useNotifications()` - Fetch and manage notifications
- `usePushNotifications()` - Handle push token registration
- `useNotificationBadge()` - Track unread count

## Implementation Steps

### Step 1: Install Dependencies

```bash
npx expo install expo-notifications
```

### Step 2: Configure App Config

Add to `app.config.js`:

```javascript
plugins: [
  // ... existing plugins
  [
    'expo-notifications',
    {
      icon: './assets/images/notification-icon.png',
      color: '#22c55e',
      sounds: ['./assets/sounds/notification.wav'], // Optional
    },
  ],
]
```

### Step 3: Create Appwrite Notifications Collection

**Collection ID:** `notifications`

**Attributes:**
- `userId` (string, required) - User who receives notification
- `type` (string, required) - 'job_assigned', 'message', 'team_invite', etc.
- `title` (string, required)
- `message` (string, required)
- `data` (string, JSON) - Additional data (jobId, teamId, etc.)
- `isRead` (boolean, default: false)
- `readAt` (datetime, optional)
- `createdAt` (datetime, auto)

**Indexes:**
- `userId` + `isRead` (for querying unread)
- `userId` + `createdAt` (for sorting)

**Permissions:**
- Read: `users` (users can read their own)
- Create: `users` (users can create, but typically done by Functions)
- Update: `users` (users can mark as read)
- Delete: `users` (optional, for cleanup)

### Step 4: Create Notification Service

Create `lib/appwrite/notifications.ts`:

```typescript
import { databases } from './client';
import { ID, Query } from 'react-native-appwrite';
import { Models } from 'react-native-appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = 'notifications';

export type NotificationType = 
  | 'job_assigned'
  | 'job_updated'
  | 'message'
  | 'team_invite'
  | 'photo_uploaded'
  | 'comment_added';

export interface NotificationData {
  jobId?: string;
  teamId?: string;
  messageId?: string;
  [key: string]: any;
}

export interface Notification extends Models.Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: string; // JSON string
  isRead: boolean;
  readAt?: string;
}

export const notificationService = {
  /**
   * Get notifications for current user
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ];

    if (options.unreadOnly) {
      queries.push(Query.equal('isRead', false));
    }

    if (options.limit) {
      queries.push(Query.limit(options.limit));
    }

    if (options.offset) {
      queries.push(Query.offset(options.offset));
    }

    return await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      queries
    );
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('isRead', false),
        Query.limit(1), // Just need count
      ]
    );
    return result.total;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      notificationId,
      {
        isRead: true,
        readAt: new Date().toISOString(),
      }
    );
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    // Get all unread notifications
    const unread = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('isRead', false),
      ]
    );

    // Update each one
    const updates = unread.documents.map(doc =>
      databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        {
          isRead: true,
          readAt: new Date().toISOString(),
        }
      )
    );

    await Promise.all(updates);
  },

  /**
   * Create notification (typically called by Appwrite Function)
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
        isRead: false,
      }
    );
  },
};
```

### Step 5: Create Push Notification Hook

Create `hooks/usePushNotifications.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
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

export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      
      // TODO: Save token to Appwrite (user preferences or separate collection)
      if (token && user) {
        // Save push token to Appwrite
        // await savePushToken(user.$id, token);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification data
      // Example: router.push(`/(jobs)/${data.jobId}`);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  return {
    expoPushToken,
    notification,
  };
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
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'c27e77a1-19c8-4d7a-b2a7-0b8012878bfd';
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    console.error('Error getting push token:', e);
  }

  return token;
}
```

### Step 6: Create Notifications Hook

Create `hooks/useNotifications.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/lib/appwrite/notifications';
import { useAuth } from '@/context/AuthContext';
import { Realtime } from 'react-native-appwrite';
import { client } from '@/lib/appwrite/client';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await notificationService.getNotifications(user.$id, {
        limit: 50,
      });
      setNotifications(result.documents as Notification[]);
      
      const count = await notificationService.getUnreadCount(user.$id);
      setUnreadCount(count);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time updates
    if (user) {
      const channel = `databases.${process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID}.collections.notifications.documents`;
      
      const unsubscribe = client.subscribe(channel, (event) => {
        if (event.events.some(e => e.includes(`userId.${user.$id}`))) {
          // Reload notifications when new one is created
          loadNotifications();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.$id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.$id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
```

### Step 7: Update Notification Screen

Update `app/(jobs)/notifications.tsx` to use real data:

```typescript
import { useNotifications } from '@/hooks/useNotifications';
// ... rest of imports

export default function Notifications() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  // ... rest of component
}
```

### Step 8: Create Appwrite Function (Optional)

Create an Appwrite Function to send push notifications when events occur:

**Function:** `send-push-notification`

**Trigger:** Database event (when notification document is created)

**Code:**
```javascript
const { Client } = require('node-appwrite');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const { userId, title, message, data } = req.variables;

  // Get user's push token from Appwrite
  // (store in user preferences or separate collection)
  
  // Send via Expo Push API
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      sound: 'default',
      title,
      body: message,
      data,
    }),
  });

  res.json({ success: true });
};
```

## Testing

### Development (Expo Go)
- Push notifications work in Expo Go
- Use Expo Push Notification Tool: https://expo.dev/notifications

### Production
- Requires EAS Build (not Expo Go)
- Configure APNs (iOS) and FCM (Android) credentials
- See: https://docs.expo.dev/push-notifications/push-notifications-setup/

## Alternative: In-App Only (Simpler)

If you don't need push notifications, you can use **Appwrite Realtime only**:

1. Store notifications in Appwrite Database
2. Use Realtime subscriptions to sync
3. Display in-app notifications
4. No push tokens or Expo Notifications needed

This is simpler but users won't get notifications when app is closed.

## Next Steps

1. ✅ Install `expo-notifications`
2. ✅ Create notifications collection in Appwrite
3. ✅ Create notification service
4. ✅ Create hooks
5. ✅ Update notification screens
6. ⏳ Set up Appwrite Function (optional)
7. ⏳ Configure EAS for production push

