# Appwrite Teams to Custom Collections Migration Plan

## Overview

This document outlines the migration strategy to remove Appwrite Teams SDK dependency and replace it with fully custom database collections. The migration transitions from a hybrid system (Appwrite Teams + custom database) to a pure custom database implementation.

**Key Improvements from Review:**
- ✅ Timeline compressed from 6 weeks to 2-3 weeks
- ✅ Removed `totalMembers` denormalized field (compute on demand)
- ✅ Simplified schema: invitation logic only in `invitations` collection
- ✅ Fixed N+1 query pattern in `listTeams()`
- ✅ Token hashing and orgId verification
- ✅ Simplified rollout: internal → beta → production
- ✅ Feature flag provides instant rollback
- ✅ All migration scripts use paginated queries
- ✅ `orgId` included on membership creation
- ✅ Pre-migration audit before any schema changes

**Architecture Decision:**
Teams and memberships are core domain concepts managed entirely within the application's database, not delegated to Appwrite Teams. This aligns with how systems like Slack and Discord handle team/workspace membership.

---

## Pagination Helper (Required for All Migration Scripts)

> ⚠️ Appwrite returns a maximum of 100 documents per request. Any script that does not paginate will silently miss records. Use this helper in every migration loop.

```typescript
// utils/paginatedList.ts
import { Query } from 'react-native-appwrite';
import { databases } from '@/lib/appwrite/client';

export async function paginatedList(
  collectionId: string,
  queries: string[] = [],
  batchSize: number = 100
): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await databases.listDocuments(collectionId, [
      ...queries,
      Query.limit(batchSize),
      Query.offset(offset)
    ]);

    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === batchSize;
  }

  return all;
}
```

---

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

**Total: 20 API calls to replace across teams.ts**

### Existing Custom Collections

1. **teams** - Team metadata
2. **memberships** - Team membership records
3. **organizations** - Organization data
4. **invitations** - ⚠️ NEW: needs to be created

---

## Pre-Migration: Data Audit

> ⚠️ Run this before touching any schema or code. Migrating on top of inconsistent data carries bugs forward.

```typescript
// scripts/pre-migration-audit.ts
import { teams } from '@/lib/appwrite/client';
import { paginatedList } from '@/utils/paginatedList';

async function runPreMigrationAudit() {
  const report = {
    appwriteTeamCount: 0,
    dbTeamCount: 0,
    orphanedDbTeams: [],        // In DB but not in Appwrite Teams
    orphanedAppwriteTeams: [],  // In Appwrite Teams but not in DB
    membershipsWithoutOrgId: [],
    membershipsWithoutTeam: [],
    jobsWithoutTeam: [],
    jobsWithoutOrg: [],
    teamsWithoutCreatedBy: [],
  };

  // Compare Appwrite Teams vs DB teams
  const appwriteTeamsList = await teams.list();
  report.appwriteTeamCount = appwriteTeamsList.total;

  const dbTeams = await paginatedList('teams');
  report.dbTeamCount = dbTeams.length;

  const appwriteTeamIds = new Set(appwriteTeamsList.teams.map(t => t.$id));
  const dbAppwriteIds = new Set(dbTeams.map(t => t.appwriteTeamId).filter(Boolean));

  report.orphanedDbTeams = dbTeams
    .filter(t => t.appwriteTeamId && !appwriteTeamIds.has(t.appwriteTeamId))
    .map(t => ({ dbId: t.$id, appwriteTeamId: t.appwriteTeamId, name: t.teamName }));

  report.orphanedAppwriteTeams = appwriteTeamsList.teams
    .filter(t => !dbAppwriteIds.has(t.$id))
    .map(t => ({ appwriteId: t.$id, name: t.name }));

  // Memberships missing orgId
  const memberships = await paginatedList('memberships');
  report.membershipsWithoutOrgId = memberships
    .filter(m => !m.orgId)
    .map(m => ({ id: m.$id, teamId: m.teamId, userId: m.userId }));

  // Memberships pointing to non-existent teams
  const dbTeamIds = new Set(dbTeams.map(t => t.$id));
  report.membershipsWithoutTeam = memberships
    .filter(m => !dbTeamIds.has(m.teamId))
    .map(m => ({ id: m.$id, teamId: m.teamId }));

  // Jobs missing team or org
  const jobs = await paginatedList('jobchat');
  report.jobsWithoutTeam = jobs.filter(j => !j.teamId).map(j => ({ id: j.$id, title: j.title }));
  report.jobsWithoutOrg = jobs.filter(j => !j.orgId).map(j => ({ id: j.$id, title: j.title }));

  // Teams missing createdBy
  report.teamsWithoutCreatedBy = dbTeams
    .filter(t => !t.createdBy)
    .map(t => ({ id: t.$id, name: t.teamName }));

  // Output
  console.log('\n=== PRE-MIGRATION AUDIT REPORT ===\n');
  console.log(`Appwrite Teams: ${report.appwriteTeamCount}`);
  console.log(`DB Teams: ${report.dbTeamCount}`);
  console.log(`Orphaned DB teams: ${report.orphanedDbTeams.length}`);
  console.log(`Orphaned Appwrite teams: ${report.orphanedAppwriteTeams.length}`);
  console.log(`Memberships missing orgId: ${report.membershipsWithoutOrgId.length}`);
  console.log(`Memberships with invalid teamId: ${report.membershipsWithoutTeam.length}`);
  console.log(`Jobs missing teamId: ${report.jobsWithoutTeam.length}`);
  console.log(`Jobs missing orgId: ${report.jobsWithoutOrg.length}`);
  console.log(`Teams missing createdBy: ${report.teamsWithoutCreatedBy.length}`);

  if (
    report.orphanedDbTeams.length > 0 ||
    report.orphanedAppwriteTeams.length > 0 ||
    report.membershipsWithoutTeam.length > 0
  ) {
    console.log('\n⚠️  DATA INCONSISTENCIES FOUND. Resolve before proceeding.\n');
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log('\n✅ Data looks consistent. Safe to proceed.\n');
  return report;
}

runPreMigrationAudit();
```

> **Do not proceed if orphaned teams or invalid membership references are found.** Fix those manually first. Save the output to `/docs/refactor/pre-migration-audit-results.json`.

---

## Feature Groups

### Group 1: Team CRUD Operations

#### Current Implementation
```typescript
const appwriteTeam = await teams.create(ID.unique(), name, roles);
const appwriteTeam = await teams.get(teamId);
const appwriteTeams = await teams.list();
const appwriteTeam = await teams.updateName(teamId, name);
await teams.delete(teamId);
```

#### Migration Strategy

**Schema Updates — extend `teams` collection:**

```typescript
interface TeamData {
  $id: string;
  teamName: string;
  // REMOVE: appwriteTeamId (after migration complete)
  orgId: string;
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  phone?: string;
  teamPhotoUrl?: string;
  isActive: boolean;
  settings?: string;
  createdBy: string;   // NEW: user ID who created the team
  $createdAt: string;
  $updatedAt: string;
}

// Member count is computed, never stored
async function getTeamMemberCount(teamId: string): Promise<number> {
  const result = await databases.listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('isActive', true),
    Query.limit(1)
  ]);
  return result.total;
}
```

**Replacement Implementation:**

```typescript
// Create team
async createTeam(name: string, orgId: string, userId: string, description?: string) {
  const teamDoc = await databaseService.createDocument('teams', {
    teamName: name,
    orgId,
    description: description || '',
    isActive: true,
    settings: '{}',
    createdBy: userId,
  });

  // Create owner membership — include orgId
  await databaseService.createDocument('memberships', {
    userId,
    teamId: teamDoc.$id,
    orgId,           // Required for tenant isolation
    role: 'owner',
    invitedBy: userId,
    joinedAt: new Date().toISOString(),
    isActive: true
  });

  return teamDoc;
}

// Get team
async getTeam(teamId: string, orgId: string) {
  const team = await databaseService.getDocument('teams', teamId);
  // Verify org ownership
  if (team.orgId !== orgId) throw new Error('Access denied');
  return team;
}

// List teams — single query, no N+1
async listTeams(userId: string, orgId: string) {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
    Query.limit(100)
  ]);

  const teamIds = memberships.documents.map(m => m.teamId);
  if (teamIds.length === 0) return { teams: [], total: 0 };

  // Fetch all teams in one query — not a loop
  const teamsResult = await databaseService.listDocuments('teams', [
    Query.equal('$id', teamIds),
    Query.equal('isActive', true)
  ]);

  return { teams: teamsResult.documents, total: teamsResult.documents.length };
}

// Update team
async updateTeam(teamId: string, orgId: string, name: string) {
  const team = await databaseService.getDocument('teams', teamId);
  if (team.orgId !== orgId) throw new Error('Access denied');
  return databaseService.updateDocument('teams', teamId, { teamName: name });
}

// Delete team — soft delete with pagination
async deleteTeam(teamId: string, orgId: string) {
  const team = await databaseService.getDocument('teams', teamId);
  if (team.orgId !== orgId) throw new Error('Access denied');

  // Paginated soft delete of memberships
  const memberships = await paginatedList('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('isActive', true)
  ]);

  for (const membership of memberships) {
    await databaseService.updateDocument('memberships', membership.$id, { isActive: false });
  }

  return databaseService.updateDocument('teams', teamId, { isActive: false });
}
```

---

### Group 2: Membership Management

#### Current Implementation
```typescript
await teams.createMembership(teamId, roles, email, undefined, undefined, url);
await teams.listMemberships(teamId);
await teams.updateMembership(teamId, membershipId, roles);
await teams.deleteMembership(teamId, membershipId);
```

#### Migration Strategy

**Schema Updates — extend `memberships` collection:**

```typescript
interface MembershipData {
  $id: string;
  userId: string;
  teamId: string;
  orgId: string;       // Required — add to all existing records via migration script
  role: string;        // 'owner' | 'admin' | 'member'
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

**NEW Collection: `invitations`**

```typescript
interface Invitation {
  $id: string;
  teamId: string;
  orgId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedName?: string;
  role: string;
  tokenHash: string;        // SHA-256 hash — never store raw token
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  sentAt: string;
  expiresAt: string;        // 7 days
  acceptedAt?: string;
  acceptedByUserId?: string;
  $createdAt: string;
  $updatedAt: string;
}
```

**Replacement Implementation:**

```typescript
// List memberships — no N+1, use cached fields
async listMemberships(teamId: string, orgId: string) {
  const memberships = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('orgId', orgId),    // Always scope to org
    Query.equal('isActive', true),
    Query.limit(100)
  ]);

  // Return cached userName/profilePicture as-is.
  // These are intentional snapshots — historical accuracy is correct behaviour.
  // Refresh on membership update if needed, not on every read.
  return { memberships: memberships.documents, total: memberships.documents.length };
}

// Update membership role
async updateMembershipRoles(membershipId: string, roles: string[], orgId: string) {
  const membership = await databaseService.getDocument('memberships', membershipId);
  if (membership.orgId !== orgId) throw new Error('Access denied');

  return databaseService.updateDocument('memberships', membershipId, {
    role: roles[0] || 'member'
  });
}

// Remove member — soft delete
async deleteMembership(membershipId: string, orgId: string) {
  const membership = await databaseService.getDocument('memberships', membershipId);
  if (membership.orgId !== orgId) throw new Error('Access denied');

  return databaseService.updateDocument('memberships', membershipId, { isActive: false });
}
```

---

### Group 3: Invitation System

#### Current Implementation
Appwrite Teams handles invitation emails and token management automatically via `createMembership` and `updateMembershipStatus`.

#### Migration Strategy

**Token Utilities:**

```typescript
// utils/crypto.ts

// Use crypto.getRandomValues — NOT Math.random() (not cryptographically secure)
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').substring(0, length);
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Create Invitation:**

```typescript
async createInvitation(
  teamId: string,
  orgId: string,
  email: string,
  roles: string[],
  invitedBy: string,
  invitationBaseUrl: string
) {
  // Check for existing pending invite
  const existing = await databaseService.listDocuments('invitations', [
    Query.equal('teamId', teamId),
    Query.equal('invitedEmail', email.toLowerCase()),
    Query.equal('status', 'pending')
  ]);
  if (existing.documents.length > 0) throw new Error('Pending invitation already exists');

  // Generate token — store only the hash
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await databaseService.createDocument('invitations', {
    teamId,
    orgId,
    invitedBy,
    invitedEmail: email.toLowerCase(),
    role: roles[0] || 'member',
    tokenHash,
    status: 'pending',
    sentAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  });

  // Send raw token in email link — never the hash
  await sendInvitationEmail({
    to: email,
    invitationLink: `${invitationBaseUrl}/accept-invite?token=${token}`,
    expiresAt
  });

  return { success: true };
}
```

**Accept Invitation:**

```typescript
async acceptInvitation(token: string, userId: string, orgId: string) {
  const tokenHash = await hashToken(token);

  const invitations = await databaseService.listDocuments('invitations', [
    Query.equal('tokenHash', tokenHash),
    Query.equal('status', 'pending')
  ]);

  if (invitations.documents.length === 0) throw new Error('Invalid or expired invitation');

  const invitation = invitations.documents[0];

  // Verify org context
  if (invitation.orgId !== orgId) throw new Error('Organization mismatch');

  // Check expiry
  if (new Date(invitation.expiresAt) < new Date()) {
    await databaseService.updateDocument('invitations', invitation.$id, { status: 'expired' });
    throw new Error('Invitation has expired');
  }

  // Verify email matches logged-in user
  const { account } = await import('@/lib/appwrite/client');
  const user = await account.get();
  if (user.email.toLowerCase() !== invitation.invitedEmail) throw new Error('Email mismatch');

  // Check not already a member
  const alreadyMember = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', invitation.teamId),
    Query.equal('userId', userId),
    Query.equal('isActive', true)
  ]);
  if (alreadyMember.documents.length > 0) throw new Error('Already a member of this team');

  // Create membership — include orgId
  await databaseService.createDocument('memberships', {
    userId,
    teamId: invitation.teamId,
    orgId: invitation.orgId,    // Required
    role: invitation.role,
    userEmail: user.email,
    userName: user.name,
    invitedBy: invitation.invitedBy,
    joinedAt: new Date().toISOString(),
    isActive: true
  });

  // Mark invitation accepted
  await databaseService.updateDocument('invitations', invitation.$id, {
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
    acceptedByUserId: userId
  });

  return { success: true };
}
```

**Email Cloud Function:**

```typescript
// functions/sendInvitationEmail/main.js
export default async ({ req, res, log, error }) => {
  try {
    const { to, invitationLink, expiresAt, teamName, invitedByName } = req.body;

    await sendEmail({
      to,
      subject: `${invitedByName} invited you to join ${teamName}`,
      html: generateInvitationEmail({ teamName, invitedByName, invitationLink, expiresAt })
    });

    return res.json({ success: true });
  } catch (err) {
    error('Failed to send invitation email:', err);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

### Group 4: Job Visibility Fix

> This is separate from the teams migration but must be fixed at the same time since it's caused by the same membership query inconsistency.

**Problem:** Jobs filtered by `teamId` disappear when a user is removed from a team, even if they created the job.

> ⚠️ Appwrite does not support OR conditions across different fields in a single query. Use two queries and merge in application code.

```typescript
async listJobChats(teamId?: string, orgId?: string, userId?: string) {
  const baseQueries = [
    Query.limit(100),
    Query.orderDesc('$createdAt'),
    Query.isNull('deletedAt')
  ];

  if (orgId) baseQueries.push(Query.equal('orgId', orgId));

  // Query 1: jobs in current team
  const teamJobs = teamId
    ? await databaseService.listDocuments('jobchat', [
        ...baseQueries,
        Query.equal('teamId', teamId)
      ])
    : { documents: [] };

  // Query 2: jobs created by this user (persists after team removal)
  const createdByJobs = userId
    ? await databaseService.listDocuments('jobchat', [
        ...baseQueries,
        Query.equal('createdBy', userId)
      ])
    : { documents: [] };

  // Merge and deduplicate
  const seen = new Set();
  const merged = [...teamJobs.documents, ...createdByJobs.documents].filter(job => {
    if (seen.has(job.$id)) return false;
    seen.add(job.$id);
    return true;
  });

  merged.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

  return { documents: merged, total: merged.length };
}
```

---

## Step-by-Step Migration Checklist

**Timeline: 2-3 weeks**

### Phase 1: Infrastructure & Schema (Days 1-2)

#### Pre-flight
- [ ] Run `npx ts-node scripts/pre-migration-audit.ts`
- [ ] Zero orphaned teams and invalid membership references
- [ ] Save audit output to `/docs/refactor/pre-migration-audit-results.json`
- [ ] Take full database backup

#### Schema Updates
- [ ] Add `createdBy` to `teams` collection (`required: false` initially)
- [ ] Add `orgId` to `memberships` collection (`required: false` initially)
- [ ] Create `invitations` collection with all fields
- [ ] Create indexes:
  - [ ] `teams.orgId`
  - [ ] `memberships.teamId + isActive`
  - [ ] `memberships.userId + isActive`
  - [ ] `memberships.orgId`
  - [ ] `memberships(teamId, userId)` UNIQUE
  - [ ] `invitations.tokenHash` UNIQUE
  - [ ] `invitations(teamId, status)`
  - [ ] `invitations(invitedEmail, status)`

#### Backend Infrastructure
- [ ] Create `utils/paginatedList.ts`
- [ ] Create `utils/crypto.ts` (with `crypto.getRandomValues`, not `Math.random`)
- [ ] Create cloud function or email service for `sendInvitationEmail`
- [ ] Set up email provider (SendGrid / Resend / AWS SES)
- [ ] Test email sends successfully

#### Code Preparation
- [ ] Create `services/teamService.ts` with feature flag dual-mode scaffold
- [ ] Set `EXPO_PUBLIC_USE_CUSTOM_TEAMS=false` in all environments

**Phase 1 Tests:**
- [ ] Schema deploys without errors
- [ ] Existing records not broken by new optional fields
- [ ] Test email received successfully
- [ ] Feature flag toggles without errors

---

### Phase 2: Data Migration (Days 3-4)

- [ ] Run `migrate-orgId-memberships.ts` (paginated)
```typescript
// scripts/migrate-orgId-memberships.ts
import { paginatedList } from '@/utils/paginatedList';

async function run() {
  const memberships = await paginatedList('memberships');
  let updated = 0, skipped = 0, failed = 0;

  for (const m of memberships) {
    if (m.orgId) { skipped++; continue; }
    try {
      const team = await databases.getDocument('teams', m.teamId);
      await databases.updateDocument('memberships', m.$id, { orgId: team.orgId });
      updated++;
    } catch (err) {
      console.error(`Failed: ${m.$id}`, err);
      failed++;
    }
  }

  console.log(`Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}
```

- [ ] Run `migrate-team-creators.ts` (paginated)
```typescript
// scripts/migrate-team-creators.ts
import { paginatedList } from '@/utils/paginatedList';

async function run() {
  const allTeams = await paginatedList('teams');
  let updated = 0;

  for (const team of allTeams) {
    if (team.createdBy) continue;

    const memberships = await databases.listDocuments('memberships', [
      Query.equal('teamId', team.$id),
      Query.equal('role', 'owner'),
      Query.orderAsc('joinedAt'),
      Query.limit(1)
    ]);

    if (memberships.documents.length > 0) {
      await databases.updateDocument('teams', team.$id, {
        createdBy: memberships.documents[0].userId
      });
      updated++;
    } else {
      console.warn(`No owner found for team ${team.$id} (${team.teamName})`);
    }
  }

  console.log(`Updated createdBy on ${updated} teams`);
}
```

- [ ] Run `verify-migration.ts` (paginated)
```typescript
// scripts/verify-migration.ts
import { paginatedList } from '@/utils/paginatedList';

async function run() {
  const issues: string[] = [];

  const teams = await paginatedList('teams', [Query.equal('isActive', true)]);
  teams.forEach(t => { if (!t.createdBy) issues.push(`Team ${t.$id} missing createdBy`); });

  const memberships = await paginatedList('memberships', [Query.equal('isActive', true)]);
  memberships.forEach(m => { if (!m.orgId) issues.push(`Membership ${m.$id} missing orgId`); });

  if (issues.length > 0) {
    console.error('Issues:', issues);
    process.exit(1);
  }

  console.log('✅ Verification passed');
}
```

- [ ] Once verified, set `orgId` and `createdBy` to `required: true` in Appwrite Console

**Phase 2 Tests:**
- [ ] All memberships have `orgId`
- [ ] All teams have `createdBy`
- [ ] Verification script exits with code 0
- [ ] Record counts match pre-migration audit

---

### Phase 3: Dual-Mode Implementation (Days 5-7)

Replace Appwrite calls one group at a time. Test after each day before moving on.

**Day 5: Team reads (lowest risk)**
- [ ] Implement `_customListTeams()` in `teamService.ts`
- [ ] Implement `_customGetTeam()` in `teamService.ts`
- [ ] Enable flag in dev, test both modes return same results

**Day 6: Membership listing and roles**
- [ ] Implement `_customListMemberships()` — no N+1, use cached fields
- [ ] Implement `_customUpdateMemberRole()`
- [ ] Implement `_customRemoveMember()`

**Day 7: Invitations and write operations**
- [ ] Implement `_customCreateTeam()`
- [ ] Implement `_customDeleteTeam()` (soft delete, paginated)
- [ ] Implement `_customInviteMember()` with token hashing
- [ ] Implement `_customAcceptInvitation()` with orgId check + duplicate member check
- [ ] Update `accept-invite.tsx` to handle token from URL params
- [ ] Fix `listJobChats()` with two-query merge pattern

**Phase 3 Tests:**
- [ ] Feature flag switches cleanly between modes
- [ ] Both modes return identical results for all operations
- [ ] Invitation sent → email received → accepted → membership created
- [ ] Job created → user removed from team → job still visible to creator
- [ ] No console errors in either mode

---

### Phase 4: Rollout (Days 8-14)

**Day 8-9: Internal testing**
- [ ] `EXPO_PUBLIC_USE_CUSTOM_TEAMS=true` in dev only
- [ ] Full manual test pass (see test scenarios below)

**Days 10-12: Beta users**
- [ ] Enable for 5-10 trusted users
- [ ] Monitor error rates for 48 hours
- [ ] Fix any issues before continuing

**Days 13-14: Full production**
- [ ] `EXPO_PUBLIC_USE_CUSTOM_TEAMS=true` in production
- [ ] Monitor for 48 hours
- [ ] Keep rollback ready

**Manual Test Scenarios:**
- [ ] Create org → create team → invite 3 members with different roles
- [ ] Accept invitations from different devices/accounts
- [ ] Remove a member → verify team access revoked, created jobs still visible
- [ ] Soft delete team → verify hidden, jobs still exist in DB
- [ ] Accept expired token → verify correct error shown
- [ ] Accept token with wrong email account → verify blocked
- [ ] Invite same email twice → verify duplicate error

---

### Phase 5: Cleanup (After stable for 1 week)

- [ ] Remove `EXPO_PUBLIC_USE_CUSTOM_TEAMS` env var and all references
- [ ] Remove all `_appwrite*` methods from `teamService.ts`
- [ ] Remove `teams` export from `lib/appwrite/client.ts`
- [ ] Remove `appwriteTeamId` attribute from `teams` collection
- [ ] Verify zero remaining Appwrite Teams references:
```bash
grep -r "teams\.create\|teams\.get\|teams\.list\|teams\.delete\|teams\.updateName\|teams\.createMembership\|teams\.listMemberships\|teams\.updateMembership\|teams\.deleteMembership\|teams\.updateMembershipStatus" --include="*.ts" --include="*.tsx"
# Must return zero results
```
- [ ] Archive migration scripts to `/scripts/archive/`
- [ ] Update developer docs

---

## Rollback Strategy

### Immediate Rollback
```bash
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false
# Redeploy — all operations revert to Appwrite Teams automatically
```

**When to rollback:**
- Error rate spikes
- Invitation flow broken
- Data inconsistencies detected

### Database Rollback
```bash
# Restore from pre-migration backup
# Revert code to pre-migration commit
# Re-run audit script to verify integrity
```

---

## Risk Assessment

### High Risk
1. **Invitation email delivery** — emails marked as spam
   - Use established provider (SendGrid/Resend), set up SPF/DKIM

2. **Existing pending invitations during cutover**
   - Test both old Appwrite tokens and new custom tokens work during transition window

### Medium Risk
1. **Performance** — multiple DB queries vs single Appwrite API call
   - Mitigated by bulk team query (`Query.equal('$id', teamIds)`) instead of N+1

2. **Pagination gaps in migration scripts**
   - Mitigated by `paginatedList` helper used in all scripts

### Low Risk
1. **Code complexity** — more code to maintain
   - Mitigated by `teamService.ts` abstraction hiding complexity from UI

---

## Success Criteria

1. ✅ Pre-migration audit shows zero orphaned records
2. ✅ Zero data loss
3. ✅ All team operations work without Appwrite Teams API
4. ✅ Invitation acceptance rate ≥ 95%
5. ✅ Jobs do not disappear when creator is removed from team
6. ✅ All memberships have `orgId`
7. ✅ Token generation uses `crypto.getRandomValues`
8. ✅ Zero Appwrite Teams references in codebase post-cleanup
9. ✅ Rollback tested and confirmed working

---

## Appendix

### A. Environment Variables

```bash
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false   # Toggle during migration
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=your_api_key
EMAIL_FROM_ADDRESS=noreply@yourapp.com
INVITATION_EXPIRY_DAYS=7
```

### B. Database Indexes

```typescript
// teams
{ orgId: 1 }
{ isActive: 1 }
{ createdBy: 1 }

// memberships
{ teamId: 1, isActive: 1 }
{ userId: 1, isActive: 1 }
{ orgId: 1 }
{ teamId: 1, userId: 1 }  // UNIQUE

// invitations
{ tokenHash: 1 }           // UNIQUE
{ teamId: 1, status: 1 }
{ invitedEmail: 1, status: 1 }
```

### C. Helper Functions

```typescript
// Check if user is a team member
export async function isTeamMember(userId: string, teamId: string, orgId: string): Promise<boolean> {
  const result = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('teamId', teamId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
    Query.limit(1)
  ]);
  return result.documents.length > 0;
}

// Get user's role in a team
export async function getUserRole(userId: string, teamId: string, orgId: string): Promise<string | null> {
  const result = await databaseService.listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('teamId', teamId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
    Query.limit(1)
  ]);
  return result.documents[0]?.role ?? null;
}
```

### D. Changes from Previous Version

| Item | Change |
|------|--------|
| Pre-migration audit | **Added** — required before any schema changes |
| Pagination helper | **Added** — all migration scripts use it |
| `deleteTeam` loop | **Fixed** — now paginated |
| `listMemberships` enrichment | **Fixed** — removed N+1 `getUserInfo` loop, use cached fields as intended |
| `acceptInvitation` membership creation | **Fixed** — now includes `orgId` |
| `createTeam` membership creation | **Fixed** — now includes `orgId` |
| `isTeamMember` / `getUserRole` helpers | **Fixed** — now include `orgId` in queries |
| Token generation | **Fixed** — `crypto.getRandomValues` not `Math.random` |
| Job visibility fix | **Added** — documents Appwrite OR limitation, two-query merge pattern |
| `required: false` on new fields | **Added** — prevents breaking existing records |

---

*Document Version: 2.0*
*Last Updated: March 2026*
