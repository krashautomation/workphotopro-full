import { messagingService } from './messaging';
import { pushTokenService } from './pushTokens';
import { databaseService } from './database';
import { notificationService } from './notifications';

/**
 * Notification preferences stored in user preferences or a separate collection
 * For now, we'll use a simple approach - you can enhance this later
 */

export type NotificationType = 
  | 'task_created'
  | 'task_completed'
  | 'message'
  | 'job_assigned'
  | 'job_updated'
  | 'photo_uploaded'
  | 'team_invite'
  | 'comment_added';

/**
 * Check if user has notifications enabled for a specific type
 */
async function isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const { notificationPreferencesService } = await import('./notificationPreferences');
    
    // Map notification event types to preference keys
    const preferenceMap: Record<NotificationType, string> = {
      'task_created': 'task_created',
      'task_completed': 'task_completed',
      'message': 'message',
      'job_assigned': 'job_assigned',
      'job_updated': 'job_updated',
      'photo_uploaded': 'photo_uploaded',
      'team_invite': 'team_invite',
      'comment_added': 'message', // Use message preference for comments
    };
    
    // First check if push notifications are enabled globally
    const pushEnabled = await notificationPreferencesService.isEnabled(userId, 'push_notifications');
    if (!pushEnabled) {
      return false; // If push notifications are disabled globally, don't send any
    }
    
    // Then check the specific notification type preference
    const preferenceKey = preferenceMap[type] || 'push_notifications';
    return await notificationPreferencesService.isEnabled(userId, preferenceKey as any);
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Send push notification to a user (with preference check)
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  orgId: string,
  data?: Record<string, any>
) {
  try {
    // Check if user has notifications enabled for this type
    const enabled = await isNotificationEnabled(userId, type);
    if (!enabled) {
      console.log(`📵 Notifications disabled for user ${userId}, type: ${type}`);
      return { success: false, reason: 'disabled' };
    }

    // Check if user has a push token
    const token = await pushTokenService.getToken(userId);
    if (!token) {
      console.log(`📵 No push token found for user ${userId}`);
      return { success: false, reason: 'no_token' };
    }

    // Create in-app notification record
    try {
      await notificationService.createNotification(
        userId,
        type,
        title,
        body,
        orgId,
        data
      );
    } catch (error) {
      // Don't fail if notification record creation fails, but log it
      console.warn('Failed to create notification record:', error);
    }

    // Send push notification
    const result = await messagingService.sendPushNotification(
      userId,
      title,
      body,
      {
        type,
        ...data,
      }
    );

    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send notifications to multiple users (team members)
 */
export async function sendNotificationsToTeam(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  orgId: string,
  data?: Record<string, any>
) {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendNotification(userId, type, title, body, orgId, data);
    results.push({ userId, ...result });
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`📬 Sent ${successful} notifications, ${failed} failed`);

  return {
    successful,
    failed,
    results,
  };
}

/**
 * Helper: Get team member IDs for a job
 * You'll need to implement this based on your team structure
 */
export async function getTeamMemberIds(jobId: string): Promise<string[]> {
  try {
    // TODO: Implement based on your team structure
    // Example:
    // const job = await databaseService.getDocument('jobs', jobId);
    // const team = await teamService.getTeamByJobId(jobId);
    // return team.members.map(m => m.userId);
    
    // For now, return empty array - implement this based on your structure
    return [];
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
}

