# Invite Link Implementation Options

## Current Implementation: Deep Links (`workphotopro://`)

We're currently using deep links (`workphotopro://team-invite?teamId=...`) because:
- ✅ Simple to implement
- ✅ Works after app is installed
- ❌ Requires app to be installed first
- ❌ Doesn't work in Expo Go reliably

## Better Option for Production: HTTPS Links

For production, you'll want to use HTTPS links like:
```
https://workphotopro.app/join?teamId=abc123
```

This link would:
1. Open in any browser
2. Check if the app is installed
3. If installed → Open the app directly
4. If not installed → Show app store links
5. If already logged in → Join team automatically
6. If not logged in → Show signup/login screen first

## How HTTPS Links Work

### 1. Create a Web Page

Create a page at `https://workphotopro.app/join` that:
- Extracts the `teamId` from the URL
- Detects if the user is on mobile
- Redirects to the app if it's installed
- Shows a "Download App" button if not installed

### 2. Universal Links (iOS) / App Links (Android)

Configure in `app.json`:
```json
{
  "ios": {
    "associatedDomains": ["applinks:workphotopro.app"]
  },
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "workphotopro.app",
            "pathPrefix": "/join"
          }
        ]
      }
    ]
  }
}
```

### 3. Handle in App

In `app/_layout.tsx`, handle both deep links and HTTPS links:
```typescript
// Handle both workphotopro:// and https:// links
const url = new URL(event.url);
const teamId = url.searchParams.get('teamId');

if (teamId) {
  router.push({
    pathname: '/(auth)/accept-invite',
    params: { teamId }
  });
}
```

## For Now (Development)

Since we're in Expo Go, deep links are the easiest to test. The flow is:
1. Generate deep link: `workphotopro://team-invite?teamId=...`
2. Copy the link or scan QR code
3. Open link on device with Expo Go running
4. Should navigate to accept-invite screen

## Testing Deep Links

### Method 1: Manual Testing
1. Copy the invite link from the app
2. Open it in Chrome on your device
3. Should prompt to open in Expo Go

### Method 2: QR Code
1. Take screenshot of QR code
2. Scan with another device
3. Tap the link
4. Should open in Expo Go

### Method 3: Type in Browser
1. In Chrome mobile, type: `workphotopro://team-invite?teamId=YOUR_TEAM_ID`
2. Tap Go
3. Should open in Expo Go

## Next Steps

When moving to production:
1. ✅ Keep the deep link implementation
2. ✅ Add HTTPS link support in app.json
3. ✅ Create a web landing page at `/join`
4. ✅ Update invite.tsx to generate HTTPS links
5. ✅ Test universal links/app links on real devices

For now, deep links work for testing in development!
