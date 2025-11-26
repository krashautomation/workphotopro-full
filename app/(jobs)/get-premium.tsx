import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { webGradients, webColors } from '@/styles/webDesignTokens';
import { useRouter } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { paymentService } from '@/lib/appwrite/payments';
import { subscriptionService } from '@/lib/appwrite/subscriptions';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import BottomModal from '@/components/BottomModal';
import PackageModal from './get-package';

interface PremiumPackage {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
}

const premiumPackages: PremiumPackage[] = [
  {
    id: '1',
    name: 'Up to 2 team members',
    description: '14 day free trial',
    monthlyPrice: '$7.99',
    annualPrice: '$79.99',
    features: ['Up to 2 team members', 'Basic features', 'Email support']
  },
  {
    id: '2',
    name: 'Up to 3 team members',
    description: '14 day free trial',
    monthlyPrice: '$15.99',
    annualPrice: '$159.99',
    features: ['Up to 3 team members', 'Basic features', 'Email support']
  },
  {
    id: '3',
    name: 'Up to 4 team members',
    description: '14 day free trial',
    monthlyPrice: '$23.99',
    annualPrice: '$239.99',
    features: ['Up to 4 team members', 'Basic features', 'Email support']
  },
  {
    id: '4',
    name: 'Up to 5 team members',
    description: '14 day free trial',
    monthlyPrice: '$31.99',
    annualPrice: '$319.99',
    features: ['Up to 5 team members', 'Basic features', 'Email support']
  },
  {
    id: '5',
    name: 'Up to 6 team members',
    description: '14 day free trial',
    monthlyPrice: '$39.99',
    annualPrice: '$399.99',
    features: ['Up to 6 team members', 'Basic features', 'Email support']
  },
  {
    id: '6',
    name: 'Up to 7 team members',
    description: '14 day free trial',
    monthlyPrice: '$47.99',
    annualPrice: '$479.99',
    features: ['Up to 7 team members', 'Basic features', 'Email support']
  },
  {
    id: '7',
    name: 'Up to 8 team members',
    description: '14 day free trial',
    monthlyPrice: '$52.99',
    annualPrice: '$529.99',
    features: ['Up to 8 team members', 'Basic features', 'Email support']
  },
  {
    id: '8',
    name: 'Up to 9 team members',
    description: '14 day free trial',
    monthlyPrice: '$60.99',
    annualPrice: '$609.99',
    features: ['Up to 9 team members', 'Basic features', 'Email support']
  },
  {
    id: '9',
    name: 'Up to 10 team members',
    description: '14 day free trial',
    monthlyPrice: '$68.99',
    annualPrice: '$689.99',
    features: ['Up to 10 team members', 'Basic features', 'Email support']
  },
  {
    id: '10',
    name: 'Up to 11 team members',
    description: '14 day free trial',
    monthlyPrice: '$74.99',
    annualPrice: '$749.99',
    features: ['Up to 11 team members', 'Basic features', 'Email support']
  }
];

export default function GetPremium() {
  const { user, isAuthenticated } = useAuth();
  const { currentOrganization, loadUserData } = useOrganization();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [revenueCatPackageMap, setRevenueCatPackageMap] = useState<Map<string, PurchasesPackage>>(new Map());

  // Initialize RevenueCat and load offerings
  useEffect(() => {
    if (!isAuthenticated || !user?.$id) return;

    const initializeRevenueCat = async () => {
      try {
        setLoadingOfferings(true);
        
        // Link user to RevenueCat
        await subscriptionService.linkUserToRevenueCat(user.$id);
        
        // Load offerings
        const currentOffering = await paymentService.getOfferings();
        setOfferings(currentOffering);
        
        // Build package map for quick lookup
        if (currentOffering) {
          const packageMap = new Map<string, PurchasesPackage>();
          currentOffering.availablePackages.forEach((pkg) => {
            packageMap.set(pkg.identifier, pkg);
          });
          setRevenueCatPackageMap(packageMap);
        }
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
        Alert.alert(
          'Error',
          'Failed to load subscription options. Please try again later.'
        );
      } finally {
        setLoadingOfferings(false);
      }
    };

    initializeRevenueCat();
  }, [isAuthenticated, user?.$id]);

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view premium options</Text>
      </View>
    );
  }

  /**
   * Get RevenueCat package for a premium package
   */
  const getRevenueCatPackage = (packageId: string, isMonthly: boolean): PurchasesPackage | null => {
    const productId = `premium_${packageId}_members_${isMonthly ? 'monthly' : 'annual'}`;
    return revenueCatPackageMap.get(productId) || null;
  };

  /**
   * Handle purchase
   */
  const handlePurchase = async (pkg: PremiumPackage) => {
    if (!user?.$id || !currentOrganization?.$id) {
      Alert.alert('Error', 'User or organization not found');
      return;
    }

    try {
      setPurchasing(true);
      
      // Get RevenueCat package
      const revenueCatPackage = getRevenueCatPackage(pkg.id, activeTab === 'monthly');
      
      if (!revenueCatPackage) {
        Alert.alert(
          'Product Not Available',
          'This subscription package is not available. Please try again later.'
        );
        return;
      }

      // Purchase through RevenueCat
      await paymentService.purchasePackage(revenueCatPackage);
      
      // Sync subscription status to database
      await subscriptionService.syncSubscriptionStatus(user.$id, currentOrganization.$id);
      
      // Refresh organization data
      await loadUserData();
      
      // Show success
      Alert.alert(
        'Success! 🎉',
        'Your subscription is now active. Premium features are unlocked!',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      if (error.message === 'Purchase cancelled') {
        // User cancelled - no action needed
        return;
      }
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'Failed to complete purchase. Please try again.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const renderPackageCard = ({ item }: { item: PremiumPackage }) => {
    const price = activeTab === 'monthly' ? item.monthlyPrice : item.annualPrice;
    const revenueCatPackage = getRevenueCatPackage(item.id, activeTab === 'monthly');
    const isCurrentPackage = currentOrganization?.currentProductId === revenueCatPackage?.identifier;
    
    return (
      <TouchableOpacity 
        style={[
          styles.packageCard,
          isCurrentPackage && styles.currentPackageCard
        ]}
        onPress={() => {
          setSelectedPackage(item);
          setModalVisible(true);
        }}
        disabled={loadingOfferings || purchasing}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.packageName}>{item.name}</Text>
            <Text style={styles.packageDescription}>{item.description}</Text>
            {isCurrentPackage && (
              <Text style={styles.currentPackageBadge}>Current Plan</Text>
            )}
          </View>
          <View style={styles.cardRight}>
            {revenueCatPackage ? (
              <>
                <Text style={styles.packagePrice}>{revenueCatPackage.product.priceString}</Text>
                <Text style={styles.pricePeriod}>
                  {activeTab === 'monthly' ? '/month' : '/year'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.packagePrice}>{price}</Text>
                <Text style={styles.pricePeriod}>
                  {activeTab === 'monthly' ? '/month' : '/year'}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Rocket size={24} color={webColors.primary} style={styles.rocketIcon} />
          <MaskedView
            style={styles.gradientTextContainer}
            maskElement={
              <Text style={styles.title}>Get Premium</Text>
            }
          >
            <LinearGradient
              colors={webGradients.primary.colors}
              start={webGradients.primary.start}
              end={webGradients.primary.end}
            >
              <Text style={[styles.title, { opacity: 0 }]}>Get Premium</Text>
            </LinearGradient>
          </MaskedView>
        </View>
        <Text style={styles.subtitle}>
          Get access to all advanced features to supercharge your productivity and manage your work photos with ease.
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>- High res images</Text>
          <Text style={styles.featureItem}>- Disable watermarks</Text>
          <Text style={styles.featureItem}>- Integrations:</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'monthly' && styles.activeTab
          ]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'monthly' && styles.activeTabText
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'annual' && styles.activeTab
          ]}
          onPress={() => setActiveTab('annual')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'annual' && styles.activeTabText
          ]}>
            Annual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Packages List */}
      {loadingOfferings ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={webColors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      ) : (
        <FlatList
          data={premiumPackages}
          keyExtractor={(item) => item.id}
          renderItem={renderPackageCard}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Package Details Modal */}
      <BottomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        content={
          selectedPackage && (
            <PackageModal
              package={selectedPackage}
              isMonthly={activeTab === 'monthly'}
              onUpgrade={() => handlePurchase(selectedPackage)}
              isLoading={purchasing}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: webColors.card,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rocketIcon: {
    marginRight: 8,
  },
  gradientTextContainer: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: webColors.foreground,
    opacity: 0.9,
    lineHeight: 22,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    fontSize: 14,
    color: webColors.foreground,
    opacity: 0.95,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: webColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  activeTabText: {
    color: '#000000',
  },
  listContent: {
    padding: 20,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: webColors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: webColors.primary,
  },
  pricePeriod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  currentPackageCard: {
    borderColor: webColors.primary,
    borderWidth: 2,
    backgroundColor: webColors.card,
  },
  currentPackageBadge: {
    fontSize: 12,
    color: webColors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
