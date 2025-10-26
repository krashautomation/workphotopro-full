import { AuthProvider } from '@/context/AuthContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    // Complete any pending OAuth sessions
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle deep links when app is already running
    const handleUrl = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        
        // Check if this is an HTTPS invite link (web.workphotopro.com/invite/{teamId})
        if (url.hostname === 'web.workphotopro.com' && url.pathname.startsWith('/invite/')) {
          const teamId = url.pathname.split('/invite/')[1];
          if (teamId) {
            console.log('🔗 HTTPS invite link detected! Team ID:', teamId);
            router.push({
              pathname: '/(auth)/accept-invite',
              params: { teamId }
            });
            return;
          }
        }
        
        // Check if this is a deep link invite (workphotopro://team-invite?teamId=...)
        if (url.pathname.includes('team-invite') || url.searchParams.get('teamId')) {
          const teamId = url.searchParams.get('teamId');
          if (teamId) {
            console.log('🔗 Deep link invite detected! Team ID:', teamId);
            router.push({
              pathname: '/(auth)/accept-invite',
              params: { teamId }
            });
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

