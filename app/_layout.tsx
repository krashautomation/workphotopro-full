import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useFCMToken } from '@/hooks/useFCMToken';
// Removed import to avoid bundling app.config.js (which uses dotenv/Node.js modules)
// import { logNotificationsDiagnostics } from '@/utils/notificationsCheck';

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
} catch (error) {
  if (isExpoGo) {
    console.warn('⚠️ expo-notifications not available (requires development build, not Expo Go)');
    console.warn('   To fix: Run "npx expo run:android" to build a development client');
  } else {
    console.warn('⚠️ expo-notifications not available (requires development build)');
    console.warn('   To fix: Run "npx expo run:android" to rebuild with native modules');
  }
}

function RootLayoutNav() {
  const router = useRouter();
  const { user } = useAuth();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  
  // Check notifications availability on mount (only once)
  // Removed logNotificationsDiagnostics() to avoid bundling app.config.js
  // useEffect(() => {
  //   logNotificationsDiagnostics();
  // }, []);
  
  // Register for push notifications when user is authenticated
  const { fcmToken, loading: tokenLoading, error: tokenError } = useFCMToken();
  
  useEffect(() => {
    if (user && fcmToken) {
      console.log('[Push Notifications] ✅ Push token registered:', fcmToken.substring(0, 20) + '...');
      console.log('[Push Notifications] 📱 Full push token (copy this):', fcmToken);
    }
    // Log errors to console only - don't show warnings to users
    if (tokenError) {
      console.error('[Push Notifications] ⚠️ Push token registration error (logged for debugging):', tokenError);
    }
  }, [user, fcmToken, tokenError]);

  // Set up notification listeners (only if module is available)
  useEffect(() => {
    if (!Notifications) {
      return; // Notifications not available (Expo Go)
    }

    try {
      // Listen for notifications received while app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received (foreground):', notification);
        // You can show an in-app notification banner here if needed
      });

      // Listen for user tapping on notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification data
        if (data?.type === 'task_created' && data?.jobId) {
          router.push(`/(jobs)/${data.jobId}`);
        } else if (data?.type === 'job_assigned' && data?.jobId) {
          router.push(`/(jobs)/${data.jobId}`);
        } else if (data?.type === 'team_invite' && data?.teamId) {
          router.push(`/(jobs)/teams/${data.teamId}`);
        } else if (data?.type === 'message' && data?.jobId) {
          router.push(`/(jobs)/${data.jobId}`);
        }
        // Add more navigation cases as needed
      });
    } catch (error) {
      console.warn('⚠️ Failed to set up notification listeners:', error);
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [router]);

  useEffect(() => {
    // Initialize cache monitoring and cleanup on app start
    const initializeCache = async () => {
      try {
        const { cacheManager } = await import('@/utils/cacheManager');
        const { offlineCache } = await import('@/utils/offlineCache');
        
        // Initialize offline cache
        await offlineCache.initialize();
        
        const stats = await cacheManager.getCacheStats();
        const offlineStats = await offlineCache.getCacheStats();
        
        console.log('[App] 📊 Cache stats on startup:', {
          size: cacheManager.formatBytes(stats.totalSize),
          fileCount: stats.fileCount,
          offlineCached: offlineStats.totalCached,
          offlineSize: cacheManager.formatBytes(offlineStats.totalSize),
        });
        
        // Perform automatic cleanup if enabled
        if (cacheManager.getConfig().enableAutoCleanup) {
          const cleanupResult = await cacheManager.performAutoCleanup();
          if (cleanupResult.expired > 0 || cleanupResult.sizeLimit > 0) {
            console.log('[App] 🧹 Cache cleanup completed:', cleanupResult);
          }
        }
      } catch (error) {
        console.warn('[App] ⚠️ Cache initialization failed (non-critical):', error);
        // Non-critical - app can continue without cache management
      }
    };
    
    initializeCache();
    
    // Complete any pending OAuth sessions
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle deep links when app is already running
    const handleUrl = async (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        
        // Handle short links: https://web.workphotopro.com/links/{shortId}
        if (url.hostname === 'web.workphotopro.com' && url.pathname.startsWith('/links/')) {
          const shortId = url.pathname.split('/links/')[1];
          if (shortId) {
            console.log('🔗 Short link detected! Short ID:', shortId);
            // Fetch invite data from API (will redirect to full invite URL)
            try {
              const response = await fetch(`https://web.workphotopro.com/links/${shortId}`, {
                method: 'GET',
                redirect: 'follow', // Follow redirects
              });
              
              // If redirected, extract teamId and token from redirect URL
              if (response.redirected) {
                const redirectUrl = new URL(response.url);
                const teamId = redirectUrl.pathname.split('/invite/')[1]?.split('?')[0];
                const token = redirectUrl.searchParams.get('token');
                
                if (teamId) {
                  if (token) {
                    console.log('🔗 Short link resolved! Team ID:', teamId, 'Token:', token);
                    router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}&token=${encodeURIComponent(token)}`);
                  } else {
                    console.log('🔗 Short link resolved (no token)! Team ID:', teamId);
                    router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}`);
                  }
                  return;
                }
              }
            } catch (fetchError) {
              console.error('🔗 Error resolving short link:', fetchError);
            }
          }
        }
        
        // Check if this is an HTTPS invite link (web.workphotopro.com/invite/{teamId}?token=...)
        if (url.hostname === 'web.workphotopro.com' && url.pathname.startsWith('/invite/')) {
          const teamId = url.pathname.split('/invite/')[1]?.split('?')[0];
          const token = url.searchParams.get('token');
          
          if (teamId) {
            if (token) {
              console.log('🔗 HTTPS invite link detected! Team ID:', teamId, 'Token:', token);
              router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}&token=${encodeURIComponent(token)}`);
            } else {
              console.log('🔗 HTTPS invite link detected (no token)! Team ID:', teamId);
              router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}`);
            }
            return;
          }
        }
        
        // Check if this is an HTTPS reset-password link (web.workphotopro.com/reset-password?userId=...&secret=...)
        if (url.hostname === 'web.workphotopro.com' && url.pathname === '/reset-password') {
          const userId = url.searchParams.get('userId');
          const secret = url.searchParams.get('secret');
          if (userId && secret) {
            console.log('🔗 HTTPS reset-password link detected!');
            router.push(`/(auth)/reset-password?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`);
            return;
          }
        }
        
        // Handle custom scheme: workphotopro://invite?teamId=...&token=...
        if (url.protocol === 'workphotopro:' && url.hostname === 'invite') {
          const teamId = url.searchParams.get('teamId');
          const token = url.searchParams.get('token');
          
          if (teamId && token) {
            console.log('🔗 Custom scheme invite detected! Team ID:', teamId, 'Token:', token);
            router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}&token=${encodeURIComponent(token)}`);
            return;
          }
        }
        
        // Legacy support: workphotopro://team-invite?teamId=... (without token)
        if (url.pathname.includes('team-invite') || (url.protocol === 'workphotopro:' && url.searchParams.get('teamId'))) {
          const teamId = url.searchParams.get('teamId');
          if (teamId) {
            console.log('🔗 Legacy deep link invite detected! Team ID:', teamId);
            router.push(`/(auth)/accept-invite?teamId=${encodeURIComponent(teamId)}`);
            return;
          }
        }
        
        // Check if this is a deep link reset-password (workphotopro://reset-password?userId=...&secret=...)
        if (url.pathname.includes('reset-password') || (url.protocol === 'workphotopro:' && url.hostname === 'reset-password')) {
          const userId = url.searchParams.get('userId');
          const secret = url.searchParams.get('secret');
          if (userId && secret) {
            console.log('🔗 Deep link reset-password detected!');
            router.push(`/(auth)/reset-password?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`);
            return;
          }
        }
      } catch (parseError) {
        console.error('🔗 Error parsing URL:', parseError);
      }
      
      // Check if this is an OAuth redirect
      if (event.url.includes('appwrite-callback-68e9d42100365e14f358')) {
        console.log('🔗 OAuth redirect detected!');
        // OAuth handling logic stays the same
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle deep link when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial deep link:', url);
        // Handle the deep link
        handleUrl({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <ThemeProvider value={DarkTheme}>
          <StatusBar style="light" />
          <RootLayoutNav />
        </ThemeProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

