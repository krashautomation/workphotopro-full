import { databaseService } from './database';
import { Query } from 'react-native-appwrite';

const COLLECTION_ID = 'user_notification_preferences';

export type NotificationType = 
  | 'push_notifications'
  | 'email_notifications'
  | 'task_created'
  | 'task_completed'
  | 'message'
  | 'job_assigned'
  | 'job_updated'
  | 'photo_uploaded'
  | 'team_invite'
  | 'job_status_updates'
  | 'weekly_summary';

export interface NotificationPreferences {
  userId: string;
  push_notifications: boolean;
  email_notifications: boolean;
  task_created: boolean;
  task_completed: boolean;
  message: boolean;
  job_assigned: boolean;
  job_updated: boolean;
  photo_uploaded: boolean;
  team_invite: boolean;
  job_status_updates: boolean;
  weekly_summary: boolean;
  updatedAt: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  push_notifications: true,
  email_notifications: true,
  task_created: true,
  task_completed: true,
  message: true,
  job_assigned: true,
  job_updated: false,
  photo_uploaded: true,
  team_invite: true,
  job_status_updates: false,
  weekly_summary: false,
};

export const notificationPreferencesService = {
  /**
   * Get user's notification preferences
   * Returns default preferences if none exist
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const result = await databaseService.listDocuments(COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.limit(1),
      ]);

      if (result.documents.length > 0) {
        return result.documents[0] as any as NotificationPreferences;
      }

      // Return defaults if no preferences exist
      return {
        userId,
        ...DEFAULT_PREFERENCES,
        updatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // If collection doesn't exist, return defaults
      if (error?.message?.includes('Collection with the requested ID could not be found')) {
        console.warn('Notification preferences collection not found - using defaults');
        return {
          userId,
          ...DEFAULT_PREFERENCES,
          updatedAt: new Date().toISOString(),
        };
      }
      console.error('Error getting notification preferences:', error);
      // Return defaults on error
      return {
        userId,
        ...DEFAULT_PREFERENCES,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>
  ): Promise<NotificationPreferences> {
    try {
      // Check if preferences exist
      const existing = await databaseService.listDocuments(COLLECTION_ID, [
        Query.equal('userId', userId),
        Query.limit(1),
      ]);

      const updatedData = {
        ...preferences,
        updatedAt: new Date().toISOString(),
      };

      if (existing.documents.length > 0) {
        // Update existing
        return await databaseService.updateDocument(
          COLLECTION_ID,
          existing.documents[0].$id,
          updatedData
        ) as any as NotificationPreferences;
      } else {
        // Create new
        return await databaseService.createDocument(COLLECTION_ID, {
          userId,
          ...DEFAULT_PREFERENCES,
          ...preferences,
          updatedAt: new Date().toISOString(),
        }) as any as NotificationPreferences;
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  /**
   * Update a single preference
   */
  async updatePreference(
    userId: string,
    key: NotificationType,
    value: boolean
  ): Promise<NotificationPreferences> {
    return await this.updatePreferences(userId, { [key]: value });
  },

  /**
   * Check if a specific notification type is enabled
   */
  async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);
      return prefs[type] ?? true; // Default to enabled if not set
    } catch (error) {
      console.error('Error checking notification preference:', error);
      return true; // Default to enabled on error
    }
  },
};

