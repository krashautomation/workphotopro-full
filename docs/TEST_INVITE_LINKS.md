# Testing Invite Links

## Quick Test

To test the invite link, you need to restart the Expo development server after changing `app.json`:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm start
```

## Testing Methods

### Method 1: Test in Expo Go (Easiest)

1. **Scan the QR Code**: Use a second device (or a friend's phone) with Expo Go installed to scan the QR code
2. **Or type the link directly**: On the second device, open a browser and type:
   ```
   workphotopro://team-invite?teamId=YOUR_TEAM_ID
   ```
   Replace `YOUR_TEAM_ID` with the actual team ID from your console logs

### Method 2: Test with Deep Link Tester (Android)

On Android devices, you can test deep links using ADB:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "workphotopro://team-invite?teamId=YOUR_TEAM_ID"
```

### Method 3: Test in Simulator/Emulator

#### iOS Simulator:
```bash
xcrun simctl openurl booted "workphotopro://team-invite?teamId=YOUR_TEAM_ID"
```

#### Android Emulator:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "workphotopro://team-invite?teamId=YOUR_TEAM_ID"
```

## Expected Behavior

When you tap the invite link or scan the QR code:

1. **If Expo Go is open**: The link should open in Expo Go
2. **If Expo Go is not open**: The link should open Expo Go (if installed)
3. **If Expo Go is not installed**: The link won't work (this is normal in development)

## Troubleshooting

### "Deep link not working"

1. **Restart Expo**: Stop and restart the dev server after changing `app.json`
2. **Clear cache**: Try `npx expo start -c` to clear the cache
3. **Rebuild**: For native code changes to `app.json`, you may need to rebuild

### "Link opens but nothing happens"

This is expected - we haven't created the accept-invite screen yet! See `TEAM_INVITE_IMPLEMENTATION_SUMMARY.md` for next steps.

### "Can't scan QR code in Expo Go"

- The QR code uses a `workphotopro://` scheme
- In development, this only works if Expo Go is already open
- For production, you'd use an HTTPS link that redirects to the app

## Production vs Development

### Development (Current)
- Deep links like `workphotopro://` only work if the app is already running
- Good for testing the flow between screens
- QR code works if scanned while the app is open

### Production (Future)
- Use HTTPS links like `https://workphotopro.app/team-invite?teamId=...`
- These can open the app even if it's not running
- The QR code will work universally

## Next Steps

To make this fully functional:

1. ✅ Deep link scheme configured
2. ⏳ Create accept-invite screen (`app/(auth)/accept-invite.tsx`)
3. ⏳ Handle team invitation acceptance
4. ⏳ Test full flow end-to-end
