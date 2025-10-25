# Database Collections Setup for Multi-Tenancy

This guide will help you create the necessary Appwrite database collections for the WorkPhotoPro multi-tenant architecture.

## Collections to Create

### 1. Organizations Collection

**Collection ID:** `organizations`

**Attributes:**
- `orgName` (String, 128 chars, required)
- `ownerId` (String, 36 chars, required) - References Appwrite Users
- `description` (String, 500 chars, optional)
- `isActive` (Boolean, default: true)
- `settings` (String, JSON, optional) - Organization-specific settings

**Permissions:**
- Create: `users` (any authenticated user can create an organization)
- Read: `Role.team(teamId)` (team members can read)
- Update: `users` (only owner can update)
- Delete: `users` (only owner can delete)

**Indexes:**
- `ownerId` (key: `ownerId`, type: `key`, attributes: `ownerId`)

### 2. Teams Collection

**Collection ID:** `teams`

**Attributes:**
- `teamName` (String, 128 chars, required)
- `orgId` (String, 36 chars, required) - References Organizations
- `description` (String, 500 chars, optional)
- `isActive` (Boolean, default: true)
- `settings` (String, JSON, optional) - Team-specific settings

**Permissions:**
- Create: `Role.team(teamId)` (organization members can create teams)
- Read: `Role.team(teamId)` (team members can read)
- Update: `Role.team(teamId)` (team members can update)
- Delete: `Role.team(teamId)` (team members can delete)

**Indexes:**
- `orgId` (key: `orgId`, type: `key`, attributes: `orgId`)

### 3. Memberships Collection

**Collection ID:** `memberships`

**Attributes:**
- `userId` (String, 36 chars, required) - References Appwrite Users
- `teamId` (String, 36 chars, required) - References Teams
- `role` (String, 50 chars, required) - e.g., "owner", "admin", "member"
- `invitedBy` (String, 36 chars, required) - User who invited this member
- `joinedAt` (DateTime, required)
- `isActive` (Boolean, default: true)

**Permissions:**
- Create: `Role.team(teamId)` (team members can invite)
- Read: `Role.team(teamId)` (team members can read)
- Update: `Role.team(teamId)` (team members can update roles)
- Delete: `Role.team(teamId)` (team members can remove members)

**Indexes:**
- `userId` (key: `userId`, type: `key`, attributes: `userId`)
- `teamId` (key: `teamId`, type: `key`, attributes: `teamId`)
- `userId_teamId` (key: `userId_teamId`, type: `key`, attributes: `userId`, `teamId`)

### 4. JobChats Collection (Update Existing)

**Collection ID:** `jobchats` (already exists, needs updates)

**New Attributes to Add:**
- `teamId` (String, 36 chars, required) - References Teams
- `orgId` (String, 36 chars, required) - References Organizations
- `createdBy` (String, 36 chars, required) - User who created the job
- `status` (String, 20 chars, default: "active") - "active", "completed", "archived"

**Updated Permissions:**
- Create: `Role.team(teamId)` (team members can create jobs)
- Read: `Role.team(teamId)` (team members can read)
- Update: `Role.team(teamId)` (team members can update)
- Delete: `Role.team(teamId)` (team members can delete)

**New Indexes:**
- `teamId` (key: `teamId`, type: `key`, attributes: `teamId`)
- `orgId` (key: `orgId`, type: `key`, attributes: `orgId`)

### 5. Messages Collection (Update Existing)

**Collection ID:** `messages` (already exists, needs updates)

**New Attributes to Add:**
- `userId` (String, 36 chars, required) - User who posted the message
- `teamId` (String, 36 chars, required) - References Teams
- `orgId` (String, 36 chars, required) - References Organizations

**Updated Permissions:**
- Create: `Role.team(teamId)` (team members can post messages)
- Read: `Role.team(teamId)` (team members can read)
- Update: `Role.team(teamId)` (team members can update their own messages)
- Delete: `Role.team(teamId)` (team members can delete their own messages)

**New Indexes:**
- `teamId` (key: `teamId`, type: `key`, attributes: `teamId`)
- `orgId` (key: `orgId`, type: `key`, attributes: `orgId`)
- `userId` (key: `userId`, type: `key`, attributes: `userId`)

## Setup Instructions

### Option 1: Using Appwrite Console (Recommended)

1. Go to your Appwrite Console
2. Navigate to **Databases** → Your Database
3. For each collection above:
   - Click **Create Collection**
   - Enter the Collection ID
   - Add each attribute with the specified type and constraints
   - Set up permissions using the Role syntax
   - Create the specified indexes

### Option 2: Using Appwrite CLI

```bash
# Install Appwrite CLI if not already installed
npm install -g appwrite-cli

# Login to Appwrite
appwrite login

# Create collections (run these commands one by one)
appwrite databases createCollection --databaseId YOUR_DATABASE_ID --collectionId organizations --name "Organizations"
appwrite databases createCollection --databaseId YOUR_DATABASE_ID --collectionId teams --name "Teams"
appwrite databases createCollection --databaseId YOUR_DATABASE_ID --collectionId memberships --name "Memberships"

# Add attributes to each collection
# (This would require individual attribute creation commands)
```

## Important Notes

1. **Team Permissions**: We're using `Role.team(teamId)` for permissions, which means only team members can access resources.

2. **Data Isolation**: Each organization's data is isolated through the `orgId` field and team-based permissions.

3. **Existing Data**: You'll need to migrate existing job chats and messages to include the new team/organization fields.

4. **Appwrite Teams**: The Appwrite Teams feature will handle the actual team membership management, while our database collections store additional metadata.

## Next Steps

After creating these collections:
1. Update your TypeScript types
2. Enhance the team service
3. Create organization context
4. Update existing services to work with teams
5. Build the UI components

Would you like me to proceed with updating the TypeScript types while you set up the database collections?
