# Known Issues

## Migration Follow-Up Items

- Real-time subscriptions are currently disabled due to WebSocket errors and need a dedicated fix.
- Invitation email sending is currently stubbed and needs an Appwrite Cloud Function implementation.
- `EXPO_PUBLIC_APP_URL` is not set in `.env`, so invitation links can show `undefined`.
- Archived team restore flow needs validation testing.
- Delete-team guard (last-team protection) needs validation testing.
- Pre-existing React UMD TypeScript warnings remain (~58 errors) and are not migration-related.
- The **Clean Site** job is orphaned (references a team that no longer exists).
