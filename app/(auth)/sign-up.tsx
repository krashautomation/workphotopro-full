import { useAuth } from '@/context/AuthContext';
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

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // signUp now returns userId and email
      const result = await signUp(email, '', name);
      // Navigate to OTP verification screen with userId, email, and name
      router.push({
        pathname: '/(auth)/verify-email',
        params: {
          userId: result.userId,
          email: result.email,
          name: name, // Pass the name to verification screen
        },
      });
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async () => {
    try {
      console.log('🟡 SignUp: handleGoogleSuccess called');
      // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
      console.log('🟡 SignUp: OAuth successful, navigating to jobs...');
      router.replace('/(jobs)');
    } catch (error: any) {
      console.error('🔴 SignUp: Google OAuth error:', error);
      setError(error.message || 'Google sign up failed. Please try again.');
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google sign up error:', error);
    setError(error.message || 'Google sign up failed. Please try again.');
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Create account</Text>
          <Text style={globalStyles.body}>We'll send a code to your email</Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          <View style={{ flex: 0.1 }} />

          <TextInput
            style={globalStyles.input}
            placeholder="Full Name"
            placeholderTextColor={getPlaceholderTextColor()}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

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
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>Sign up</Text>
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
            mode="sign-up"
          />

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text style={globalStyles.link}>Sign in</Text>
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

