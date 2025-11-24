import { databaseService } from './database';
import { ID, Query } from 'react-native-appwrite';
import { hashContacts } from '@/utils/contactHashing';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

export type UserContact = {
  $id: string;
  userId: string;
  phoneHash: string | null;
  emailHash: string | null;
  contactHash: string;
  contactType: 'phone' | 'email';
  syncedAt: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
};

export type ContactMatch = {
  $id: string;
  userId: string;
  matchedUserId: string;
  contactHash: string;
  matchType: 'phone' | 'email' | 'both';
  matchedAt: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
};

export type UserContactSync = {
  $id: string;
  userId: string;
  lastSyncedAt: string | null;
  contactsCount: number;
  matchesCount: number;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  syncVersion: number;
  $createdAt: string;
  $updatedAt: string;
};

export const contactService = {
  COLLECTION_USER_CONTACTS: 'user_contacts',
  COLLECTION_CONTACT_MATCHES: 'contact_matches',
  COLLECTION_USER_CONTACT_SYNC: 'user_contact_sync',

  /**
   * Sync user's contacts to the database
   * Takes raw contacts from expo-contacts, hashes them, and stores in database
   */
  async syncUserContacts(
    userId: string,
    contacts: Array<{ phoneNumbers?: Array<{ number: string }>; emails?: Array<{ email: string }> }>
  ): Promise<{ synced: number; errors: number }> {
    try {
      // Update sync status to "syncing"
      await this.updateSyncStatus(userId, 'syncing');

      // Hash all contacts
      const hashedContacts = await hashContacts(contacts);

      let synced = 0;
      let errors = 0;

      // Store each hashed contact
      for (const hashed of hashedContacts) {
        try {
          // Check if contact already exists
          const existing = await databaseService.listDocuments(
            this.COLLECTION_USER_CONTACTS,
            [
              Query.equal('userId', userId),
              Query.equal('contactHash', hashed.contactHash),
            ]
          );

          if (existing.documents.length === 0) {
            // Create new contact
            await databaseService.createDocument(
              this.COLLECTION_USER_CONTACTS,
              {
                userId,
                phoneHash: hashed.phoneHash,
                emailHash: hashed.emailHash,
                contactHash: hashed.contactHash,
                contactType: hashed.contactType,
                syncedAt: new Date().toISOString(),
                isActive: true,
              }
            );
            synced++;
          }
        } catch (error) {
          console.error('Error syncing contact:', error);
          errors++;
        }
      }

      // Update sync status to "completed"
      await this.updateSyncStatus(userId, 'completed', synced);

      return { synced, errors };
    } catch (error) {
      console.error('Error syncing user contacts:', error);
      await this.updateSyncStatus(userId, 'failed');
      throw error;
    }
  },

  /**
   * Get all contacts for a user
   */
  async getUserContacts(userId: string): Promise<UserContact[]> {
    try {
      const result = await databaseService.listDocuments(
        this.COLLECTION_USER_CONTACTS,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.orderDesc('$createdAt'),
        ]
      );
      return result.documents as unknown as UserContact[];
    } catch (error) {
      console.error('Error getting user contacts:', error);
      throw error;
    }
  },

  /**
   * Find matches between user's contacts and app users
   * This should be called after syncing contacts or periodically
   */
  async findMatches(userId: string): Promise<ContactMatch[]> {
    try {
      // Get user's contacts
      const userContacts = await this.getUserContacts(userId);

      // Get all app users' emails/phones (you'll need to implement this based on your user storage)
      // For now, this is a placeholder - you'll need to hash all user emails/phones and compare
      
      // TODO: Implement matching logic
      // 1. Get all user emails/phones from Appwrite Users or your users collection
      // 2. Hash them
      // 3. Compare with userContacts
      // 4. Create ContactMatch entries for matches

      return [];
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  },

  /**
   * Get "People You May Know" - users matched from contacts
   */
  async getPeopleYouMayKnow(userId: string): Promise<ContactMatch[]> {
    try {
      const result = await databaseService.listDocuments(
        this.COLLECTION_CONTACT_MATCHES,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.orderDesc('matchedAt'),
          Query.limit(50),
        ]
      );
      return result.documents as unknown as ContactMatch[];
    } catch (error) {
      console.error('Error getting people you may know:', error);
      throw error;
    }
  },

  /**
   * Create a contact match
   */
  async createMatch(
    userId: string,
    matchedUserId: string,
    contactHash: string,
    matchType: 'phone' | 'email' | 'both'
  ): Promise<ContactMatch> {
    try {
      // Check if match already exists
      const existing = await databaseService.listDocuments(
        this.COLLECTION_CONTACT_MATCHES,
        [
          Query.equal('userId', userId),
          Query.equal('matchedUserId', matchedUserId),
          Query.equal('contactHash', contactHash),
        ]
      );

      if (existing.documents.length > 0) {
        return existing.documents[0] as unknown as ContactMatch;
      }

      // Create new match
      const match = await databaseService.createDocument(
        this.COLLECTION_CONTACT_MATCHES,
        {
          userId,
          matchedUserId,
          contactHash,
          matchType,
          matchedAt: new Date().toISOString(),
          isActive: true,
        }
      );

      // Update matches count in sync record
      await this.incrementMatchesCount(userId);

      return match as unknown as ContactMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  /**
   * Get or create sync record for user
   */
  async getSyncRecord(userId: string): Promise<UserContactSync | null> {
    try {
      const result = await databaseService.listDocuments(
        this.COLLECTION_USER_CONTACT_SYNC,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length > 0) {
        return result.documents[0] as unknown as UserContactSync;
      }

      // Create new sync record
      return await this.createSyncRecord(userId);
    } catch (error) {
      console.error('Error getting sync record:', error);
      return null;
    }
  },

  /**
   * Create sync record for user
   */
  async createSyncRecord(userId: string): Promise<UserContactSync> {
    try {
      const sync = await databaseService.createDocument(
        this.COLLECTION_USER_CONTACT_SYNC,
        {
          userId,
          lastSyncedAt: null,
          contactsCount: 0,
          matchesCount: 0,
          syncStatus: 'pending',
          syncVersion: 1,
        }
      );
      return sync as unknown as UserContactSync;
    } catch (error) {
      console.error('Error creating sync record:', error);
      throw error;
    }
  },

  /**
   * Update sync status
   */
  async updateSyncStatus(
    userId: string,
    status: 'pending' | 'syncing' | 'completed' | 'failed',
    contactsCount?: number
  ): Promise<void> {
    try {
      const syncRecord = await this.getSyncRecord(userId);
      if (!syncRecord) {
        await this.createSyncRecord(userId);
        return;
      }

      const updateData: any = {
        syncStatus: status,
        syncVersion: syncRecord.syncVersion + 1,
      };

      if (status === 'completed') {
        updateData.lastSyncedAt = new Date().toISOString();
        if (contactsCount !== undefined) {
          updateData.contactsCount = contactsCount;
        }
      }

      await databaseService.updateDocument(
        this.COLLECTION_USER_CONTACT_SYNC,
        syncRecord.$id,
        updateData
      );
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  },

  /**
   * Increment matches count
   */
  async incrementMatchesCount(userId: string): Promise<void> {
    try {
      const syncRecord = await this.getSyncRecord(userId);
      if (!syncRecord) return;

      await databaseService.updateDocument(
        this.COLLECTION_USER_CONTACT_SYNC,
        syncRecord.$id,
        {
          matchesCount: (syncRecord.matchesCount || 0) + 1,
        }
      );
    } catch (error) {
      console.error('Error incrementing matches count:', error);
    }
  },

  /**
   * Delete user's contacts (for privacy/account deletion)
   */
  async deleteUserContacts(userId: string): Promise<void> {
    try {
      // Soft delete contacts
      const contacts = await this.getUserContacts(userId);
      for (const contact of contacts) {
        await databaseService.updateDocument(
          this.COLLECTION_USER_CONTACTS,
          contact.$id,
          { isActive: false }
        );
      }

      // Soft delete matches
      const matches = await this.getPeopleYouMayKnow(userId);
      for (const match of matches) {
        await databaseService.updateDocument(
          this.COLLECTION_CONTACT_MATCHES,
          match.$id,
          { isActive: false }
        );
      }
    } catch (error) {
      console.error('Error deleting user contacts:', error);
      throw error;
    }
  },
};

