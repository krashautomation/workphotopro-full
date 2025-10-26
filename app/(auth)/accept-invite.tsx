import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/appwrite/auth';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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
  StyleSheet,
} from 'react-native';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function AcceptInvite() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    // TODO: Fetch team details to show team name
    console.log('Accept invite for team:', teamId);
  }, [teamId]);

  const handleSignUp = async () => {
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
      // Send OTP for signup
      const result = await authService.createAccount(email, 'User');
      // Navigate to OTP verification screen with team invite info
      router.push({
        pathname: '/(auth)/verify-email',
        params: {
          userId: result.userId,
          email: result.email,
          teamId: teamId || '',
          isInvite: 'true',
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
      // GoogleAuthButton already calls signInWithGoogle()
      // TODO: After successful auth, join the team
      console.log('Google auth successful, joining team:', teamId);
      router.replace({
        pathname: '/(jobs)',
        params: { joinedTeamId: teamId }
      });
    } catch (error: any) {
      setError(error.message || 'Google sign in failed. Please try again.');
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google sign in error:', error);
    setError(error.message || 'Google sign in failed. Please try again.');
  };

  if (!teamId) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Invalid Invite</Text>
        <Text style={[globalStyles.body, { color: '#ff6b6b' }]}>
          This invitation link is invalid.
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 20 }]}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={globalStyles.buttonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Join Team</Text>
          <Text style={globalStyles.body}>
            You've been invited to join a team!
          </Text>

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
            style={[globalStyles.button, { opacity: loading ? 0.6 : 1 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>Continue with Email</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
            <Text style={[globalStyles.body, { marginHorizontal: 10 }]}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
          </View>

          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={loading}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
            <Text style={globalStyles.body}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={[globalStyles.body, { color: '#4263eb' }]}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
