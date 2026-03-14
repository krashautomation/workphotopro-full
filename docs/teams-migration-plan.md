# Appwrite Teams to Custom Collections Migration Plan

## Overview

This document outlines the migration strategy to remove Appwrite Teams SDK dependency and replace it with fully custom database collections. The migration will transition from a hybrid system (Appwrite Teams + custom database) to a pure custom database implementation.

**Key Improvements from Review:**
- ✅ Timeline compressed from 6 weeks to 2-3 weeks
- ✅ Removed `totalMembers` denormalized field (compute on demand)
- ✅ Simplified schema: invitation logic only in `invitations` collection
- ✅ Fixed N+1 query pattern in `listTeams()`
- ✅ Added security: token hashing and orgId verification
- ✅ Simplified rollout: internal → beta → production
- ✅ Feature flag provides instant rollback

**Architecture Decision:**
This migration aligns with SaaS best practices (Slack, Discord pattern) where teams/memberships are core domain concepts managed entirely within the application's database, not delegated to external auth systems.

## Current State Analysis

### Appwrite Teams APIs Currently in Use

| API Method | Line(s) | Purpose | Call Count |
|------------|---------|---------|------------|
| `teams.create()` | 128 | Create new team | 1 |
| `teams.get()` | 178, 434, 596, 684, 952 | Retrieve team by ID | 5 |
| `teams.list()` | 252, 332, 700 | List all accessible teams | 3 |
| `teams.updateName()` | 383, 487 | Update team name | 2 |
| `teams.delete()` | 688 | Delete team | 1 |
| `teams.createMembership()` | 785 | Invite user to team | 1 |
| `teams.listMemberships()` | 962 | List team members | 1 |
| `teams.updateMembership()` | 1234 | Update member roles | 1 |
| `teams.getMembership()` | 1265, 1294, 1323 | Get specific membership | 3 |
| `teams.deleteMembership()` | 1297 | Remove member from team | 1 |
| `teams.updateMembershipStatus()` | 1340 | Accept invitation | 1 |

**Total: 20 API calls across teams.ts**

### Existing Custom Collections

The following collections already exist and can be extended:

1. **teams** - Team metadata
2. **memberships** - Team membership records
3. **organizations** - Organization data
4. **invitations** - ⚠️ **NEW: Needs to be created**

---

## Feature Groups

### Group 1: Team CRUD Operations

#### Current Implementation
```typescript
// Create team
const appwriteTeam = await teams.create(ID.unique(), name, roles);

// Get team
const appwriteTeam = await teams.get(teamId);

// List teams
const appwriteTeams = await teams.list();

// Update team name
const appwriteTeam = await teams.updateName(teamId, name);

// Delete team
await teams.delete(teamId);
```

#### Migration Strategy

**Database Schema Updates:**

Extend the `teams` collection with additional fields:

```typescript
interface TeamData {
  $id: string;
  teamName: string;
  // REMOVE: appwriteTeamId: string; // No longer needed
  orgId: string;
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  phone?: string;
  teamPhotoUrl?: string;
  isActive: boolean;
  settings?: string;
  
  // NEW FIELDS for complete migration:
  createdBy: string;        // User ID who created the team
  $createdAt: string;
  $updatedAt: string;
}

// Helper function to count members (computed, not stored)
async function getTeamMemberCount(teamId: string): Promise<number> {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);
  return memberships.documents.length;
}
```

**Replacement Implementation:**

```typescript
// Create team - PURE DATABASE
async createTeam(name: string, orgId: string, description?: string, userId?: string) {
  const teamData = {
    teamName: name,
    orgId: orgId,
    description: description || '',
    isActive: true,
    settings: '{}',
    createdBy: userId || '',
  };

  const teamDoc = await databaseService.createDocument('teams', teamData);

  // Create owner membership
  if (userId) {
    await databaseService.createDocument('memberships', {
      userId: userId,
      teamId: teamDoc.$id,
      role: 'owner',
      invitedBy: userId,
      joinedAt: new Date().toISOString(),
      isActive: true
    });
  }
  
  return teamDoc;
}

// Get team - PURE DATABASE
async getTeam(teamId: string) {
  return await databaseService.getDocument('teams', teamId);
}

// List teams - PURE DATABASE
async listTeams(userId?: string) {
  // Get all teams where user is a member
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('isActive', true)
  ]);

  const teamIds = memberships.documents.map(m => m.teamId);

  if (teamIds.length === 0) {
    return { teams: [], total: 0 };
  }

  // Get all teams in a single query (avoids N+1 problem)
  const teamsResult = await databaseService.listDocuments('teams', [
    Query.equal('$id', teamIds),
    Query.equal('isActive', true)
  ]);

  return {
    teams: teamsResult.documents,
    total: teamsResult.documents.length
  };
}

// Update team name - PURE DATABASE
async updateTeam(teamId: string, name: string) {
  return await databaseService.updateDocument('teams', teamId, {
    teamName: name,
    $updatedAt: new Date().toISOString()
  });
}

// Delete team - PURE DATABASE (soft delete)
async deleteTeam(teamId: string) {
  // Soft delete memberships
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', teamId)
  ]);
  
  for (const membership of memberships.documents) {
    await databaseService.updateDocument('memberships', membership.$id, {
      isActive: false
    });
  }
  
  // Soft delete team
  return await databaseService.updateDocument('teams', teamId, {
    isActive: false
  });
}
```

---

### Group 2: Membership Management

#### Current Implementation
```typescript
// Create membership (invite)
const appwriteMembership = await teams.createMembership(teamId, roles, email, undefined, undefined, url);

// List memberships
const appwriteMemberships = await teams.listMemberships(teamId);

// Update membership roles
const appwriteMembership = await teams.updateMembership(teamId, membershipId, roles);

// Delete membership
await teams.deleteMembership(teamId, membershipId);
```

#### Migration Strategy

**Database Schema Updates:**

Extend the `memberships` collection:

```typescript
interface MembershipData {
  $id: string;
  userId: string;
  teamId: string;
  role: string;  // 'owner', 'admin', 'member'
  userEmail: string;
  userName?: string;
  profilePicture?: string;
  invitedBy: string;
  joinedAt: string;
  isActive: boolean;
  canShareJobReports?: boolean;
  $createdAt: string;
  $updatedAt: string;
}
```

**NEW Collection: invitations**

```typescript
interface Invitation {
  $id: string;
  teamId: string;
  orgId: string;
  invitedBy: string;        // User ID who sent invitation
  invitedEmail: string;     // Email address invited
  invitedName?: string;     // Optional name
  role: string;            // Role being offered
  tokenHash: string;       // Hashed token (never store raw token)
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  sentAt: string;
  expiresAt: string;       // 7 days from sentAt
  acceptedAt?: string;
  acceptedByUserId?: string;
  $createdAt: string;
  $updatedAt: string;
}
```

**Replacement Implementation:**

```typescript
// Create membership (send invitation)
async createMembership(
  teamId: string,
  orgId: string,  // ADDED: orgId for security verification
  email: string,
  roles: string[],
  url: string,  // Deep link URL
  invitedBy: string
) {
  // Check if user already has pending invitation
  const existingInvitations = await databaseService.listDocuments('invitations', [
    Query.equal('teamId', teamId),
    Query.equal('invitedEmail', email),
    Query.equal('status', 'pending')
  ]);

  if (existingInvitations.documents.length > 0) {
    throw new Error('User already has a pending invitation to this team');
  }

  // Generate unique invitation token
  const token = generateSecureToken();
  const tokenHash = await hashToken(token); // Hash for storage
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  // Create invitation record
  const invitation = await databaseService.createDocument('invitations', {
    teamId: teamId,
    orgId: orgId,  // Store for security verification
    invitedBy: invitedBy,
    invitedEmail: email,
    role: roles[0] || 'member',
    tokenHash: tokenHash,
    status: 'pending',
    sentAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  });

  // Send invitation email (via backend/cloud function)
  await sendInvitationEmail({
    to: email,
    teamName: team.teamName,
    invitedByName: inviterName,
    invitationLink: `${url}?token=${token}`,  // Send raw token in email only
    expiresAt: expiresAt
  });

  return invitation;
}

// Accept invitation
async acceptInvitation(token: string, userId: string, orgId: string) {
  // Hash the token for lookup
  const tokenHash = await hashToken(token);

  // Find invitation by token hash
  const invitations = await databaseService.listDocuments('invitations', [
    Query.equal('tokenHash', tokenHash),
    Query.equal('status', 'pending')
  ]);

  if (invitations.documents.length === 0) {
    throw new Error('Invalid or expired invitation');
  }

  const invitation = invitations.documents[0];

  // SECURITY: Verify orgId matches
  if (invitation.orgId !== orgId) {
    throw new Error('Invitation organization mismatch');
  }

  // Check expiration
  if (new Date(invitation.expiresAt) < new Date()) {
    // Mark as expired
    await databaseService.updateDocument('invitations', invitation.$id, {
      status: 'expired'
    });
    throw new Error('Invitation has expired');
  }

  // Get current user
  const { account } = await import('./client');
  const user = await account.get();

  // Verify email matches
  if (user.email !== invitation.invitedEmail) {
    throw new Error('Invitation email does not match your account email');
  }

  // Create membership
  await databaseService.createDocument('memberships', {
    userId: userId,
    teamId: invitation.teamId,
    role: invitation.role,
    userEmail: user.email,
    userName: user.name,
    invitedBy: invitation.invitedBy,
    joinedAt: new Date().toISOString(),
    isActive: true
  });

  // Update invitation status
  await databaseService.updateDocument('invitations', invitation.$id, {
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
    acceptedByUserId: userId
  });

  return { success: true };
}

// List memberships
async listMemberships(teamId: string) {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);

  // Enrich with user info if available
  const enrichedMemberships = await Promise.all(
    memberships.documents.map(async (membership) => {
      // Try to get latest user info
      try {
        const userInfo = await this.getUserInfo(membership.userId);
        return {
          ...membership,
          userName: userInfo?.name || membership.userName,
          profilePicture: userInfo?.profilePicture || membership.profilePicture
        };
      } catch {
        return membership;
      }
    })
  );

  return {
    memberships: enrichedMemberships,
    total: enrichedMemberships.length
  };
}

// Update membership roles
async updateMembershipRoles(
  teamId: string,
  membershipId: string,
  roles: string[]
) {
  return await databaseService.updateDocument('memberships', membershipId, {
    role: roles[0] || 'member',
    $updatedAt: new Date().toISOString()
  });
}

// Delete membership (remove from team)
async deleteMembership(teamId: string, membershipId: string) {
  // Soft delete
  await databaseService.updateDocument('memberships', membershipId, {
    isActive: false,
    $updatedAt: new Date().toISOString()
  });

  return { success: true };
}
```

---

### Group 3: Invitation System

#### Current Implementation
Appwrite Teams handles invitation emails and token management automatically.

#### Migration Strategy

**New Backend Requirements:**

1. **Cloud Function: `sendInvitationEmail`**
   - Triggered when invitation is created
   - Sends email with invitation link
   - Supports resending invitations

2. **Deep Link Handling:**
   - Update `accept-invite.tsx` screen
   - Handle token parameter from URL
   - Call new `acceptInvitation()` function

**Implementation Details:**

```typescript
// Cloud Function: sendInvitationEmail
// File: functions/sendInvitationEmail/main.js

export default async ({ req, res, log, error }) => {
  try {
    const { to, teamName, invitedByName, invitationLink, expiresAt } = req.body;
    
    // Send email using your email provider (SendGrid, AWS SES, etc.)
    await sendEmail({
      to,
      subject: `${invitedByName} invited you to join ${teamName} on WorkPhotoPro`,
      html: generateInvitationEmail({
        teamName,
        invitedByName,
        invitationLink,
        expiresAt
      })
    });
    
    return res.json({ success: true });
  } catch (err) {
    error('Failed to send invitation email:', err);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

## Step-by-Step Migration Checklist

**Timeline: 2-3 Weeks**

### Phase 1: Infrastructure & Schema (Days 1-2)

#### Database Schema Updates
- [ ] Add `createdBy` field to `teams` collection
- [ ] Create new `invitations` collection with all required fields
- [ ] Create database indexes:
  - [ ] `teams.orgId`
  - [ ] `memberships.teamId`
  - [ ] `memberships.userId`
  - [ ] `invitations.tokenHash`
  - [ ] `invitations.status`
  - [ ] `memberships(teamId, userId)` UNIQUE

#### Backend Infrastructure
- [ ] Create Cloud Function: `sendInvitationEmail`
- [ ] Set up email service provider (SendGrid/AWS SES/etc.)
- [ ] Configure environment variables
- [ ] Add token hashing utilities:
  ```typescript
  // utils/crypto.ts
  export async function hashToken(token: string): Promise<string> {
    // Use crypto.subtle or bcrypt
  }
  ```

#### Code Preparation
- [ ] Create feature flag: `EXPO_PUBLIC_USE_CUSTOM_TEAMS=false`
- [ ] Create service abstraction layer: `services/teamService.ts`
- [ ] Implement helper functions:
  - [ ] `getTeamMembers(teamId)`
  - [ ] `isTeamMember(userId, teamId)`
  - [ ] `getUserRole(userId, teamId)`

**Testing Checklist - Phase 1:**
- [ ] Database schema deploys successfully
- [ ] Cloud Function sends test email
- [ ] Token hashing works correctly
- [ ] Feature flag can toggle implementations

---

### Phase 2: Data Migration (Days 3-4)

#### Migrate Existing Data
- [ ] Run migration script: populate `createdBy` field
  ```typescript
  // scripts/migrate-team-creators.ts
  for each team in teams:
    find membership with role='owner' and oldest joinedAt
    set team.createdBy = membership.userId
  ```

- [ ] Verify all Appwrite Teams data is reflected in custom collections
  - [ ] Compare team counts
  - [ ] Compare membership counts per team
  - [ ] Verify role assignments match

#### Migration Scripts
- [ ] `scripts/migrate-team-creators.ts`
- [ ] `scripts/verify-migration.ts`

**Testing Checklist - Phase 2:**
- [ ] Migration scripts run without errors
- [ ] All teams have `createdBy` populated
- [ ] Validation script confirms data integrity

---

### Phase 3: Dual-Mode Implementation (Days 5-7)

#### Feature-by-Feature Replacement (in this order):

**Day 5: Team Reads (Safest)**
- [ ] Replace `teams.list()` with database query
- [ ] Replace `teams.get()` with database query
- [ ] Update `listTeams()` - fix N+1 query issue
- [ ] Test with feature flag

**Day 6: Membership Listing & Roles**
- [ ] Replace `teams.listMemberships()` with database query
- [ ] Role checks (already from database - verify this)
- [ ] Update `listMemberships()`
- [ ] Test with feature flag

**Day 7: Invites & Write Operations**
- [ ] Replace `teams.createMembership()` with invite system
- [ ] Replace `teams.updateMembership()` with database update
- [ ] Replace `teams.deleteMembership()` with soft delete
- [ ] Update invitation acceptance flow
- [ ] Add orgId security verification
- [ ] Test complete invitation flow

#### Service Abstraction Layer
```typescript
// services/teamService.ts
export const teamService = {
  async listMembers(teamId) {
    if (USE_CUSTOM_TEAMS) {
      return customListMembers(teamId);
    }
    return teams.listMemberships(teamId);
  },
  // ... other methods
};
```

**Testing Checklist - Phase 3:**
- [ ] Feature flag switches implementations correctly
- [ ] Team reads work in both modes
- [ ] Membership listing works in both modes
- [ ] Invitations work end-to-end
- [ ] Both modes produce identical results

---

### Phase 4: Rollout (Week 2-3)

#### Staged Rollout Strategy

**Step 1: Internal Testing (Day 8)**
- [ ] Enable custom mode for development team only
- [ ] Test all team operations
- [ ] Test invitation flow
- [ ] Monitor for errors

**Step 2: Beta Users (Days 9-11)**
- [ ] Enable for 5-10 trusted beta users
- [ ] Collect feedback
- [ ] Monitor error rates
- [ ] Fix any issues immediately

**Step 3: Full Production (Days 12-14)**
- [ ] Enable for all users
- [ ] Monitor for 48 hours
- [ ] Keep feature flag ready for instant rollback

**Rollback Procedure:**
```bash
# Instant rollback if issues detected
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false
```

**Testing Checklist - Phase 4:**
- [ ] Internal testing passes
- [ ] Beta users report no issues
- [ ] Production rollout successful
- [ ] Rollback tested and works

---

### Phase 5: Cleanup (After stable for 1 week)

#### Remove Appwrite Teams
- [ ] Remove feature flag
- [ ] Delete Appwrite Teams code paths
- [ ] Remove `teams` import from `client.ts`
- [ ] Run full test suite
- [ ] Verify bundle size reduction

#### Documentation
- [ ] Update API documentation
- [ ] Create troubleshooting guide
- [ ] Document new invitation flow

---

## Rollback Strategy

### Quick Rollback (Immediate)

The feature flag provides instant rollback capability:

```bash
# Disable custom mode
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false

# Redeploy/restart app
# All operations revert to Appwrite Teams automatically
```

**When to Rollback:**
- Error rate spikes
- Invitation flow breaks
- Data inconsistencies detected
- User complaints increase

### Rollback Checklist

- [ ] Feature flag tested in staging
- [ ] Rollback procedure documented
- [ ] Team knows how to execute rollback
- [ ] Monitor alerts configured (if available)

---

## Risk Assessment

### High Risk
1. **Invitation Email Delivery**
   - Risk: Emails may be marked as spam
   - Mitigation: Use established email provider (SendGrid/AWS SES), implement SPF/DKIM

2. **Token Security**
   - Risk: Invitation tokens could be guessed
   - Mitigation: 
     - Use cryptographically secure random tokens (32+ bytes)
     - Store only hashed tokens in database
     - Short expiration (7 days)
     - Single-use tokens

### Medium Risk
1. **Performance Degradation**
   - Risk: Multiple database queries vs single Appwrite API call
   - Mitigation: Use bulk queries (Query.equal('$id', [...]) instead of N+1)

2. **Existing Pending Invitations**
   - Risk: Users with pending invites during migration
   - Mitigation: Test invitation acceptance with both old and new tokens

### Low Risk
1. **Code Complexity**
   - Risk: More code to maintain
   - Mitigation: Service abstraction layer hides complexity from UI

---

## Success Criteria

The migration is successful when:

1. ✅ Zero data loss
2. ✅ All team operations work without Appwrite Teams API
3. ✅ Invitation acceptance rate >= 95% of pre-migration
4. ✅ Feature flag rollback works instantly
5. ✅ No security vulnerabilities (tokens hashed, orgId verified)
6. ✅ N+1 query issues resolved
7. ✅ Code is simpler than before (removed dual-schema complexity)

---

## Appendix

### A. Environment Variables

```bash
# Feature Flag - Controls which system to use
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false  # Set to true to use custom implementation

# Email Service (for invitations)
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=your_api_key
EMAIL_FROM_ADDRESS=noreply@workphotopro.com

# Invitation Settings
INVITATION_EXPIRY_DAYS=7
INVITATION_TOKEN_LENGTH=32
```

### B. Database Indexes Required

```javascript
// teams collection
db.teams.createIndex({ orgId: 1 });
db.teams.createIndex({ isActive: 1 });
db.teams.createIndex({ createdBy: 1 });

// memberships collection
db.memberships.createIndex({ teamId: 1, isActive: 1 });
db.memberships.createIndex({ userId: 1, isActive: 1 });
db.memberships.createIndex({ teamId: 1, userId: 1 }, { unique: true });

// invitations collection
db.invitations.createIndex({ tokenHash: 1 }, { unique: true });
db.invitations.createIndex({ teamId: 1, status: 1 });
db.invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### C. Helper Functions

```typescript
// services/teamService.ts - Core helper functions

/**
 * Check if user is a member of a team
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);
  return memberships.documents.length > 0;
}

/**
 * Get user's role in a team
 */
export async function getUserRole(userId: string, teamId: string): Promise<string | null> {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);
  
  if (memberships.documents.length === 0) {
    return null;
  }
  
  return memberships.documents[0].role;
}

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string) {
  return await databaseService.listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);
}
```

### D. Testing Scripts

```typescript
// scripts/test-migration.ts
// Quick validation tests

import { teamService } from '@/lib/appwrite/teams';

async function runMigrationTests() {
  console.log('🧪 Running migration tests...');
  
  // Test 1: Team CRUD
  const team = await teamService.createTeam('Test Team', 'org-123');
  console.assert(team.teamName === 'Test Team', 'Team creation failed');
  
  // Test 2: List teams (N+1 check)
  const teams = await teamService.listTeams(user.$id);
  console.assert(Array.isArray(teams.teams), 'List teams failed');
  
  // Test 3: Membership
  await teamService.createMembership(team.$id, orgId, 'test@example.com', ['member'], url, user.$id);
  const memberships = await teamService.listMemberships(team.$id);
  console.assert(memberships.total >= 1, 'Membership creation failed');
  
  // Test 4: Invitation flow
  // ... test accept invitation
  
  console.log('✅ All tests passed');
}
```

---

## Review and Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Tech Lead | _____________ | ______ | ⬜ Approved |
| Product Manager | _____________ | ______ | ⬜ Approved |
| QA Lead | _____________ | ______ | ⬜ Approved |
| DevOps | _____________ | ______ | ⬜ Approved |

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Next Review: Before Phase 1 execution*
