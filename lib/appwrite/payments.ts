import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage,
  CustomerInfo,
  PURCHASES_ERROR_CODE
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Add these to your .env file
// Get them from RevenueCat Dashboard → Project Settings → API Keys
const REVENUECAT_API_KEY = {
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '' // For future iOS support
};

class PaymentService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once when app starts or before first purchase
   */
  async initialize() {
    if (this.initialized) {
      console.log('📱 RevenueCat already initialized');
      return;
    }

    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const apiKey = REVENUECAT_API_KEY[platform];

      if (!apiKey) {
        throw new Error(
          `RevenueCat API key not found for ${platform}. ` +
          `Please set EXPO_PUBLIC_REVENUECAT_${platform.toUpperCase()}_API_KEY in your .env file`
        );
      }

      await Purchases.configure({ apiKey });
      this.initialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('❌ RevenueCat initialization error:', error);
      throw error;
    }
  }

  /**
   * Login user to RevenueCat
   * Links RevenueCat customer to your Appwrite user ID
   */
  async loginUser(appwriteUserId: string) {
    try {
      await this.ensureInitialized();
      await Purchases.logIn(appwriteUserId);
      console.log('✅ User logged in to RevenueCat:', appwriteUserId);
    } catch (error) {
      console.error('❌ RevenueCat login error:', error);
      throw error;
    }
  }

  /**
   * Logout user from RevenueCat
   */
  async logoutUser() {
    try {
      await Purchases.logOut();
      console.log('✅ User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ RevenueCat logout error:', error);
      throw error;
    }
  }

  /**
   * Get available offerings (products)
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      await this.ensureInitialized();
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        console.warn('⚠️ No current offering found in RevenueCat');
        return null;
      }

      console.log('✅ Offerings loaded:', offerings.current.identifier);
      return offerings.current;
    } catch (error) {
      console.error('❌ Error getting offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      await this.ensureInitialized();
      console.log('💳 Purchasing package:', packageToPurchase.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase successful:', customerInfo.entitlements.active);
      return customerInfo;
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log('ℹ️ User cancelled purchase');
        throw new Error('Purchase cancelled');
      }
      
      console.error('❌ Purchase error:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      await this.ensureInitialized();
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('✅ Purchases restored:', customerInfo.entitlements.active);
      return customerInfo;
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      await this.ensureInitialized();
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Get customer info error:', error);
      throw error;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      return hasPremium;
    } catch (error) {
      console.error('❌ Check subscription status error:', error);
      return false;
    }
  }

  /**
   * Get RevenueCat customer ID (app user ID)
   */
  async getCustomerId(): Promise<string> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.originalAppUserId;
    } catch (error) {
      console.error('❌ Get customer ID error:', error);
      throw error;
    }
  }

  /**
   * Ensure SDK is initialized before operations
   */
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Re-export types for convenience
export type { PurchasesOffering, PurchasesPackage, CustomerInfo };

