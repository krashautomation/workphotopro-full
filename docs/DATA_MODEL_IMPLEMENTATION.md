# Data Model Implementation with Appwrite

## Overview
This document outlines the implementation of the Work Photo Pro data model using Appwrite as the backend service.

## Data Model Analysis

### Original Data Model Structure
The designed data model follows a multi-tenant architecture with the following hierarchy:
- **Organizations** → **Teams** → **JobChats** → **Messages**
- **Users** can belong to multiple teams across different organizations
- **Memberships** table handles the many-to-many relationship between Users and Teams

### Key Strengths of the Design
1. **Clear Hierarchy** - Organization → Teams → JobChats creates logical business structure
2. **Proper Normalization** - Avoids data duplication using foreign keys
3. **Multi-tenancy Design** - Each organization is isolated through team structure
4. **Scalable Architecture** - Supports users belonging to multiple teams

## Appwrite Implementation

### TypeScript Interfaces (types/index.ts)

```typescript
// Organization/Team types (mapped to Appwrite)
export interface Organization {
  $id: string;
  name: string;
  ownerId: string;
  appwriteTeamId: string; // Reference to Appwrite Team
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  $id: string;
  name: string;
  orgId: string; // Reference to Organization
  appwriteTeamId: string; // Reference to Appwrite Team
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  $id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

// JobChat types (updated to match data model)
export interface JobChat {
  $id: string;
  title: string;
  description: string;
  teamId: string; // Reference to Team
  createdByUserId: string; // User who created the chat
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  $id: string;
  jobChatId: string; // Reference to JobChat
  text: string;
  image?: string; // Appwrite Storage file ID
  postedByUserId: string; // User who posted the message
  createdAt: string;
  updatedAt: string;
}
```

### Database Services (lib/appwrite/database.ts)

The implementation includes comprehensive service layers for each entity:

1. **organizationService** - CRUD operations for organizations
2. **teamService** - CRUD operations for teams
3. **membershipService** - CRUD operations for team memberships
4. **jobChatService** - CRUD operations for job chats
5. **messageService** - CRUD operations for messages
6. **appwriteTeamService** - Integration with Appwrite's native Teams API

### Appwrite Collections Required

Based on the TypeScript interfaces, create these collections in Appwrite Console:

#### 1. Organizations Collection
- **Collection ID:** `organizations`
- **Attributes:**
  - `$id` (String, Auto-generated)
  - `name` (String, Required)
  - `ownerId` (String, Required)
  - `appwriteTeamId` (String, Required)
  - `createdAt` (String, Required)
  - `updatedAt` (String, Required)

#### 2. Teams Collection
- **Collection ID:** `teams`
- **Attributes:**
  - `$id` (String, Auto-generated)
  - `name` (String, Required)
  - `orgId` (String, Required)
  - `appwriteTeamId` (String, Required)
  - `createdAt` (String, Required)
  - `updatedAt` (String, Required)

#### 3. Memberships Collection
- **Collection ID:** `memberships`
- **Attributes:**
  - `$id` (String, Auto-generated)
  - `userId` (String, Required)
  - `teamId` (String, Required)
  - `role` (String, Required) - Enum: `owner`, `admin`, `member`, `viewer`
  - `joinedAt` (String, Required)

#### 4. JobChats Collection
- **Collection ID:** `jobchats`
- **Attributes:**
  - `$id` (String, Auto-generated)
  - `title` (String, Required)
  - `description` (String, Required)
  - `teamId` (String, Required)
  - `createdByUserId` (String, Required)
  - `createdAt` (String, Required)
  - `updatedAt` (String, Required)

#### 5. Messages Collection
- **Collection ID:** `messages`
- **Attributes:**
  - `$id` (String, Auto-generated)
  - `jobChatId` (String, Required)
  - `text` (String, Required)
  - `image` (String, Optional)
  - `postedByUserId` (String, Required)
  - `createdAt` (String, Required)
  - `updatedAt` (String, Required)

## Key Appwrite Advantages

1. **Native Teams Support** - Appwrite has built-in Teams functionality that maps perfectly to the Organization/Team structure
2. **Built-in Authentication** - User management is handled automatically
3. **Real-time Capabilities** - Perfect for chat/messaging features
4. **File Storage** - Built-in storage for images in messages
5. **Security & Permissions** - Team-based access control out of the box

## Implementation Strategy

### Data Model Mapping
- **Organizations** → Appwrite Teams + custom `organizations` collection
- **Teams** → Appwrite Teams + custom `teams` collection
- **Memberships** → Appwrite Team Memberships + custom `memberships` collection
- **Users** → Appwrite Auth (automatic)
- **JobChats** → Custom `jobchats` collection
- **Messages** → Custom `messages` collection

### Next Steps
1. Create Collections in Appwrite Console with proper attributes and relationships
2. Set up Permissions using Appwrite's team-based security
3. Use the provided Services to interact with data
4. Leverage Real-time for live chat functionality

## Conclusion

The data model translates beautifully to Appwrite's architecture. The TypeScript interfaces serve as the perfect blueprint for creating Appwrite collections, ensuring type safety and consistency throughout the application.

The implementation provides a complete foundation for building a multi-tenant Work Photo Pro application with proper team-based access control, real-time messaging, and file storage capabilities.
