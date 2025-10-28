# Quick Guide: Testing Invite Links

## What's Working ✅

- Team page displays correctly with owner name
- Invite page shows QR code and invite link
- Deep link scheme configured in `app.json`

## How to Test the Invite Link (Simplest Method)

### Option 1: Test in Expo Go on Same Device

1. **Make sure Expo is running** (you should have restarted with `npx expo start -c`)

2. **Open the invite page** in your app

3. **Copy the invite link** from the screen (it shows the link like `workphotopro://team-invite?teamId=...`)

4. **On your phone**:
   - Open Notes app or any text app
   - Paste the link there
   - Long press the link
   - Tap "Open" or it may automatically ask to open in Expo Go

### Option 2: Type the Link Directly

On your phone:
1. Open Chrome or any browser
2. Type this URL in the address bar:
   ```
   workphotopro://team-invite?teamId=68fd6aed002d891b5a16
   ```
   (Use your actual team ID from the invite page)

3. Press Go
4. It should prompt to open in Expo Go

### Option 3: Scan QR Code (Best for Real Testing)

1. **Take a screenshot** of the QR code from your invite page
2. **Send it to yourself** via email, WhatsApp, etc.
3. **On a second device** (or same device):
   - Open the screenshot
   - Use a QR code scanner app
   - Scan the code
   - Tap the link that appears
   - It should open in Expo Go

## What Happens When You Click?

Right now, **nothing will happen yet** - that's expected! The link will:
- Open the app in Expo Go (if it's running)
- But then just show your current screen

This is because we haven't created the accept-invite screen yet. The deep link is working, we just need to add the screen that handles it.

## Status

- ✅ Deep link scheme configured in `app.json`
- ✅ Invite page shows QR code and link
- ⏳ Accept-invite screen (next step)
- ⏳ Handle invitation acceptance (next step)

## Troubleshooting

### "Can't copy the link"
- Take a screenshot and zoom in
- Or manually type: `workphotopro://team-invite?teamId=YOUR_TEAM_ID`

### "Nothing happens when I click"
- Make sure Expo is running
- Make sure the app is open in Expo Go
- This is normal - the accept-invite screen doesn't exist yet!

### Want to skip ADB setup?
You don't need ADB! The methods above work without it.
