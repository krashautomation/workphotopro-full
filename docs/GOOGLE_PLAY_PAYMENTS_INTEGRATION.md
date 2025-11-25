# Google Play Payments Integration Overview

This document outlines what needs to be implemented to integrate Google Play Billing for premium subscriptions in WorkPhotoPro V2.

## 1. Required Libraries

### Primary Library:
- **`react-native-iap`** - Google Play Billing Library for React Native
  - Handles product queries, purchases, subscriptions
  - Supports subscription management (renewals, cancellations)
  - Works with Expo (may need config plugin)

### Alternative (if using Expo):
- **`expo-in-app-purchases`** - Expo's official IAP library
  - Simpler API, but less feature-rich than react-native-iap

**Recommendation:** Use `react-native-iap` for more control and features.

---

## 2. Database Schema (Appwrite Collections)

### A. Subscriptions Collection
Create a new `subscriptions` collection:

**Fields:**
- `userId` (String, required) - Appwrite user ID
- `orgId` (String, required) - Organization ID (subscriptions are org-level)
- `packageId` (String, required) - Maps to your premium package IDs (1-10)
- `googlePlayPurchaseToken` (String, required) - Google Play purchase token
- `googlePlayOrderId` (String, required) - Google Play order ID
- `productId` (String, required) - Google Play product ID (e.g., "premium_2_members_monthly")
- `subscriptionType` (String, required) - "monthly" or "annual"
- `status` (String, required) - "active", "expired", "canceled", "pending", "on_hold"
- `startDate` (DateTime, required) - Subscription start date
- `expiryDate` (DateTime, required) - Subscription expiry date
- `autoRenewing` (Boolean, default: true) - Whether subscription auto-renews
- `trialEndDate` (DateTime, optional) - End of trial period
- `canceledAt` (DateTime, optional) - When subscription was canceled
- `lastVerifiedAt` (DateTime, required) - Last time subscription was verified with Google
- `createdAt` (DateTime, required)
- `updatedAt` (DateTime, required)

**Indexes:**
- `userId` (for user's subscriptions)
- `orgId` (for org's subscription)
- `googlePlayPurchaseToken` (for verification)
- `status` (for active subscriptions query)

### B. Update Organizations Collection
Add/verify these fields exist:
- `premiumTier` (String, default: "free") - Already exists ✓
- `subscriptionId` (String, optional) - Reference to active subscription
- `subscriptionExpiryDate` (DateTime, optional) - Quick expiry check

### C. Payment Transactions Collection (Optional but Recommended)
Create `payment_transactions` collection for audit trail:

**Fields:**
- `userId` (String, required)
- `orgId` (String, required)
- `subscriptionId` (String, optional)
- `googlePlayOrderId` (String, required)
- `googlePlayPurchaseToken` (String, required)
- `amount` (Float, required) - Transaction amount
- `currency` (String, required) - Currency code
- `transactionType` (String, required) - "purchase", "renewal", "refund", "cancel"
- `status` (String, required) - "completed", "pending", "failed", "refunded"
- `transactionDate` (DateTime, required)
- `createdAt` (DateTime, required)

---

## 3. Google Play Console Setup

### Required Steps:

1. **Create subscription products in Google Play Console**
   - Product IDs must match your package IDs (e.g., `premium_2_members_monthly`, `premium_2_members_annual`)
   - Set pricing for each product
   - Configure trial periods (14 days as per your UI)
   - Set up base plans and offers

2. **Link your app package name**
   - Ensure `com.workphotopro.app` matches your Android app

3. **Set up license testing**
   - Add test accounts for testing purchases
   - Configure license testers

4. **Get service account credentials**
   - For server-side verification (recommended)
   - Download JSON key file

---

## 4. Implementation Architecture

### A. Client-Side (React Native)

**Services to Create:**
- `lib/appwrite/payments.ts` - Payment service
  - `initializePayments()` - Initialize Google Play Billing
  - `getAvailableProducts()` - Fetch available subscription products
  - `purchaseSubscription(productId)` - Initiate purchase flow
  - `getPurchases()` - Get user's active purchases
  - `restorePurchases()` - Restore previous purchases
  - `acknowledgePurchase(purchaseToken)` - Acknowledge purchase to Google

**Components to Update:**
- `app/(jobs)/get-premium.tsx` - Wire up purchase buttons
- `app/(jobs)/get-package.tsx` - Handle purchase initiation

### B. Server-Side Verification (Recommended)

**Appwrite Cloud Function:**
Create a Cloud Function for:
- Verifying purchase tokens with Google Play API
- Updating subscription status in database
- Updating organization `premiumTier`
- Handling webhooks from Google Play (subscription renewals, cancellations)

**Why Server-Side:**
- Security (prevents fake purchases)
- Reliable verification
- Handles subscription lifecycle events
- Updates database automatically

### C. Subscription Status Checking

**Background Job/Function:**
- Periodic check (daily/hourly) of subscription expiry dates
- Verify active subscriptions with Google Play API
- Update expired subscriptions
- Downgrade organizations when subscriptions expire

---

## 5. Payment Flow

### Purchase Flow:
1. User selects package → Calls `purchaseSubscription(productId)`
2. Google Play purchase dialog appears
3. User completes purchase → Google returns purchase token
4. Client sends purchase token to your backend
5. Backend verifies token with Google Play API
6. Backend creates subscription record in database
7. Backend updates organization `premiumTier`
8. Client acknowledges purchase to Google
9. UI updates to show premium status

### Subscription Renewal Flow:
1. Google Play automatically renews subscription
2. Google sends notification to your backend (webhook)
3. Backend verifies renewal
4. Backend updates subscription `expiryDate`
5. Organization remains premium

### Cancellation Flow:
1. User cancels in Google Play or your app
2. Subscription continues until expiry date
3. Backend marks subscription as `canceled`
4. On expiry, backend downgrades organization to `free`

---

## 6. Key Considerations

### Security:
- Always verify purchases server-side
- Never trust client-side purchase data
- Use Google Play API for verification
- Store purchase tokens securely

### Error Handling:
- Handle network failures during purchase
- Handle user cancellation
- Handle payment failures
- Handle subscription already owned

### Testing:
- Use Google Play test accounts
- Test purchase flow end-to-end
- Test subscription renewal
- Test cancellation
- Test restore purchases

### User Experience:
- Show loading states during purchase
- Handle purchase errors gracefully
- Provide clear subscription status
- Allow users to manage subscriptions (link to Google Play)

---

## 7. Integration Points in Your Codebase

### Files to Modify:
- `app/(jobs)/get-premium.tsx` - Add purchase logic
- `app/(jobs)/get-package.tsx` - Wire up upgrade button
- `lib/appwrite/teams.ts` - Add subscription update methods
- `context/OrganizationContext.tsx` - Refresh org data after purchase

### New Files to Create:
- `lib/appwrite/payments.ts` - Payment service
- `lib/appwrite/subscriptions.ts` - Subscription management service
- `appwrite/functions/verify-purchase` - Cloud Function for verification
- `appwrite/functions/subscription-webhook` - Cloud Function for webhooks

---

## 8. Product ID Mapping

Map your packages to Google Play product IDs:

```
Package 1 (2 members): 
  - Monthly: "premium_2_members_monthly"
  - Annual: "premium_2_members_annual"

Package 2 (3 members):
  - Monthly: "premium_3_members_monthly"
  - Annual: "premium_3_members_annual"
  
Package 3 (4 members):
  - Monthly: "premium_4_members_monthly"
  - Annual: "premium_4_members_annual"

Package 4 (5 members):
  - Monthly: "premium_5_members_monthly"
  - Annual: "premium_5_members_annual"

Package 5 (6 members):
  - Monthly: "premium_6_members_monthly"
  - Annual: "premium_6_members_annual"

Package 6 (7 members):
  - Monthly: "premium_7_members_monthly"
  - Annual: "premium_7_members_annual"

Package 7 (8 members):
  - Monthly: "premium_8_members_monthly"
  - Annual: "premium_8_members_annual"

Package 8 (9 members):
  - Monthly: "premium_9_members_monthly"
  - Annual: "premium_9_members_annual"

Package 9 (10 members):
  - Monthly: "premium_10_members_monthly"
  - Annual: "premium_10_members_annual"

Package 10 (11 members):
  - Monthly: "premium_11_members_monthly"
  - Annual: "premium_11_members_annual"
```

---

## 9. Testing Checklist

- [ ] Set up Google Play Console products
- [ ] Configure license testing
- [ ] Test purchase flow
- [ ] Test subscription verification
- [ ] Test subscription renewal
- [ ] Test cancellation
- [ ] Test restore purchases
- [ ] Test organization premium tier updates
- [ ] Test premium feature gating

---

## 10. Current Premium Packages

Based on `app/(jobs)/get-premium.tsx`, you have 10 packages:

1. **Up to 2 team members** - $7.99/month, $79.99/year
2. **Up to 3 team members** - $15.99/month, $159.99/year
3. **Up to 4 team members** - $23.99/month, $239.99/year
4. **Up to 5 team members** - $31.99/month, $319.99/year
5. **Up to 6 team members** - $39.99/month, $399.99/year
6. **Up to 7 team members** - $47.99/month, $479.99/year
7. **Up to 8 team members** - $52.99/month, $529.99/year
8. **Up to 9 team members** - $60.99/month, $609.99/year
9. **Up to 10 team members** - $68.99/month, $689.99/year
10. **Up to 11 team members** - $74.99/month, $749.99/year

All packages include:
- 14 day free trial
- High res images
- Disable watermarks
- Integrations (Dropbox, Google Drive, OneDrive)

---

## Summary

This provides a comprehensive foundation for Google Play Billing integration. The main work involves:

1. Setting up Google Play Console products
2. Implementing client-side purchase flow
3. Creating server-side verification
4. Updating database schema
5. Handling subscription lifecycle events

