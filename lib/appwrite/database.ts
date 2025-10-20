import { databases } from './client';
import { ID, Query } from 'react-native-appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

// Simple database service for basic CRUD operations
export const databaseService = {
  /**
   * Create a new document in a collection
   */
  async createDocument(collectionId: string, data: any, documentId?: string) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        collectionId,
        documentId || ID.unique(),
        data
      );
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  },

  /**
   * Get a document by ID
   */
  async getDocument(collectionId: string, documentId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  /**
   * List documents with optional queries
   */
  async listDocuments(collectionId: string, queries: string[] = []) {
    try {
      return await databases.listDocuments(DATABASE_ID, collectionId, queries);
    } catch (error) {
      console.error('List documents error:', error);
      throw error;
    }
  },

  /**
   * Update a document
   */
  async updateDocument(collectionId: string, documentId: string, data: any) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        data
      );
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(collectionId: string, documentId: string) {
    try {
      return await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },
};

// Simple JobChat service (matching old working version)
export const jobChatService = {
  COLLECTION_ID: 'jobchat', // Using old collection name

  async createJobChat(data: any) {
    return databaseService.createDocument(this.COLLECTION_ID, data);
  },

  async getJobChat(jobChatId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, jobChatId);
  },

  async listJobChats() {
    // Get all jobs and filter out soft-deleted ones in the application
    // This approach handles both cases: jobs without deletedAt field and jobs with deletedAt = null
    const response = await databaseService.listDocuments(this.COLLECTION_ID, [
      Query.limit(100),
      Query.orderDesc('$createdAt') // Order by creation date to get latest jobs first
    ]);
    
    console.log('🔍 Database Service: Raw jobs response:', response.documents.length, 'jobs');
    
    // Filter out soft-deleted jobs in the application
    const activeJobs = response.documents.filter((job: any) => 
      !job.deletedAt || job.deletedAt === null
    );
    
    console.log('🔍 Database Service: Active jobs after filtering:', activeJobs.length, 'jobs');
    
    return {
      ...response,
      documents: activeJobs,
      total: activeJobs.length
    };
  },

  async updateJobChat(jobChatId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, jobChatId, data);
  },

  async deleteJobChat(jobChatId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, jobChatId);
  },

  async restoreJobChat(jobChatId: string) {
    // Restore a soft-deleted job by removing the deletedAt field
    return databaseService.updateDocument(this.COLLECTION_ID, jobChatId, {
      deletedAt: null,
    });
  },

  async listDeletedJobChats() {
    // Get all jobs and filter for soft-deleted ones in the application
    const response = await databaseService.listDocuments(this.COLLECTION_ID, [
      Query.limit(100)
    ]);
    
    // Filter for soft-deleted jobs only
    const deletedJobs = response.documents.filter((job: any) => 
      job.deletedAt && job.deletedAt !== null
    );
    
    return {
      ...response,
      documents: deletedJobs,
      total: deletedJobs.length
    };
  },
};

// Simple Message service (matching old working version)
export const messageService = {
  COLLECTION_ID: 'messages',

  async createMessage(data: any) {
    return databaseService.createDocument(this.COLLECTION_ID, data);
  },

  async getMessage(messageId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, messageId);
  },

  async listMessages(jobId: string) {
    // Use jobId instead of jobChatId to match old version
    const queries = [
      Query.equal('jobId', jobId),
      Query.orderAsc('$createdAt'),
      Query.limit(100)
    ];
    return databaseService.listDocuments(this.COLLECTION_ID, queries);
  },

  async updateMessage(messageId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, messageId, data);
  },

  async deleteMessage(messageId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, messageId);
  },
};