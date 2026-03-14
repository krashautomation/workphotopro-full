# Database Schema Audit Report
## WorkPhotoPro V2 - Multi-Tenant Architecture Review

**Date:** March 2026  
**Auditor:** AI Code Review  
**Scope:** Complete database schema analysis vs. ideal multi-tenant structure

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Current Collections** | 15 |
| **Ideal Collections** | 10 |
| **Schema Alignment** | ⚠️ Needs Improvement |
| **Migration Difficulty** | Medium-High |

### Quick Stats
- **5/15 collections** are fully aligned with best practices
- **3 critical security gaps** identified (missing orgId fields)
- **Hybrid architecture** creating data consistency issues
- **Estimated migration time:** 3-4 weeks

---

## Current Collections Inventory

### 1. **organizations**
**Purpose:** Multi-tenant organization root entity

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `orgName` | String | Yes | Display name |
| `ownerId` | String | Yes | References Appwrite Users |
| `description` | String | No | Optional description |
| `logoUrl` | String | No | Organization logo URL |
| `isActive` | Boolean | Yes | Soft delete flag |
| `settings` | String | No | JSON string for settings |
| `premiumTier` | String | No | Subscription tier |
| `currentProductId` | String | No | Active product ID |
| `subscriptionId` | String | No | Subscription reference |
| `subscriptionExpiryDate` | String | No | ISO date string |
| `revenueCatCustomerId` | String | No | RevenueCat customer ID |
| `hdCaptureEnabled` | Boolean | No | Feature flag |
| `timestampEnabled` | Boolean | No | Feature flag |
| `watermarkEnabled` | Boolean | No | Feature flag (default: true) |
| `videoRecordingEnabled` | Boolean | No | Feature flag |
| `hdVideoEnabled` | Boolean | No | Feature flag |

**Missing from Ideal Schema:**
- ❌ No `slug` for URL-friendly names
- ❌ No `billingEmail` field
- ❌ No `metadata` JSON field for extensibility

**Status:** ✅ **Good** - Core fields present

---

### 2. **teams**
**Purpose:** Team metadata (custom database layer over Appwrite Teams)

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `teamName` | String | Yes | Display name |
| `appwriteTeamId` | String | Yes | **DEPRECATED:** Links to Appwrite Teams SDK |
| `orgId` | String | Yes | References Organizations |
| `description` | String | No | Optional description |
| `email` | String | No | Contact email |
| `website` | String | No | Team website |
| `address` | String | No | Physical address |
| `phone` | String | No | Contact phone |
| `teamPhotoUrl` | String | No | Team logo/photo |
| `isActive` | Boolean | Yes | Soft delete flag |
| `settings` | String | No | JSON string for settings |

**Missing from Ideal Schema:**
- ❌ No `createdBy` field (being added per migration plan)
- ❌ No `slug` for URLs
- ❌ No `memberCount` (computed on demand per migration plan)
- ❌ **Hybrid architecture** - still depends on Appwrite Teams SDK

**Status:** ⚠️ **Needs Improvement** - Hybrid system creates complexity

**Code Reference:** `lib/appwrite/teams.ts:120-138`

---

### 3. **memberships**
**Purpose:** Team membership records (custom layer over Appwrite memberships)

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | References Appwrite Users |
| `teamId` | String | Yes | References Teams |
| `role` | String | Yes | 'owner', 'admin', 'member' |
| `userEmail` | String | No | Cached email |
| `userName` | String | No | Cached name (can become stale) |
| `profilePicture` | String | No | Cached photo URL (can become stale) |
| `invitedBy` | String | Yes | User ID who invited |
| `joinedAt` | String | Yes | ISO date string |
| `isActive` | Boolean | Yes | Soft delete flag |
| `canShareJobReports` | Boolean | No | Permission flag |

**Missing from Ideal Schema:**
- ❌ **No `orgId`** for multi-tenant security at membership level 🔴
- ❌ No `status` field (pending/accepted/declined)
- ❌ No `invitedAt` timestamp
- ❌ Caching `userName`, `profilePicture` can become stale

**Status:** ⚠️ **Needs Improvement** - Missing org isolation

**Code Reference:** `lib/appwrite/teams.ts:155-172`

---

### 4. **jobchat** (jobs)
**Purpose:** Job/chat entities - core app functionality

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `title` | String | Yes | Job title |
| `description` | String | Yes | Job description |
| `isPrivate` | Boolean | No | Privacy flag |
| `status` | Enum | No | 'active', 'completed', 'archived' |
| `createdBy` | String | No | Creator's user ID |
| `createdByName` | String | No | **DENORMALIZED:** Creator's name |
| `deletedAt` | String | No | Soft delete timestamp |
| `teamId` | String | Yes | References Teams |
| `orgId` | String | Yes | References Organizations |
| `$sequence` | Number | Yes | Appwrite sequence |

**Missing from Ideal Schema:**
- ❌ No `assignedTo` field for job assignment
- ❌ No `dueDate` field
- ❌ No `priority` field
- ❌ No `location` field (for field service)
- ❌ No `tags` array (using separate join table instead)
- ❌ `createdByName` is denormalized (can become stale)

**Status:** ⚠️ **Needs Improvement** - Missing field service fields

**Code Reference:** `lib/appwrite/database.ts:114-230`

---

### 5. **messages**
**Purpose:** Chat messages within jobs

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `content` | String | Yes | Message text |
| `senderId` | String | Yes | User who sent |
| `senderName` | String | Yes | **DENORMALIZED:** Sender's name |
| `senderPhoto` | String | No | **DENORMALIZED:** Sender's photo |
| `jobId` | String | Yes | References JobChat |
| `teamId` | String | Yes | References Teams |
| `orgId` | String | Yes | References Organizations |
| `imageUrl` | String | No | Single image (legacy) |
| `imageFileId` | String | No | Single image file ID |
| `imageUrls` | Array | No | Multiple images |
| `imageFileIds` | Array | No | Multiple image file IDs |
| `videoUrl` | String | No | Video URL |
| `videoFileId` | String | No | Video file ID |
| `audioUrl` | String | No | Audio URL |
| `audioFileId` | String | No | Audio file ID |
| `audioDuration` | Number | No | Audio length in seconds |
| `fileUrl` | String | No | File URL |
| `fileFileId` | String | No | File ID |
| `fileName` | String | No | Original filename |
| `fileSize` | Number | No | File size in bytes |
| `fileMimeType` | String | No | MIME type |
| `locationData` | Object | No | `{latitude, longitude, address, timestamp}` |
| `messageType` | Enum | No | 'text', 'image', 'video', 'location', 'file', 'audio' |
| `isTask` | Boolean | No | **EMBEDDED:** Task flag |
| `taskStatus` | Enum | No | 'active', 'completed' |
| `isDuty` | Boolean | No | **EMBEDDED:** Duty flag |
| `dutyStatus` | Enum | No | 'active', 'completed' |
| `replyToMessageId` | String | No | Threading support |
| `replyCount` | Number | No | Number of replies |

**Missing from Ideal Schema:**
- ❌ Tasks/duties embedded in messages (not separate collection)
- ❌ Denormalized `senderName`, `senderPhoto` (can become stale)
- ❌ No `editedAt` field for message edits
- ❌ No `deletedAt` for soft delete

**Status:** ⚠️ **Needs Improvement** - Tasks should be separate collection

**Code Reference:** `lib/appwrite/database.ts:232-275`

---

### 6. **tag_templates**
**Purpose:** Tag definitions for categorizing jobs

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `name` | String | Yes | Tag name |
| `color` | String | Yes | Hex color code |
| `icon` | String | No | Icon name |
| `description` | String | No | Tag description |
| `isActive` | Boolean | Yes | Soft delete flag |
| `sortOrder` | Number | Yes | Display order |
| `createdBy` | String | Yes | User who created |

**Missing from Ideal Schema:**
- ❌ **No `orgId`** - tags are global (should be per-organization) 🔴
- ❌ No `teamId` for team-specific tags

**Status:** ⚠️ **Needs Improvement** - Not multi-tenant

**Code Reference:** `lib/appwrite/database.ts:277-531`

---

### 7. **job_tag_assignments**
**Purpose:** Many-to-many join table for jobs and tags

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `jobId` | String | Yes | References JobChat |
| `tagTemplateId` | String | Yes | References TagTemplate |
| `assignedBy` | String | Yes | User ID who assigned |
| `assignedAt` | String | Yes | ISO date string |
| `isActive` | Boolean | Yes | Soft delete flag |

**Missing from Ideal Schema:**
- ❌ **No `orgId`** for tenant isolation 🔴

**Status:** ⚠️ **Needs Improvement** - Missing tenant isolation

---

### 8. **user_preferences**
**Purpose:** User-specific app settings

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | References Appwrite Users |
| `timestampEnabled` | Boolean | Yes | Watermark setting |
| `timestampFormat` | Enum | No | 'short', 'long' |
| `hdPreferences` | Object | No | Resolution preferences by job |
| `hdPreferencesRaw` | String | No | JSON string version |
| `timestampPreferences` | Object | No | Timestamp settings by job |

**Missing from Ideal Schema:**
- ❌ Not part of ideal schema (ideal uses `users` table)
- ❌ No `orgId`/`teamId` context (org-level settings override user settings)

**Status:** ⚠️ **Redundant** - Should be in users table or per-org

**Code Reference:** `lib/appwrite/database.ts:533-631`

---

### 9. **notifications**
**Purpose:** User notification records

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | Recipient user ID |
| `type` | Enum | Yes | 'job_assigned', 'message', 'team_invite', etc. |
| `title` | String | Yes | Notification title |
| `message` | String | Yes | Notification body |
| `data` | String | No | JSON string with metadata |
| `isRead` | Boolean | Yes | Read status |
| `readAt` | String | No | ISO date when read |

**Missing from Ideal Schema:**
- ❌ **No `orgId`/`teamId`** for context 🔴
- ❌ No `actorId` (who triggered the notification)
- ❌ No `priority` field

**Status:** ⚠️ **Needs Improvement** - Missing tenant context

**Code Reference:** `lib/appwrite/notifications.ts:25-247`

---

### 10. **user_push_tokens**
**Purpose:** FCM push notification tokens

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | Appwrite user ID |
| `token` | String | Yes | FCM/Expo push token |
| `platform` | String | Yes | 'ios', 'android', 'web' |
| `createdAt` | String | Yes | ISO date string |
| `updatedAt` | String | Yes | ISO date string |

**Missing from Ideal Schema:**
- ❌ Not part of ideal schema (could be in users table)

**Status:** ⚠️ **Redundant** - Could be consolidated

**Code Reference:** `lib/appwrite/pushTokens.ts:1-100`

---

### 11. **user_contacts** ✅
**Purpose:** Hashed contact data for "People You May Know"

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | Owner user ID |
| `phoneHash` | String | No | SHA-256 hash of phone |
| `emailHash` | String | No | SHA-256 hash of email |
| `contactHash` | String | Yes | Primary hash identifier |
| `contactType` | Enum | Yes | 'phone', 'email' |
| `syncedAt` | String | Yes | ISO date string |
| `isActive` | Boolean | Yes | Soft delete flag |

**Status:** ✅ **Good** - Privacy-focused design

**Code Reference:** `lib/appwrite/contacts.ts:7-18`

---

### 12. **contact_matches** ✅
**Purpose:** Matches between user contacts and app users

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | User who owns contact |
| `matchedUserId` | String | Yes | Matched app user ID |
| `contactHash` | String | Yes | Hash that matched |
| `matchType` | Enum | Yes | 'phone', 'email', 'both' |
| `matchedAt` | String | Yes | ISO date string |
| `isActive` | Boolean | Yes | Soft delete flag |

**Status:** ✅ **Good** - Privacy-focused design

**Code Reference:** `lib/appwrite/contacts.ts:20-30`

---

### 13. **user_contact_sync** ✅
**Purpose:** Contact sync tracking

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | Appwrite user ID (unique) |
| `lastSyncedAt` | String | No | Last sync timestamp |
| `contactsCount` | Number | Yes | Number of contacts |
| `matchesCount` | Number | Yes | Number of matches |
| `syncStatus` | Enum | Yes | 'pending', 'syncing', 'completed', 'failed' |
| `syncVersion` | Number | Yes | Increment on each sync |

**Status:** ✅ **Good** - Metadata tracking

**Code Reference:** `lib/appwrite/contacts.ts:32-42`

---

### 14. **subscriptions** ✅
**Purpose:** RevenueCat subscription records

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `userId` | String | Yes | Appwrite user ID |
| `orgId` | String | Yes | Organization ID |
| `revenueCatCustomerId` | String | Yes | RevenueCat customer ID |
| `productId` | String | Yes | Product identifier |
| `status` | Enum | Yes | 'active', 'grace_period', 'billing_issue', etc. |
| `startDate` | String | Yes | ISO date string |
| `expiryDate` | String | Yes | ISO date string |
| `autoRenewing` | Boolean | Yes | Auto-renew flag |
| `canceledAt` | String | No | Cancellation date |
| `lastSyncedAt` | String | Yes | Last RevenueCat sync |
| `trialEndDate` | String | No | Trial expiration |
| `packageId` | String | No | Package identifier |

**Status:** ✅ **Good** - Complete subscription tracking

**Code Reference:** `utils/types.ts:37-56`

---

### 15. **revenuecat_events** ✅
**Purpose:** RevenueCat webhook events

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `$id` | String | Yes | Appwrite document ID |
| `eventId` | String | Yes | RevenueCat event ID (unique) |
| `eventType` | String | Yes | 'INITIAL_PURCHASE', 'RENEWAL', etc. |
| `eventCategory` | Enum | Yes | 'subscription', 'entitlement', 'customer' |
| `customerId` | String | Yes | RevenueCat customer ID |
| `userId` | String | No | Appwrite user ID |
| `orgId` | String | No | Organization ID |
| `productId` | String | No | Product ID |
| `eventData` | String | No | Full event payload (JSON) |
| `attemptNumber` | Number | Yes | Retry attempt count |
| `processedStatus` | Enum | Yes | 'pending', 'success', 'failed', 'ignored' |
| `processedAt` | String | No | Processing timestamp |
| `errorMessage` | String | No | Error if failed |

**Status:** ✅ **Good** - Event audit log

**Code Reference:** `utils/types.ts:61-80`

---

## Ideal Schema Comparison

### Missing Collections (per ideal structure):

1. **invitations** - Currently using Appwrite Teams for invitations
   - Status: Documented in migration plan, not yet implemented
   
2. **tasks** - Embedded in messages (isTask flag)
   - Current: `messages.isTask` + `messages.taskStatus`
   - Ideal: Separate `tasks` collection
   
3. **media** - Media URLs stored directly in messages
   - Current: `messages.imageUrls[]`, `videoUrl`, etc.
   - Ideal: Separate `media` collection with metadata

### Collection Mapping

| Ideal Collection | Current Implementation | Status |
|------------------|------------------------|--------|
| users | Appwrite Auth + `user_preferences` | ⚠️ Partial |
| organizations | `organizations` | ✅ Good |
| org_members | **MISSING** | 🔴 Not implemented |
| teams | `teams` (hybrid) | ⚠️ Needs work |
| team_members | `memberships` | ⚠️ Missing orgId |
| jobs | `jobchat` | ⚠️ Missing fields |
| media | **Embedded in messages** | ⚠️ Not separate |
| messages | `messages` | ⚠️ Tasks embedded |
| tasks | **Embedded in messages** | 🔴 Not separate |
| invitations | **Using Appwrite Teams** | 🔴 Not implemented |

---

## Risky Relationships & Bug Patterns

### 🔴 CRITICAL: Jobs Disappearing Due to Membership Filtering

**Location:** `lib/appwrite/database.ts:133-165`

**Problem:**
```typescript
async listJobChats(teamId?: string, orgId?: string) {
  // Jobs are filtered by teamId/orgId
  // If user is removed from team, teamId/orgId context may be lost
  // Jobs become inaccessible even though they still exist
}
```

**Impact:** When a user is removed from a team, jobs they created may disappear from their view, even though they should still see jobs they created or are assigned to.

**Real-world scenario:**
1. User A creates Job #123 in Team Alpha
2. User A is removed from Team Alpha
3. User A can no longer see Job #123
4. Job #123 appears orphaned but still exists in database

**Mitigation:**
- Add `createdBy` filtering as fallback
- Implement job assignment logic
- Query: `Query.equal('createdBy', userId)` OR `Query.equal('assignedTo', userId)`

**Priority:** 🔴 HIGH - Fix immediately

---

### 🟡 MEDIUM: Stale Denormalized Data

**Location:** Multiple collections

**Problem:**
- `jobchat.createdByName` - Not updated when user changes name
- `messages.senderName`, `senderPhoto` - Stale if user updates profile
- `memberships.userName`, `profilePicture` - Cached but not refreshed

**Impact:** Users see outdated names/photos in historical data. Confusing UX.

**Example:**
- User "John Doe" changes name to "John Smith"
- Old messages still show "John Doe"
- New messages show "John Smith"

**Mitigation:**
- Option 1: Remove denormalized fields, fetch fresh data via JOINs
- Option 2: Implement periodic sync (e.g., on app launch)
- Option 3: Use database triggers to cascade updates

**Priority:** 🟡 MEDIUM - Fix in next sprint

---

### 🔴 CRITICAL: Hybrid Teams Architecture

**Location:** `lib/appwrite/teams.ts`

**Problem:** Current system uses BOTH Appwrite Teams SDK AND custom `teams`/`memberships` collections.

**Code Evidence:**
```typescript
// Creating team requires both Appwrite Teams AND database
const appwriteTeam = await teams.create(ID.unique(), name, roles);
const teamDoc = await databaseService.createDocument('teams', {
  teamName: name,
  appwriteTeamId: appwriteTeam.$id, // Linking required!
  // ...
});
```

**Fallback chaos when Appwrite lookup fails:**
```typescript
// Lines 191-244: Complex fallback logic creating "mock" teams
const mockAppwriteTeam = {
  $id: teamId,
  name: teamDoc.teamName,
  // ...
};
```

**Impact:** 
- Data inconsistencies between Appwrite Teams and custom collections
- Complex fallback logic creating technical debt
- 20 API calls to Appwrite Teams SDK across the codebase

**Mitigation:** Complete migration to custom collections per `docs/teams-migration-plan.md`

**Priority:** 🔴 HIGH - Execute migration plan

---

### 🟡 MEDIUM: Global Tags (Not Multi-Tenant)

**Location:** `tag_templates` collection

**Problem:** Tags are global (`createdBy` only), not scoped to `orgId` or `teamId`.

**Impact:**
- Organization A sees Organization B's tags
- Tag name collisions across organizations
- Cannot customize tags per organization

**Example:**
- Org A creates tag "Urgent" (red)
- Org B creates tag "Urgent" (blue)
- Conflict: Which color shows?

**Mitigation:**
```typescript
// Add to tag_templates:
orgId: string;        // Required for tenant isolation
teamId?: string;      // Optional for team-specific tags
isGlobal: boolean;    // Org-wide vs team-only
```

**Priority:** 🟡 MEDIUM - Fix before multi-tenant GA

---

### 🔴 CRITICAL: No orgId on Memberships

**Location:** `memberships` collection

**Problem:** Memberships only have `teamId`, not `orgId`.

**Security Risk:**
```typescript
// Current query (no org validation):
const memberships = await databaseService.listDocuments('memberships', [
  Query.equal('userId', userId),
  Query.equal('teamId', teamId)
]);

// Missing security check:
// Query.equal('orgId', currentOrgId) // NOT IMPLEMENTED
```

**Attack Vector:**
1. User is removed from Organization A
2. User knows Team Alpha's ID (still in Organization A)
3. User can still query memberships for Team Alpha
4. Data leakage occurs

**Mitigation:**
1. Add `orgId` to `memberships` collection
2. Validate `orgId` on every membership access
3. Add database constraint: `UNIQUE(teamId, userId, orgId)`

**Priority:** 🔴 HIGH - Security vulnerability

---

### 🟡 MEDIUM: Tasks Embedded in Messages

**Location:** `messages` collection

**Problem:** Tasks use `isTask` boolean + `taskStatus` enum instead of separate collection.

**Impact:**
- Cannot query all tasks across jobs efficiently
- Task metadata limited to message fields
- No task-specific fields (assignee, due date, priority)
- Task lifecycle tied to message lifecycle

**Current Schema:**
```typescript
messages: {
  isTask?: boolean;
  taskStatus?: 'active' | 'completed';
  // Missing: assignedTo, dueDate, priority, etc.
}
```

**Ideal Schema:**
```typescript
tasks: {
  jobId: string;
  messageId?: string;  // Optional link to originating message
  assignedTo: string;
  createdBy: string;
  title: string;
  description?: string;
  status: 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  orgId: string;
  teamId: string;
}
```

**Priority:** 🟡 MEDIUM - Refactor for v2

---

## Schema Alignment Score

| Category | Score | Weight | Notes |
|----------|-------|--------|-------|
| **Multi-tenancy** | 6/10 | 30% | orgId present on most, but missing on critical collections |
| **Normalization** | 5/10 | 20% | Too much denormalization (names, photos cached) |
| **Audit Trail** | 7/10 | 15% | Soft deletes present, missing some timestamps |
| **Relationship Integrity** | 5/10 | 20% | Hybrid architecture creates inconsistencies |
| **Field Service Features** | 4/10 | 15% | Missing assignment, priority, due dates |
| **OVERALL** | **5.4/10** | 100% | **Needs Improvement** |

### Score Breakdown by Collection

| Collection | Score | Issues |
|------------|-------|--------|
| organizations | 8/10 | Missing slug, billingEmail |
| teams | 5/10 | Hybrid architecture, missing createdBy |
| memberships | 4/10 | **Missing orgId**, stale cached fields |
| jobchat | 5/10 | Missing assignment fields, denormalized name |
| messages | 5/10 | Tasks embedded, denormalized sender info |
| tag_templates | 4/10 | **Not multi-tenant** (no orgId) |
| job_tag_assignments | 5/10 | **Missing orgId** |
| user_preferences | 6/10 | Redundant separate collection |
| notifications | 5/10 | **Missing orgId/teamId** |
| user_push_tokens | 7/10 | Could be consolidated |
| user_contacts | 9/10 | Well designed |
| contact_matches | 9/10 | Well designed |
| user_contact_sync | 9/10 | Well designed |
| subscriptions | 9/10 | Complete |
| revenuecat_events | 9/10 | Complete |

---

## Suggested Schema Improvements

### 🔴 HIGH PRIORITY (Security & Stability)

#### 1. Add `orgId` to ALL Collections

**Collections needing orgId:**
- `memberships` - Security critical
- `notifications` - Context required
- `tag_templates` - Tenant isolation
- `job_tag_assignments` - Security critical
- `user_preferences` - Org-level overrides

**Migration Script:**
```typescript
// Migration: Add orgId to memberships
async function addOrgIdToMemberships() {
  const memberships = await database.listDocuments('memberships');
  
  for (const membership of memberships.documents) {
    // Get team to find orgId
    const team = await database.getDocument('teams', membership.teamId);
    
    // Update membership with orgId
    await database.updateDocument('memberships', membership.$id, {
      orgId: team.orgId
    });
  }
}
```

**Validation:**
```typescript
// Middleware pattern for all queries
function withOrgValidation(queries: string[], orgId: string): string[] {
  return [...queries, Query.equal('orgId', orgId)];
}
```

---

#### 2. Complete Teams Migration

**Remove Appwrite Teams dependency per `docs/teams-migration-plan.md`**

**Steps:**
1. Add `createdBy` to `teams` collection
2. Create `invitations` collection
3. Replace 20 Appwrite Teams API calls
4. Update `accept-invite.tsx` screen
5. Add token hashing utilities

**Timeline:** 2-3 weeks (documented in migration plan)

**Benefits:**
- Eliminates hybrid complexity
- Full control over team logic
- Simpler data model
- Better performance (no N+1 queries)

---

#### 3. Add Tenant Validation Middleware

**Implement for all data access:**
```typescript
// lib/appwrite/tenantValidation.ts
export async function validateTenantAccess(
  collection: string,
  documentId: string,
  userOrgId: string
): Promise<boolean> {
  const doc = await database.getDocument(collection, documentId);
  return doc.orgId === userOrgId;
}

// Usage in services
if (!await validateTenantAccess('teams', teamId, currentOrgId)) {
  throw new Error('Access denied: organization mismatch');
}
```

---

### 🟡 MEDIUM PRIORITY (Data Integrity)

#### 4. Remove or Sync Denormalized Fields

**Option A: Remove denormalization (RECOMMENDED)**
```typescript
// Remove these fields:
jobchat.createdByName    // Fetch from users table
messages.senderName      // Fetch from memberships
messages.senderPhoto     // Fetch from memberships
```

**Option B: Sync on user update**
```typescript
// When user updates profile:
async function syncUserProfile(userId: string, newName: string, newPhoto: string) {
  // Update all memberships
  const memberships = await database.listDocuments('memberships', [
    Query.equal('userId', userId)
  ]);
  
  for (const membership of memberships.documents) {
    await database.updateDocument('memberships', membership.$id, {
      userName: newName,
      profilePicture: newPhoto
    });
  }
  
  // Update all messages (may be expensive - consider background job)
  // ... similar for messages
}
```

---

#### 5. Add Missing Job Fields

**Extend `jobchat` collection:**
```typescript
jobchat: {
  // Existing fields...
  
  // NEW FIELDS:
  assignedTo?: string;           // User ID responsible for job
  dueDate?: string;              // ISO date for deadline
  priority: 'low' | 'medium' | 'high';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  estimatedHours?: number;       // For field service
  actualHours?: number;          // Time tracking
  customerName?: string;         // Client info
  customerPhone?: string;
  customerEmail?: string;
}
```

---

#### 6. Separate Tasks from Messages

**Create new `tasks` collection:**
```typescript
// New collection: tasks
tasks: {
  $id: string;
  jobId: string;                    // Parent job
  messageId?: string;               // Optional: originating message
  
  // Assignment
  assignedTo: string;               // User ID
  createdBy: string;
  
  // Content
  title: string;
  description?: string;
  
  // Status
  status: 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  
  // Dates
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  
  // Tenant isolation
  orgId: string;
  teamId: string;
  
  // Metadata
  $createdAt: string;
  $updatedAt: string;
}
```

**Migration:**
```typescript
// Extract tasks from existing messages
async function migrateTasksFromMessages() {
  const messagesWithTasks = await database.listDocuments('messages', [
    Query.equal('isTask', true)
  ]);
  
  for (const message of messagesWithTasks.documents) {
    await database.createDocument('tasks', {
      jobId: message.jobId,
      messageId: message.$id,
      assignedTo: message.senderId,  // Default to creator
      createdBy: message.senderId,
      title: message.content.substring(0, 100), // Truncate
      status: message.taskStatus,
      orgId: message.orgId,
      teamId: message.teamId,
    });
  }
}
```

---

### 🟢 LOW PRIORITY (Optimization)

#### 7. Consolidate User Data

**Merge into users collection or keep separate with proper indexes:**
```typescript
// Option 1: Merge (requires Appwrite Functions for auth hooks)
users: {
  // Appwrite Auth fields...
  
  // From user_preferences
  preferences: {
    timestampEnabled: boolean;
    timestampFormat: string;
    hdPreferences: object;
  };
  
  // From user_push_tokens (array)
  pushTokens: Array<{
    token: string;
    platform: string;
    updatedAt: string;
  }>;
}

// Option 2: Keep separate but add indexes
// Add indexes on user_preferences: userId (unique)
// Add indexes on user_push_tokens: userId, platform
```

---

#### 8. Add Slugs for SEO/UX

```typescript
// Add to all entity collections
organizations: { slug: string; }  // e.g., "acme-corp"
teams: { slug: string; }          // e.g., "field-team-alpha"
jobchat: { slug: string; }        // e.g., "repair-job-123"

// Auto-generate from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
```

---

## Migration Difficulty Estimate

### Detailed Breakdown

| Migration Task | Effort | Risk | Dependencies |
|----------------|--------|------|--------------|
| **Add orgId to memberships** | 2 days | Low | None |
| **Add orgId to notifications** | 1 day | Low | None |
| **Add orgId to tag_templates** | 2 days | Medium | Data migration |
| **Add orgId to job_tag_assignments** | 1 day | Low | None |
| **Create invitations collection** | 3 days | Medium | Teams migration |
| **Remove Appwrite Teams dependency** | 10 days | High | Invitations ready |
| **Migrate tasks from messages** | 3 days | Medium | New tasks collection |
| **Fix denormalized data** | 2 days | Low | None |
| **Add job assignment fields** | 1 day | Low | None |
| **Add slugs** | 1 day | Low | None |
| **Testing & validation** | 3 days | Medium | All above |
| **Rollback procedure testing** | 1 day | Low | All above |
| **TOTAL** | **~30 days (6 weeks)** | **Medium-High** | - |

### Phased Approach (Recommended)

#### Phase 1: Security Fixes (Week 1)
- Add orgId to memberships
- Add orgId to notifications
- Add tenant validation middleware
- **Risk:** Low
- **Value:** High

#### Phase 2: Teams Migration (Weeks 2-3)
- Complete teams-migration-plan.md
- Create invitations collection
- Remove Appwrite Teams dependency
- **Risk:** High
- **Value:** High

#### Phase 3: Data Integrity (Week 4)
- Fix denormalized fields
- Add job assignment fields
- Scope tags to organizations
- **Risk:** Medium
- **Value:** Medium

#### Phase 4: Feature Enhancements (Weeks 5-6)
- Separate tasks from messages
- Add slugs
- Consolidate user data
- **Risk:** Low
- **Value:** Medium

### Rollback Strategy

**Per Phase Rollback:**
1. **Database backups** before each phase
2. **Feature flags** for major changes
3. **Dual-mode operation** during transition (old + new)
4. **Monitoring** for 48 hours post-deployment

**Emergency Rollback Procedure:**
```bash
# If critical issues detected:
1. Restore database from backup
2. Revert code to previous version
3. Clear CDN/cache
4. Notify users of temporary downtime
5. Post-mortem within 24 hours
```

---

## Recommendations

### Immediate (This Week)

1. **Add orgId to memberships collection**
   ```typescript
   // Critical security fix
   await databases.createStringAttribute(
     DATABASE_ID,
     'memberships',
     'orgId',
     36,
     true  // required
   );
   ```

2. **Document current schema**
   - Create entity-relationship diagram
   - Document all relationships
   - Identify orphaned record risks

3. **Add database constraints**
   ```typescript
   // Prevent orphaned records
   await databases.createIndex(
     DATABASE_ID,
     'memberships',
     'teamId_userId_unique',
     'unique',
     ['teamId', 'userId']
   );
   ```

### Short-term (Next Month)

1. **Complete teams migration** per documented plan
2. **Add missing job fields** (assignedTo, dueDate, priority)
3. **Scope tags to organizations** (add orgId to tag_templates)

### Long-term (Next Quarter)

1. **Refactor denormalized fields** to use JOINs
2. **Separate tasks from messages** into own collection
3. **Add comprehensive audit logging** (who changed what when)
4. **Implement soft-delete** for all entities consistently

---

## Conclusion

The current schema supports the basic multi-tenant structure but has **critical gaps in tenant isolation** and suffers from a **hybrid architecture** that creates data consistency issues. The teams-migration-plan document shows awareness of these issues and provides a solid roadmap.

### Key Takeaways

1. **Security First:** Address missing `orgId` fields immediately to prevent data leakage
2. **Architecture Debt:** Complete the teams migration to eliminate hybrid complexity
3. **Data Quality:** Fix denormalized fields to prevent stale data
4. **Feature Gaps:** Add job assignment fields for field service workflows

### Success Metrics

Track these metrics post-migration:
- Zero cross-organization data access incidents
- <100ms query performance for team listings
- 99.9% data consistency (no orphaned records)
- Zero jobs "disappearing" for users

### Resources

- **Migration Plan:** `docs/teams-migration-plan.md`
- **Contacts Schema:** `docs/CONTACTS_DATABASE_SCHEMA.md`
- **Type Definitions:** `utils/types.ts`
- **Database Services:** `lib/appwrite/database.ts`, `lib/appwrite/teams.ts`

---

**Next Review Date:** After Phase 2 completion (teams migration)  
**Document Owner:** Engineering Team  
**Stakeholders:** Product, QA, DevOps
