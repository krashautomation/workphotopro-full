import { Models } from 'appwrite';

// User types
export type User = Models.User<Models.Preferences>;

// Job types
export interface Job {
  $id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Organization/Team types
export interface Organization {
  $id: string;
  name: string;
  ownerId: string;
  teamId: string; // Reference to Appwrite Team
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  $id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

// Image/Photo types
export interface Photo {
  $id: string;
  jobId: string;
  userId: string;
  fileId: string; // Appwrite Storage file ID
  caption?: string;
  tags?: string[];
  createdAt: string;
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

