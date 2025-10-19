import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/appwrite/auth';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignIn() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send OTP for login
      const result = await authService.sendEmailOTP(email);
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-email',
        params: {
          userId: result.userId,
          email: result.email,
        },
      });
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async () => {
    try {
      // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
      router.replace('/(jobs)');
    } catch (error: any) {
      setError(error.message || 'Google sign in failed. Please try again.');
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google sign in error:', error);
    setError(error.message || 'Google sign in failed. Please try again.');
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Welcome back</Text>
          <Text style={globalStyles.body}>We'll send a code to your email</Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          <View style={{ flex: 0.1 }} />

          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            placeholderTextColor={getPlaceholderTextColor()}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TouchableOpacity
            style={[globalStyles.button, loading && { opacity: 0.5 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            mode="sign-in"
          />

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={globalStyles.link}>Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
});

