/**
 * Utility to check if expo-notifications is properly installed and available
 */

import { Platform } from 'react-native';

export interface NotificationsCheckResult {
  /** Whether the npm package is installed */
  packageInstalled: boolean;
  /** Whether the native module is available */
  nativeModuleAvailable: boolean;
  /** Whether running in Expo Go (not a development build) */
  isExpoGo: boolean;
  /** Detailed status message */
  status: string;
  /** Recommendations for fixing issues */
  recommendations: string[];
}

/**
 * Check if expo-notifications is installed and available
 */
export function checkNotificationsAvailability(): NotificationsCheckResult {
  const result: NotificationsCheckResult = {
    packageInstalled: false,
    nativeModuleAvailable: false,
    isExpoGo: false,
    status: '',
    recommendations: [],
  };

  // Check 1: Is the npm package installed in node_modules?
  try {
    // Try to resolve the package from node_modules
    require.resolve('expo-notifications');
    result.packageInstalled = true;
    
    // Also check package.json for version info
    try {
      const packageJson = require('../package.json');
      const version = packageJson.dependencies?.['expo-notifications'];
      if (version) {
        console.log(`✅ expo-notifications package installed: ${version}`);
      }
    } catch (e) {
      // Ignore package.json read errors
    }
  } catch (error) {
    result.packageInstalled = false;
    result.recommendations.push('Install expo-notifications: npm install expo-notifications');
    result.recommendations.push('Then rebuild: npx expo run:android');
  }

  // Check 2: Is Expo Go being used?
  try {
    const Constants = require('expo-constants');
    result.isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (result.isExpoGo) {
      result.status = 'Running in Expo Go - notifications require a development build';
      result.recommendations.push('Rebuild with: npx expo run:android (or npx expo run:ios)');
      result.recommendations.push('Do not use Expo Go app - use the development build instead');
    }
  } catch (error) {
    // Constants might not be available, ignore
  }

  // Check 3: Is the native module available?
  try {
    const Notifications = require('expo-notifications');
    
    // Try to access a native method to verify it's actually working
    if (Notifications && typeof Notifications.getPermissionsAsync === 'function') {
      result.nativeModuleAvailable = true;
      console.log('✅ expo-notifications native module is available');
    } else {
      result.nativeModuleAvailable = false;
      result.status = 'expo-notifications package found but native module not available';
      result.recommendations.push('Rebuild native app: npx expo run:android');
    }
  } catch (error: any) {
    result.nativeModuleAvailable = false;
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('Cannot find module')) {
      result.status = 'expo-notifications package not found in node_modules';
      result.recommendations.push('Run: npm install');
      result.recommendations.push('Then rebuild: npx expo run:android');
    } else if (errorMessage.includes('Cannot find native module') || 
               errorMessage.includes('ExpoPushTokenManager')) {
      result.status = 'Native module not linked - requires development build';
      result.recommendations.push('Rebuild native app: npx expo run:android');
      result.recommendations.push('Make sure expo-notifications plugin is in app.config.js');
    } else {
      result.status = `Error loading expo-notifications: ${errorMessage}`;
      result.recommendations.push('Check error message above');
      result.recommendations.push('Try: npm install && npx expo run:android');
    }
  }

  // Generate final status message
  if (result.nativeModuleAvailable) {
    result.status = '✅ expo-notifications is properly installed and available';
  } else if (!result.packageInstalled) {
    result.status = '❌ expo-notifications package not installed';
  } else if (result.isExpoGo) {
    result.status = '⚠️ Running in Expo Go - notifications require development build';
  } else {
    result.status = '⚠️ expo-notifications native module not available';
  }

  return result;
}

/**
 * Log a detailed diagnostic report about notifications availability
 */
export function logNotificationsDiagnostics(): void {
  console.log('\n📋 expo-notifications Diagnostic Report');
  console.log('=====================================\n');
  
  const check = checkNotificationsAvailability();
  
  console.log(`Package Installed: ${check.packageInstalled ? '✅ Yes' : '❌ No'}`);
  console.log(`Native Module Available: ${check.nativeModuleAvailable ? '✅ Yes' : '❌ No'}`);
  console.log(`Running in Expo Go: ${check.isExpoGo ? '⚠️ Yes' : '✅ No'}`);
  console.log(`\nStatus: ${check.status}\n`);
  
  if (check.recommendations.length > 0) {
    console.log('Recommendations:');
    check.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }
  
  // Note: We can't import app.config.js here because it uses dotenv (Node.js only)
  // The plugin configuration is checked during build time, not runtime
  // If notifications aren't working, check that expo-notifications plugin is in app.config.js
  
  console.log('=====================================\n');
}

/**
 * Quick check - returns true if notifications are fully available
 */
export function isNotificationsAvailable(): boolean {
  const check = checkNotificationsAvailability();
  return check.nativeModuleAvailable;
}

