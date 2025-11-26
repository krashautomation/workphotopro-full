import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/globalStyles';
import { webColors } from '@/styles/webDesignTokens';

interface PremiumPackage {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
}

interface PackageModalProps {
  package: PremiumPackage;
  isMonthly: boolean;
  onUpgrade: () => void;
  isLoading?: boolean;
}

export default function PackageModal({ package: pkg, isMonthly, onUpgrade, isLoading = false }: PackageModalProps) {
  const price = isMonthly ? pkg.monthlyPrice : pkg.annualPrice;
  const period = isMonthly ? 'month' : 'year';
  
  const handleManageSubscription = () => {
    // TODO: Implement manage subscription functionality
    console.log('Navigate to manage subscription');
  };

  const handleTermsLink = () => {
    // TODO: Implement terms link
    Linking.openURL('https://example.com/terms').catch(err => 
      console.error('Failed to open terms:', err)
    );
  };

  const handlePrivacyLink = () => {
    // TODO: Implement privacy policy link
    Linking.openURL('https://example.com/privacy').catch(err => 
      console.error('Failed to open privacy policy:', err)
    );
  };

  return (
    <View style={styles.container}>
      {/* Package Title */}
      <Text style={styles.title}>{pkg.name}</Text>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        <Text style={styles.feature}>• High-res images</Text>
        <Text style={styles.feature}>• Disable watermarks</Text>
        <Text style={styles.feature}>• Integrations with Dropbox, Google Drive, OneDrive</Text>
        <Text style={styles.featureText}>
          Starting today, your subscription will automatically renew at {price} per {period} unless canceled.
        </Text>
        <Text style={styles.featureText}>
          You can cancel your subscription at any time.
        </Text>
      </View>

      {/* Upgrade Button */}
      <TouchableOpacity 
        style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]} 
        onPress={onUpgrade}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={webColors.primaryForeground} />
        ) : (
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        )}
      </TouchableOpacity>

      {/* Manage Subscription Link */}
      <TouchableOpacity onPress={handleManageSubscription} style={styles.linkContainer}>
        <Text style={styles.linkText}>Manage Subscription</Text>
      </TouchableOpacity>

      {/* Terms and Privacy Links */}
      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={handleTermsLink}>
          <Text style={styles.footerLink}>T&C</Text>
        </TouchableOpacity>
        <Text style={styles.footerSeparator}>and</Text>
        <TouchableOpacity onPress={handlePrivacyLink}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: webColors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: webColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    marginBottom: 24,
  },
  linkText: {
    color: webColors.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerSeparator: {
    color: colors.textSecondary,
    fontSize: 14,
    marginHorizontal: 4,
  },
});
