import { paymentService } from './payments';
import { databaseService } from './database';
import { organizationService } from './teams';
import { Query } from 'react-native-appwrite';
import { CustomerInfo } from 'react-native-purchases';

class SubscriptionService {
  /**
   * Link RevenueCat customer to Appwrite user
   * Call this when user first opens premium screen or after login
   */
  async linkUserToRevenueCat(appwriteUserId: string) {
    try {
      // Initialize RevenueCat
      await paymentService.initialize();
      
      // Login user to RevenueCat (uses Appwrite user ID as RevenueCat app user ID)
      await paymentService.loginUser(appwriteUserId);
      
      // Get RevenueCat customer info
      const customerInfo = await paymentService.getCustomerInfo();
      
      console.log('✅ User linked to RevenueCat:', {
        appwriteUserId,
        revenueCatCustomerId: customerInfo.originalAppUserId
      });
      
      return customerInfo;
    } catch (error) {
      console.error('❌ Error linking user to RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Sync subscription status from RevenueCat to database
   * Call this after purchase or when checking subscription status
   */
  async syncSubscriptionStatus(userId: string, orgId: string) {
    try {
      const customerInfo = await paymentService.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active['premium'];
      
      if (entitlement) {
        // User has active premium subscription
        await this.updateSubscriptionFromRevenueCat(
          userId,
          orgId,
          entitlement,
          customerInfo.originalAppUserId
        );
        
        // Update organization premium tier
        await this.updateOrganizationPremiumTier(
          orgId,
          entitlement.productIdentifier,
          new Date(entitlement.expirationDate),
          customerInfo.originalAppUserId
        );
      } else {
        // No active subscription - downgrade organization
        await this.updateOrganizationPremiumTier(
          orgId,
          null,
          null,
          null
        );
      }
    } catch (error) {
      console.error('❌ Error syncing subscription status:', error);
      throw error;
    }
  }

  /**
   * Update subscription record from RevenueCat entitlement
   */
  private async updateSubscriptionFromRevenueCat(
    userId: string,
    orgId: string,
    entitlement: any,
    revenueCatCustomerId: string
  ) {
    try {
      const subscriptionData = {
        userId,
        orgId,
        revenueCatCustomerId,
        productId: entitlement.productIdentifier,
        status: this.mapRevenueCatStatus(entitlement),
        startDate: new Date(entitlement.originalPurchaseDate),
        expiryDate: new Date(entitlement.expirationDate),
        autoRenewing: entitlement.willRenew ?? true,
        canceledAt: entitlement.unsubscribeDetectedAt 
          ? new Date(entitlement.unsubscribeDetectedAt) 
          : null,
        lastSyncedAt: new Date().toISOString()
      };

      // Add trial end date if in trial
      if (entitlement.periodType === 'trial') {
        subscriptionData.trialEndDate = new Date(entitlement.expirationDate).toISOString();
      }

      // Upsert subscription (create or update)
      await this.upsertSubscription(orgId, subscriptionData);
    } catch (error) {
      console.error('❌ Error updating subscription from RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Map RevenueCat entitlement status to our status enum
   */
  private mapRevenueCatStatus(entitlement: any): string {
    if (!entitlement.isActive) {
      return 'expired';
    }
    
    // Check for canceled status (still active until expiry)
    if (entitlement.willRenew === false && entitlement.unsubscribeDetectedAt) {
      return 'canceled';
    }
    
    // Check for grace period or billing issues
    if (entitlement.periodType === 'grace_period') {
      return 'grace_period';
    }
    
    if (entitlement.periodType === 'billing_retry') {
      return 'billing_issue';
    }
    
    return 'active';
  }

  /**
   * Update organization premium tier with currentProductId
   */
  private async updateOrganizationPremiumTier(
    orgId: string,
    productId: string | null,
    expiryDate: Date | null,
    revenueCatCustomerId: string | null
  ) {
    try {
      // Determine premium tier from productId
      const premiumTier = productId 
        ? this.extractTierFromProductId(productId)
        : 'free';
      
      // Get subscription ID if exists
      const subscription = await this.getSubscriptionByOrgId(orgId);
      
      const updateData: any = {
        premiumTier,
        currentProductId: productId || null,
        subscriptionId: subscription?.$id || null,
        subscriptionExpiryDate: expiryDate ? expiryDate.toISOString() : null,
        revenueCatCustomerId: revenueCatCustomerId || subscription?.revenueCatCustomerId || null
      };

      await organizationService.updateOrganization(orgId, updateData);
      
      console.log('✅ Organization premium tier updated:', {
        orgId,
        premiumTier,
        currentProductId: productId
      });
    } catch (error) {
      console.error('❌ Error updating organization premium tier:', error);
      throw error;
    }
  }

  /**
   * Extract tier from product ID (e.g., "premium_2_members_monthly" -> "premium_2")
   */
  private extractTierFromProductId(productId: string): string {
    const match = productId.match(/premium_(\d+)_members/);
    if (match) {
      return `premium_${match[1]}`;
    }
    return 'premium'; // Fallback
  }

  /**
   * Upsert subscription (create or update by orgId)
   */
  private async upsertSubscription(orgId: string, data: any) {
    try {
      // Check if subscription exists for this org
      const existing = await this.getSubscriptionByOrgId(orgId);
      
      if (existing) {
        // Update existing
        await databaseService.updateDocument('subscriptions', existing.$id, data);
        console.log('✅ Subscription updated:', existing.$id);
      } else {
        // Create new
        await databaseService.createDocument('subscriptions', data);
        console.log('✅ Subscription created for org:', orgId);
      }
    } catch (error) {
      console.error('❌ Error upserting subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by org ID
   */
  private async getSubscriptionByOrgId(orgId: string) {
    try {
      const result = await databaseService.listDocuments('subscriptions', [
        Query.equal('orgId', orgId),
        Query.limit(1)
      ]);
      return result.documents[0] || null;
    } catch (error) {
      console.error('❌ Error getting subscription by org ID:', error);
      return null;
    }
  }

  /**
   * Restore purchases and sync to database
   */
  async restorePurchases(userId: string, orgId: string): Promise<boolean> {
    try {
      const customerInfo = await paymentService.restorePurchases();
      
      if (customerInfo.entitlements.active['premium']) {
        // Sync subscription status
        await this.syncSubscriptionStatus(userId, orgId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

