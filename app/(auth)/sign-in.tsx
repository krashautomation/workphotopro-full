import { useAuth } from '@/context/AuthContext';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
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
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
// import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignIn() {
  const { signIn } = useAuth();
  // GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
  // const { signInWithGoogle, signIn } = useAuth();
  const router = useRouter();
  const { verified } = useLocalSearchParams<{ verified?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign in with email and password
      await signIn(email, password);
      // Navigate to app
      router.replace('/(jobs)');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
  // const handleGoogleSuccess = async () => {
  //   try {
  //     // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
  //     router.replace('/(jobs)');
  //   } catch (error: any) {
  //     setError(error.message || 'Google sign in failed. Please try again.');
  //   }
  // };

  // const handleGoogleError = (error: Error) => {
  //   console.error('Google sign in error:', error);
  //   setError(error.message || 'Google sign in failed. Please try again.');
  // };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Welcome back</Text>
          <Text style={globalStyles.body}>Sign in to your account</Text>

          {verified === 'true' && (
            <Text style={[globalStyles.body, { color: '#22c55e', marginVertical: 10 }]}>
              Email verified! Please sign in to continue.
            </Text>
          )}

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

          <TextInput
            style={globalStyles.input}
            placeholder="Password"
            placeholderTextColor={getPlaceholderTextColor()}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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

          {/* GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in */}
          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            mode="sign-in"
          /> */}

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={globalStyles.link}>Sign up</Text>
            </Link>
          </View>

          <TouchableOpacity
            style={{ alignSelf: 'center', marginTop: 12 }}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={globalStyles.link}>Lost password?</Text>
          </TouchableOpacity>
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

