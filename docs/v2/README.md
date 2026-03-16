# WorkPhotoPro V2 Documentation

## Navigation
- [architecture.md](./architecture.md) — System architecture, tech stack, invite system
- [data-model.md](./data-model.md) — Database schema, entities, invite collections
- [permissions.md](./permissions.md) — Permission system and usage
- [feature-matrix.md](./feature-matrix.md) — Product feature specification
- [security-audit.md](./security-audit.md) — Security verification and audit results

## Changelog

### March 2026 - Backend API Migration
**Breaking Change:** Backend endpoints migrated from `/api/invites/*` to `/api/invitations/*`

**Changes:**
- `GET /api/invites/details` → `GET /api/invitations/details`
- `POST /api/invites/claim` → `POST /api/invitations/claim`
- `POST /api/invites/accept` → `POST /api/invitations/accept`
- Session endpoints unchanged: `/api/invites/session`

**New Features:**
- Session authentication required for claim/accept operations
- New invitation statuses: `declined`, `cancelled`, `revoked`
- Appwrite session validation before authenticated API calls
- Terminal state protection (declined/cancelled/revoked invitations cannot be claimed)

**Field Name Updates:**
- `inviterId` → `invitedBy`
- `token_hash` → `tokenHash` (camelCase)
- `email` → `invitedEmail` (now required)
- Added: `orgId`, `invitedName`, `role`, `sentAt`, `acceptedAt`, `acceptedByUserId`, `reminderSent`

## Overview
This folder contains the technical and product documentation for WorkPhotoPro V2.  
It is versioned under /docs/v2/ to keep the refactored documentation separate from the original /docs/ folder.  

## Documentation Structure

- **architecture.md** — System architecture, tech stack, permission enforcement layers  
- **data-model.md** — Database schema, entity relationships, Appwrite collections  
- **permissions.md** — Centralized permission system, role & plan-based permissions, usage examples  
- **feature-matrix.md** — Product features, role/plan permissions, open decisions  
- **security-audit.md** — Permission coverage audit, critical fixes, security verification

## Overview

WorkPhotoPro V2 is a React Native application built with Expo SDK, using Appwrite as the backend-as-a-service and RevenueCat for subscription management.

### Key Metrics

- **Total Screens**: 44
- **Security-Audited Screens**: 31 (100% coverage)
- **Permissions**: 18 (11 role-based, 7 plan-based)
- **Real-time Features**: ✅ Chat messages, ✅ Notifications
- **Database Collections**: 18+
- **Status**: Production Ready

## What's New in V2

### Backend API Migration (March 2026)
- **Endpoint Migration**: Migrated from `/api/invites/*` to `/api/invitations/*`
- **Session Authentication**: Appwrite session required for claim/accept operations
- **Extended Status Values**: Added `declined`, `cancelled`, `revoked` states
- **Enhanced Security**: Terminal state protection and session validation

### Universal Invite System (March 2026)
- **Universal Deep Links**: `https://workphotopro.com/invite/{shortId}`
- **Install-Safe Resume**: Users can click invites before installing the app
- **Multi-Format Support**: Universal links, QR codes, and legacy tokens
- **7-Day Expiration**: Secure time-limited invites with automatic cleanup

## Documentation Structure

### Engineering Documentation
- **Architecture** — High-level system design, tech stack, and app structure
- **Data Model** — Appwrite collections, relationships, and TypeScript interfaces
- **Permissions** — Permission system implementation and usage

### Product Documentation
- **Feature Matrix** — Feature availability by role (Owner/Admin/Member) and plan (Free/Trial/Premium)
- **Security Audit** — Permission coverage audit and security verification

## External Resources

- [Appwrite Console](https://cloud.appwrite.io)
- [Expo Documentation](https://docs.expo.dev)
- [RevenueCat Documentation](https://docs.revenuecat.com)

---

*Last Updated: March 2026*
