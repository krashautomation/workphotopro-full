/**
 * Katya AI Agent - Client-side Service
 * 
 * Helper functions for interacting with Katya from the client app.
 * Note: Most Katya functionality happens server-side via Cloud Function.
 */

import { databases } from './client';
import { Query } from 'react-native-appwrite';
import { appwriteConfig, db } from '@/utils/appwrite';

export interface KatyaConfig {
  enabled: boolean;
  responseFrequency: 'low' | 'medium' | 'high';
  personality: 'friendly' | 'professional' | 'enthusiastic';
}

/**
 * Katya Service - Client-side helpers
 */
export const katyaService = {
  /**
   * Check Katya's status - verify she's set up correctly
   */
  async checkKatyaStatus(): Promise<{
    active: boolean;
    userId?: string;
    userExists: boolean;
    functionDeployed: boolean;
    errors: string[];
  }> {
    const status = {
      active: false,
      userId: undefined as string | undefined,
      userExists: false,
      functionDeployed: false,
      errors: [] as string[]
    };

    try {
      console.log('🤖 Checking Katya status...');

      // Get Katya user ID from environment or config
      const katyaUserId = process.env.EXPO_PUBLIC_KATYA_USER_ID || '692d284d000f7e24c7e4';
      status.userId = katyaUserId;

      // Check if Katya user exists
      try {
        // Try to get user info (this will fail if user doesn't exist)
        // Note: We can't directly check user existence from client, but we can check if
        // Katya has any memberships or messages
        const memberships = await db.listDocuments(
          appwriteConfig.db,
          'memberships',
          [
            Query.equal('userId', katyaUserId),
            Query.limit(1)
          ]
        );

        if (memberships.documents && memberships.documents.length > 0) {
          status.userExists = true;
          console.log('🤖 ✅ Katya user exists and has team memberships');
        } else {
          status.errors.push('Katya user exists but has no team memberships');
          console.log('🤖 ⚠️ Katya user exists but has no team memberships');
        }
      } catch (error: any) {
        status.errors.push(`Could not verify Katya user: ${error.message}`);
        console.log('🤖 ⚠️ Could not verify Katya user:', error.message);
      }

      // Check if Katya has posted any messages (indicates function is working)
      try {
        const messages = await db.listDocuments(
          appwriteConfig.db,
          appwriteConfig.col.messages,
          [
            Query.equal('senderId', katyaUserId),
            Query.orderDesc('$createdAt'),
            Query.limit(1)
          ]
        );

        if (messages.documents && messages.documents.length > 0) {
          status.functionDeployed = true;
          console.log('🤖 ✅ Katya has posted messages (function is active)');
        } else {
          status.errors.push('Katya has not posted any messages yet');
          console.log('🤖 ⚠️ Katya has not posted any messages yet');
        }
      } catch (error: any) {
        status.errors.push(`Could not check Katya messages: ${error.message}`);
        console.log('🤖 ⚠️ Could not check Katya messages:', error.message);
      }

      // Overall status: active if user exists and function is deployed
      status.active = status.userExists && status.functionDeployed;

      if (status.active) {
        console.log('🤖 ✅ Katya is ACTIVE and ready to respond!');
      } else {
        console.log('🤖 ⚠️ Katya status:', {
          userExists: status.userExists,
          functionDeployed: status.functionDeployed,
          errors: status.errors
        });
      }

      return status;
    } catch (error: any) {
      console.error('🤖 ❌ Error checking Katya status:', error);
      status.errors.push(`Status check failed: ${error.message}`);
      return status;
    }
  },

  /**
   * Manually trigger Katya to respond in a job chat
   * Useful for testing or manual activation
   * 
   * Note: This requires a separate endpoint or function execution
   * For now, Katya responds automatically via webhook
   */
  async triggerResponse(jobId: string, teamId: string, orgId: string): Promise<boolean> {
    try {
      // This would call a Cloud Function endpoint to trigger Katya
      // Implementation depends on your setup
      console.log('🤖 Triggering Katya response for job:', jobId);
      
      // TODO: Implement if you want manual triggers
      // For now, Katya responds automatically via webhook
      
      return false;
    } catch (error) {
      console.error('🤖 Error triggering Katya:', error);
      return false;
    }
  },

  /**
   * Check if a message is from Katya
   */
  isKatyaMessage(senderId: string, katyaUserId?: string): boolean {
    // You'll need to store Katya's user ID somewhere accessible
    // For now, check against a known pattern or store in config
    const KATYA_USER_ID = katyaUserId || process.env.EXPO_PUBLIC_KATYA_USER_ID || '692d284d000f7e24c7e4';
    
    if (!KATYA_USER_ID) {
      // Fallback: check sender name
      return false; // Can't determine without user ID
    }
    
    return senderId === KATYA_USER_ID;
  },

  /**
   * Get Katya's display info
   */
  getKatyaInfo() {
    return {
      name: 'Katya',
      avatar: '', // You can add a default avatar URL
      description: 'AI Team Assistant',
      isAI: true
    };
  },

  /**
   * Format Katya message for display (if needed)
   */
  formatKatyaMessage(message: any) {
    return {
      ...message,
      isFromKatya: true,
      displayName: 'Katya',
      avatar: this.getKatyaInfo().avatar
    };
  }
};

/**
 * Check if Katya is enabled for a team/job
 * This would check a database field or setting
 */
export async function isKatyaEnabled(teamId: string): Promise<boolean> {
  try {
    // Check team settings for katyaEnabled field
    // This requires adding a field to your teams collection
    // For now, return true (always enabled)
    return true;
  } catch (error) {
    console.error('🤖 Error checking Katya enabled status:', error);
    return false;
  }
}

/**
 * Enable/disable Katya for a team
 */
export async function setKatyaEnabled(teamId: string, enabled: boolean): Promise<boolean> {
  try {
    // Update team settings
    // This requires adding katyaEnabled field to teams collection
    // For now, just return success
    console.log(`🤖 Setting Katya enabled=${enabled} for team: ${teamId}`);
    return true;
  } catch (error) {
    console.error('🤖 Error setting Katya enabled:', error);
    return false;
  }
}

