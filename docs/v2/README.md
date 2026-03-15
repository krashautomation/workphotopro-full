# WorkPhotoPro V2 Documentation

## Navigation
- [architecture.md](./architecture.md) — System architecture and tech stack
- [data-model.md](./data-model.md) — Database schema and entities
- [permissions.md](./permissions.md) — Permission system and usage
- [feature-matrix.md](./feature-matrix.md) — Product feature specification
- [security-audit.md](./security-audit.md) — Security verification and audit results

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
- **Database Collections**: 16+
- **Status**: Production Ready

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
