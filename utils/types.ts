import { Models } from 'react-native-appwrite';

// User types
interface User {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
}

// JobChat types (matching old working version)
export interface JobChat {
  id: string; // For backwards compatibility
  $id: string; // Appwrite document ID
  title: string;
  description: string;
  isPrivate: boolean | null;
  status?: 'current' | 'complete'; // Job status
  deletedAt?: string; // Soft delete timestamp (ISO string)
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
  createdAt?: string; // For backwards compatibility
  updatedAt?: string; // For backwards compatibility
}

// Message types (matching old working version)
export interface Message {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
  $sequence: number;
  content: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  jobId: string; // Reference to JobChat
  imageUrl?: string; // Optional image URL
  imageFileId?: string; // Optional Appwrite file ID for deletion
}

// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
}

export type { JobChat, Message, User };