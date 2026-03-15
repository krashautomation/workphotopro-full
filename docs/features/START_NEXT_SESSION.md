# Start Next Session

## Prerequisites
Read these files before starting:
1. `/docs/refactor/SESSION_NOTES.md` - Complete session history
2. `/docs/refactor/KNOWN_ISSUES.md` - Outstanding issues
3. `/docs/features/PERMISSIONS_GAP_ANALYSIS.md` - Permission gaps identified

## Current State (March 15, 2026)

### Recently Completed
- ✅ **Chat UI completely redesigned** - Snapchat-style layout with colored sender names and vertical accent bars
- ✅ **Real-time subscriptions stabilized** - Fixed scroll jumping, added connection status, AppState handling
- ✅ **Reports integration** - Reports button in chat, Reports sub-tab under Media, permissions fixed
- ✅ **Media tab** - Renamed from Uploads, now includes Photos, Videos, Audios, Files, Reports

### Current Priorities

#### 1. Testing & Verification
- **Test new chat UI** across different devices and screen sizes
- **Test real-time reliability** - Send messages while app in background, verify resubscription
- **Test reports functionality** - Owner vs member permissions, report creation flow
- **Test Media tab** - All 5 sub-tabs working correctly

#### 2. Known Issues to Address
- **TypeScript errors** - 3 pre-existing errors in [job].tsx (non-critical)
- **WebSocket stability** - Monitor for any remaining connection drops
- **Performance** - Chat list performance with new layout

#### 3. Pending Features
- **Invitation email** - Wire up Appwrite Cloud Function for sending invite emails
- **AI report generation** - Job Progress report type (planned feature)
- **Additional permission gaps** - Review PERMISSIONS_GAP_ANALYSIS.md for remaining screens

### Quick Start Commands
```bash
# Start Metro with clear cache
npx expo start --clear

# Run on Android
npm run android

# TypeScript check
npx tsc --noEmit

# Check git status
git status
```

### Key Files Modified Recently
- `app/(jobs)/[job].tsx` - Chat UI, real-time, Reports button
- `app/(jobs)/job-uploads.tsx` - Media tab with Reports
- `hooks/useJobReportsPermission.ts` - Permission logic

### Questions?
Review the latest session notes in SESSION_NOTES.md for full context.

---

## Next Session Instructions

**DO NOT START WORK YET**

Wait for user instructions on which priority to tackle first.

Common starting points:
1. "Test the new chat UI" - Verify Snapchat-style layout works correctly
2. "Fix [specific issue]" - Address a known issue or bug
3. "Implement [feature]" - Start on a pending feature
4. "Check [file]" - Review or refactor specific code

Ready to begin when you are.
