import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/appwrite/auth';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { getUserFriendlyError } from '@/utils/errorHandler';
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
import { IconSymbol } from '@/components/IconSymbol';
import { Linking } from 'react-native';
import Avatar from '@/components/Avatar';
import { teamService, organizationService } from '@/lib/appwrite/teams';

export default function AcceptInvite() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { teamId, token } = useLocalSearchParams<{ teamId?: string; token?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [inviterName, setInviterName] = useState('');
  const [inviterProfilePicture, setInviterProfilePicture] = useState<string | undefined>(undefined);
  const [organizationName, setOrganizationName] = useState('');
  const [loadingInviteData, setLoadingInviteData] = useState(true);

  useEffect(() => {
    fetchInviteData();
  }, [teamId, token]);

  const fetchInviteData = async () => {
    if (!teamId) {
      setLoadingInviteData(false);
      return;
    }

    try {
      setLoadingInviteData(true);
      
      // Fetch team information
      const team = await teamService.getTeam(teamId);
      if (team?.teamData?.teamName) {
        setTeamName(team.teamData.teamName);
      }

      // Fetch team memberships to find the owner/inviter
      const membershipsResult = await teamService.listMemberships(teamId);
      const memberships = membershipsResult.memberships || [];
      
      // Find the owner or first member as inviter
      let inviter = memberships.find((m: any) => 
        m.membershipData?.role === 'owner' || m.roles?.includes('owner')
      ) || memberships[0];

      if (inviter) {
        // Get inviter name
        const name = inviter.userInfo?.name || 
                    inviter.membershipData?.name || 
                    inviter.userName || 
                    'Team Member';
        setInviterName(name);

        // Get inviter profile picture
        const profilePic = inviter.userInfo?.profilePicture || 
                          inviter.membershipData?.profilePicture;
        if (profilePic) {
          setInviterProfilePicture(profilePic);
        }

        // Get organization name
        if (team?.teamData?.orgId) {
          try {
            const org = await organizationService.getOrganization(team.teamData.orgId);
            if (org?.orgName) {
              setOrganizationName(org.orgName);
            }
          } catch (orgError) {
            console.warn('Could not fetch organization:', orgError);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching invite data:', err);
      // Don't show error to user, just use defaults
    } finally {
      setLoadingInviteData(false);
    }
  };

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
      await signIn(email, password);
      // After successful sign in, join the team
      await joinTeamAfterAuth();
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create account with email and password
      const result = await authService.signUp(email, password, 'User');
      // Navigate to OTP verification screen with team invite info
      router.push({
        pathname: '/(auth)/verify-email',
        params: {
          userId: result.$id,
          email: result.email || email,
          teamId: teamId || '',
          token: token || '',
          isInvite: 'true',
        },
      });
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinTeamAfterAuth = async () => {
    // TODO: Call API to join team using token
    // After successful join, navigate to jobs
    router.replace({
      pathname: '/(jobs)',
      params: { joinedTeamId: teamId }
    });
  };

  if (!teamId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Invalid Invite</Text>
        <Text style={styles.errorText}>
          This invitation link is invalid.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.buttonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Inviter Card */}
        {loadingInviteData ? (
          <View style={styles.inviterCard}>
            <ActivityIndicator size="large" color="#4263eb" />
          </View>
        ) : (
          <View style={styles.inviterCard}>
            <Avatar
              name={inviterName}
              imageUrl={inviterProfilePicture}
              size={80}
            />
            {inviterName ? (
              <Text style={styles.inviterName}>{inviterName}</Text>
            ) : null}
            {organizationName ? (
              <Text style={styles.organizationName}>{organizationName}</Text>
            ) : null}
          </View>
        )}

        {/* Invitation Copy */}
        {inviterName && (
          <Text style={styles.invitationCopy}>
            <Text style={styles.invitationCopyBlue}>You've been invited to join </Text>
            <Text style={styles.invitationCopyBold}>{inviterName}'s</Text>
            <Text style={styles.invitationCopyBlue}> team on Work Photo Pro...</Text>
          </Text>
        )}

        {/* Title */}
        <Text style={styles.title}>You've been invited</Text>
        <Text style={styles.subtitle}>Verify your device</Text>

        {/* Error Message */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Email Authentication Form */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={getPlaceholderTextColor()}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            autoComplete="email"
          />

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={getPlaceholderTextColor()}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoComplete="password-new"
            />
          )}

          {!isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={getPlaceholderTextColor()}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoComplete="password"
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message */}
        <Text style={styles.message}>
          After verification you will access your team's workspace.
        </Text>

        {/* Help Link */}
        <TouchableOpacity
          style={styles.helpLink}
          onPress={() => {
            Linking.openURL('https://workphotopro.com');
          }}
        >
          <Text style={styles.helpText}>Need help? Visit workphotopro.com</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  inviterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inviterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
  },
  organizationName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  invitationCopy: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  invitationCopyBlue: {
    color: '#4263eb',
  },
  invitationCopyBold: {
    color: '#000',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#4263eb',
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  helpLink: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#4263eb',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
