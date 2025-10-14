import { databases } from './client';
import { ID, Query } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

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

// Job-specific helpers
export const jobService = {
  COLLECTION_ID: 'jobs', // You'll create this in Appwrite Console

  async createJob(data: any) {
    return databaseService.createDocument(this.COLLECTION_ID, data);
  },

  async getJob(jobId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, jobId);
  },

  async listJobs(userId?: string) {
    const queries = userId ? [Query.equal('userId', userId)] : [];
    return databaseService.listDocuments(this.COLLECTION_ID, queries);
  },

  async updateJob(jobId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, jobId, data);
  },

  async deleteJob(jobId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, jobId);
  },
};

