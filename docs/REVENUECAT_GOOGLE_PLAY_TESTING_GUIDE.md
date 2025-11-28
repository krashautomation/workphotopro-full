# 🧪 RevenueCat & Google Play Subscription Testing Guide

## 🎯 Recommended Release Track: **Closed Testing**

**For RevenueCat and Google Play subscription testing, use Closed Testing.**

### Why Closed Testing?

✅ **Best for subscription testing:**
- Supports Google Play License Testing (free test purchases)
- Up to 100,000 testers
- Real subscription environment (not sandbox)
- Can test subscription flows end-to-end
- Supports RevenueCat webhooks and events
- Faster than Production (no review needed)

✅ **Perfect for RevenueCat:**
- RevenueCat can track purchases properly
- Webhooks work correctly
- Subscription status syncs accurately
- Can test renewals, cancellations, and restorations

---

## 📋 Google Play Release Tracks Comparison

| Track | Max Testers | Review Time | License Testing | Best For |
|-------|-------------|-------------|-----------------|----------|
| **Internal Testing** | 100 | Instant | ✅ Yes | Quick initial testing |
| **Closed Testing** ⭐ | 100,000 | ~1-3 days | ✅ Yes | **Subscription testing** |
| **Open Testing** | Unlimited | ~1-3 days | ✅ Yes | Public beta |
| **Production** | Everyone | ~1-7 days | ❌ No | Public release |

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Create Products in Google Play Console

**Before testing, you MUST create subscription products:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app: **WorkPhotoPro**
3. Navigate to: **Monetize** → **Products** → **Subscriptions**
4. Click **Create subscription**

**Create your subscription products** (match your RevenueCat products):
- Example: `premium_2_members_monthly`
- Example: `premium_5_members_monthly`
- Example: `premium_10_members_monthly`
- etc.

**For each subscription:**
- Set **Product ID** (must match RevenueCat product ID)
- Set **Name** and **Description**
- Set **Price** and **Billing period**
- Set **Free trial** (if applicable)
- Set **Grace period** (if applicable)

**Important:** Product IDs must match exactly between:
- Google Play Console
- RevenueCat Dashboard
- Your app code

---

### Step 2: Link Products in RevenueCat

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Navigate to: **Products** → **Your Products**
3. For each product, click **Edit**
4. Under **Google Play**, link the Google Play product ID
5. Save changes

**Verify linking:**
- RevenueCat should show "Linked" status
- Product IDs should match exactly

---

### Step 3: Create Closed Testing Release

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app: **WorkPhotoPro**
3. Navigate to: **Testing** → **Closed testing**
4. Click **Create new release** (or **Create track** if first time)

**Release Details:**
- **Name**: "RevenueCat Testing v0.2.0"
- **Release notes**: "Testing RevenueCat subscription integration"
- **Upload AAB**: Upload your production build AAB file

**Important:** Use the same AAB you'll use for production (same package name, signing key)

---

### Step 4: Add Testers

**Option A: Email List (Recommended for initial testing)**
1. In Closed Testing, go to **Testers** tab
2. Click **Create email list**
3. Add test email addresses (your test accounts)
4. Save list

**Option B: Google Groups**
1. Create a Google Group
2. Add testers to the group
3. Add the group to Closed Testing

**Option C: Internal Testing First (Quick Test)**
1. Use **Internal Testing** for fastest initial test (100 testers max)
2. Then move to **Closed Testing** for full testing

---

### Step 5: Set Up License Testing

**This allows FREE test purchases:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to: **Setup** → **License testing**
3. Add test email addresses (same as your test accounts)
4. Set **License response** to: **RESPOND_NORMALLY**

**Important:**
- Test accounts must be added to License Testing
- Test accounts must be added to Closed Testing testers list
- Use the same Google account for both

---

### Step 6: Build and Upload

1. **Build your app** with EAS:
   ```bash
   eas build --platform android --profile production
   ```

2. **Download the AAB** from EAS dashboard

3. **Upload to Closed Testing**:
   - Go to Google Play Console
   - Navigate to: **Testing** → **Closed testing**
   - Click **Create new release**
   - Upload the AAB file
   - Add release notes
   - Click **Save** → **Review release** → **Start rollout to Closed testing**

---

### Step 7: Test Subscriptions

**On your test device:**

1. **Install the app** from Closed Testing track
2. **Sign in** with your test Google account (must be in License Testing)
3. **Navigate to subscription screen** (get-premium.tsx)
4. **Attempt a purchase**:
   - Select a subscription package
   - Click purchase
   - Google Play will show "Test purchase" (no charge)
   - Complete the purchase flow

**What to test:**
- ✅ Purchase flow works
- ✅ RevenueCat receives purchase event
- ✅ Subscription status updates in app
- ✅ Webhook fires (check RevenueCat dashboard)
- ✅ Database syncs subscription status
- ✅ Restore purchases works
- ✅ Subscription appears in Google Play account

---

## 🔍 Testing Checklist

### Pre-Testing Setup:
- [ ] Products created in Google Play Console
- [ ] Products linked in RevenueCat Dashboard
- [ ] Product IDs match exactly (Google Play ↔ RevenueCat ↔ App)
- [ ] Closed Testing release created
- [ ] Testers added to Closed Testing
- [ ] Test accounts added to License Testing
- [ ] AAB uploaded to Closed Testing
- [ ] Release rolled out to Closed Testing

### Testing Flow:
- [ ] App installs from Closed Testing
- [ ] RevenueCat initializes correctly
- [ ] Offerings load from RevenueCat
- [ ] Subscription packages display correctly
- [ ] Purchase flow initiates
- [ ] Google Play shows "Test purchase"
- [ ] Purchase completes successfully
- [ ] RevenueCat receives purchase event
- [ ] Subscription status updates in app
- [ ] Database syncs subscription status
- [ ] Webhook fires (check RevenueCat dashboard)
- [ ] Restore purchases works
- [ ] Subscription appears in Google Play account

---

## 🐛 Common Issues & Solutions

### Issue: "Product not found" or "Product unavailable"

**Causes:**
- Product not created in Google Play Console
- Product ID mismatch between Google Play and RevenueCat
- Product not linked in RevenueCat
- App not published to Closed Testing yet

**Solutions:**
1. Verify product exists in Google Play Console
2. Check product ID matches exactly (case-sensitive)
3. Link product in RevenueCat dashboard
4. Wait for Closed Testing release to be active (can take a few hours)

---

### Issue: "Purchase fails" or "Error purchasing"

**Causes:**
- Test account not in License Testing
- Test account not added to Closed Testing
- Product not available in your country
- Google Play services issue

**Solutions:**
1. Add test account to License Testing (Google Play Console → Setup → License testing)
2. Add test account to Closed Testing testers list
3. Check product availability in your country
4. Clear Google Play Store cache and retry

---

### Issue: "RevenueCat not receiving purchase events"

**Causes:**
- Webhook not configured in RevenueCat
- Product not linked correctly
- RevenueCat API key incorrect

**Solutions:**
1. Check RevenueCat Dashboard → Project Settings → Webhooks
2. Verify webhook URL is correct
3. Verify product linking in RevenueCat
4. Check RevenueCat API key in `.env` file

---

### Issue: "Subscription status not syncing"

**Causes:**
- Webhook not firing
- Database sync logic issue
- RevenueCat customer not linked

**Solutions:**
1. Check RevenueCat webhook logs
2. Verify user is logged into RevenueCat (`linkUserToRevenueCat`)
3. Check database sync code in `lib/appwrite/subscriptions.ts`
4. Manually trigger sync if needed

---

## 📊 Testing Workflow

### Phase 1: Internal Testing (Quick Validation)
1. Use **Internal Testing** track
2. Add yourself as tester
3. Test basic purchase flow
4. Verify RevenueCat receives events
5. **Time:** ~30 minutes

### Phase 2: Closed Testing (Full Testing)
1. Move to **Closed Testing** track
2. Add team members as testers
3. Test all subscription products
4. Test renewals, cancellations, restorations
5. Verify webhooks and database sync
6. **Time:** 1-2 days

### Phase 3: Production (Public Release)
1. Once testing is complete
2. Upload same AAB to **Production**
3. Submit for review
4. Launch to public

---

## 🔐 Test Accounts Setup

**Create dedicated test Google accounts:**

1. **Create test accounts:**
   - `test1@yourdomain.com`
   - `test2@yourdomain.com`
   - etc.

2. **Add to License Testing:**
   - Google Play Console → Setup → License Testing
   - Add all test emails

3. **Add to Closed Testing:**
   - Google Play Console → Testing → Closed Testing → Testers
   - Add all test emails

4. **Use on test devices:**
   - Sign in to Google Play Store with test account
   - Install app from Closed Testing track
   - Test purchases (will be free)

---

## 📚 Additional Resources

### RevenueCat Documentation:
- [RevenueCat Testing Guide](https://docs.revenuecat.com/docs/testing-purchases)
- [Google Play Integration](https://docs.revenuecat.com/docs/google-play)
- [Webhooks Setup](https://docs.revenuecat.com/docs/webhooks)

### Google Play Documentation:
- [Set up license testing](https://support.google.com/googleplay/android-developer/answer/6062777)
- [Test subscriptions](https://support.google.com/googleplay/android-developer/answer/140504)
- [Closed testing guide](https://support.google.com/googleplay/android-developer/answer/9845334)

---

## ✅ Quick Start Checklist

**For immediate testing:**

1. ✅ Create subscription products in Google Play Console
2. ✅ Link products in RevenueCat Dashboard
3. ✅ Create Closed Testing release
4. ✅ Add test account to License Testing
5. ✅ Add test account to Closed Testing testers
6. ✅ Build and upload AAB to Closed Testing
7. ✅ Install app from Closed Testing
8. ✅ Test purchase flow

**Estimated time:** 2-4 hours (including Google Play processing time)

---

## 🎯 Summary

**Use Closed Testing for RevenueCat subscription testing because:**
- ✅ Supports License Testing (free test purchases)
- ✅ Real subscription environment
- ✅ RevenueCat webhooks work correctly
- ✅ Can test all subscription flows
- ✅ Up to 100,000 testers
- ✅ Faster than Production (no review needed)

**Don't use:**
- ❌ **Internal Testing** - Too limited (100 testers), better for quick validation only
- ❌ **Open Testing** - Public beta, not ideal for subscription testing
- ❌ **Production** - No License Testing, real charges, review required

**Recommended workflow:**
1. **Internal Testing** → Quick validation (30 min)
2. **Closed Testing** → Full subscription testing (1-2 days)
3. **Production** → Public release

---

**Next Steps:** Follow the Step-by-Step Setup Guide above to get started! 🚀

