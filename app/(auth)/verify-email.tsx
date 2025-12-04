import { authService } from '@/lib/appwrite/auth';
import { globalStyles } from '@/styles/globalStyles';
import { getUserFriendlyError } from '@/utils/errorHandler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import * as Linking from 'expo-linking';

export default function VerifyEmail() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { userId, secret, email } = useLocalSearchParams<{ userId?: string; secret?: string; email?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Check if we have userId and secret from URL params (deep link)
    if (userId && secret) {
      handleVerification(userId, secret);
      return;
    }

    // Try to get from deep link URL
    const checkDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('verify-email')) {
          const url = new URL(initialUrl);
          const urlUserId = url.searchParams.get('userId');
          const urlSecret = url.searchParams.get('secret');
          if (urlUserId && urlSecret) {
            handleVerification(urlUserId, urlSecret);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
      }
    };
    checkDeepLink();

    // Also listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      try {
        if (event.url && event.url.includes('verify-email')) {
          const url = new URL(event.url);
          const urlUserId = url.searchParams.get('userId');
          const urlSecret = url.searchParams.get('secret');
          if (urlUserId && urlSecret) {
            handleVerification(urlUserId, urlSecret);
          }
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId, secret]);

  const handleVerification = async (verificationUserId: string, verificationSecret: string) => {
    setVerifying(true);
    setLoading(true);
    setError('');

    try {
      // Verify email with userId and secret
      await authService.verifyEmail(verificationUserId, verificationSecret);
      
      // After verification, user needs to sign in with email/password
      // Redirect to sign-in with success message
      router.replace({
        pathname: '/(auth)/sign-in',
        params: { verified: 'true' },
      });
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Verification failed. The link may have expired. Please try signing up again.');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (verifying || loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={[globalStyles.body, { marginTop: 20, textAlign: 'center' }]}>
          Verifying your email...
        </Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Verify Your Email</Text>
      <Text style={[globalStyles.body, { marginBottom: 30, textAlign: 'center' }]}>
        {email ? (
          <>
            Click the verification link sent to{'\n'}
            <Text style={{ color: '#22c55e' }}>{email}</Text>
          </>
        ) : (
          'Please check your email for the verification link.'
        )}
      </Text>

      {error ? (
        <Text style={[globalStyles.body, { color: '#ff6b6b', marginBottom: 20, textAlign: 'center' }]}>
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/(auth)/sign-in')}
      >
        <Text style={[globalStyles.body, { color: '#999' }]}>Go to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginTop: 20,
    padding: 10,
  },
});

