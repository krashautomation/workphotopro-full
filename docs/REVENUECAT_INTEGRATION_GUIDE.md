# RevenueCat Integration Guide

This guide outlines the complete implementation process for integrating RevenueCat into WorkPhotoPro V2 for premium subscription management.

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Database Schema](#database-schema)
4. [RevenueCat Dashboard Setup](#revenuecat-dashboard-setup)
5. [Google Play Console Setup](#google-play-console-setup)
6. [Implementation Architecture](#implementation-architecture)
7. [Step-by-Step Integration](#step-by-step-integration)
8. [Code Examples](#code-examples)
9. [Webhook Implementation](#webhook-implementation)
10. [Testing](#testing)
11. [Cost Analysis](#cost-analysis)

---

## Overview

### What is RevenueCat?

RevenueCat is a backend service that wraps Apple App Store and Google Play Billing, providing:
- Unified API for iOS and Android subscriptions
- Server-side receipt validation
- Subscription lifecycle management
- Analytics and paywall management
- Cross-platform subscription sync

### Benefits for WorkPhotoPro V2

1. **Faster Implementation** - 1 week vs 2-3 weeks for direct integration
2. **Cross-Platform Ready** - Same code works for iOS when you expand
3. **Less Backend Code** - No receipt validation needed
4. **Built-in Analytics** - Subscription metrics out of the box
5. **Free Tier** - Free up to $10k/month revenue
6. **Better Testing** - Test Store and sandbox tools

---

## Requirements

### 1. RevenueCat Account

**Sign Up:**
- Go to [revenuecat.com](https://www.revenuecat.com)
- Create free account
- Get your API keys from dashboard

**Pricing:**
- **Free Tier:** Up to $10k monthly revenue
- **Paid Tiers:** $99/month+ for revenue > $10k/month
- Google Play fees still apply (15-30%)

### 2. Technical Requirements

**React Native/Expo:**
- React Native 0.73.0 or later
- Expo SDK 54+ (your current version)
- May need Expo config plugin

**Platform Requirements:**
- **Android:** API level 21+ (Android 5.0+)
- **iOS:** iOS 11.0+ (if adding iOS later)

**Dependencies:**
- `react-native-purchases` - RevenueCat SDK
- Appwrite Cloud Functions (for webhooks)

### 3. Platform Setup (Still Required)

You still need to:
- Create subscription products in Google Play Console
- Configure products in RevenueCat dashboard
- Set up webhook endpoints

---

## Database Schema

> **Schema Review:** This schema has been refined based on RevenueCat best practices to be easier to maintain, avoid duplicate data, align with how RevenueCat actually works, scale for org-based billing, and simplify backend + app logic.

### A. Subscriptions Collection

Create/update `subscriptions` collection in Appwrite:

**Core Fields (Required):**
- `userId` (String, required) - Appwrite user ID
- `orgId` (String, required) - Organization ID
- `revenueCatCustomerId` (String, required) - RevenueCat customer ID
- `productId` (String, required) - RevenueCat product identifier (e.g., "premium_2_members_monthly")
- `status` (String, required) - Subscription status (see status enum below)
- `startDate` (DateTime, required) - Subscription start date
- `expiryDate` (DateTime, required) - Subscription expiry date
- `autoRenewing` (Boolean, default: true) - Whether subscription auto-renews
- `canceledAt` (DateTime, optional) - When subscription was canceled (null if active)
- `lastSyncedAt` (DateTime, required) - Last sync with RevenueCat
- `createdAt` (DateTime, required)
- `updatedAt` (DateTime, required)

**Optional Fields:**
- `trialEndDate` (DateTime, optional) - End of trial period (useful for onboarding logic)
- `packageId` (String, optional) - Your package ID (1-10) - Only if manually mapping tiers

**Removed Fields (Redundant):**
- ❌ `revenueCatSubscriptionId` - Not required; RevenueCat doesn't provide stable sub ID for all cases
- ❌ `subscriptionType` - Derivable from `productId` (contains "monthly" or "annual")
- ❌ `willRenewAt` - Redundant; `expiryDate` already covers renewal timing

**Status Enum Values:**
```
active          - Subscription is active and working
grace_period    - Payment failed, in grace period
billing_issue   - Payment issue detected
canceled        - User canceled (still active until expiryDate)
expired         - Subscription has expired
refunded        - Subscription was refunded (rare)
paused          - Subscription is paused
```

**Indexes:**
- `userId` - For user's subscriptions
- `orgId` - For organization's subscription (unique index recommended)
- `revenueCatCustomerId` - For RevenueCat lookups
- `status` - For active subscriptions query
- `expiryDate` - For expiry checks

**Design Notes:**
- This represents the **active subscription** for a customer, not renewal history
- One subscription record per org (most recent/active)
- All other fields can be inferred or are redundant with RevenueCat's data

### B. Update Organizations Collection

Add/verify these fields:

**Required Fields:**
- `premiumTier` (String, default: "free") - Already exists ✓
- `currentProductId` (String, optional) - **NEW** - Current active product ID (makes billing logic trivial)
- `subscriptionId` (String, optional) - Reference to active subscription
- `subscriptionExpiryDate` (DateTime, optional) - Quick expiry check
- `revenueCatCustomerId` (String, optional) - RevenueCat customer ID

**Why `currentProductId`?**
- Allows UI/business logic to instantly know which tier the org is on
- Avoids checking subscriptions collection on every page load
- Examples: `"free"`, `"premium_2_members_monthly"`, `"premium_5_members_annual"`, `"enterprise"`

**Example Usage:**
```typescript
// Instead of querying subscriptions table:
if (org.currentProductId === 'free') {
  // Show upgrade prompt
} else if (org.currentProductId?.includes('monthly')) {
  // Show monthly subscription UI
} else if (org.currentProductId?.includes('annual')) {
  // Show annual subscription UI
}
```

### C. RevenueCat Events Collection (Recommended - for audit & retry logic)

Create `revenuecat_events` collection for webhook events:

**Fields:**
- `eventId` (String, required, unique) - RevenueCat event ID (prevents duplicates)
- `eventType` (String, required) - Event type from RevenueCat (e.g., "INITIAL_PURCHASE", "RENEWAL")
- `eventCategory` (String, required) - Event category: `"subscription"`, `"entitlement"`, `"customer"`
- `customerId` (String, required) - RevenueCat customer ID
- `userId` (String, optional) - Appwrite user ID (populated after processing)
- `orgId` (String, optional) - Organization ID (populated after processing)
- `productId` (String, optional) - Product ID (extracted from event)
- `eventData` (String, JSON) - Full event payload (store complete event)
- `attemptNumber` (Integer, default: 0) - **NEW** - Retry attempt number
- `processedStatus` (String, required) - **NEW** - Processing status: `"pending"`, `"success"`, `"failed"`, `"ignored"`
- `processedAt` (DateTime, optional) - When event was processed
- `errorMessage` (String, optional) - Error message if processing failed
- `createdAt` (DateTime, required)

**Indexes:**
- `eventId` (unique) - Prevent duplicate processing
- `processedStatus` - For retry queue queries
- `customerId` - For customer event history
- `createdAt` - For chronological queries

**Why This Structure?**
- **Retry Logic:** `attemptNumber` and `processedStatus` enable retry on network errors or temporary inconsistencies
- **Audit Trail:** Complete event history for debugging and compliance
- **Idempotency:** `eventId` uniqueness prevents duplicate processing
- **Error Handling:** `errorMessage` helps debug failed events

**Processing Flow:**
1. Webhook receives event → Create record with `processedStatus: "pending"`
2. Process event → Update to `processedStatus: "success"` or `"failed"`
3. If failed → Increment `attemptNumber`, retry later
4. If `attemptNumber > 3` → Mark as `"ignored"` and alert

---

## Schema Summary

### Simplified Subscription Model

**10 Core Fields** (all you really need):
1. `userId`
2. `orgId`
3. `revenueCatCustomerId`
4. `productId`
5. `status`
6. `startDate`
7. `expiryDate`
8. `canceledAt`
9. `autoRenewing`
10. `lastSyncedAt`

Everything else can be inferred or is redundant with RevenueCat's data.

### Benefits of This Schema

✅ **Less Redundancy** - Removed fields that RevenueCat already tracks  
✅ **Easier Sync Logic** - Simpler status enum matches RevenueCat webhooks  
✅ **Matches RevenueCat Structure** - Aligns with customer → entitlements model  
✅ **Clear Separation** - Subscription record vs event log  
✅ **Org-Level Premium** - `currentProductId` makes billing logic trivial  
✅ **Retry Capability** - Event collection supports retry logic  
✅ **Better Performance** - `currentProductId` avoids subscription queries on every page load

---

## Schema Design Rationale

### Why This Schema?

This schema has been refined based on RevenueCat best practices and real-world implementation patterns:

#### 1. **Simplified Subscription Model**
- **One record per active subscription** - Not renewal history (RevenueCat handles that)
- **10 core fields** - Everything else is redundant or derivable
- **Status matches webhooks** - Direct mapping to RevenueCat event types

#### 2. **Organization-Level Billing**
- **`currentProductId` on org** - Instant tier lookup without subscription query
- **Cached expiry date** - Quick checks without database joins
- **Single source of truth** - Org knows its premium status immediately

#### 3. **Event-Driven Architecture**
- **Complete event log** - Full audit trail of all RevenueCat events
- **Retry capability** - Handle network errors and temporary inconsistencies
- **Idempotency** - Prevent duplicate processing with unique `eventId`

#### 4. **Performance Optimizations**
- **Denormalized `currentProductId`** - Avoid subscription queries on every page load
- **Indexed lookups** - Fast queries by `orgId`, `userId`, `status`
- **Minimal joins** - Most queries hit single collection

### Field Removal Justification

**Removed:**
- `revenueCatSubscriptionId` - RevenueCat doesn't provide stable subscription IDs in all cases
- `subscriptionType` - Can be derived from `productId` (contains "monthly"/"annual")
- `willRenewAt` - Redundant with `expiryDate` (renewal happens at expiry)
- `packageId` - Optional, only needed if manually mapping tiers

**Kept:**
- `trialEndDate` - Useful for onboarding logic and trial reminders
- `canceledAt` - Important for understanding cancellation timing
- `lastSyncedAt` - Critical for sync job logic

### Status Enum Alignment

The status enum directly maps to RevenueCat entitlement states:

| RevenueCat State | Your Status | Description |
|-----------------|-------------|-------------|
| `ACTIVE` | `active` | Subscription is active |
| `GRACE_PERIOD` | `grace_period` | Payment failed, in grace period |
| `BILLING_ISSUE` | `billing_issue` | Payment issue detected |
| `CANCELED` | `canceled` | User canceled (active until expiry) |
| `EXPIRED` | `expired` | Subscription expired |
| `REFUNDED` | `refunded` | Subscription refunded |
| `PAUSED` | `paused` | Subscription paused |

This alignment makes webhook processing straightforward - direct mapping from RevenueCat events to your database.

---

## RevenueCat Dashboard Setup

### Step 1: Create Project

1. Log into RevenueCat dashboard
2. Create new project: "WorkPhotoPro V2"
3. Select platforms: Android (and iOS if planning)

### Step 2: Configure Products

For each of your 10 packages, create products:

**Product Structure:**
```
Package 1 (2 members):
  - Monthly: premium_2_members_monthly
  - Annual: premium_2_members_annual

Package 2 (3 members):
  - Monthly: premium_3_members_monthly
  - Annual: premium_3_members_annual

... (continue for all 10 packages)
```

**Product Configuration:**
- Product Identifier: `premium_X_members_monthly` / `premium_X_members_annual`
- Display Name: "Premium - Up to X Members (Monthly/Annual)"
- Description: Your package description

### Step 3: Create Entitlements

Create entitlement: `premium`

**Entitlement Configuration:**
- Identifier: `premium`
- Display Name: "Premium Subscription"
- Attach all 20 products (10 packages × 2 billing periods) to this entitlement

### Step 4: Create Offerings

Create offering: `default`

**Offering Structure:**
- Offering Identifier: `default`
- Display Name: "Premium Plans"
- Package all products into packages (monthly/annual groupings)

### Step 5: Configure Webhooks

1. Go to Project Settings → Webhooks
2. Add webhook URL: `https://your-appwrite-endpoint.com/v1/functions/revenuecat-webhook`
3. Select events to receive:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `UNCANCELLATION`
   - `NON_RENEWING_PURCHASE`
   - `EXPIRATION`
   - `BILLING_ISSUE`
   - `SUBSCRIPTION_PAUSED`
   - `SUBSCRIPTION_EXTENDED`

### Step 6: Get API Keys

1. Go to Project Settings → API Keys
2. Copy:
   - **Public API Key** - For client-side SDK
   - **Secret API Key** - For server-side webhook verification (keep secret!)

---

## Google Play Console Setup

### Still Required!

RevenueCat doesn't eliminate Google Play setup. You still need:

### Step 1: Create Subscription Products

For each package, create subscriptions in Google Play Console:

**Product IDs must match RevenueCat product identifiers:**
- `premium_2_members_monthly`
- `premium_2_members_annual`
- `premium_3_members_monthly`
- ... (all 20 products)

### Step 2: Configure Each Product

**For each product:**
- Set pricing (match your package prices)
- Configure 14-day free trial
- Set up base plan
- Configure offers (if any)

### Step 3: Link to RevenueCat

1. In RevenueCat dashboard, go to each product
2. Link to Google Play product ID
3. RevenueCat will sync product details

### Step 4: License Testing

- Add test accounts
- Configure license testers
- Test purchases without real charges

---

## Implementation Architecture

### Client-Side (React Native)

**Services:**
- `lib/appwrite/payments.ts` - RevenueCat payment service
- `lib/appwrite/subscriptions.ts` - Subscription management

**Components:**
- `app/(jobs)/get-premium.tsx` - Purchase UI
- `app/(jobs)/get-package.tsx` - Package details modal

### Server-Side (Appwrite Cloud Functions)

**Functions:**
- `revenuecat-webhook` - Handle RevenueCat webhooks
- `sync-subscription-status` - Periodic sync job (optional)

### Data Flow

```
User → App → RevenueCat SDK → Google Play → RevenueCat Backend
                                              ↓
                                    Webhook → Appwrite Function
                                              ↓
                                    Update Database
                                              ↓
                                    Update Organization Premium Tier
```

---

## Step-by-Step Integration

### Phase 1: SDK Installation & Setup (Day 1)

#### Step 1.1: Install SDK

```bash
npm install react-native-purchases
# or
expo install react-native-purchases
```

#### Step 1.2: Configure Expo (if needed)

Add to `app.config.js`:
```javascript
plugins: [
  // ... existing plugins
  [
    'react-native-purchases',
    {
      // Configuration if needed
    }
  ]
]
```

#### Step 1.3: Initialize SDK

Create `lib/appwrite/payments.ts`:
```typescript
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage,
  CustomerInfo 
} from 'react-native-purchases';

const REVENUECAT_API_KEY = {
  android: 'your_android_api_key',
  ios: 'your_ios_api_key' // For future iOS support
};

class PaymentService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY[platform]
    });
    
    this.initialized = true;
  }

  async loginUser(appwriteUserId: string) {
    await Purchases.logIn(appwriteUserId);
  }

  async logoutUser() {
    await Purchases.logOut();
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  }

  async purchasePackage(packageToPurchase: PurchasesPackage) {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  }

  async restorePurchases(): Promise<CustomerInfo> {
    return await Purchases.restorePurchases();
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    return await Purchases.getCustomerInfo();
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  }
}

export const paymentService = new PaymentService();
```

### Phase 2: Link RevenueCat to Appwrite Users (Day 2)

#### Step 2.1: Create User Linking Service

Add to `lib/appwrite/subscriptions.ts`:
```typescript
import { paymentService } from './payments';
import { databaseService } from './database';
import { useAuth } from '@/context/AuthContext';

class SubscriptionService {
  /**
   * Link RevenueCat customer to Appwrite user
   */
  async linkUserToRevenueCat(appwriteUserId: string) {
    // Initialize RevenueCat
    await paymentService.initialize();
    
    // Login user to RevenueCat
    await paymentService.loginUser(appwriteUserId);
    
    // Get RevenueCat customer info
    const customerInfo = await paymentService.getCustomerInfo();
    
    // Store mapping in database
    await this.storeRevenueCatMapping(
      appwriteUserId,
      customerInfo.originalAppUserId
    );
    
    return customerInfo;
  }

  /**
   * Store RevenueCat customer ID mapping
   */
  async storeRevenueCatMapping(
    appwriteUserId: string,
    revenueCatCustomerId: string
  ) {
    // Update user's organization with RevenueCat ID
    // This would be done when user first opens premium screen
  }

  /**
   * Sync subscription status from RevenueCat
   */
  async syncSubscriptionStatus(userId: string, orgId: string) {
    const customerInfo = await paymentService.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isPremium) {
      const entitlement = customerInfo.entitlements.active['premium'];
      
      // Update subscription in database
      await this.updateSubscriptionFromRevenueCat(
        userId,
        orgId,
        entitlement
      );
      
      // Update organization premium tier
      await this.updateOrganizationPremiumTier(orgId, true);
    } else {
      // Downgrade organization
      await this.updateOrganizationPremiumTier(orgId, false);
    }
  }

  /**
   * Update subscription record from RevenueCat entitlement
   */
  async updateSubscriptionFromRevenueCat(
    userId: string,
    orgId: string,
    entitlement: any
  ) {
    // Map RevenueCat entitlement to simplified subscription model
    const subscriptionData = {
      userId,
      orgId,
      revenueCatCustomerId: entitlement.customerId,
      productId: entitlement.productIdentifier,
      status: this.mapRevenueCatStatus(entitlement),
      startDate: new Date(entitlement.originalPurchaseDate),
      expiryDate: new Date(entitlement.expirationDate),
      autoRenewing: entitlement.willRenew,
      canceledAt: entitlement.unsubscribeDetectedAt 
        ? new Date(entitlement.unsubscribeDetectedAt) 
        : null,
      lastSyncedAt: new Date()
    };

    // Optional: Add trial end date if in trial
    if (entitlement.periodType === 'trial') {
      subscriptionData.trialEndDate = new Date(entitlement.expirationDate);
    }

    // Create or update subscription record (upsert by orgId)
    await this.upsertSubscription(orgId, subscriptionData);
    
    // Update organization with currentProductId for fast lookups
    await this.updateOrganizationPremiumTier(
      orgId,
      entitlement.isActive ? entitlement.productIdentifier : null,
      subscriptionData.expiryDate
    );
  }

  /**
   * Map RevenueCat status to your status enum
   */
  mapRevenueCatStatus(entitlement: any): string {
    if (!entitlement.isActive) {
      return 'expired';
    }
    
    // Map RevenueCat states to your enum
    if (entitlement.willRenew === false && entitlement.unsubscribeDetectedAt) {
      return 'canceled'; // Canceled but still active until expiry
    }
    
    // Check for grace period or billing issues
    if (entitlement.store === 'GOOGLE_PLAY') {
      // Google Play specific states
      if (entitlement.periodType === 'grace_period') {
        return 'grace_period';
      }
      if (entitlement.periodType === 'billing_retry') {
        return 'billing_issue';
      }
    }
    
    if (entitlement.periodType === 'trial') {
      return 'active'; // Trial is still active
    }
    
    return 'active';
  }

  /**
   * Update organization premium tier with currentProductId
   */
  async updateOrganizationPremiumTier(
    orgId: string,
    productId: string | null,
    expiryDate: Date | null
  ) {
    const { organizationService } = await import('./teams');
    
    // Determine premium tier from productId
    const premiumTier = productId 
      ? this.extractTierFromProductId(productId)
      : 'free';
    
    // Get subscription ID if exists
    const subscription = await this.getSubscriptionByOrgId(orgId);
    
    await organizationService.updateOrganization(orgId, {
      premiumTier,
      currentProductId: productId, // NEW: Fast lookup field
      subscriptionId: subscription?.$id || null,
      subscriptionExpiryDate: expiryDate,
      revenueCatCustomerId: subscription?.revenueCatCustomerId || null
    });
  }

  /**
   * Extract tier from product ID (e.g., "premium_2_members_monthly" -> "premium_2")
   */
  extractTierFromProductId(productId: string): string {
    // Extract package number from product ID
    const match = productId.match(/premium_(\d+)_members/);
    if (match) {
      return `premium_${match[1]}`;
    }
    return 'premium'; // Fallback
  }

  /**
   * Upsert subscription (create or update)
   */
  async upsertSubscription(orgId: string, data: any) {
    // Check if subscription exists for this org
    const existing = await this.getSubscriptionByOrgId(orgId);
    
    if (existing) {
      // Update existing
      await databaseService.updateDocument('subscriptions', existing.$id, data);
    } else {
      // Create new
      await databaseService.createDocument('subscriptions', data);
    }
  }

  /**
   * Get subscription by org ID
   */
  async getSubscriptionByOrgId(orgId: string) {
    const result = await databaseService.listDocuments('subscriptions', [
      Query.equal('orgId', orgId),
      Query.limit(1)
    ]);
    return result.documents[0] || null;
  }
}

export const subscriptionService = new SubscriptionService();
```

### Phase 3: Purchase Flow Implementation (Day 2-3)

#### Step 3.1: Update Premium Screen

Update `app/(jobs)/get-premium.tsx`:

```typescript
import { paymentService } from '@/lib/appwrite/payments';
import { subscriptionService } from '@/lib/appwrite/subscriptions';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';

export default function GetPremium() {
  const { user } = useAuth();
  const { currentOrganization, loadUserData } = useOrganization();
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      await paymentService.initialize();
      await paymentService.loginUser(user.$id);
      
      const currentOffering = await paymentService.getOfferings();
      setOfferings(currentOffering);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const handlePurchase = async (packageToPurchase) => {
    try {
      setLoading(true);
      
      // Purchase through RevenueCat
      const customerInfo = await paymentService.purchasePackage(packageToPurchase);
      
      // Sync subscription status
      await subscriptionService.syncSubscriptionStatus(
        user.$id,
        currentOrganization.$id
      );
      
      // Refresh organization data
      await loadUserData();
      
      // Show success message
      Alert.alert('Success', 'Your subscription is now active!');
      
      // Close modal
      setModalVisible(false);
    } catch (error) {
      if (error.userCancelled) {
        // User cancelled - no action needed
        return;
      }
      
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map your packages to RevenueCat packages
  const mapPackageToRevenueCat = (packageId: string, isMonthly: boolean) => {
    const productId = `premium_${packageId}_members_${isMonthly ? 'monthly' : 'annual'}`;
    
    // Find matching RevenueCat package
    if (!offerings) return null;
    
    return offerings.availablePackages.find(
      pkg => pkg.identifier === productId
    );
  };

  // Render packages with RevenueCat data
  // ...
}
```

### Phase 4: Webhook Implementation (Day 3-4)

#### Step 4.1: Create Appwrite Cloud Function

Create `appwrite/functions/revenuecat-webhook/index.ts`:

```typescript
import { Client, Functions } from 'node-appwrite';
import crypto from 'crypto';

const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY;

export default async function handler(req: any, res: any) {
  try {
    // Verify webhook signature
    const signature = req.headers['authorization'];
    const isValid = verifyWebhookSignature(req.body, signature);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    
    // Process event based on type
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(event);
        break;
      case 'RENEWAL':
        await handleRenewal(event);
        break;
      case 'CANCELLATION':
        await handleCancellation(event);
        break;
      case 'EXPIRATION':
        await handleExpiration(event);
        break;
      case 'UNCANCELLATION':
        await handleUncancellation(event);
        break;
      case 'BILLING_ISSUE':
        await handleBillingIssue(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function verifyWebhookSignature(body: any, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', REVENUECAT_SECRET_KEY);
  const digest = hmac.update(JSON.stringify(body)).digest('hex');
  return digest === signature;
}

async function handleInitialPurchase(event: any) {
  const { app_user_id, product_id, entitlement_ids, event_timestamp_ms } = event;
  
  // Get user ID from RevenueCat customer ID
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  
  // Get organization for user
  const orgId = await getUserOrganization(userId);
  
  // Calculate expiry date
  const expiryDate = calculateExpiryDate(product_id, event_timestamp_ms);
  
  // Create subscription record (simplified schema)
  await createSubscription({
    userId,
    orgId,
    revenueCatCustomerId: app_user_id,
    productId: product_id,
    status: 'active',
    startDate: new Date(event_timestamp_ms),
    expiryDate: expiryDate,
    autoRenewing: true,
    canceledAt: null,
    lastSyncedAt: new Date()
  });
  
  // Update organization with currentProductId for fast lookups
  await updateOrganizationPremiumTier(orgId, product_id, expiryDate, app_user_id);
}

async function handleRenewal(event: any) {
  const { app_user_id, product_id, event_timestamp_ms } = event;
  
  // Get org ID
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  const orgId = await getUserOrganization(userId);
  
  // Calculate new expiry date
  const expiryDate = calculateExpiryDate(product_id, event_timestamp_ms);
  
  // Update subscription expiry date
  await updateSubscriptionExpiry(orgId, expiryDate);
  
  // Update organization expiry date
  await updateOrganizationExpiry(orgId, expiryDate);
}

async function handleCancellation(event: any) {
  const { app_user_id, product_id, event_timestamp_ms } = event;
  
  // Get org ID
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  const orgId = await getUserOrganization(userId);
  
  // Mark subscription as canceled (but still active until expiry)
  await updateSubscriptionStatus(orgId, 'canceled', new Date(event_timestamp_ms));
  
  // Note: currentProductId stays the same - subscription remains active until expiry
  // Only update canceledAt timestamp
}

async function handleExpiration(event: any) {
  const { app_user_id, product_id } = event;
  
  // Get org ID
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  const orgId = await getUserOrganization(userId);
  
  // Mark subscription as expired
  await updateSubscriptionStatus(orgId, 'expired', null);
  
  // Downgrade organization - clear currentProductId
  await updateOrganizationPremiumTier(orgId, null, null, null);
}

async function handleBillingIssue(event: any) {
  const { app_user_id, product_id } = event;
  
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  const orgId = await getUserOrganization(userId);
  
  // Update status to billing_issue
  await updateSubscriptionStatus(orgId, 'billing_issue', null);
  
  // currentProductId stays - user still has access during grace period
}

async function handleUncancellation(event: any) {
  const { app_user_id, product_id } = event;
  
  const userId = await getUserIdFromRevenueCatId(app_user_id);
  const orgId = await getUserOrganization(userId);
  
  // Reactivate subscription
  await updateSubscriptionStatus(orgId, 'active', null);
  
  // Ensure currentProductId is set
  await updateOrganizationPremiumTier(orgId, product_id, null, app_user_id);
}

// Helper: Update organization premium tier with currentProductId
async function updateOrganizationPremiumTier(
  orgId: string,
  productId: string | null,
  expiryDate: Date | null,
  revenueCatCustomerId: string | null
) {
  const premiumTier = productId 
    ? extractTierFromProductId(productId)
    : 'free';
  
  const subscription = await getSubscriptionByOrgId(orgId);
  
  await updateOrganization(orgId, {
    premiumTier,
    currentProductId: productId, // KEY: Fast lookup field
    subscriptionId: subscription?.$id || null,
    subscriptionExpiryDate: expiryDate,
    revenueCatCustomerId: revenueCatCustomerId || subscription?.revenueCatCustomerId || null
  });
}

// Helper functions to interact with Appwrite database
// Implementation depends on your Appwrite setup
```

#### Step 4.2: Deploy Cloud Function

1. Create function in Appwrite Console
2. Set environment variables:
   - `REVENUECAT_SECRET_KEY` - Your RevenueCat secret key
   - `APPWRITE_ENDPOINT` - Your Appwrite endpoint
   - `APPWRITE_PROJECT_ID` - Your project ID
   - `APPWRITE_API_KEY` - Server API key
3. Set webhook URL in RevenueCat dashboard
4. Deploy function

### Phase 5: Subscription Status Checking (Day 4)

#### Step 5.1: Periodic Sync Job (Optional)

Create `appwrite/functions/sync-subscription-status/index.ts`:

```typescript
// Run daily to sync subscription statuses
export default async function handler(req: any, res: any) {
  // Get all active subscriptions
  const subscriptions = await getActiveSubscriptions();
  
  for (const subscription of subscriptions) {
    try {
      // Check status with RevenueCat API
      const customerInfo = await getRevenueCatCustomerInfo(
        subscription.revenueCatCustomerId
      );
      
      // Update subscription if status changed
      if (customerInfo.entitlements.active['premium']) {
        await updateSubscriptionStatus(subscription.id, 'active');
      } else {
        await updateSubscriptionStatus(subscription.id, 'expired');
        await downgradeOrganization(subscription.orgId);
      }
    } catch (error) {
      console.error('Error syncing subscription:', subscription.id, error);
    }
  }
  
  return res.status(200).json({ synced: subscriptions.length });
}
```

---

## Code Examples

### Example 1: Fast Premium Check Using currentProductId

**Using the refined schema - no subscription query needed!**

```typescript
import { useOrganization } from '@/context/OrganizationContext';

function PremiumFeature() {
  const { currentOrganization } = useOrganization();
  
  // Fast lookup - no database query needed!
  const isPremium = currentOrganization?.currentProductId !== null 
    && currentOrganization?.currentProductId !== 'free';
  
  const isMonthly = currentOrganization?.currentProductId?.includes('monthly');
  const isAnnual = currentOrganization?.currentProductId?.includes('annual');
  
  // Extract tier from productId (e.g., "premium_2_members_monthly" -> 2)
  const memberLimit = currentOrganization?.currentProductId 
    ? parseInt(currentOrganization.currentProductId.match(/\d+/)?.[0] || '0')
    : 0;

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return (
    <PremiumContent 
      memberLimit={memberLimit}
      billingPeriod={isMonthly ? 'monthly' : 'annual'}
    />
  );
}
```

### Example 1b: Alternative - Check with RevenueCat SDK

```typescript
import { paymentService } from '@/lib/appwrite/payments';
import { useAuth } from '@/context/AuthContext';

function PremiumFeature() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      await paymentService.initialize();
      await paymentService.loginUser(user.$id);
      
      const hasPremium = await paymentService.checkSubscriptionStatus();
      setIsPremium(hasPremium);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return <PremiumContent />;
}
```

**Recommendation:** Use Example 1a (currentProductId) for better performance - no async call needed!

### Example 2: Restore Purchases

```typescript
const handleRestorePurchases = async () => {
  try {
    setLoading(true);
    
    await paymentService.initialize();
    await paymentService.loginUser(user.$id);
    
    const customerInfo = await paymentService.restorePurchases();
    
    if (customerInfo.entitlements.active['premium']) {
      // Sync subscription
      await subscriptionService.syncSubscriptionStatus(
        user.$id,
        currentOrganization.$id
      );
      
      Alert.alert('Success', 'Your purchases have been restored!');
      await loadUserData();
    } else {
      Alert.alert('No Purchases', 'No active subscriptions found.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to restore purchases.');
    console.error('Restore error:', error);
  } finally {
    setLoading(false);
  }
};
```

### Example 3: Display Packages

```typescript
const renderPackages = () => {
  if (!offerings) return null;

  return offerings.availablePackages.map((pkg) => {
    const packageInfo = getPackageInfoFromProductId(pkg.identifier);
    
    // Check if this package is currently active
    const isCurrentPackage = currentOrganization?.currentProductId === pkg.identifier;
    
    return (
      <TouchableOpacity
        key={pkg.identifier}
        onPress={() => handlePurchase(pkg)}
        style={isCurrentPackage ? styles.activePackage : styles.package}
      >
        <Text>{packageInfo.name}</Text>
        <Text>{pkg.product.priceString}</Text>
        <Text>{packageInfo.description}</Text>
        {isCurrentPackage && <Text>Current Plan</Text>}
      </TouchableOpacity>
    );
  });
};
```

### Example 4: Business Logic Using currentProductId

```typescript
import { useOrganization } from '@/context/OrganizationContext';

function OrganizationSettings() {
  const { currentOrganization } = useOrganization();
  
  // Extract information from currentProductId
  const getSubscriptionInfo = () => {
    const productId = currentOrganization?.currentProductId;
    
    if (!productId || productId === 'free') {
      return {
        tier: 'free',
        memberLimit: 0,
        billingPeriod: null,
        isPremium: false
      };
    }
    
    // Parse productId: "premium_2_members_monthly"
    const match = productId.match(/premium_(\d+)_members_(monthly|annual)/);
    
    if (match) {
      return {
        tier: `premium_${match[1]}`,
        memberLimit: parseInt(match[1]),
        billingPeriod: match[2],
        isPremium: true
      };
    }
    
    return {
      tier: 'premium',
      memberLimit: 0,
      billingPeriod: null,
      isPremium: true
    };
  };
  
  const subscriptionInfo = getSubscriptionInfo();
  
  // Use in business logic
  const canAddMember = (currentMemberCount: number) => {
    if (!subscriptionInfo.isPremium) return false;
    return currentMemberCount < subscriptionInfo.memberLimit;
  };
  
  // Check expiry
  const isExpired = currentOrganization?.subscriptionExpiryDate 
    ? new Date(currentOrganization.subscriptionExpiryDate) < new Date()
    : false;
  
  return (
    <View>
      <Text>Tier: {subscriptionInfo.tier}</Text>
      <Text>Member Limit: {subscriptionInfo.memberLimit}</Text>
      <Text>Billing: {subscriptionInfo.billingPeriod}</Text>
      {isExpired && <Text>⚠️ Subscription Expired</Text>}
    </View>
  );
}
```

---

## Webhook Implementation

### Webhook Event Types

RevenueCat sends these events:

1. **INITIAL_PURCHASE** - First purchase
2. **RENEWAL** - Subscription renewed
3. **CANCELLATION** - User canceled (still active until expiry)
4. **UNCANCELLATION** - User reactivated canceled subscription
5. **EXPIRATION** - Subscription expired
6. **BILLING_ISSUE** - Payment failed
7. **SUBSCRIPTION_PAUSED** - Subscription paused
8. **SUBSCRIPTION_EXTENDED** - Subscription extended

### Webhook Payload Structure

```json
{
  "event": {
    "id": "event_id",
    "type": "INITIAL_PURCHASE",
    "app_user_id": "revenuecat_customer_id",
    "product_id": "premium_2_members_monthly",
    "period_type": "trial",
    "purchased_at_ms": 1234567890,
    "expiration_at_ms": 1234567890,
    "environment": "SANDBOX",
    "entitlement_ids": ["premium"],
    "entitlement_id": "premium"
  }
}
```

### Webhook Security

Always verify webhook signatures:

```typescript
function verifyWebhookSignature(body: any, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', REVENUECAT_SECRET_KEY);
  const digest = hmac.update(JSON.stringify(body)).digest('hex');
  return digest === signature;
}
```

---

## Testing

### Testing Checklist

#### Setup Testing
- [ ] RevenueCat account created
- [ ] Products configured in RevenueCat dashboard
- [ ] Products created in Google Play Console
- [ ] Products linked between RevenueCat and Google Play
- [ ] Webhook endpoint configured
- [ ] Test accounts added to Google Play Console

#### SDK Testing
- [ ] SDK initializes correctly
- [ ] User login to RevenueCat works
- [ ] Offerings fetch successfully
- [ ] Packages display correctly
- [ ] Purchase flow initiates
- [ ] Purchase completes successfully
- [ ] Purchase errors handled gracefully
- [ ] Restore purchases works

#### Backend Testing
- [ ] Webhook receives events
- [ ] Webhook signature verification works
- [ ] Initial purchase creates subscription record
- [ ] Renewal updates subscription
- [ ] Cancellation marks subscription as canceled
- [ ] Expiration downgrades organization
- [ ] Organization premium tier updates correctly

#### Integration Testing
- [ ] Purchase flow end-to-end
- [ ] Subscription status syncs correctly
- [ ] Premium features unlock after purchase
- [ ] Premium features lock after expiration
- [ ] Multiple organizations handled correctly
- [ ] User switching organizations works

#### Edge Cases
- [ ] User cancels purchase
- [ ] Network failure during purchase
- [ ] Purchase already owned
- [ ] Subscription expires
- [ ] Subscription canceled but still active
- [ ] Restore purchases on new device
- [ ] Multiple subscriptions (shouldn't happen, but handle)

### Test Accounts

**Google Play Console:**
- Add test accounts in License Testing
- Test purchases won't charge real money
- Test subscriptions renew automatically in sandbox

**RevenueCat:**
- Use Test Store for initial testing
- Switch to sandbox for real device testing
- Use RevenueCat debug logs

---

## Cost Analysis

### RevenueCat Costs

**Free Tier:**
- Up to $10,000 monthly revenue
- All features included
- Perfect for early stage

**Paid Tiers:**
- $99/month for revenue $10k-$50k/month
- $299/month for revenue $50k-$200k/month
- Custom pricing above $200k/month

### Total Cost Comparison

**Direct Google Play Integration:**
- Google Play fees: 15-30% of revenue
- Server costs: Minimal (~$10-50/month)
- Development time: 2-3 weeks
- Maintenance: Ongoing

**RevenueCat Integration:**
- Google Play fees: 15-30% of revenue (still applies)
- RevenueCat fees: $0 (free tier) or $99+/month
- Server costs: Minimal (~$10-50/month)
- Development time: 1 week
- Maintenance: Less (RevenueCat handles more)

### Break-Even Analysis

**Use RevenueCat Free Tier if:**
- Monthly revenue < $10,000
- Want faster implementation
- Want cross-platform support

**Consider Direct Integration if:**
- Monthly revenue > $10,000
- Want to minimize costs
- Have development resources
- Don't need cross-platform

---

## Migration from Direct Google Play (If Needed)

If you've already implemented direct Google Play integration:

1. **Keep existing subscriptions active**
2. **New purchases go through RevenueCat**
3. **Migrate existing subscriptions gradually:**
   - Link existing Google Play subscriptions to RevenueCat
   - Use RevenueCat's migration tools
   - Update database records

---

## Best Practices

### 1. User Identification
- Always link RevenueCat users to Appwrite users
- Use Appwrite user ID as RevenueCat app user ID
- Store mapping in database

### 2. Error Handling
- Handle all purchase errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Implement retry logic

### 3. Subscription Status
- Check status on app launch
- Sync status after purchase
- Handle webhook events promptly
- Implement periodic sync job

### 4. User Experience
- Show loading states during purchase
- Provide clear subscription status
- Allow easy subscription management
- Link to Google Play subscription management

### 5. Security
- Never expose secret API keys
- Verify webhook signatures
- Validate all subscription data
- Use HTTPS for all API calls

---

## Troubleshooting

### Common Issues

**1. Products not showing:**
- Check products are configured in RevenueCat
- Verify products exist in Google Play Console
- Ensure products are linked correctly
- Check user is logged in to RevenueCat

**2. Purchase fails:**
- Check Google Play account has payment method
- Verify product is available in user's country
- Check network connection
- Verify product ID matches exactly

**3. Webhook not receiving events:**
- Verify webhook URL is correct
- Check webhook is enabled in RevenueCat
- Verify server is accessible
- Check webhook signature verification

**4. Subscription status not updating:**
- Check webhook is processing events
- Verify database updates are working
- Check organization premium tier logic
- Verify sync job is running

---

## Next Steps

1. **Create RevenueCat account**
2. **Set up products in dashboard**
3. **Create products in Google Play Console**
4. **Install SDK and initialize**
5. **Implement purchase flow**
6. **Set up webhook endpoint**
7. **Test end-to-end**
8. **Deploy to production**

---

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native Purchases SDK](https://docs.revenuecat.com/docs/react-native)
- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

---

## Summary

RevenueCat integration provides:
- ✅ Faster implementation (1 week vs 2-3 weeks)
- ✅ Cross-platform support (iOS ready)
- ✅ Less backend code
- ✅ Built-in analytics
- ✅ Free tier for early stage
- ✅ Better testing tools

Trade-offs:
- ⚠️ Third-party dependency
- ⚠️ Costs at scale (>$10k/month)
- ⚠️ Less control over verification

For WorkPhotoPro V2, RevenueCat is recommended for faster time-to-market and easier iOS support later.

