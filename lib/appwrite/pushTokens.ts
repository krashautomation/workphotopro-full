import { databaseService } from './database';
import { Query } from 'react-native-appwrite';

const COLLECTION_ID = 'user_push_tokens';

export const pushTokenService = {
  /**
   * Save or update FCM token for user
   */
  async saveToken(userId: string, token: string, platform: string) {
    try {
      // Check if token exists for this user and platform
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
          createdAt: new Date().toISOString(),
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
    try {
      const queries = [Query.equal('userId', userId)];
      if (platform) {
        queries.push(Query.equal('platform', platform));
      }

      const result = await databaseService.listDocuments(COLLECTION_ID, queries);
      return result.documents[0]?.token || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      throw error;
    }
  },

  /**
   * Get all tokens for a user (all platforms)
   */
  async getAllTokens(userId: string) {
    try {
      const result = await databaseService.listDocuments(COLLECTION_ID, [
        Query.equal('userId', userId),
      ]);
      return result.documents.map(doc => doc.token);
    } catch (error) {
      console.error('Error getting all push tokens:', error);
      throw error;
    }
  },

  /**
   * Delete token
   */
  async deleteToken(userId: string, platform: string) {
    try {
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
    } catch (error) {
      console.error('Error deleting push token:', error);
      throw error;
    }
  },
};

