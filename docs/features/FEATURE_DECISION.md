# Feature Decisions & Permission Matrix

## Roles
- org_owner: owns the organization, has all permissions
- team_owner: created/owns a team, manages that team
- member: regular team member

## Organization Rules
- One org per user (created on signup)
- User cannot create additional orgs (v1)
- User cannot delete their org (v1)
- Only org_owner can create teams in their org
- Only org_owner can edit org settings

## Team Rules
- org_owner can create unlimited teams
- org_owner is automatically team_owner of teams they create
- org_owner can delete any team in their org
- team_owner can edit their team settings
- team_owner can invite members
- team_owner can remove members
- team_owner cannot delete themselves from team
- Cannot delete last active team in org
- Deleted teams are soft deleted (restorable)
- Members cannot edit team settings
- Members cannot invite others (v1 — owner only)
- Members cannot remove other members

## Invitation Rules
- Only team_owner can send invitations
- Invitation expires in 7 days
- Cannot invite existing member
- Cannot send duplicate pending invite
- Invited user must sign up if no account exists
- Invitation email contains deep link to accept
- Accept validates: token, expiry, email match, org match

## Job Rules
- Any team member can create jobs
- Any team member can view all jobs in their team
- Any team member can add messages/photos to jobs
- Only job creator OR team_owner can delete a job
- Deleted jobs are soft deleted (restorable by creator or owner)
- Jobs belong to one team only
- Jobs cannot be moved between teams (v1)

## Message Rules  
- Any member can send messages
- Any member can view all messages in a job
- Only message sender can delete their message (v1)
- Messages cannot be edited (v1)

## Photo Rules
- Any member can upload photos
- Any member can view all photos in a job
- Only uploader OR team_owner can delete photos (v1)
- Watermark setting controlled by org_owner
- HD setting controlled by org_owner

## Premium / Subscription Rules
- Subscription is per organization
- org_owner manages subscription
- All team members benefit from org subscription
- Free tier limits: TBD (define before beta)
- Premium features: HD photos, video, watermark toggle

## What Needs a Decision Before Beta

### Decision 1: Free tier limits
Options:
A) 1 team, 5 jobs, 50 photos — hard limits
B) Unlimited everything, just watermark on photos
C) 30 day free trial then require payment
Recommendation: Option C — easiest to implement,
maximizes trial conversions

### Decision 2: Can members invite others?
Options:
A) Only team_owner can invite (current)
B) Any member can invite
Recommendation: Option A for v1 — simpler permissions

### Decision 3: Report generation access
Options:
A) Any member can generate reports
B) Only team_owner can generate reports
Recommendation: Option A — reports are the value prop,
everyone should access them

### Decision 4: Archived team restoration
Options:
A) org_owner can restore any archived team
B) Only the team_owner can restore their team
Recommendation: Option A — org_owner has full control

### Decision 5: Member can see other members?
Options:
A) Yes — all members see full member list
B) No — members only see themselves
Recommendation: Option A — transparency builds trust
in field crews