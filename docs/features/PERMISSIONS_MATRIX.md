# WorkPhotoPro V2 — Permissions & Feature Matrix

## Roles
- **Owner**: Created the org, full control
- **Admin**: Delegated manager, can run team but not billing/delete
- **Member**: Regular field worker

## Plans
- **Free**: Permanent limited tier
- **Trial**: Full premium for 30 days (everyone starts here)
- **Premium**: Paid plan ($29/3 users or $79/10 users)

## Limits (Free Tier — TBD)
- [ ] Max teams: ?
- [ ] Max jobs: ?
- [ ] Max photos per job: ?
- [ ] Max members per team: ?
- [ ] Max storage: ?

---

## Feature Matrix

Legend:
- ✅ Allowed
- ❌ Not allowed
- 🔒 Premium only
- 👑 Owner only
- 👔 Owner + Admin
- 📊 Limited (define limit)
- ❓ Decision needed

---

### 1. Authentication

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Sign up | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Sign in | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Forgot password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Google OAuth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Currently disabled |
| Edit profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete account | ❓ | ❓ | ❓ | ✅ | ❌ | ❌ | Decision needed |

---

### 2. Organization

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View org | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Edit org name/logo | ❓ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Edit org settings | ❓ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Create additional orgs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | v1 — one org per user |
| Delete org | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | |
| View subscription | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Manage subscription | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |

---

### 3. Team Management

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View teams | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create team | 📊 | ✅ | ✅ | ✅ | ❓ | ❌ | Free limit: ? teams |
| Edit team name/photo | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Edit team contact info | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Delete team | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Cannot delete last team |
| Restore archived team | ✅ | ✅ | ✅ | ✅ | ❓ | ❌ | |
| View team settings | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Switch between teams | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 4. Team Members

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View member list | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Invite member via email | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | Free limit: ? members |
| Invite via QR code | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Invite via contacts | 📊 | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Accept invitation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Remove member | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Cannot remove last owner |
| Change member role | ✅ | ✅ | ✅ | ✅ | ❓ | ❌ | |
| View member profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| canShareJobReports permission | ❓ | ✅ | ✅ | ✅ | ✅ | ❌ | |

---

### 5. Jobs / Projects

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create job | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | Free limit: ? jobs |
| Edit job title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Creator or owner only? |
| Edit job details | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete job | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | Creator or owner only? |
| Restore deleted job | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Search jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Filter jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Add tags to job | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Share job via link | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Share job via QR | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Job status management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 6. Photos / Media

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Take photos | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | Free limit: ? photos |
| Upload photos | 📊 | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Delete photos | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | Uploader or owner only? |
| HD photo capture | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium feature |
| Watermark on photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Free always has watermark |
| Watermark toggle off | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | Premium + owner only |
| Timestamp on photos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Timestamp toggle | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Video recording | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium feature |
| Video playback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Photo gallery view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 7. Chat / Messages

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

### 8. Reports / AI

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Generate job progress report | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Core premium feature |
| Generate estimate report | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Generate inspection report | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | |
| Generate invoice | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | v1.1 |
| Generate insurance report | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | v1.1 |
| Export report as PDF | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Export report as DOCX | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Share report with client | ❌ | ✅ | ✅ | ✅ | ✅ | ❓ | canShareJobReports flag |
| Custom report template | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | v1.1 |
| Voice transcription | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | v1.1 |

---

### 9. Tags

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| View tags | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Edit tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Delete tag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Assign tag to job | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 10. Notifications

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Receive push notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| View notification center | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Notification preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 11. Settings

| Feature | Free | Trial | Premium | Owner | Admin | Member | Notes |
|---------|------|-------|---------|-------|-------|--------|-------|
| Edit profile photo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Edit account details | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Cache management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| HD capture preference | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Premium |
| Timestamp preference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

### 12. Gamification

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

---

## Sprint Priority

### Beta Blockers (must work before any users)
- Sign up → org → team → job → photo loop
- Team invite and accept
- Basic job report generation (1 type)
- PDF export

### Should Have for Beta
- Real-time chat
- Push notifications
- Watermark on free tier photos
- Trial countdown

### Defer to v1.1
- Invoice generation
- Insurance reports
- Voice transcription
- Custom templates
- Admin role
- Google OAuth

---

*Last updated: March 2026*
*Status: Decisions pending — review Open Decisions table*