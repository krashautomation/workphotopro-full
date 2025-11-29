import { authService } from '@/lib/appwrite/auth';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Linking from 'expo-linking';

export default function ResetPassword() {
  const router = useRouter();
  const { userId: paramUserId, secret: paramSecret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const [userId, setUserId] = useState<string | undefined>(paramUserId);
  const [secret, setSecret] = useState<string | undefined>(paramSecret);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasParams, setHasParams] = useState(!!(paramUserId && paramSecret));

  useEffect(() => {
    // Check if we have userId and secret from URL params (deep link)
    if (paramUserId && paramSecret) {
      setUserId(paramUserId);
      setSecret(paramSecret);
      setHasParams(true);
      return;
    }

    // Try to get from deep link URL
    const checkDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('reset-password')) {
          const url = new URL(initialUrl);
          const urlUserId = url.searchParams.get('userId');
          const urlSecret = url.searchParams.get('secret');
          if (urlUserId && urlSecret) {
            setUserId(urlUserId);
            setSecret(urlSecret);
            setHasParams(true);
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
        if (event.url && event.url.includes('reset-password')) {
          const url = new URL(event.url);
          const urlUserId = url.searchParams.get('userId');
          const urlSecret = url.searchParams.get('secret');
          if (urlUserId && urlSecret) {
            setUserId(urlUserId);
            setSecret(urlSecret);
            setHasParams(true);
          }
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [paramUserId, paramSecret]);

  const handleResetPassword = async () => {
    if (!userId || !secret) {
      setError('Missing reset credentials. Please use the link from your email.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(userId, secret, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasParams && !userId && !secret) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Reset Password</Text>
            <Text style={[globalStyles.body, { marginBottom: 20, textAlign: 'center' }]}>
              Please use the link from your email to reset your password.
            </Text>
            <TouchableOpacity
              style={globalStyles.button}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text style={globalStyles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Reset Password</Text>
          <Text style={globalStyles.body}>
            Enter your new password below
          </Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          {success ? (
            <View style={{ marginVertical: 20 }}>
              <Text style={[globalStyles.body, { color: '#22c55e', marginBottom: 10 }]}>
                Password reset successfully! You can now sign in with your new password.
              </Text>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={globalStyles.buttonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flex: 0.1 }} />

              <TextInput
                style={globalStyles.input}
                placeholder="New Password"
                placeholderTextColor={getPlaceholderTextColor()}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                autoCapitalize="none"
              />

              <TextInput
                style={globalStyles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={getPlaceholderTextColor()}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[globalStyles.button, loading && { opacity: 0.5 }]}
                onPress={() => handleResetPassword()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={globalStyles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignSelf: 'center', marginTop: 20 }}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={globalStyles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

