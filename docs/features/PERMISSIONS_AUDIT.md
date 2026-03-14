# Permissions Audit

Date: 2026-03-14
Reference matrix reviewed: `docs/features/PERMISSIONS_MATRIX.md`

## 1) Role checks already implemented

- `app/(jobs)/team-settings.tsx:50`-`app/(jobs)/team-settings.tsx:64`
  - Reads `membershipRole` from `currentTeam`, computes `isOwner`, blocks full screen access if not owner.

- `app/(jobs)/teams.tsx:117`
  - Filters "My Teams" list to owner-only teams (`team.membershipRole === 'owner'`).

- `app/(jobs)/teams.tsx:462`
  - Computes per-card `isOwner` from `membershipRole` to render Owner/Member badge.

- `app/(jobs)/teams.tsx:624`
  - Hides Team Settings menu item unless current `membershipRole === 'owner'`.

- `app/(jobs)/delete-team.tsx:34`
  - Counts only teams where current user's membership role is owner (`membership?.role === 'owner'`), then allows delete only when owned team count > 1.

- `app/(jobs)/manage-member.tsx:201`
  - `isOwner()` helper checks member role (`owner`/`owners`) and prevents owner removal or owner role mutation.

- `app/(jobs)/manage-member.tsx:260`
  - `isCurrentUserOwner()` checks current user role (`owner`/`owners`) to gate permission toggles and role editing UI.

- `services/teamService.ts:478`
  - Server-side/business rule: prevents removing the last owner from a team.

- `services/teamService.ts:546`
  - Server-side/business rule: prevents demoting the last owner.

- `app/(jobs)/profile-settings.tsx:60`
  - Derives owned teams from `membershipRole === 'owner'` to choose profile team context.

- `app/(jobs)/user-profile.tsx:143`
  - Derives owned teams count from `membershipRole === 'owner'`.

- `app/(jobs)/index.tsx:40`
  - Reads `membershipRole` and derives `isOwnerRole` for role display pill (display logic, not access enforcement).

- `app/(auth)/accept-invite.tsx:63`
  - Uses first owner membership as inviter fallback (`m.role === 'owner'`) for display.

- `context/OrganizationContext.tsx`
  - Multiple places attach/preserve `membershipRole` on team objects for downstream role checks; no direct access deny/allow in this file.

## 2) Plan checks already implemented

- `context/OrganizationContext.tsx:612`
  - Central derived plan flags from org state:
    - `currentOrgPremiumTier`
    - `isCurrentOrgPremium` (`premiumTier !== 'free' || hdCaptureEnabled`)

- `app/(jobs)/video-camera.tsx:169`
  - Access gating: requires premium (`isCurrentOrgPremium` or `org.premiumTier !== 'free'`) AND `videoRecordingEnabled`.
  - Enforced in initialization, in `startRecording()`, and in render fallback with upgrade CTA.

- `app/(jobs)/profile-settings.tsx:78`
  - Plan + owner gating for media settings:
    - `hasPremium` from `premiumTier !== 'free'`
    - owner check via `canManageOrgHd`
  - Blocks/toggles HD capture, timestamp overlays, watermark toggle, video recording, and HD video unless required premium/owner prerequisites are met.

- `lib/appwrite/payments.ts:156`
  - `checkSubscriptionStatus()` checks RevenueCat entitlement (`customerInfo.entitlements.active['premium']`).

- `lib/appwrite/subscriptions.ts:39`
  - Sync logic checks active premium entitlement and updates org subscription state.

- `lib/appwrite/subscriptions.ts:141`
  - Writes `premiumTier` and related subscription fields to organization (`currentProductId`, `subscriptionExpiryDate`, etc.).

- `app/(jobs)/get-premium.tsx`
  - Implements purchase/sync flow and upgrade UX; this is subscription flow plumbing, not a direct feature access gate.

## 3) Centralized permission helper audit

Search targets: `hasPermission`, `canAccess`, `checkPermission`.

Findings:

- No generic centralized RBAC helper found (no shared `hasPermission`/`canAccess` utility for app-wide role+plan checks).

- `hooks/useJobReportsPermission.ts:13`
  - Contains a scoped `checkPermission` function for one feature (`canShareJobReports`), not a general permission engine.

- Other matches are device/platform permission checks, not role/plan authorization:
  - `components/AudioRecorder.tsx:48` (microphone permission)
  - `app/(jobs)/job-uploads.tsx:640` (media/filesystem permission)
  - `app/(jobs)/contacts.tsx:85` (contacts permission status)

Conclusion:

- Role checks exist but are distributed across screens/services.
- Plan checks are implemented for video/settings and subscription sync, also distributed.
- There is currently no single centralized app permission helper covering role + plan + feature policy.
