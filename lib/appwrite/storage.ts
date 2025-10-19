import { storage } from './client';
import { ID } from 'react-native-appwrite';

const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '';

export const storageService = {
  /**
   * Upload a file
   */
  async uploadFile(file: File) {
    try {
      return await storage.createFile(BUCKET_ID, ID.unique(), file);
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  },

  /**
   * Get file preview URL
   */
  getFilePreview(fileId: string, width?: number, height?: number) {
    try {
      return storage.getFilePreview(BUCKET_ID, fileId, width, height);
    } catch (error) {
      console.error('Get file preview error:', error);
      throw error;
    }
  },

  /**
   * Get file download URL
   */
  getFileDownload(fileId: string) {
    try {
      return storage.getFileDownload(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Get file download error:', error);
      throw error;
    }
  },

  /**
   * Get file view URL
   */
  getFileView(fileId: string) {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Get file view error:', error);
      throw error;
    }
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string) {
    try {
      return await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  },

  /**
   * List files
   */
  async listFiles(queries?: string[]) {
    try {
      return await storage.listFiles(BUCKET_ID, queries);
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },
};

