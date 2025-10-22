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
  createdBy?: string; // Creator's user ID
  createdByName?: string; // Creator's display name
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

// Tag system types
export interface TagTemplate {
  $id: string;
  name: string;
  color: string; // Hex color code
  icon?: string; // Icon name
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdBy: string; // User ID who created this template
  $createdAt: string;
  $updatedAt: string;
}

export interface JobTagAssignment {
  $id: string;
  jobId: string; // Reference to JobChat
  tagTemplateId: string; // Reference to TagTemplate
  assignedBy: string; // User ID who assigned the tag
  assignedAt: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

// Extended JobChat with tags
export interface JobChatWithTags extends JobChat {
  assignedTags?: JobTagAssignment[];
  tagTemplates?: TagTemplate[];
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

export type { JobChat, Message, User, TagTemplate, JobTagAssignment, JobChatWithTags };