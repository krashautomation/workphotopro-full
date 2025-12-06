# Implementation Plan: "Allow Member to Share Job Reports" Permission

## Overview
This document outlines the implementation plan for adding a permission that allows team owners to control whether team members can share job reports.

## Current State
- The toggle exists in `app/(jobs)/manage-member.tsx` with label "Allow member to share job reports"
- The toggle defaults to `false` (off)
- The toggle is not connected to any backend functionality
- No permission checking is done when users attempt to share job reports

## Database Changes

### 1. Memberships Collection - Add New Field

**Collection ID:** `memberships`

**New Attribute to Add:**
- `canShareJobReports` (Boolean, default: false, optional)
  - Type: Boolean
  - Required: No (optional field)
  - Default: `false`
  - Description: Controls whether this member is allowed to share job reports

**Database Setup Steps:**
1. Go to Appwrite Console → Databases → Your Database → `memberships` collection
2. Click "Add Attribute"
3. Add `canShareJobReports` as Boolean
4. Set default value to `false`
5. Mark as optional (not required)

**Migration Note:**
- Existing memberships will need this field added
- Default value of `false` means existing members will not have permission until explicitly granted
- No data migration script needed (Appwrite will handle defaults)

## TypeScript Type Updates

### File: `utils/types.ts`

**Update `MembershipData` interface:**

```typescript
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
  canShareJobReports?: boolean; // NEW: Permission to share job reports (default: false)
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}
```

## Service Layer Updates

### File: `lib/appwrite/teams.ts`

**Functions to Update:**

1. **`createMembership`** - Add default value when creating new memberships
   - Add `canShareJobReports: false` to the membershipData object

2. **`updateMembershipRoles`** - Consider if we need a separate function or can extend this
   - **NEW FUNCTION NEEDED:** `updateMembershipPermission` or extend existing update logic

3. **`listMemberships`** - Already returns membershipData, should include the new field automatically

**New Function to Add:**

```typescript
/**
 * Update membership permission for sharing job reports
 */
async updateMembershipJobReportsPermission(
  teamId: string,
  membershipId: string,
  canShare: boolean
) {
  try {
    // Get the membership to find userId
    const membership = await teams.getMembership(teamId, membershipId);
    
    // Update our custom membership data
    const membershipData = await databaseService.listDocuments('memberships', [
      Query.equal('userId', membership.userId),
      Query.equal('teamId', teamId)
    ]);

    if (membershipData.documents.length > 0) {
      await databaseService.updateDocument('memberships', membershipData.documents[0].$id, {
        canShareJobReports: canShare
      });
    } else {
      throw new Error('Membership data not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Update membership permission error:', error);
    throw error;
  }
}
```

**Alternative Approach (Simpler):**
- Add a general `updateMembership` function that can update any membership field
- Or extend `updateMembershipRoles` to accept additional fields

## UI Component Updates

### File: `app/(jobs)/manage-member.tsx`

**Changes Needed:**

1. **Load Permission on Mount:**
   - Update `loadMemberData` to read `canShareJobReports` from `member.membershipData`
   - Set `sendJobReports` state from the loaded value (default to `false`)

2. **Save Permission on Toggle:**
   - Update the `Switch` `onValueChange` handler to:
     - Call `teamService.updateMembershipJobReportsPermission()`
     - Show loading state during save
     - Show success/error feedback
     - Reload member data after successful save

3. **Only Show Toggle for Owners:**
   - Already implemented: `{isCurrentUserOwner() && !isOwner() && ...}`
   - Keep this logic

**Implementation Details:**

```typescript
// In loadMemberData, after setting member:
if (foundMember?.membershipData?.canShareJobReports !== undefined) {
  setSendJobReports(foundMember.membershipData.canShareJobReports);
} else {
  setSendJobReports(false); // Default to false
}

// New handler for toggle change:
const handleToggleJobReports = async (value: boolean) => {
  if (!member || !actualTeamId || !member.$id) {
    Alert.alert('Error', 'Cannot update permission. Member information is missing.');
    return;
  }

  try {
    setSavingPermission(true);
    await teamService.updateMembershipJobReportsPermission(
      actualTeamId,
      member.$id,
      value
    );
    
    setSendJobReports(value);
    
    // Reload member data to ensure sync
    await loadMemberData();
    
    Alert.alert('Success', `Permission ${value ? 'granted' : 'revoked'}`);
  } catch (error: any) {
    console.error('Error updating permission:', error);
    Alert.alert('Error', error.message || 'Failed to update permission. Please try again.');
    // Revert toggle on error
    setSendJobReports(!value);
  } finally {
    setSavingPermission(false);
  }
};
```

## Permission Enforcement

### Files to Update for Permission Checking

1. **`app/(jobs)/share-job.tsx`**
   - Check permission before allowing report creation/sharing
   - Show appropriate error message if permission denied

2. **`app/(jobs)/[job].tsx`**
   - Check permission before showing share button/modal
   - Hide or disable share functionality if permission not granted

**Implementation Approach:**

Create a utility function or hook to check permission:

**New File: `hooks/useJobReportsPermission.ts`:**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';

export function useJobReportsPermission(teamId?: string) {
  const { user } = useAuth();
  const { currentTeam } = useOrganization();
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.$id) {
        setCanShare(false);
        setLoading(false);
        return;
      }

      const actualTeamId = teamId || currentTeam?.$id;
      if (!actualTeamId) {
        setCanShare(false);
        setLoading(false);
        return;
      }

      try {
        const memberships = await teamService.listMemberships(actualTeamId);
        const userMembership = memberships.memberships.find(
          (m: any) => m.userId === user.$id
        );

        if (userMembership) {
          // Owners always have permission
          const role = userMembership.membershipData?.role || userMembership.roles?.[0] || 'member';
          if (role.toLowerCase() === 'owner' || role.toLowerCase() === 'owners') {
            setCanShare(true);
          } else {
            // Check the permission flag
            setCanShare(userMembership.membershipData?.canShareJobReports === true);
          }
        } else {
          setCanShare(false);
        }
      } catch (error) {
        console.error('Error checking job reports permission:', error);
        setCanShare(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, teamId, currentTeam]);

  return { canShare, loading };
}
```

**Usage in `share-job.tsx`:**

```typescript
import { useJobReportsPermission } from '@/hooks/useJobReportsPermission';

// In component:
const { canShare, loading } = useJobReportsPermission(job?.teamId);

// Show error or disable if canShare is false
if (!canShare && !loading) {
  // Show message or disable share button
}
```

## Files Affected Summary

### Database
- ✅ `memberships` collection - Add `canShareJobReports` field

### TypeScript Types
- ✅ `utils/types.ts` - Update `MembershipData` interface

### Service Layer
- ✅ `lib/appwrite/teams.ts` - Add `updateMembershipJobReportsPermission` function
- ✅ `lib/appwrite/teams.ts` - Update `createMembership` to set default

### UI Components
- ✅ `app/(jobs)/manage-member.tsx` - Load, display, and save permission
- ✅ `app/(jobs)/share-job.tsx` - Check permission before allowing share
- ✅ `app/(jobs)/[job].tsx` - Check permission before showing share UI

### Hooks (New)
- ✅ `hooks/useJobReportsPermission.ts` - New hook for permission checking

## Implementation Order

1. **Phase 1: Database & Types**
   - Add `canShareJobReports` field to `memberships` collection in Appwrite
   - Update `MembershipData` interface in `utils/types.ts`

2. **Phase 2: Service Layer**
   - Add `updateMembershipJobReportsPermission` function to `teamService`
   - Update `createMembership` to set default value

3. **Phase 3: UI - Manage Member Screen**
   - Update `manage-member.tsx` to load and save permission
   - Add loading states and error handling

4. **Phase 4: Permission Enforcement**
   - Create `useJobReportsPermission` hook
   - Update `share-job.tsx` to check permission
   - Update `[job].tsx` to check permission before showing share UI

5. **Phase 5: Testing**
   - Test permission toggle as owner
   - Test permission enforcement for members
   - Test default behavior (new members default to false)

## Testing Checklist

- [ ] Owner can toggle permission for members
- [ ] Owner cannot toggle permission for themselves (or it's always true)
- [ ] Member with permission can share job reports
- [ ] Member without permission cannot share job reports
- [ ] New members default to `canShareJobReports: false`
- [ ] Permission persists after page refresh
- [ ] Error handling works correctly
- [ ] Loading states display properly

## Edge Cases to Handle

1. **Owner Permission:** Owners should always have permission (even if flag is false)
2. **Missing Membership Data:** Handle cases where membershipData doesn't exist
3. **Network Errors:** Gracefully handle API failures
4. **Concurrent Updates:** Handle race conditions when toggling permission
5. **Default Values:** Ensure new memberships get default value of `false`

## Notes

- The permission is stored per membership (per team), so a user can have different permissions in different teams
- Owners always have permission regardless of the flag value
- The permission defaults to `false` for security (opt-in model)
- Consider adding audit logging for permission changes in the future

