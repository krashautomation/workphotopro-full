# Team Memberships and Roles Fix

## Problem
1. When creating a new team, the membership was not being properly created in the database, which caused issues with filtering teams in "My Memberships" vs "My Teams" tabs. Additionally, the "My Memberships" tab was showing teams where the user was the owner, which is incorrect.
2. Teams were being displayed even after deletion from the database because `listTeams()` was querying Appwrite Teams API without checking if they exist in our database.

## Root Cause
1. When creating a team, `teamService.createTeam()` was not creating a membership record for the creator
2. The `listTeams()` method was not including membership role information
3. The filtering logic in `teams.tsx` was only checking organization ownership, not membership roles
4. The `listTeams()` method was returning ALL teams from Appwrite Teams API without checking if they exist in our database, causing deleted teams to still appear

## Solution

### 1. Fixed Team Creation (`lib/appwrite/teams.ts`)
Updated `createTeam()` to automatically create a membership record for the creator:

```typescript
async createTeam(name: string, orgId: string, description?: string, roles?: string[], userId?: string) {
  // ... existing code ...
  
  // Create membership for the creator as owner
  if (userId) {
    const membershipData = {
      userId: userId,
      teamId: appwriteTeam.$id,
      role: 'owner',
      invitedBy: userId,
      joinedAt: new Date().toISOString(),
      isActive: true
    };

    await databaseService.createDocument('memberships', membershipData);
  }
  
  // ... existing code ...
}
```

### 2. Updated Context (`context/OrganizationContext.tsx`)
Pass `userId` and role when creating teams:

```typescript
const team = await teamService.createTeam(
  name, 
  currentOrganization.$id, 
  description, 
  ['owner'], 
  user.$id
);
```

### 3. Enhanced List Teams (`lib/appwrite/teams.ts`)
Added `userId` parameter to `listTeams()` to fetch membership roles, and added database validation:

```typescript
async listTeams(userId?: string) {
  const appwriteTeams = await teams.list();
  
  const teamsWithData = await Promise.all(
    appwriteTeams.teams.map(async (team) => {
      try {
        // Get team data from our database
        const teamData = await databaseService.listDocuments('teams', [
          Query.equal('teamName', team.name)
        ]);
        
        // Only return teams that exist in our database
        if (!teamData.documents || teamData.documents.length === 0) {
          return null; // Skip teams not in our database
        }
        
        // Get membership role for the user
        let membershipRole = null;
        if (userId) {
          const memberships = await teams.listMemberships(team.$id);
          const currentMembership = memberships.memberships.find(
            (m: any) => m.userId === userId
          );
          
          if (currentMembership?.roles?.length > 0) {
            membershipRole = currentMembership.roles[0];
          }
        }
        
        return {
          ...team,
          teamData: teamData.documents[0] || null,
          membershipRole: membershipRole || null
        };
      } catch (error) {
        return null; // Skip teams with errors
      }
    })
  );
  
  // Filter out null values (teams not in our database or with errors)
  const validTeams = teamsWithData.filter(team => team !== null);
  
  return {
    teams: validTeams,
    total: validTeams.length
  };
}
```

### 4. Fixed Filtering Logic (`app/(jobs)/teams.tsx`)
Updated the "My Memberships" filter to check both role and organization ownership:

```typescript
const membershipsOnly = userTeams.filter((team) => {
  // Method 1: Check if user's role is "owner" in this team
  const isOwnerRole = (team as any).membershipRole === 'owner';
  
  // Method 2: Check if this team belongs to an organization owned by the user
  const isFromOwnedOrg = myOwnedTeams.some(ownedTeam => ownedTeam.$id === team.$id);
  
  // Only include if user is NOT an owner (by role or org ownership)
  return !isOwnerRole && !isFromOwnedOrg;
});
```

## Database Schema
Memberships table structure:
- `userId` (String, 36 chars, required) - References Appwrite Users
- `teamId` (String, 36 chars, required) - References Teams
- `role` (String, required) - User's role: "owner", "admin", "member"
- `invitedBy` (String, 36 chars) - User who invited this member
- `joinedAt` (String, ISO date) - When the member joined
- `isActive` (Boolean, default: true) - Whether the membership is active

## Result
- ✅ Teams are properly created with membership records
- ✅ "My Teams" tab shows only teams from organizations owned by the user
- ✅ "My Memberships" tab shows only teams where the user is a member (not owner)
- ✅ No overlap between the two tabs
- ✅ Role information is properly tracked in both Appwrite Teams and our database

## Appwrite Considerations
No changes needed in Appwrite dashboard. The fix works with existing Appwrite Teams API:
- Appwrite Teams automatically adds the creator as a member with "owner" role
- Our custom membership table provides additional role tracking and metadata
- Both systems work together to provide complete role information
