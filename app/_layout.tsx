import { AuthProvider } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function RootLayout() {
  useEffect(() => {
    // Complete any pending OAuth sessions
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle deep links when app is already running
    const handleUrl = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      console.log('🔗 Deep link type:', typeof event.url);
      console.log('🔗 Deep link length:', event.url.length);
      
      // Check if this is an OAuth redirect
      if (event.url.includes('appwrite-callback-68e9d42100365e14f358')) {
        console.log('🔗 OAuth redirect detected!');
        console.log('🔗 OAuth URL:', event.url);
        
        // Parse the OAuth parameters
        try {
          const url = new URL(event.url);
          const secret = url.searchParams.get('secret');
          const userId = url.searchParams.get('userId');
          const error = url.searchParams.get('error');
          
          console.log('🔗 OAuth parameters:', {
            secret: secret ? '***' : 'null',
            userId: userId,
            error: error || 'null'
          });
        } catch (parseError) {
          console.error('🔗 Error parsing OAuth URL:', parseError);
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle deep link when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial deep link:', url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <OrganizationProvider>
        <ThemeProvider value={DarkTheme}>
          <StatusBar style="light" />
          <Slot />
        </ThemeProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

