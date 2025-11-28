import { pushTokenService } from './pushTokens';

/**
 * Service for sending push notifications
 * 
 * This service provides methods to send push notifications to users.
 * You can use either:
 * 1. Appwrite Messaging API (if configured)
 * 2. Expo Push API (simpler, works with Expo push tokens)
 * 3. Custom Appwrite Function
 */

export interface PushNotificationData {
  type?: string;
  jobId?: string;
  teamId?: string;
  taskId?: string;
  messageId?: string;
  [key: string]: any;
}

export const messagingService = {
  /**
   * Send push notification to a single user via Expo Push API
   * 
   * This is the simplest approach - works with Expo push tokens directly
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: PushNotificationData
  ) {
    try {
      // Get user's push token
      const token = await pushTokenService.getToken(userId);
      if (!token) {
        console.warn(`No push token found for user ${userId}`);
        return { success: false, error: 'No push token registered' };
      }

      // Send via Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title: title,
          body: body,
          data: data || {},
          priority: 'high',
        }),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'ok') {
        console.log('✅ Push notification sent successfully');
        return { success: true, messageId: result.data.id };
      } else {
        console.error('❌ Failed to send push notification:', result.errors);
        return { success: false, error: result.errors || 'Unknown error' };
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send push notification to multiple users (team members)
   */
  async sendPushToTeam(
    userIds: string[],
    title: string,
    body: string,
    data?: PushNotificationData
  ) {
    try {
      // Get all push tokens for these users
      const tokens: string[] = [];
      for (const userId of userIds) {
        const token = await pushTokenService.getToken(userId);
        if (token) {
          tokens.push(token);
        }
      }

      if (tokens.length === 0) {
        console.warn('No push tokens found for team members');
        return { success: false, error: 'No push tokens found' };
      }

      // Send to all tokens via Expo Push API
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
        priority: 'high',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      // Check results
      const successful = result.data?.filter((r: any) => r.status === 'ok').length || 0;
      const failed = result.data?.filter((r: any) => r.status === 'error').length || 0;

      console.log(`✅ Sent ${successful} notifications, ${failed} failed`);
      
      return {
        success: successful > 0,
        successful,
        failed,
        results: result.data,
      };
    } catch (error) {
      console.error('Error sending push notifications to team:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send push notification using Appwrite Messaging API
   * 
   * This is the recommended approach per Appwrite documentation:
   * https://appwrite.io/docs/products/messaging/send-push-notifications
   * 
   * Note: Requires Appwrite Messaging provider to be configured
   */
  async sendPushViaAppwriteMessaging(
    userId: string,
    title: string,
    body: string,
    data?: PushNotificationData
  ) {
    try {
      const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
      const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

      // Appwrite Messaging API expects targets to be user IDs or target IDs
      // Since push targets are associated with accounts, we can send to userId
      // OR we can get the target ID from our custom collection
      
      // Option 1: Send to user ID (Appwrite will find their push targets)
      // This is simpler and recommended by Appwrite docs
      const response = await fetch(`${endpoint}/messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId,
          // Add auth header if needed (for server-side calls)
        },
        body: JSON.stringify({
          providerId: 'fcm', // Your FCM provider ID from Appwrite Console
          targets: [userId], // User ID - Appwrite finds their push targets
          title: title,
          body: body,
          data: data || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Appwrite Messaging API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Push notification sent via Appwrite Messaging');
      return { success: true, result };
    } catch (error) {
      console.error('Error sending push via Appwrite Messaging:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send push notification via Appwrite Function
   * 
   * Use this if you've created a custom Appwrite Function for sending notifications
   */
  async sendPushViaFunction(
    userId: string,
    title: string,
    body: string,
    data?: PushNotificationData
  ) {
    try {
      // Get user's push token
      const token = await pushTokenService.getToken(userId);
      if (!token) {
        return { success: false, error: 'No push token registered' };
      }

      // Call Appwrite Function
      // Note: You'll need to import Functions from react-native-appwrite
      // const { Functions } = require('react-native-appwrite');
      // const functions = new Functions(client);
      
      // const result = await functions.createExecution(
      //   'send-push-notification',
      //   JSON.stringify({
      //     expoPushToken: token,
      //     title,
      //     body,
      //     data,
      //   })
      // );

      // return { success: true, result };
      
      console.warn('Appwrite Function approach not implemented yet');
      return { success: false, error: 'Not implemented' };
    } catch (error) {
      console.error('Error sending push via Function:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

