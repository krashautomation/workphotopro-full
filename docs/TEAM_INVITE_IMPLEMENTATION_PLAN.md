# Team Invite Implementation Plan

## Overview
This document outlines the implementation plan for the team invite feature that allows users to invite others to join their teams via QR codes and shareable links.

## Flow Overview

### Inviter Flow (Current User)
1. User clicks "Team" in bottom navigation on `(jobs)/index.tsx`
2. Navigates to `(jobs)/invite.tsx`
3. Invite page shows:
   - Current team name and member count
   - QR code containing invite link
   - Shareable link
   - "Share link" button

### Invitee Flow (New User)
1. Invitee receives email with invitation link (sent by Appwrite)
2. Clicks the link (opens app if installed, or web signup if not)
3. If new user: Sign up process → Create account → Accept invitation
4. If existing user: Sign in → Accept invitation
5. User becomes "member" role on team

## Technical Implementation

### 1. Update Navigation (index.tsx)
**File**: `app/(jobs)/index.tsx`
- Change the "Team" button to navigate to `invite.tsx` instead of `team.tsx`

```typescript
<TouchableOpacity 
  style={styles.menuButton}
  onPress={() => router.push('/(jobs)/invite')}
>
  <IconSymbol
    name="person.3"
    size={24}
    color={colors.textSecondary}
  />
  <Text style={styles.menuButtonText}>Team</Text>
</TouchableOpacity>
```

### 2. Invite Link Generation
**File**: `lib/appwrite/teams.ts`

We'll add a new method to generate invite links. The invite link will be a deep link that:
- Contains the team ID
- Can be scanned as QR code
- Can be shared via messaging/email

The deep link format: `workphotopro://team-invite?teamId=TEAM_ID`

### 3. Update Invite Page
**File**: `app/(jobs)/invite.tsx`

Changes needed:
1. Connect to actual team data from `OrganizationContext`
2. Generate real invite link with team ID
3. Fetch current member count
4. Handle invitation creation through Appwrite Teams API
5. Generate QR code with the actual invite link

Key functionality:
```typescript
// Generate invite link
const inviteLink = `workphotopro://team-invite?teamId=${currentTeam.$id}`;

// Create membership invitation (via Appwrite Teams)
const membership = await teamService.createMembership(
  currentTeam.$id,
  email, // Optional - can invite via link without email
  ['member'], // Role: member
  inviteUrl,
  user.$id // Invited by
);
```

### 4. Handle Deep Link Acceptance
**New File**: `app/(auth)/accept-invite.tsx`

This screen handles:
- Extracting team ID from deep link
- Checking if user is authenticated
- If not authenticated: Redirect to sign up → auto-accept on completion
- If authenticated: Accept invitation immediately

### 5. Appwrite Team Permissions Setup

According to the docs, we need to set permissions at the resource level:

**Database Collections** - Each collection (jobs, messages, etc.) should have:
```typescript
[
  Permission.read(Role.team(teamId)),     // Team members can read
  Permission.update(Role.team(teamId)),   // Team members can update
  Permission.delete(Role.team(teamId, "owner")) // Only owners can delete
]
```

**Key Points**:
- New members get "member" role by default
- Members can read/update jobs and messages
- Only owners/admins can delete or manage members

### 6. Deep Link Configuration

We need to configure the app to handle deep links:
- Configure in `app.json` (Expo)
- Handle in the app when it opens via deep link
- Extract team ID from URL parameters

## Implementation Steps

### Step 1: Update Navigation
- [ ] Change Team button to navigate to invite.tsx

### Step 2: Connect Invite Page to Real Data
- [ ] Use `OrganizationContext` to get current team
- [ ] Fetch actual team member count
- [ ] Generate real invite link with team ID

### Step 3: Generate and Display QR Code
- [ ] Generate invite link: `workphotopro://team-invite?teamId={teamId}`
- [ ] Display QR code with link
- [ ] Update share functionality to share actual link

### Step 4: Handle Invitation Acceptance
- [ ] Create accept-invite.tsx screen
- [ ] Parse deep link parameters
- [ ] Check authentication status
- [ ] Accept invitation using Appwrite Teams API

### Step 5: Test Full Flow
- [ ] Generate invitation from app
- [ ] Share link/QR code
- [ ] Click link from different device
- [ ] Sign up/sign in as new user
- [ ] Verify team membership is created

## Important Considerations

### User Experience
1. **Existing Users**: If they click the invite link, they should sign in and automatically join the team
2. **New Users**: Sign up → Verify email → Accept invitation in flow
3. **QR Code**: Can be scanned to open invite link directly

### Security
- Invite links should be time-limited (Appwrite handles this)
- Only team owners/admins can generate invites
- Validate team membership before allowing access to resources

### Appwrite Permissions
According to [the docs](https://appwrite.io/docs/advanced/platform/permissions#example-2-team-roles):
- Team members get `Role.team(teamId)` - can read/update
- Owners get `Role.team(teamId, "owner")` - can delete/manage
- Permissions are set per resource (database rows, files, etc.)

## Next Steps

1. Start with navigation update
2. Connect invite page to real team data
3. Implement QR code generation
4. Create invitation acceptance flow
5. Test complete user journey
6. Add error handling and edge cases
