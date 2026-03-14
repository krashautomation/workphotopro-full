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
import { organizationService } from '@/lib/appwrite/teams';
import { teamService } from '@/services/teamService';

export default function AcceptInvite() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { teamId, token, orgId } = useLocalSearchParams<{ teamId?: string; token?: string; orgId?: string }>();
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
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);

  useEffect(() => {
    fetchInviteData();
  }, [teamId, token]);

  const fetchInviteData = async () => {
    if (!teamId || !orgId) {
      setLoadingInviteData(false);
      return;
    }

    try {
      setLoadingInviteData(true);
      
      // Fetch team information (requires orgId for security)
      const team = await teamService.getTeam(teamId, orgId);
      if (team?.teamName) {
        setTeamName(team.teamName);
      }

      // Fetch team members to find the owner/inviter
      const memberships = await teamService.listMembers(teamId, orgId);
      
      // Find the owner or first member as inviter
      let inviter = memberships.find((m: any) => m.role === 'owner') || memberships[0];

      if (inviter) {
        // Get inviter name (use cached fields from membership)
        const name = inviter.userName || 'Team Member';
        setInviterName(name);

        // Get inviter profile picture (use cached field)
        const profilePic = inviter.profilePicture;
        if (profilePic) {
          setInviterProfilePicture(profilePic);
        }

        // Get organization name
        if (team?.orgId) {
          try {
            const org = await organizationService.getOrganization(team.orgId);
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
    if (!token) {
      setError('Invalid invitation token');
      return;
    }

    if (!orgId) {
      setError('Invalid invitation link - missing organization');
      return;
    }

    setAcceptingInvitation(true);
    setError('');

    try {
      // Get current user
      const { account } = await import('@/lib/appwrite/client');
      const user = await account.get();
      
      if (!user?.$id) {
        setError('You must be signed in to accept an invitation');
        setAcceptingInvitation(false);
        return;
      }

      // Accept the invitation using the new custom system
      await teamService.acceptInvitation(token, user.$id, orgId);
      
      // Success! Navigate to jobs screen
      router.replace({
        pathname: '/(jobs)',
        params: { joinedTeamId: teamId }
      });
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      
      // Handle specific error messages from teamService
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('Invalid or expired')) {
        setError('This invitation is invalid or has expired. Please ask the team owner to send a new invitation.');
      } else if (errorMessage.includes('Organization mismatch')) {
        setError('This invitation is for a different organization. Please check the invitation link and try again.');
      } else if (errorMessage.includes('Email mismatch')) {
        setError('This invitation was sent to a different email address. Please sign in with the email address that received the invitation, or ask the team owner to invite your current email address.');
      } else if (errorMessage.includes('Already a member')) {
        setError('You are already a member of this team.');
        // Still redirect to jobs since they're already a member
        setTimeout(() => {
          router.replace({
            pathname: '/(jobs)',
            params: { joinedTeamId: teamId }
          });
        }, 2000);
      } else {
        setError(getUserFriendlyError(err) || 'Failed to accept invitation. Please try again or contact support.');
      }
    } finally {
      setAcceptingInvitation(false);
    }
  };

  if (!teamId || !orgId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Invalid Invite</Text>
        <Text style={styles.errorText}>
          This invitation link is invalid or incomplete.
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

  // Show loading screen while accepting invitation
  if (acceptingInvitation) {
    return (
      <View style={styles.container}>
        <View style={styles.inviterCard}>
          <ActivityIndicator size="large" color="#4263eb" />
          <Text style={[styles.inviterName, { marginTop: 16 }]}>
            Accepting invitation...
          </Text>
          <Text style={styles.organizationName}>
            Please wait while we add you to the team
          </Text>
        </View>
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
