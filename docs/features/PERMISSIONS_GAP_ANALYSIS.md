# Permissions Gap Analysis

**Date:** 2026-03-15
**Updated:** 2026-03-15
**Analysis Scope:** Screens not in PERMISSIONS_AUDIT.md that perform data modification

## Update Log

### 2026-03-15 - Permissions Infrastructure Complete
- ✅ **canEditJob** added to utils/permissions.ts (owner OR job creator)
- ✅ **canEditOrganization** added to utils/permissions.ts (org owner only)
- ✅ All HIGH priority files now have required permissions available
- Ready to implement: archived-teams.tsx, edit-job-title.tsx, edit-tag.tsx, edit-organization.tsx

## Executive Summary

| Category | Count | Priority |
|----------|-------|----------|
| **High Priority** | 4 | Missing critical permission checks on data modification |
| **Medium Priority** | 2 | Should have permission checks for better security |
| **Low Priority** | 3 | User-specific data or read-only operations |
| **Already Protected** | 5 | Parent controls or already has usePermissions |

---

## High Priority - Missing Critical Permission Checks

### 1. archived-teams.tsx
**File:** `app/(jobs)/archived-teams.tsx`

**Data Modifications:**
- Line 75: `databaseService.updateDocument('jobchat', ...)` - Restores deleted jobs
- Line 94: `databaseService.updateDocument('teams', ...)` - Restores archived team

**Current Permission Checks:**
- ❌ NONE - No usePermissions import or checks

**Required Permission:**
- ✅ **AVAILABLE:** `canEditTeamSettings` (owner only)
- Similar to trashed-jobs.tsx which was restricted to owners

**Risk:**
- Any team member can restore archived teams and associated jobs
- Could restore data that was intentionally archived by owners

**Recommendation:**
```typescript
const { canEditTeamSettings } = usePermissions();
// Gate restore actions with permission check
```

**Status:** Permission available in utils/permissions.ts - ready to implement
**Priority:** HIGH

---

### 2. edit-job-title.tsx
**File:** `app/(jobs)/edit-job-title.tsx`

**Data Modifications:**
- Line 32: `db.updateDocument(appwriteConfig.col.jobchat, ...)` - Updates job title

**Current Permission Checks:**
- ❌ NONE - No usePermissions import or checks
- Only checks if user is authenticated

**Required Permission:**
- ✅ **AVAILABLE:** `canEditJob` (owner or job creator)
- Same logic as canDeleteJob

**Risk:**
- Any authenticated user can edit any job title if they know the jobId
- No validation that user is member of the team

**Recommendation:**
```typescript
const { canEditJob } = usePermissions(jobCreatedBy);
// Check permission before allowing edit
```

**Status:** Permission available in utils/permissions.ts - ready to implement
**Priority:** HIGH

---

### 3. edit-tag.tsx
**File:** `app/(jobs)/edit-tag.tsx`

**Data Modifications:**
- Line 65: `tagService.updateTagTemplate(...)` - Updates tag template

**Current Permission Checks:**
- ❌ NONE - No usePermissions import or checks

**Required Permission:**
- ✅ **AVAILABLE:** `canManageTags` (owner or admin)
- Tags are team/org-wide resources

**Risk:**
- Any authenticated user can modify tag templates
- Could break tagging system for entire organization

**Recommendation:**
```typescript
const { canManageTags } = usePermissions();
// Block screen or disable save if !canManageTags
```

**Status:** Permission available in utils/permissions.ts - ready to implement
**Priority:** HIGH

---

### 4. edit-organization.tsx
**File:** `app/(jobs)/edit-organization.tsx`

**Data Modifications:**
- Line 105: `createOrganization(...)` - Creates new organization
- Line 109: `organizationService.updateOrganization(...)` - Updates org with logo
- Line 151: `organizationService.updateOrganization(...)` - Updates org data
- Lines 247-251: `storage.createFile(...)` - Uploads org logo

**Current Permission Checks:**
- ⚠️ PARTIAL - Checks `organizationToEdit.ownerId === user?.$id` for editing
- ❌ No check for createOrganization

**Required Permission:**
- ✅ **AVAILABLE:** `canCreateOrganization` (via `canCreateTeam` or owner check)
- ✅ **AVAILABLE:** `canEditOrganization` (org owner only - `currentOrganization?.ownerId === user?.$id`)

**Risk:**
- Create organization is gated by UI but not by permission check
- Edit has inline check but should use centralized permissions

**Recommendation:**
- Use `canEditOrganization` from usePermissions for editing
- Use `canCreateOrganization` equivalent (owner check) for creation
- Centralize organization permission logic

**Status:** Permissions available in utils/permissions.ts - ready to implement
**Priority:** HIGH

---

## Medium Priority - Should Have Permission Checks

### 5. new-job.tsx
**File:** `app/(jobs)/new-job.tsx`

**Data Modifications:**
- Line 36: `jobChatService.createJobChat(...)` - Creates new job

**Current Permission Checks:**
- ⚠️ Checks `currentTeam?.$id` and `currentOrganization?.$id` exist
- ❌ No role-based permission check

**Required Permission:**
- **canCreateJob** - All team members (current behavior)
- Or restrict to owner/admin if that's the policy

**Current Status:**
- According to PERMISSIONS_MATRIX.md: `canCreateJob` = true for all roles
- May be acceptable as-is, but should be explicit

**Recommendation:**
```typescript
const { canCreateJob } = usePermissions();
// Verify canCreateJob is true (for explicit documentation)
```

**Priority:** MEDIUM

---

### 6. contacts.tsx
**File:** `app/(jobs)/contacts.tsx`

**Data Modifications:**
- Line 229: `contactService.syncUserContacts(...)` - Syncs device contacts
- Line 232: `contactService.findMatches(...)` - Finds matches

**Current Permission Checks:**
- ❌ NONE - Only checks device contacts permission

**Required Permission:**
- **canSyncContacts** - User-specific feature, probably all authenticated users
- Data is user-specific (syncing own contacts)

**Current Status:**
- This is user-specific data (their own contacts)
- Less critical than team/org-wide data

**Recommendation:**
- May be acceptable without additional checks
- Consider adding `canSyncContacts` for consistency

**Priority:** MEDIUM

---

## Low Priority - User-Specific or Read-Only

### 7. edit-account.tsx
**File:** `app/(jobs)/edit-account.tsx`

**Data Modifications:**
- Line 89: `account.updatePrefs(...)` - Updates own user preferences

**Current Permission Checks:**
- ✅ Implicit - Can only update own account
- Uses `account.get()` to get current user

**Required Permission:**
- N/A - Users can always edit their own account

**Current Status:**
- ✅ SECURE - Users can only modify their own data

**Priority:** LOW

---

### 8. job-tasks.tsx
**File:** `app/(jobs)/job-tasks.tsx`

**Data Modifications:**
- Line 125: `onCompleteTask(item.$id)` - Completes task
- Line 265: `onCompleteDuty(item.$id)` - Completes duty

**Current Permission Checks:**
- ✅ PARENT PROTECTED - These are callbacks passed from `[job].tsx`
- Parent component has permission checks
- Only allows sender to complete their own tasks/duties

**Required Permission:**
- N/A - Handled by parent

**Current Status:**
- ✅ SECURE - Parent `[job].tsx` controls permissions

**Priority:** LOW

---

### 9. choose-job-for-photo.tsx
**File:** `app/(jobs)/choose-job-for-photo.tsx`

**Data Modifications:**
- ❌ NONE - Only navigates to other screens
- Routes to `new-job.tsx` or camera screens

**Current Permission Checks:**
- ✅ Checks authentication
- ✅ Checks team/organization selection

**Required Permission:**
- N/A - Navigation only

**Current Status:**
- ✅ SECURE - Destination screens have their own checks

**Priority:** LOW

---

## Already Protected - No Changes Needed

### 10. edit-tags.tsx
**File:** `app/(jobs)/edit-tags.tsx`

**Data Modifications:**
- ❌ NONE - Read-only
- Only lists tags and navigates to edit-tag.tsx

**Current Status:**
- ✅ No modifications, only reads

---

### 11. filter-jobs.tsx
**File:** `app/(jobs)/filter-jobs.tsx`

**Data Modifications:**
- ❌ NONE - Read-only filtering UI
- Only updates local filter state

**Current Status:**
- ✅ No modifications, only reads

---

### 12. invite-contacts.tsx
**File:** `app/(jobs)/invite-contacts.tsx`

**Data Modifications:**
- ❌ NONE - Sharing/invitation UI only
- Generates invite links, no database writes

**Current Status:**
- ✅ No modifications to shared data

---

### 13. settings/[job].tsx
**File:** `app/(jobs)/settings/[job].tsx`

**Data Modifications:**
- ❌ NONE - Empty placeholder
- Only renders "Job Settings" text

**Current Status:**
- ✅ No functionality yet

---

### 14. user-profile.tsx
**File:** `app/(jobs)/user-profile.tsx`

**Data Modifications:**
- ❌ NONE - Read-only profile display
- Only fetches and displays data

**Current Status:**
- ✅ No modifications, only reads

---

## Summary Table

| File | Modifies Data | Has Permission Check | Required Permission | Priority |
|------|---------------|---------------------|---------------------|----------|
| archived-teams.tsx | ✅ | ❌ | canEditTeamSettings | **HIGH** |
| edit-job-title.tsx | ✅ | ❌ | canEditJob | **HIGH** |
| edit-tag.tsx | ✅ | ❌ | canManageTags | **HIGH** |
| edit-organization.tsx | ✅ | ⚠️ Partial | canCreate/EditOrg | **HIGH** |
| new-job.tsx | ✅ | ⚠️ Implicit | canCreateJob | MEDIUM |
| contacts.tsx | ✅ | ❌ | canSyncContacts | MEDIUM |
| edit-account.tsx | ✅ | ✅ Implicit | N/A (own data) | LOW |
| job-tasks.tsx | ✅ | ✅ Parent | N/A | LOW |
| choose-job-for-photo.tsx | ❌ | ✅ Navigation | N/A | LOW |
| edit-tags.tsx | ❌ | N/A | N/A | ✅ OK |
| filter-jobs.tsx | ❌ | N/A | N/A | ✅ OK |
| invite-contacts.tsx | ❌ | N/A | N/A | ✅ OK |
| settings/[job].tsx | ❌ | N/A | N/A | ✅ OK |
| user-profile.tsx | ❌ | N/A | N/A | ✅ OK |

---

## Recommendations

### Immediate Actions (High Priority)

1. **Add permissions to archived-teams.tsx**
   - Import usePermissions
   - Add canEditTeamSettings check before restore
   - Show permission denied UI if not owner

2. **Add permissions to edit-job-title.tsx**
   - Import usePermissions with jobCreatedBy
   - Add canEditJob check
   - Pass jobCreatedBy from parent or fetch it

3. **Add permissions to edit-tag.tsx**
   - Import usePermissions
   - Add canManageTags check
   - Block editing if not owner/admin

4. **Update edit-organization.tsx**
   - Replace inline owner check with usePermissions
   - Add canCreateOrganization check for creation

### Documentation Updates Needed

- Add these 4 HIGH priority screens to PERMISSIONS_AUDIT.md
- Update utils/permissions.ts if new permissions needed (canRestoreTeam, canEditOrg)
- Document that new-job.tsx and contacts.tsx have implicit permissions (may need explicit checks later)

### Testing Priority

1. Test that non-owners CANNOT restore archived teams
2. Test that non-owners CANNOT edit job titles
3. Test that non-owners/admins CANNOT edit tags
4. Test that only org owners can edit organization details

---

*Generated by comprehensive codebase analysis*
*Next step: Implement permission checks for HIGH priority files*
