import { databaseService } from './database';
import { Query } from 'react-native-appwrite';
import { Models } from 'react-native-appwrite';

export const COLLECTION_ID = 'notifications';

export type NotificationType = 
  | 'job_assigned'
  | 'job_updated'
  | 'message'
  | 'team_invite'
  | 'photo_uploaded'
  | 'task_created'
  | 'task_completed'
  | 'comment_added';

export interface NotificationData {
  jobId?: string;
  teamId?: string;
  messageId?: string;
  taskId?: string;
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
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
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

      return await databaseService.listDocuments(COLLECTION_ID, queries);
    } catch (error: any) {
      // If collection doesn't exist, return empty result
      if (error?.message?.includes('Collection with the requested ID could not be found')) {
        console.warn('Notifications collection not found - returning empty list');
        return { documents: [], total: 0 };
      }
      // If user is not authorized, return empty result (user might not be fully authenticated)
      if (error?.message?.includes('not authorized') || error?.message?.includes('unauthorized')) {
        console.warn('User not authorized to access notifications - returning empty list');
        return { documents: [], total: 0 };
      }
      throw error;
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await this.getNotifications(userId, {
        unreadOnly: true,
        limit: 1, // Just need count
      });
      return result.total || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      return await databaseService.updateDocument(
        COLLECTION_ID,
        notificationId,
        {
          isRead: true,
          readAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    try {
      // Get all unread notifications
      const unread = await this.getNotifications(userId, {
        unreadOnly: true,
      });

      // Update each one
      const updates = unread.documents.map(doc =>
        databaseService.updateDocument(
          COLLECTION_ID,
          doc.$id,
          {
            isRead: true,
            readAt: new Date().toISOString(),
          }
        )
      );

      await Promise.all(updates);
      return { success: true, count: unread.documents.length };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Create notification (typically called by Appwrite Function or notification helper)
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ) {
    try {
      console.log('🔔 Creating notification:', {
        userId,
        type,
        title,
        message,
        data,
      });

      const notification = await databaseService.createDocument(COLLECTION_ID, {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
        isRead: false,
      });

      console.log('✅ Notification created:', {
        notificationId: notification.$id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        createdAt: notification.$createdAt,
      });

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      return await databaseService.deleteDocument(COLLECTION_ID, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Clear all read notifications for a user
   */
  async clearReadNotifications(userId: string) {
    try {
      // Get all read notifications
      const readNotifications = await this.getNotifications(userId, {
        limit: 1000, // Get a large batch
      });

      const readOnly = readNotifications.documents.filter(
        (doc: any) => doc.isRead === true
      );

      if (readOnly.length === 0) {
        return { success: true, count: 0 };
      }

      // Delete each read notification
      const deletions = readOnly.map((doc: any) =>
        databaseService.deleteDocument(COLLECTION_ID, doc.$id)
      );

      await Promise.all(deletions);
      console.log(`🗑️ Cleared ${readOnly.length} read notifications`);
      return { success: true, count: readOnly.length };
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      throw error;
    }
  },
};

