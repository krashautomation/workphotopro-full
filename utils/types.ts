import { Models } from 'react-native-appwrite';

// User types
interface User {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
}

export type ResolutionPreference = 'standard' | 'hd';
export type TimestampPreference = 'on' | 'off';

// User preferences for watermark and timestamp
export interface UserPreferences {
  $id?: string;
  userId: string; // References Appwrite Users
  timestampEnabled: boolean;
  timestampFormat?: 'short' | 'long';
  hdPreferences?: Record<string, ResolutionPreference>;
  hdPreferencesRaw?: string;
  timestampPreferences?: Record<string, TimestampPreference>;
  $createdAt?: string;
  $updatedAt?: string;
}

// RevenueCat subscription types
export type SubscriptionStatus = 
  | 'active' 
  | 'grace_period' 
  | 'billing_issue' 
  | 'canceled' 
  | 'expired' 
  | 'refunded' 
  | 'paused';

export interface Subscription {
  $id: string; // Appwrite document ID
  userId: string; // Appwrite user ID
  orgId: string; // Organization ID
  revenueCatCustomerId: string; // RevenueCat customer ID
  productId: string; // RevenueCat product identifier (e.g., "premium_2_members_monthly")
  status: SubscriptionStatus; // Subscription status
  startDate: string; // ISO date string
  expiryDate: string; // ISO date string
  autoRenewing: boolean; // Whether subscription auto-renews (default: true)
  canceledAt?: string; // ISO date string - when subscription was canceled (null if active)
  lastSyncedAt: string; // ISO date string - last sync with RevenueCat
  trialEndDate?: string; // ISO date string - end of trial period
  packageId?: string; // Package ID (1-10) - only if manually mapping tiers
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

export type RevenueCatEventCategory = 'subscription' | 'entitlement' | 'customer';
export type RevenueCatProcessedStatus = 'pending' | 'success' | 'failed' | 'ignored';

export interface RevenueCatEvent {
  $id: string; // Appwrite document ID
  eventId: string; // RevenueCat event ID (unique)
  eventType: string; // Event type from RevenueCat (e.g., "INITIAL_PURCHASE", "RENEWAL")
  eventCategory: RevenueCatEventCategory; // Event category
  customerId: string; // RevenueCat customer ID
  userId?: string; // Appwrite user ID (populated after processing)
  orgId?: string; // Organization ID (populated after processing)
  productId?: string; // Product ID (extracted from event)
  eventData?: string; // Full event payload as JSON string
  attemptNumber: number; // Retry attempt number (default: 0)
  processedStatus: RevenueCatProcessedStatus; // Processing status
  processedAt?: string; // ISO date string - when event was processed
  errorMessage?: string; // Error message if processing failed
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// Multi-tenant Organization types
export interface Organization {
  $id: string; // Appwrite document ID
  orgName: string;
  ownerId: string; // References Appwrite Users
  description?: string;
  logoUrl?: string; // Organization logo/icon URL
  isActive: boolean;
  settings?: string; // JSON string for organization settings
  premiumTier?: string;
  // RevenueCat subscription fields
  currentProductId?: string; // Current active product ID (e.g., "free", "premium_2_members_monthly")
  subscriptionId?: string; // Reference to active subscription document ID
  subscriptionExpiryDate?: string; // ISO date string - quick expiry check
  revenueCatCustomerId?: string; // RevenueCat customer ID
  hdCaptureEnabled?: boolean;
  timestampEnabled?: boolean;
  watermarkEnabled?: boolean;
  videoRecordingEnabled?: boolean;
  hdVideoEnabled?: boolean;
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
  /**
   * @deprecated Appwrite Teams SDK has been removed. This field is no longer used
   * and will be removed in a future cleanup. Kept for backwards compatibility.
   */
  appwriteTeamId?: string;
  orgId: string; // References Organizations
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  phone?: string;
  teamPhotoUrl?: string;
  isActive: boolean;
  settings?: string; // JSON string for team settings
  createdBy?: string; // User ID who created the team
  membershipRole?: string; // User's role in this team (attached at runtime)
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
  userEmail?: string; // Email of the member (stored when creating membership)
  userName?: string; // Name of the member (cached from Appwrite Users)
  profilePicture?: string; // Profile picture URL (cached from Appwrite Users preferences)
  invitedBy: string; // User who invited this member
  joinedAt: string; // ISO date string
  isActive: boolean;
  canShareJobReports?: boolean; // Permission to share job reports (default: false)
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
  imageUrl?: string; // Optional image URL (single image - kept for backward compatibility)
  imageFileId?: string; // Optional Appwrite file ID for deletion (single image - kept for backward compatibility)
  imageUrls?: string[]; // Optional array of image URLs (multiple images)
  imageFileIds?: string[]; // Optional array of Appwrite file IDs for deletion (multiple images)
  videoUrl?: string; // Optional video URL
  videoFileId?: string; // Optional Appwrite file ID for deletion
  audioUrl?: string; // Optional audio URL
  audioFileId?: string; // Optional Appwrite file ID for deletion
  audioDuration?: number; // Audio duration in seconds
  fileUrl?: string; // Optional file URL
  fileFileId?: string; // Optional Appwrite file ID for deletion
  fileName?: string; // Original filename
  fileSize?: number; // File size in bytes
  fileMimeType?: string; // MIME type
  locationData?: LocationData; // Optional location data
  messageType?: 'text' | 'image' | 'video' | 'location' | 'file' | 'audio'; // Message type (optional, inferred from field presence)
  // Task fields
  isTask?: boolean; // Flag to mark message as a task
  taskStatus?: 'active' | 'completed'; // Task status (only relevant if isTask is true)
  // Duty fields
  isDuty?: boolean; // Flag to mark message as a duty
  dutyStatus?: 'active' | 'completed'; // Duty status (only relevant if isDuty is true)
  // Reply fields
  replyToMessageId?: string; // ID of the message being replied to
  replyCount?: number; // Number of replies this message has received (for rewards/metrics)
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

// Report types
export interface Report {
  $id: string; // Report ID (document ID)
  jobId: string; // Reference to JobChat
  jobTitle?: string; // Title of the job
  createdBy?: string; // User ID who created the report
  createdByName?: string; // Name of the user who created the report
  textEntries?: string; // JSON string array of text entries
  images?: string; // JSON string array of image objects
  messageCount?: number; // Number of messages in the report
  generationTime?: string; // Time taken to generate (e.g., "123ms")
  createdAt?: string; // ISO date string
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// Multi-tenant context types
export interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentTeam: TeamData | null;
  userOrganizations: Organization[];
  userTeams: TeamData[];
  loading: boolean;
  currentOrgPremiumTier: string;
  isCurrentOrgPremium: boolean;
  isHDCaptureEnabled: boolean;
  loadUserData: () => Promise<void>;
  refreshCurrentTeam: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  switchTeam: (teamOrId: TeamData | string) => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<Organization>;
  createTeam: (name: string, description?: string) => Promise<TeamData>;
  inviteToTeam: (teamId: string, email: string, roles: string[]) => Promise<void>;
  updateMembershipRole: (teamId: string, membershipId: string, roles: string[]) => Promise<void>;
  removeFromTeam: (teamId: string, membershipId: string) => Promise<void>;
}

// Role types
export type TeamRole = 'owner' | 'member';
export type OrganizationRole = 'owner' | 'member';

// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
}

// Universal Invite Types for Deep Link Flow
// https://workphotopro.com/invite/{shortId}

/**
 * Invite status in the state machine
 * pending → claimed → accepted
 * pending → declined | cancelled | revoked | expired
 */
export type InviteStatus = 
  | 'pending' 
  | 'claimed' 
  | 'accepted' 
  | 'expired'
  | 'declined'
  | 'cancelled'
  | 'revoked';

/**
 * Response from GET /api/invites/details
 * Contains invite metadata for display before authentication
 */
export interface UniversalInviteDetails {
  shortId: string;
  inviterName: string;
  inviterEmail?: string;
  organizationName: string;
  organizationId: string;
  teamName: string;
  teamId: string;
  role: TeamRole;
  status: InviteStatus;
  claimedBy?: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Response from POST /api/invites/claim
 * Reserves the invite for the authenticated user
 */
export interface ClaimInviteResponse {
  success: boolean;
  message: string;
  claimedAt: string;
  shortId: string;
}

/**
 * Response from POST /api/invites/accept
 * Finalizes membership creation (server-side)
 */
export interface AcceptInviteResponse {
  success: boolean;
  message: string;
  membershipId: string;
  teamId: string;
  organizationId: string;
  acceptedAt: string;
}

/**
 * Error codes for universal invite flow
 */
export type InviteErrorCode =
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ALREADY_CLAIMED'
  | 'ALREADY_MEMBER'
  | 'NOT_CLAIMED'
  | 'CLAIMED_BY_OTHER'
  | 'NETWORK_ERROR';

// Export User type (not exported above)
export type { User };