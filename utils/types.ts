import { Models } from 'react-native-appwrite';

// User types
interface User {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
}

// Multi-tenant Organization types
export interface Organization {
  $id: string; // Appwrite document ID
  orgName: string;
  ownerId: string; // References Appwrite Users
  description?: string;
  isActive: boolean;
  settings?: string; // JSON string for organization settings
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// Team types (Appwrite Teams + our custom data)
export interface Team {
  $id: string; // Appwrite Teams ID
  name: string; // Appwrite Teams name
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  // Custom team data from our database
  teamData?: TeamData;
}

export interface TeamData {
  $id: string; // Our database document ID
  teamName: string;
  orgId: string; // References Organizations
  description?: string;
  isActive: boolean;
  settings?: string; // JSON string for team settings
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// Membership types
export interface Membership {
  $id: string; // Appwrite Teams membership ID
  teamId: string; // Appwrite Teams ID
  userId: string; // Appwrite Users ID
  userName: string;
  userEmail: string;
  roles: string[]; // Array of roles
  invited: string; // ISO date string
  joined: string; // ISO date string
  confirm: boolean;
  // Custom membership data from our database
  membershipData?: MembershipData;
}

export interface MembershipData {
  $id: string; // Our database document ID
  userId: string; // References Appwrite Users
  teamId: string; // References Teams
  role: string; // e.g., "owner", "admin", "member"
  invitedBy: string; // User who invited this member
  joinedAt: string; // ISO date string
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// JobChat types (updated for multi-tenancy)
export interface JobChat {
  id: string; // For backwards compatibility
  $id: string; // Appwrite document ID
  title: string;
  description: string;
  isPrivate: boolean | null;
  status?: 'active' | 'completed' | 'archived'; // Updated job status
  createdBy?: string; // Creator's user ID
  createdByName?: string; // Creator's display name
  deletedAt?: string; // Soft delete timestamp (ISO string)
  // Multi-tenant fields
  teamId: string; // References Teams
  orgId: string; // References Organizations
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
  createdAt?: string; // For backwards compatibility
  updatedAt?: string; // For backwards compatibility
}

// Message types (updated for multi-tenancy)
export interface Message {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
  $sequence: number;
  content: string;
  senderId: string; // User who posted the message (kept existing field)
  senderName: string;
  senderPhoto: string;
  jobId: string; // Reference to JobChat
  // Multi-tenant fields
  teamId: string; // References Teams
  orgId: string; // References Organizations
  imageUrl?: string; // Optional image URL
  imageFileId?: string; // Optional Appwrite file ID for deletion
  locationData?: LocationData; // Optional location data
  messageType?: 'text' | 'image' | 'location'; // Message type
}

// Location data for messages
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
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

// Multi-tenant context types
export interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentTeam: Team | null;
  userOrganizations: Organization[];
  userTeams: Team[];
  loading: boolean;
  loadUserData: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<Organization>;
  createTeam: (name: string, description?: string) => Promise<Team>;
  inviteToTeam: (teamId: string, email: string, roles: string[]) => Promise<void>;
  updateMembershipRole: (teamId: string, membershipId: string, roles: string[]) => Promise<void>;
  removeFromTeam: (teamId: string, membershipId: string) => Promise<void>;
}

// Role types
export type TeamRole = 'owner' | 'admin' | 'member';
export type OrganizationRole = 'owner' | 'admin' | 'member';

// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
}

// Export all types
export type { 
  JobChat, 
  Message, 
  User, 
  TagTemplate, 
  JobTagAssignment, 
  JobChatWithTags,
  Organization,
  Team,
  TeamData,
  Membership,
  MembershipData,
  OrganizationContextType,
  TeamRole,
  OrganizationRole
};