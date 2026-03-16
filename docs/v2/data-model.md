# Data Model

## Overview

WorkPhotoPro V2 uses a multi-tenant data model with hierarchical relationships: **Organizations → Teams → Jobs → Messages**.

## Core Entities

### Organization
Top-level tenant container.

```typescript
interface Organization {
  $id: string;
  name: string;
  ownerId: string;        // References User
  appwriteTeamId: string; // Appwrite Team ID
  logoUrl?: string;
  description?: string;
  premiumTier?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Team
Teams belong to organizations.

```typescript
interface Team {
  $id: string;
  name: string;
  orgId: string;          // References Organization
  appwriteTeamId: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### JobChat
Jobs are chat rooms with associated metadata.

```typescript
interface JobChat {
  $id: string;
  title: string;
  description: string;
  teamId: string;         // References Team
  orgId: string;          // References Organization
  status: 'active' | 'completed' | 'archived';
  createdByUserId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;     // Soft delete
}
```

### Message
Chat messages within jobs.

```typescript
interface Message {
  $id: string;
  jobchatId: string;      // References JobChat
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'task' | 'duty';
  content: string;
  imageUrls?: string[];
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  location?: { lat: number; lng: number };
  tasks?: Task[];
  duties?: Duty[];
  senderId: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Appwrite Collections

### Core Collections

| Collection | ID | Purpose | Key Relationships |
|------------|-----|---------|-------------------|
| `jobchat` | jobchat | Job/chat rooms | `teamId` → teams, `orgId` → organizations |
| `messages` | messages | Chat messages | `jobchatId` → jobchat |
| `organizations` | organizations | Multi-tenant orgs | `ownerId` → users |
| `teams` | teams | Team data | `orgId` → organizations |
| `memberships` | memberships | Team memberships | `userId` → users, `teamId` → teams |

### Feature Collections

| Collection | Purpose | Key Attributes |
|------------|---------|----------------|
| `tag_templates` | Job tag definitions | `name`, `color`, `orgId`, `createdBy` |
| `job_tag_assignments` | Tag-to-job mappings | `jobchatId`, `tagId` |
| `notifications` | In-app notifications | `userId`, `type`, `read` |
| `push_tokens` | FCM/Expo tokens | `userId`, `token`, `platform` |
| `notification_preferences` | User notification settings | `userId`, `pushEnabled`, `types` |
| `subscriptions` | RevenueCat subscriptions | `userId`, `orgId`, `status`, `expiresAt` |
| `user_preferences` | User settings | `userId`, `hdCapture`, `showTimestamps` |
| `contacts` | Phone contacts | `userId`, `name`, `phoneHash` |
| `invitations` | Universal invite records | `shortId`, `teamId`, `status`, `tokenHash` |
| `invite_sessions` | Install-safe sessions | `deviceId`, `shortId`, `status`, `expiresAt` |

## Invite System Collections

### invitations

Stores universal invite links with secure token hashing.

```typescript
interface Invitation {
  $id: string;
  shortId: string;        // Base62-encoded short ID (12 chars)
  teamId: string;         // References Team
  orgId: string;          // References Organization
  invitedBy: string;      // User ID who created invite
  invitedEmail: string;   // Email of invited user (required)
  invitedName?: string;   // Optional name of invited user
  role: 'owner' | 'admin' | 'member';
  tokenHash: string;      // SHA-256 hash of token (camelCase)
  status: 'pending' | 'claimed' | 'accepted' | 'expired' | 'declined' | 'cancelled' | 'revoked';
  claimedBy?: string;     // User ID who claimed
  claimedByUserId?: string; // Same as claimedBy (backend compatibility)
  sentAt: string;         // When invitation email was sent
  expiresAt: string;      // 7 days from creation
  acceptedAt?: string;    // When invitation was accepted
  acceptedByUserId?: string; // Who accepted the invitation
  reminderSent?: boolean; // Whether reminder email was sent
  createdAt: string;
  updatedAt: string;
}
```

### invite_sessions

Enables install-safe invite resume for users who click links before installing the app.

```typescript
interface InviteSession {
  $id: string;
  sessionId: string;      // Unique session identifier (UUID)
  deviceId: string;       // Device fingerprint (UUID from mobile app)
  shortId: string;        // References Invitation
  source: 'email' | 'qr' | 'share' | 'sms' | 'unknown'; // How user clicked
  status: 'pending' | 'claimed' | 'accepted' | 'expired';
  ip: string;             // Client IP address
  userAgent: string;      // Browser/app user agent
  inviterName: string;    // Cached for display
  organizationName: string;
  teamName: string;
  email?: string;         // If collected from web
  claimedByUserId?: string; // User ID who claimed (renamed from claimedBy)
  claimedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  expiresAt: string;      // 7 days from creation
}
```

**API Endpoints:**
- `POST /api/invites/session` - Create session (web only, no auth required)
- `GET /api/invites/session?deviceId={deviceId}` - Check for pending sessions (no auth required)

**Indexes:**
- `deviceId` + `status` + `createdAt` (for session lookups)
- `shortId` + `status` (for invite status checks)
- `expiresAt` (for cleanup jobs)

## Relationships

```
Organization (1)
    └── Teams (N)
            └── JobChats (N)
                    └── Messages (N)

User (N) ←── Membership (N) ──→ Team (N)
```

## Security Model

### Collection Permissions
- **All collections**: `role:users` (authenticated users only)
- **Row-level security**: Filtered by `orgId` and `teamId`
- **Ownership checks**: Validated in service layer

See [Permissions](./permissions.md) for access control details and [Security Audit](./security-audit.md) for implementation verification.

## Storage Buckets

| Bucket | Purpose | File Types |
|--------|---------|------------|
| Configured bucket | All uploads | Images, videos, documents, avatars |

---

*Last Updated: March 2026*
