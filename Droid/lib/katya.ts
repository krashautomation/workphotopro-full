/**
 * Katya AI Agent - Client-side Service
 * 
 * Helper functions for interacting with Katya from the client app.
 * Note: Most Katya functionality happens server-side via Cloud Function.
 */

import { databases, appwriteConfig } from '../../utils/appwrite';
import { ID } from 'react-native-appwrite';

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
      console.log('Triggering Katya response for job:', jobId);
      
      // TODO: Implement if you want manual triggers
      // For now, Katya responds automatically via webhook
      
      return false;
    } catch (error) {
      console.error('Error triggering Katya:', error);
      return false;
    }
  },

  /**
   * Check if a message is from Katya
   */
  isKatyaMessage(senderId: string, katyaUserId?: string): boolean {
    // You'll need to store Katya's user ID somewhere accessible
    // For now, check against a known pattern or store in config
    const KATYA_USER_ID = katyaUserId || process.env.EXPO_PUBLIC_KATYA_USER_ID;
    
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
    console.error('Error checking Katya enabled status:', error);
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
    console.log(`Setting Katya enabled=${enabled} for team: ${teamId}`);
    return true;
  } catch (error) {
    console.error('Error setting Katya enabled:', error);
    return false;
  }
}

