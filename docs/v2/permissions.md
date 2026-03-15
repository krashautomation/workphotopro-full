# Permission System

## Overview

WorkPhotoPro V2 implements centralized permission management through the `usePermissions()` hook and utility functions in `utils/permissions.ts`.

**Important**: Permissions are evaluated client-side for UX and server-side for data integrity. Client checks prevent UI actions while server validation prevents malicious requests.

## Architecture

### usePermissions Hook

Centralized React hook for checking permissions across the app.

```typescript
import { usePermissions } from '@/utils/permissions';

// General permissions
const { canCreateTeam, canInviteMember, canManageTags } = usePermissions();

// Job-specific permissions (edit/delete)
const { canEditJob, canDeleteJob } = usePermissions(jobCreatedBy);
```

## Role-Based Permissions (11)

| Permission | Access Level | Description | Used In |
|------------|--------------|-------------|---------|
| `canCreateTeam` | Owner only | Create new teams within organization | new-team.tsx, teams.tsx |
| `canDeleteTeam` | Owner only | Delete teams (cannot delete last team) | delete-team.tsx |
| `canInviteMember` | Owner only | Invite users to teams | invite.tsx |
| `canRemoveMember` | Owner only | Remove members from teams | manage-member.tsx |
| `canEditTeamSettings` | Owner only | Edit team name, photo, restore archived | team-settings.tsx, edit-team.tsx, archived-teams.tsx |
| `canCreateJob` | All Members | Create new jobs/projects | new-job.tsx |
| `canDeleteJob` | Owner OR Creator | Delete jobs (creator-based exception) | trashed-jobs.tsx, job-uploads.tsx |
| `canEditJob` | Owner OR Creator | Edit job titles and details | edit-job-title.tsx |
| `canManageTags` | Owner | Create, edit, delete job tags (Admin support planned for v1.1) | edit-tag.tsx |
| `canManageBilling` | Owner only | Manage subscriptions and billing | profile-settings.tsx |
| `canEditOrganization` | Owner only | Edit org name, logo, settings | edit-organization.tsx |

## Plan-Based Permissions (7)

| Permission | Required Plan | Description | Used In |
|------------|---------------|-------------|---------|
| `canUploadPhoto` | All | Upload photos (free tier has limits) | camera.tsx |
| `canRecordVideo` | Premium/Trial | Record video (premium feature) | video-camera.tsx |
| `canToggleWatermark` | Premium + Owner | Toggle watermark on/off | profile-settings.tsx |
| `canToggleHD` | Premium/Trial | Enable HD photo capture | profile-settings.tsx |
| `canGenerateReport` | Premium/Trial | Generate job reports | profile-settings.tsx |
| `canExportReport` | Premium/Trial | Export reports as PDF/DOCX | profile-settings.tsx |
| `canShareReport` | Premium + Permission | Share reports with clients (canShareJobReports flag) | share-job.tsx |

## Permission Enforcement Layers

Permissions are enforced at three layers:

### 1. Collection Security (Appwrite)
- All collections require authenticated users (`role:users`)
- Access further restricted using `orgId`/`teamId` document filtering
- No guest or unauthenticated access allowed

### 2. Server Logic / Services
- Business rules enforced in service layer
- Owner/creator validation before mutations
- Team membership verification

### 3. UI Permission Hooks
- `usePermissions()` hook for centralized access control
- Buttons disable when permissions missing
- Alert dialogs for permission denied feedback

## Usage Examples

### Check General Permission
```typescript
const { canCreateTeam } = usePermissions();

if (!canCreateTeam) {
  Alert.alert('Permission Denied', 'Only team owners can create teams.');
  return;
}
```

### Check Job-Specific Permission
```typescript
const { canEditJob } = usePermissions(job.createdByUserId);

<Button 
  onPress={handleEdit}
  disabled={!canEditJob}
  title="Edit Job"
/>
```

### Conditional UI Rendering
```typescript
const { canManageTags } = usePermissions();

{canManageTags && (
  <Button onPress={goToTagEditor} title="Manage Tags" />
)}
```

## Implementation Details

### Permission Logic Location
- **File**: `utils/permissions.ts`
- **Hook**: `usePermissions(jobCreatedBy?: string)`
- **Context Dependencies**: AuthContext, OrganizationContext

### Permission Dependencies
- User authentication state
- Current organization ownership
- Current team membership
- Subscription tier (for plan-based permissions)
- Job creator ID (for job-specific permissions)

See [Security Audit](./security-audit.md) for implementation verification and testing recommendations.

---

*Last Updated: March 2026*
