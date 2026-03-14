# Migration Checklist: Appwrite Teams to Pure Database

## Overview

This checklist provides a step-by-step guide for migrating from the hybrid Appwrite Teams + custom database architecture to a pure database implementation with proper multi-tenant support.

**Estimated Duration:** 3-4 weeks  
**Risk Level:** Medium-High  
**Rollback Window:** 48 hours per phase

> ⚠️ **IMPORTANT:** All migration scripts must use paginated queries. Appwrite returns a maximum of 100 documents per request. Scripts that do not paginate will silently miss records. Use the `paginatedList` helper below for every loop.

---

## Pagination Helper (Use in ALL Migration Scripts)

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

> Use `paginatedList('memberships')` instead of `databases.listDocuments('memberships')` everywhere in migration scripts.

---

## Pre-Migration: Data Audit (Do This Before Anything Else)

Before touching any code or schema, run a full audit to find inconsistencies between Appwrite Teams and your custom DB. Migrating on top of dirty data will carry the bugs forward.

### Audit Script

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

  // 1. Compare Appwrite Teams vs DB teams
  const appwriteTeamsList = await teams.list();
  report.appwriteTeamCount = appwriteTeamsList.total;

  const dbTeams = await paginatedList('teams');
  report.dbTeamCount = dbTeams.length;

  const appwriteTeamIds = new Set(appwriteTeamsList.teams.map(t => t.$id));
  const dbAppwriteIds = new Set(dbTeams.map(t => t.appwriteTeamId).filter(Boolean));

  // Teams in DB that have no matching Appwrite Team
  report.orphanedDbTeams = dbTeams
    .filter(t => t.appwriteTeamId && !appwriteTeamIds.has(t.appwriteTeamId))
    .map(t => ({ dbId: t.$id, appwriteTeamId: t.appwriteTeamId, name: t.teamName }));

  // Appwrite Teams with no matching DB record
  report.orphanedAppwriteTeams = appwriteTeamsList.teams
    .filter(t => !dbAppwriteIds.has(t.$id))
    .map(t => ({ appwriteId: t.$id, name: t.name }));

  // 2. Memberships missing orgId
  const memberships = await paginatedList('memberships');
  report.membershipsWithoutOrgId = memberships
    .filter(m => !m.orgId)
    .map(m => ({ id: m.$id, teamId: m.teamId, userId: m.userId }));

  // 3. Memberships pointing to non-existent teams
  const dbTeamIds = new Set(dbTeams.map(t => t.$id));
  report.membershipsWithoutTeam = memberships
    .filter(m => !dbTeamIds.has(m.teamId))
    .map(m => ({ id: m.$id, teamId: m.teamId }));

  // 4. Jobs missing team or org
  const jobs = await paginatedList('jobchat');
  report.jobsWithoutTeam = jobs
    .filter(j => !j.teamId)
    .map(j => ({ id: j.$id, title: j.title }));

  report.jobsWithoutOrg = jobs
    .filter(j => !j.orgId)
    .map(j => ({ id: j.$id, title: j.title }));

  // 5. Teams missing createdBy
  report.teamsWithoutCreatedBy = dbTeams
    .filter(t => !t.createdBy)
    .map(t => ({ id: t.$id, name: t.teamName }));

  // Output
  console.log('\n=== PRE-MIGRATION AUDIT REPORT ===\n');
  console.log(`Appwrite Teams: ${report.appwriteTeamCount}`);
  console.log(`DB Teams: ${report.dbTeamCount}`);
  console.log(`Orphaned DB teams (no Appwrite match): ${report.orphanedDbTeams.length}`);
  console.log(`Orphaned Appwrite teams (no DB match): ${report.orphanedAppwriteTeams.length}`);
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
  } else {
    console.log('\n✅ Data looks consistent. Safe to proceed.\n');
  }

  return report;
}

runPreMigrationAudit();
```

### Audit Checklist

- [ ] Run `npx ts-node scripts/pre-migration-audit.ts`
- [ ] Zero orphaned DB teams
- [ ] Zero orphaned Appwrite teams
- [ ] Zero memberships with invalid teamId
- [ ] Document count of memberships missing orgId (expected — fixed in Phase 1)
- [ ] Document count of teams missing createdBy (expected — fixed in Phase 1)
- [ ] Save audit output to `/docs/refactor/pre-migration-audit-results.json`

> **Do not proceed to Phase 1 if orphaned teams or invalid membership references are found.** Fix those manually first.

---

## Pre-Migration Setup

### Environment Preparation

- [ ] Create `.env.migration` file with feature flags
```bash
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false
EXPO_PUBLIC_MIGRATION_PHASE=0
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
ROLLBACK_ENABLED=true
```

- [ ] Take full database backup before starting
- [ ] Create rollback scripts
- [ ] Verify backup can be restored in staging

---

## Phase 1: Foundation (Days 1-3)

### Day 1: Schema Updates

#### Add orgId to memberships (Critical)

- [ ] Add `orgId` field to `memberships` collection in Appwrite Console
```typescript
await databases.createStringAttribute(DATABASE_ID, 'memberships', 'orgId', 36, false);
// Note: set required=false initially so existing records don't break
// Set to required=true after migration script populates all records
```

- [ ] Run migration script (uses pagination)
```typescript
// scripts/migrate-orgId-memberships.ts
import { paginatedList } from '@/utils/paginatedList';

async function migrateMembershipsOrgId() {
  const memberships = await paginatedList('memberships');
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const membership of memberships) {
    if (membership.orgId) {
      skipped++;
      continue; // Already has orgId
    }

    try {
      const team = await databases.getDocument('teams', membership.teamId);
      await databases.updateDocument('memberships', membership.$id, {
        orgId: team.orgId
      });
      updated++;
    } catch (err) {
      console.error(`Failed for membership ${membership.$id}:`, err);
      failed++;
    }
  }

  console.log(`✅ Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('⚠️ Some memberships failed. Check logs before continuing.');
    process.exit(1);
  }
}
```

- [ ] Verify all memberships have orgId
```typescript
const memberships = await paginatedList('memberships');
const missing = memberships.filter(m => !m.orgId);
console.log(`Missing orgId: ${missing.length}`); // Should be 0
```

- [ ] Once verified, set `orgId` to required in Appwrite Console

#### Add orgId to Other Collections

- [ ] Add `orgId` to `notifications` — populate from userId → memberships → orgId
- [ ] Add `orgId` to `tag_templates` — populate from `createdBy` → memberships → orgId
- [ ] Add `orgId` to `job_tag_assignments` — populate from `jobId` → jobchat → orgId
- [ ] Run pagination-safe migration script for each
- [ ] Verify counts match before and after each script

### Day 2: Service Layer Setup

#### Create Team Service Abstraction

- [ ] Create `/services/teamService.ts`

```typescript
// services/teamService.ts
import { databaseService } from '@/lib/appwrite/database';
import { Query } from 'react-native-appwrite';

const USE_CUSTOM_TEAMS = process.env.EXPO_PUBLIC_USE_CUSTOM_TEAMS === 'true';

export const teamService = {
  async listTeams(userId: string, orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customListTeams(userId, orgId);
    return this._appwriteListTeams(userId);
  },

  async createTeam(name: string, orgId: string, userId: string) {
    if (USE_CUSTOM_TEAMS) return this._customCreateTeam(name, orgId, userId);
    return this._appwriteCreateTeam(name, orgId, userId);
  },

  async getTeam(teamId: string, orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customGetTeam(teamId, orgId);
    return this._appwriteGetTeam(teamId);
  },

  async inviteMember(teamId: string, orgId: string, email: string, roles: string[], invitedBy: string) {
    if (USE_CUSTOM_TEAMS) return this._customInviteMember(teamId, orgId, email, roles, invitedBy);
    return this._appwriteInviteMember(teamId, email, roles, invitedBy);
  },

  async removeMember(teamId: string, membershipId: string, orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customRemoveMember(teamId, membershipId, orgId);
    return this._appwriteRemoveMember(teamId, membershipId);
  },

  async getMembership(teamId: string, userId: string, orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customGetMembership(teamId, userId, orgId);
    return this._appwriteGetMembership(teamId, userId);
  },

  async updateMemberRole(teamId: string, membershipId: string, roles: string[], orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customUpdateRole(teamId, membershipId, roles, orgId);
    return this._appwriteUpdateRole(teamId, membershipId, roles);
  },

  async acceptInvitation(token: string, userId: string, orgId: string) {
    if (USE_CUSTOM_TEAMS) return this._customAcceptInvitation(token, userId, orgId);
    return this._appwriteAcceptInvitation(token, userId);
  },

  // --- Custom implementations (pure DB) ---
  async _customListTeams(userId: string, orgId: string) { /* TODO */ },
  async _customCreateTeam(name: string, orgId: string, userId: string) { /* TODO */ },
  async _customGetTeam(teamId: string, orgId: string) { /* TODO */ },
  async _customInviteMember(teamId: string, orgId: string, email: string, roles: string[], invitedBy: string) { /* TODO */ },
  async _customRemoveMember(teamId: string, membershipId: string, orgId: string) { /* TODO */ },
  async _customGetMembership(teamId: string, userId: string, orgId: string) { /* TODO */ },
  async _customUpdateRole(teamId: string, membershipId: string, roles: string[], orgId: string) { /* TODO */ },
  async _customAcceptInvitation(token: string, userId: string, orgId: string) { /* TODO */ },

  // --- Appwrite legacy implementations ---
  async _appwriteListTeams(userId: string) { /* existing logic */ },
  async _appwriteCreateTeam(name: string, orgId: string, userId: string) { /* existing logic */ },
  async _appwriteGetTeam(teamId: string) { /* existing logic */ },
  async _appwriteInviteMember(teamId: string, email: string, roles: string[], invitedBy: string) { /* existing logic */ },
  async _appwriteRemoveMember(teamId: string, membershipId: string) { /* existing logic */ },
  async _appwriteGetMembership(teamId: string, userId: string) { /* existing logic */ },
  async _appwriteUpdateRole(teamId: string, membershipId: string, roles: string[]) { /* existing logic */ },
  async _appwriteAcceptInvitation(token: string, userId: string) { /* existing logic */ },
};
```

- [ ] Find all direct Appwrite Teams imports
```bash
grep -r "from.*appwrite.*client" --include="*.ts" --include="*.tsx" | grep "teams"
```

- [ ] Replace with `teamService` calls in:
  - [ ] `context/OrganizationContext.tsx`
  - [ ] `app/(jobs)/team.tsx`
  - [ ] `app/(jobs)/manage-member.tsx`
  - [ ] `app/(jobs)/invite.tsx`
  - [ ] `app/(jobs)/teams.tsx`
  - [ ] `app/(auth)/accept-invite.tsx`
  - [ ] `app/(jobs)/edit-team.tsx`
  - [ ] `app/(jobs)/delete-team.tsx`

### Day 3: Fix Disappearing Jobs

> ⚠️ **Appwrite does not support OR across different fields in a single query.** The fix requires two separate queries merged in application code.

- [ ] Update `listJobChats` in `lib/appwrite/database.ts`

```typescript
async listJobChats(teamId?: string, orgId?: string, userId?: string) {
  const baseQueries = [
    Query.limit(100),
    Query.orderDesc('$createdAt'),
    Query.isNull('deletedAt')  // exclude soft-deleted
  ];

  if (orgId) baseQueries.push(Query.equal('orgId', orgId));

  // Primary query: jobs in user's current team
  const teamJobs = teamId
    ? await databaseService.listDocuments('jobchat', [
        ...baseQueries,
        Query.equal('teamId', teamId)
      ])
    : { documents: [] };

  // Fallback query: jobs created by this user (survives team removal)
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

  // Sort by createdAt desc
  merged.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

  return { documents: merged, total: merged.length };
}
```

- [ ] Add `assignedTo` field to `jobchat` collection (optional, for future assignment)
- [ ] Test: create job → remove user from team → verify job still visible to creator

---

## Phase 2: Custom Invitations (Days 4-7)

### Day 4: Create Invitations Collection

- [ ] Create `invitations` collection with these attributes:
```typescript
{ key: 'teamId',            type: 'string',   size: 36,  required: true  }
{ key: 'orgId',             type: 'string',   size: 36,  required: true  }
{ key: 'invitedBy',         type: 'string',   size: 36,  required: true  }
{ key: 'invitedEmail',      type: 'string',   size: 255, required: true  }
{ key: 'invitedName',       type: 'string',   size: 100, required: false }
{ key: 'role',              type: 'string',   size: 20,  required: true  }
{ key: 'tokenHash',         type: 'string',   size: 64,  required: true  }
{ key: 'status',            type: 'string',   size: 20,  required: true  }
{ key: 'sentAt',            type: 'datetime',            required: true  }
{ key: 'expiresAt',         type: 'datetime',            required: true  }
{ key: 'acceptedAt',        type: 'datetime',            required: false }
{ key: 'acceptedByUserId',  type: 'string',   size: 36,  required: false }
```

- [ ] Create indexes:
```typescript
await databases.createIndex(DATABASE_ID, 'invitations', 'tokenHash_unique', 'unique', ['tokenHash']);
await databases.createIndex(DATABASE_ID, 'invitations', 'team_status', 'key', ['teamId', 'status']);
await databases.createIndex(DATABASE_ID, 'invitations', 'email_status', 'key', ['invitedEmail', 'status']);
```

#### Token Utilities

- [ ] Create `utils/crypto.ts`
```typescript
export function generateSecureToken(length: number = 32): string {
  // Use crypto.getRandomValues for security — not Math.random()
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

> ⚠️ The original checklist used `Math.random()` for token generation. This is **not cryptographically secure**. The version above uses `crypto.getRandomValues()` instead.

### Day 5-6: Invitation Service

- [ ] Implement `createInvitation` in `teamService.ts`
```typescript
async _customInviteMember(teamId, orgId, email, roles, invitedBy) {
  // Check for existing pending invite
  const existing = await databaseService.listDocuments('invitations', [
    Query.equal('teamId', teamId),
    Query.equal('invitedEmail', email.toLowerCase()),
    Query.equal('status', 'pending')
  ]);
  if (existing.documents.length > 0) throw new Error('Pending invitation already exists');

  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await databaseService.createDocument('invitations', {
    teamId, orgId, invitedBy,
    invitedEmail: email.toLowerCase(),
    role: roles[0] || 'member',
    tokenHash,
    status: 'pending',
    sentAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  });

  await this._sendInvitationEmail(email, teamId, token, expiresAt);
  return { success: true };
}
```

- [ ] Implement `acceptInvitation`
```typescript
async _customAcceptInvitation(token, userId, orgId) {
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
    throw new Error('Invitation expired');
  }

  // Verify email matches current user
  const { account } = await import('@/lib/appwrite/client');
  const user = await account.get();
  if (user.email.toLowerCase() !== invitation.invitedEmail) throw new Error('Email mismatch');

  // Check not already a member
  const existing = await databaseService.listDocuments('memberships', [
    Query.equal('teamId', invitation.teamId),
    Query.equal('userId', userId),
    Query.equal('isActive', true)
  ]);
  if (existing.documents.length > 0) throw new Error('Already a member of this team');

  // Create membership
  await databaseService.createDocument('memberships', {
    userId,
    teamId: invitation.teamId,
    orgId: invitation.orgId,
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

- [ ] Set up email sending (cloud function or third-party — e.g. Resend, SendGrid)
- [ ] Test invitation flow end-to-end in dev before proceeding

### Day 7: Update UI Components

- [ ] Update `app/(auth)/accept-invite.tsx` to use token from URL params
- [ ] Update invite send screen to call `teamService.inviteMember()`
- [ ] Handle expired/invalid token states in UI

---

## Phase 3: Remove Appwrite Teams (Days 8-12)

### Day 8: Enable Feature Flag + Test

- [ ] Set `EXPO_PUBLIC_USE_CUSTOM_TEAMS=true` in dev
- [ ] Test all team operations end-to-end:
  - [ ] Create team
  - [ ] List teams
  - [ ] Get team details
  - [ ] Update team
  - [ ] Soft delete team
  - [ ] Invite member
  - [ ] Accept invitation
  - [ ] List members
  - [ ] Update member role
  - [ ] Remove member

### Day 9-10: Data Migration

- [ ] Populate `createdBy` on all teams (paginated)
```typescript
// scripts/migrate-team-creators.ts
import { paginatedList } from '@/utils/paginatedList';

async function migrateTeamCreators() {
  const allTeams = await paginatedList('teams');
  let updated = 0;

  for (const team of allTeams) {
    if (team.createdBy) continue; // Already set

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

  console.log(`✅ Migrated createdBy on ${updated} teams`);
}
```

- [ ] Run verification script
```typescript
// scripts/verify-migration.ts
import { paginatedList } from '@/utils/paginatedList';

async function verifyMigration() {
  const issues: string[] = [];

  const teams = await paginatedList('teams', [Query.equal('isActive', true)]);
  teams.forEach(t => { if (!t.createdBy) issues.push(`Team ${t.$id} missing createdBy`); });

  const memberships = await paginatedList('memberships', [Query.equal('isActive', true)]);
  memberships.forEach(m => { if (!m.orgId) issues.push(`Membership ${m.$id} missing orgId`); });

  if (issues.length > 0) {
    console.error('Issues found:', issues);
    process.exit(1);
  }

  console.log('✅ Migration verified');
}
```

### Day 11-12: Remove Appwrite Teams Code

- [ ] Remove `teams` from `lib/appwrite/client.ts` exports
- [ ] Delete all `_appwrite*` methods from `teamService.ts`
- [ ] Remove feature flag conditional logic (keep only custom path)
- [ ] Remove `appwriteTeamId` attribute from `teams` collection
- [ ] Search and confirm zero remaining references:
```bash
grep -r "teams\.create\|teams\.get\|teams\.list\|teams\.delete\|teams\.updateName\|teams\.createMembership\|teams\.listMemberships\|teams\.updateMembership\|teams\.deleteMembership\|teams\.updateMembershipStatus" --include="*.ts" --include="*.tsx"
# Should return zero results
```

---

## Phase 4: Testing & Rollout (Days 13-16)

### Day 13-14: Internal Testing

- [ ] Manual test scenarios:
  - [ ] Create org → create team → invite 3 members → accept invitations
  - [ ] Remove a member → verify they lose team access but keep their created jobs
  - [ ] Delete team (soft) → verify team hidden, jobs still exist
  - [ ] Create job → switch teams → verify job visible in correct context
  - [ ] Invite with expired token → verify error message
  - [ ] Invite duplicate email → verify error message

### Day 15: Beta Rollout

- [ ] Enable for 5-10 real users
- [ ] Monitor for 24 hours:
  - [ ] Invitation acceptance rate
  - [ ] Team creation errors
  - [ ] Any job visibility regressions

### Day 16: Full Production

- [ ] `EXPO_PUBLIC_USE_CUSTOM_TEAMS=true` in production
- [ ] Monitor for 48 hours
- [ ] Keep rollback ready

---

## Phase 5: Cleanup (Days 17-18)

- [ ] Remove `EXPO_PUBLIC_USE_CUSTOM_TEAMS` env var and all references
- [ ] Remove dual-mode logic
- [ ] Archive migration scripts to `/scripts/archive/`
- [ ] Update developer docs

---

## Rollback Procedures

### Immediate (< 5 minutes)
```bash
# Set env var and redeploy
EXPO_PUBLIC_USE_CUSTOM_TEAMS=false
```

### Database Rollback (< 30 minutes)
```bash
# Restore from pre-migration backup
# Revert code to pre-migration commit
# Verify data integrity with audit script
```

---

## Success Criteria

- [ ] Pre-migration audit shows zero orphaned records
- [ ] All memberships have `orgId`
- [ ] All teams have `createdBy`
- [ ] Zero Appwrite Teams API calls in codebase
- [ ] Jobs do not disappear when creator is removed from team
- [ ] Invitation acceptance rate ≥ 95%
- [ ] Zero data loss
- [ ] Rollback tested

---

## Changes from Previous Version

| Item | Change |
|------|--------|
| Pre-migration audit | **Added** — run before any schema changes |
| Pagination helper | **Added** — all migration scripts must use it |
| `listDocuments` loops | **Fixed** — all now paginated (was silently missing records) |
| Token generation | **Fixed** — uses `crypto.getRandomValues()` not `Math.random()` |
| Job visibility query | **Fixed** — noted Appwrite OR limitation, uses two queries + merge |
| `required=false` on new fields | **Added** — prevents breaking existing records during migration |

---

*Last Updated: March 2026*  
*Document Owner: Engineering Team*
