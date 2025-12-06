import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { pushTokenService } from '@/lib/appwrite/pushTokens';
import { account } from '@/lib/appwrite/client';
import { ID } from 'react-native-appwrite';

// Safely import expo-notifications (may not be available in Expo Go)
let Notifications: typeof import('expo-notifications') | null = null;
let isExpoGo = false;
try {
  const Constants = require('expo-constants');
  isExpoGo = Constants.executionEnvironment === 'storeClient';
} catch (e) {
  // Ignore
}

try {
  Notifications = require('expo-notifications');
  // Configure notification behavior (only if module is available)
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  if (isExpoGo) {
    console.warn('⚠️ expo-notifications not available (requires development build, not Expo Go)');
  } else {
    console.warn('⚠️ expo-notifications not available (requires development build)');
  }
}

export function useFCMToken() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    registerForPushNotificationsAsync()
      .then(token => {
        setFcmToken(token);
        setLoading(false);
        
        // Save token to Appwrite Database
        if (token) {
          saveFCMTokenToAppwrite(user.$id, token).catch(err => {
            // Log error to console only - don't show to user
            console.error('[Push Notifications] Error saving FCM token to Appwrite:', err);
            // Don't set error state - fail silently for user experience
          });
        }
      })
      .catch(err => {
        // Log error to console only - don't show to user
        console.error('[Push Notifications] Error getting push token:', err);
        // Don't set error state - fail silently for user experience
        setLoading(false);
      });
  }, [user]);

  return { fcmToken, loading, error };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Check if notifications module is available
  if (!Notifications) {
    console.warn('⚠️ Push notifications not available - requires development build (not Expo Go)');
    return null;
  }

  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Get Expo push token
    // Note: For Appwrite Messaging, we'll use Expo push tokens
    // If Appwrite requires native FCM tokens, we'll need to use @react-native-firebase/messaging
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'c27e77a1-19c8-4d7a-b2a7-0b8012878bfd';
    
    try {
      const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      // For now, use Expo push token
      // Appwrite Messaging might accept Expo tokens, or we may need to convert to FCM tokens
      token = expoToken;
    } catch (tokenError: any) {
      const tokenErrorMessage = tokenError?.message || '';
      const tokenErrorBody = tokenError?.body || '';
      
      // Handle 503 Service Unavailable errors (Expo service down or network issues)
      if (tokenErrorMessage.includes('503') || 
          tokenErrorBody.includes('503') ||
          tokenErrorMessage.includes('upstream connect error') ||
          tokenErrorMessage.includes('connection termination') ||
          tokenErrorMessage.includes('connection reset')) {
        console.warn('[Push Notifications] ⚠️ Expo push service unavailable (503). This may be temporary.');
        console.warn('[Push Notifications] Push notifications will be disabled until service is available.');
        return null; // Fail gracefully without throwing
      }
      
      // Handle network/connection errors
      if (tokenErrorMessage.includes('Network request failed') ||
          tokenErrorMessage.includes('timeout') ||
          tokenErrorMessage.includes('ECONNREFUSED') ||
          tokenErrorMessage.includes('ENOTFOUND')) {
        console.warn('[Push Notifications] ⚠️ Network error connecting to Expo push service.');
        console.warn('[Push Notifications] Check your internet connection.');
        return null; // Fail gracefully without throwing
      }
      
      // Re-throw other token errors to be handled by outer catch
      throw tokenError;
    }
    
  } catch (e: any) {
    const errorMessage = e?.message || '';
    
    // Handle "Cannot find native module" error gracefully
    if (errorMessage.includes('Cannot find native module') || errorMessage.includes('ExpoPushTokenManager')) {
      console.warn('[Push Notifications] ⚠️ Push notifications require a development build. Run: npx expo run:android or npx expo run:ios');
      return null;
    }
    
    // Handle Firebase initialization error
    if (errorMessage.includes('FirebaseApp is not initialized') || errorMessage.includes('Firebase')) {
      console.warn('[Push Notifications] ⚠️ Firebase not initialized. Upload FCM credentials to EAS:');
      console.warn('[Push Notifications]   1. Run: eas credentials');
      console.warn('[Push Notifications]   2. Select: Android → Push Notifications (Legacy)');
      console.warn('[Push Notifications]   3. Upload Google Service Account Key or enter Server Key');
      console.warn('[Push Notifications]   See: docs/FCM_CREDENTIALS_SETUP.md');
      return null;
    }
    
    // Log all other errors to console but don't throw - fail gracefully
    console.error('[Push Notifications] Error getting push token:', e);
    console.warn('[Push Notifications] Push notifications will be disabled. Error details logged above.');
    return null; // Return null instead of throwing to prevent user-facing errors
  }

  return token;
}

async function saveFCMTokenToAppwrite(userId: string, token: string) {
  try {
    // Method 1: Register with Appwrite Messaging (recommended by Appwrite docs)
    // This creates a push target associated with the account
    try {
      // Check if react-native-appwrite supports createPushTarget
      // If not available, fall back to custom collection
      if (account && typeof (account as any).createPushTarget === 'function') {
        const target = await (account as any).createPushTarget({
          targetId: ID.unique(),
          identifier: token,
        });
        console.log('✅ Push target created with Appwrite Messaging:', target.$id);
        
        // Also save to custom collection for backup/reference
        await pushTokenService.saveToken(userId, token, Platform.OS).catch(() => {
          // Non-critical - Appwrite Messaging is primary
        });
        return;
      }
    } catch (appwriteError: any) {
      const errorMessage = appwriteError?.message || '';
      
      // Handle duplicate target error gracefully
      // If a target with the same identifier already exists, that's fine
      if (errorMessage.includes('target with the same ID already exists') || 
          errorMessage.includes('target with the same identifier already exists') ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('already exists')) {
        console.log('✅ Push target already exists for this token, skipping creation');
        
        // Still save to custom collection for backup/reference
        await pushTokenService.saveToken(userId, token, Platform.OS).catch(() => {
          // Non-critical
        });
        return;
      }
      
      // If Appwrite Messaging API not available or other error, fall back to custom collection
      console.warn('⚠️ Appwrite Messaging API not available, using custom collection:', errorMessage);
    }

    // Method 2: Fallback - Save to custom collection
    // This is useful if react-native-appwrite doesn't support createPushTarget yet
    await pushTokenService.saveToken(userId, token, Platform.OS);
    console.log('✅ Push token saved to custom collection:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
}

