Please read these files before starting any work:

1. /docs/refactor/SESSION_NOTES.md
2. /docs/refactor/MIGRATION_CHECKLIST.md
3. /docs/refactor/teams-migration-plan.md

Summary of where we are:
- Phase 1 & 2 complete
- Feature flag EXPO_PUBLIC_USE_CUSTOM_TEAMS=true enabled in dev
- Phase 3 in progress — 18 Appwrite Teams SDK calls remain in 
  lib/appwrite/teams.ts
- Phase 5 pending — full removal after Phase 3 complete

First task next session:
1. Run pre-migration audit to confirm still clean:
   npx tsx scripts/pre-migration-audit.ts

2. Then grep for remaining Appwrite Teams SDK calls:
   grep -rn "teams\.create\|teams\.get\|teams\.list\|teams\.delete\|teams\.updateName\|teams\.createMembership\|teams\.listMemberships\|teams\.updateMembership\|teams\.deleteMembership\|teams\.updateMembershipStatus" 
   --include="*.ts" --include="*.tsx" | grep -v "node_modules"

3. Report results before touching any code.

Do not start any work until I confirm I am ready.