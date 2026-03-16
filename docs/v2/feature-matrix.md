# Feature Matrix

## Overview

Feature availability by **Role** (Owner/Admin/Member) and **Plan** (Free/Trial/Premium).

## Roles

- **Owner**: Created the org, full control
- **Admin**: Delegated manager (planned for v1.1)
- **Member**: Regular field worker

## Plans

- **Free**: Permanent limited tier
- **Trial**: Full premium for 30 days
- **Premium**: Paid plan ($29/3 users or $79/10 users)

## Legend

- ✅ Allowed
- ❌ Not allowed
- 🔒 Premium only
- 👑 Owner only
- 👔 Owner + Admin
- 📊 Limited (define limit)
- ❓ Decision needed

---

## 1. Authentication

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Sign up | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Sign in | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Forgot password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Google OAuth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Currently disabled |
| Edit profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete account | ❓ | ❓ | ❓ | ✅ | ❌ | ❌ | Decision needed |

---

## 2. Organization

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View org | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Edit org name/logo | ❓ | ✅ | ✅ | ✅ | ❌ | ❌ | canEditOrganization (owner only) |
| Edit org settings | ❓ | ✅ | ✅ | ✅ | ❌ | ❌ | canEditOrganization (owner only) |
| Create additional orgs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | v1 — one org per user |
| Delete org | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | |
| View subscription | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Manage subscription | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |

---

## 3. Team Management

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View teams | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create team | 📊 | ✅ | ✅ | ✅ | ❓ | ❌ | Free limit: ? teams |
| Edit team name/photo | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | canEditTeamSettings |
| Edit team contact info | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | canEditTeamSettings |
| Delete team | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Cannot delete last team |
| Restore archived team | ✅ | ✅ | ✅ | ✅ | ❓ | ❌ | canEditTeamSettings (owner only) |
| View team settings | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Switch between teams | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 4. Team Members

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View member list | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Invite member via email | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | Free limit: ? members |
| Invite via QR code | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | Legacy format |
| Invite via universal link | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | `workphotopro.com/invite/{shortId}` |
| Invite via contacts | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Accept invitation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Install-safe invite resume | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Auto-resume if clicked before install |
| Remove member | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Cannot remove last owner |
| Change member role | ✅ | ✅ | ✅ | ✅ | ❓ | ❌ | |
| View member profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| canShareJobReports permission | ❓ | ✅ | ✅ | ✅ | ✅ | ❌ | |

---

## 5. Jobs / Projects

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create job | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | Free limit: ? jobs |
| Edit job title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | canEditJob (owner or job creator) |
| Edit job details | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete job | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | canDeleteJob (owner or job creator) |
| Restore deleted job | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Search jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Filter jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Add tags to job | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Share job via link | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Share job via QR | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Job status management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 6. Photos / Media

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Take photos | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | Free limit: ? photos |
| Upload photos | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete photos | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | Uploader or owner only? |
| HD photo capture | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium feature |
| Watermark on photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Free always has watermark |
| Watermark toggle off | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | canToggleWatermark (premium + owner) |
| Timestamp on photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Timestamp toggle | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Video recording | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium feature |
| Video playback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Photo gallery view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 7. Chat / Messages

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Send text message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Send photo in chat | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Send video in chat | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium |
| Send audio message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Send file attachment | ❓ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Share location | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create task in chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Complete task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create duty in chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete message | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | Own messages only? |
| Real-time updates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Currently disabled |
| Message search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 8. Reports / AI

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Generate job progress report | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Core premium feature |
| Generate estimate report | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Generate inspection report | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Generate invoice | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | v1.1 |
| Generate insurance report | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | v1.1 |
| Export report as PDF | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Export report as DOCX | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Share report with client | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | canShareReport (premium + canShareJobReports flag) |
| Custom report template | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | v1.1 |
| Voice transcription | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | v1.1 |

---

## 9. Tags

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View tags | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | canManageTags (owner only; Admin support planned for v1.1) |
| Edit tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | canManageTags (owner only; Admin support planned for v1.1) |
| Delete tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | canManageTags (owner only; Admin support planned for v1.1) |
| Assign tag to job | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 10. Notifications

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Receive push notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View notification center | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Notification preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 11. Settings

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Edit profile photo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Edit account details | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Cache management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| HD capture preference | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium |
| Timestamp preference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 12. Gamification

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Earn XP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View achievements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View progress | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## Open Decisions

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Free tier job limit | 3 / 5 / 10 / unlimited | 5 jobs |
| 2 | Free tier photo limit | 10 / 25 / 50 / unlimited | 25 photos total |
| 3 | Free tier member limit | 1 / 2 / 3 | 2 members |
| 4 | Free tier team limit | 1 / 2 / unlimited | 1 team |
| 5 | Trial duration | 14 / 30 / 60 days | 30 days |
| 6 | Admin role in v1? | Yes / No | No — keep simple |
| 7 | Members delete own jobs? | Yes / No | Yes |
| 8 | Members delete own messages? | Yes / No | Yes |
| 9 | Members share reports? | Yes / No | Owner grants per member |
| 10 | Members invite others? | Yes / No | No — owner/admin only |

See [Permissions](./permissions.md) for permission implementation details and [Security Audit](./security-audit.md) for audit results.

---

*Last Updated: March 2026*  
*Permission System: v1.0 — Production Ready*
