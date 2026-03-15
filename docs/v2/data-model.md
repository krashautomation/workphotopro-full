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
