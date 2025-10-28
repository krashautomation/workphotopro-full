# Team Roles in WorkPhotoPro V2

## Where Roles Are Stored

### Organizations
- **Purpose**: Organizations represent companies/workplaces
- **Owner Field**: `ownerId` (references the Appwrite User who created/owns the organization)
- **Roles**: No roles at the organization level - just owner tracking

### Teams (Appwrite Teams)
- **Purpose**: Teams are work groups within an organization
- **Owner**: Appwrite Teams automatically adds the creator as "owner"
- **Roles**: Defined in Appwrite Teams roles array
  - Common roles: `["owner"]`, `["admin"]`, `["member"]`
  - Each team can have custom roles

### Team Memberships
- **Storage**: Two places
  1. **Appwrite Teams Memberships** (primary)
     - Contains: userId, teamId, roles[], invited, joined
  2. **Database Memberships Collection** (our custom data)
     - Contains: userId, teamId, role (primary role), invitedBy, joinedAt

## Role Hierarchy

```
Organization Owner (ownerId)
    └── Creates Teams
        └── Team Owner (roles: ["owner"])
            └── Can invite members
                ├── Admin (roles: ["admin"])
                └── Member (roles: ["member"])
```

## Current Implementation

### My Teams Tab
- Shows teams from organizations where `currentUser.id === organization.ownerId`
- These are teams you OWN through organization ownership

### My Memberships Tab
- Shows teams from organizations where `currentUser.id !== organization.ownerId`
- These are teams you JOINED as a member (not the owner)

## Database Structure

```typescript
Organization {
  $id: string;
  orgName: string;
  ownerId: string;  // ✅ Organization owner reference
  description?: string;
  isActive: boolean;
}

Team (Appwrite Teams) {
  $id: string;
  name: string;
  roles: string[];  // ✅ Team-level roles defined here
}

Membership {
  $id: string;
  userId: string;
  teamId: string;
  roles: string[];  // ✅ User's role in this team
  // ... other fields
}
```

## Answer to Question

**Where should roles be stored?**

✅ **In Teams** (Appwrite Teams) - This is where roles are defined and managed
- Appwrite Teams automatically gives the creator the "owner" role
- Roles are stored in the team's membership records
- Team roles: `["owner"]`, `["admin"]`, `["member"]`, etc.

❌ **NOT in Organizations** - Organizations only track the owner (`ownerId`), not roles
- Organizations don't have roles because they're just containers
- The `ownerId` field determines organization ownership

## Future Enhancement

If you need organization-level roles (e.g., multiple co-owners), you could add:
- An `organizationMembers` collection with userId and role
- But currently, organizations only have a single owner
