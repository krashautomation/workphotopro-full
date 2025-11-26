# RevenueCat SDK Setup - Quick Guide

This guide covers the basic SDK installation and integration that was just completed.

## ✅ What Was Done

### 1. SDK Installed
- ✅ `react-native-purchases` package installed

### 2. Services Created
- ✅ `lib/appwrite/payments.ts` - RevenueCat payment service
- ✅ `lib/appwrite/subscriptions.ts` - Subscription management service

### 3. UI Updated
- ✅ `app/(jobs)/get-premium.tsx` - Integrated with RevenueCat
- ✅ `app/(jobs)/get-package.tsx` - Added loading state

## 🔧 Next Steps: Add API Keys

### Step 1: Get RevenueCat API Keys

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to **Project Settings** → **API Keys**
4. Copy your **Public API Key** for Android

### Step 2: Add to `.env` File

Add these lines to your `.env` file:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_api_key_here
```

**Note:** For now, you only need the Android key. Add iOS key when you're ready to support iOS.

### Step 3: Restart Development Server

After adding the API keys, restart your Expo dev server:

```bash
npm start
```

Then press `r` to reload, or restart completely.

## 🧪 Testing

### Before Testing

1. **Set up products in RevenueCat Dashboard:**
   - Create products matching your package IDs:
     - `premium_1_members_monthly`, `premium_1_members_annual`
     - `premium_2_members_monthly`, `premium_2_members_annual`
     - ... (all 20 products)

2. **Set up products in Google Play Console:**
   - Create subscription products with matching IDs
   - Link them in RevenueCat dashboard

3. **Add test accounts:**
   - Add your Google account to Google Play Console License Testing
   - This allows testing without real charges

### Test Flow

1. Open the app
2. Navigate to "Get Premium" screen
3. You should see:
   - Loading indicator while fetching offerings
   - Package list with prices from RevenueCat
   - "Current Plan" badge if you have active subscription

4. Tap a package → Tap "Upgrade"
   - Google Play purchase dialog should appear
   - Complete purchase (won't charge in test mode)
   - Should see success message
   - Premium features should unlock

## 🐛 Troubleshooting

### "RevenueCat API key not found"
- Make sure `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` is in `.env`
- Restart dev server after adding
- Check for typos in variable name

### "No current offering found"
- Products not configured in RevenueCat dashboard
- Products not linked to Google Play
- Check RevenueCat dashboard → Products

### "Product Not Available"
- Product ID doesn't match between app and RevenueCat
- Check product IDs match exactly: `premium_X_members_monthly/annual`

### Purchase fails
- Check Google Play account has payment method (even for testing)
- Verify products exist in Google Play Console
- Check network connection
- Verify you're using a test account

## 📋 Current Implementation Status

✅ **Completed:**
- SDK installed
- Payment service created
- Subscription service created
- Premium screen integrated
- Purchase flow implemented
- Loading states added
- Error handling added

⏳ **Still Needed:**
- Add RevenueCat API keys to `.env`
- Set up products in RevenueCat dashboard
- Set up products in Google Play Console
- Test purchase flow
- Set up webhook endpoint (next phase)

## 🎯 What Works Now

- ✅ App can initialize RevenueCat SDK
- ✅ App can load subscription offerings
- ✅ App can display packages with real prices
- ✅ App can initiate purchases
- ✅ App syncs subscription status to database
- ✅ App updates organization premium tier

## 📖 Next Phase

After testing the basic integration:
1. Set up webhook endpoint (Phase 4)
2. Test subscription lifecycle (renewal, cancellation)
3. Add restore purchases functionality
4. Polish UI/UX

See `docs/REVENUECAT_INTEGRATION_GUIDE.md` for complete integration guide.

