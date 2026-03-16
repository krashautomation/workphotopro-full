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
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { Linking } from 'react-native';
import Avatar from '@/components/Avatar';
import { organizationService } from '@/lib/appwrite/teams';
import { teamService } from '@/services/teamService';
import {
  getInviteDetails,
  claimInvite,
  acceptInvite,
  completeInviteFlow,
  getInviteErrorMessage,
  isInviteClaimable,
  type UniversalInviteDetails,
  InviteAPIError,
} from '@/services/inviteService';

/**
 * Accept Invite Screen
 * 
 * Supports two invite flows:
 * 
 * 1. Universal Deep Link Flow (NEW):
 *    URL: https://workphotopro.com/invite/{shortId}
 *    - Uses shortId to fetch invite details
 *    - Shows inviterName and organizationName from API
 *    - Claim → Accept flow (server creates membership)
 *    
 * 2. Legacy Token Flow:
 *    URL: https://web.workphotopro.com/invite/{teamId}?token=...&orgId=...
 *    - Uses teamId, token, orgId
 *    - Fetches team/organization data
 *    - Uses teamService.acceptInvitation()
 */
export default function AcceptInvite() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  
  // URL Parameters - support all flows including session-based
  const { 
    shortId,           // NEW: Universal flow
    teamId,            // Legacy: Team ID
    token,             // Legacy: Invitation token
    orgId,             // Legacy: Organization ID
    fromSession,       // Session-based invite flag
    deviceId,          // Device ID for session tracking
    prefillEmail       // Pre-filled email from session
  } = useLocalSearchParams<{ 
    shortId?: string;
    teamId?: string; 
    token?: string; 
    orgId?: string;
    fromSession?: string;
    deviceId?: string;
    prefillEmail?: string;
  }>();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Invite data state
  const [inviteMode, setInviteMode] = useState<'universal' | 'legacy' | null>(null);
  const [loadingInviteData, setLoadingInviteData] = useState(true);
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);

  // Universal flow data
  const [inviteDetails, setInviteDetails] = useState<UniversalInviteDetails | null>(null);

  // Legacy flow data
  const [teamName, setTeamName] = useState('');
  const [inviterName, setInviterName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  // Shared data (inviter profile picture from legacy flow)
  const [inviterProfilePicture, setInviterProfilePicture] = useState<string | undefined>(undefined);

  // Determine which flow to use and load data
  useEffect(() => {
    if (shortId) {
      // NEW: Universal flow
      setInviteMode('universal');
      fetchUniversalInviteDetails(shortId);
    } else if (teamId && orgId) {
      // Legacy flow
      setInviteMode('legacy');
      fetchLegacyInviteData(teamId, orgId);
    } else {
      // Invalid - no parameters
      setLoadingInviteData(false);
      setError('Invalid invitation link. Please check the URL or ask for a new invitation.');
    }
  }, [shortId, teamId, orgId]);

  /**
   * Fetch invite details for universal flow
   * Called immediately when screen loads (before auth)
   */
  const fetchUniversalInviteDetails = async (id: string) => {
    try {
      setLoadingInviteData(true);
      setError('');
      
      const details = await getInviteDetails(id);
      setInviteDetails(details);
      
      // Pre-populate email from session or authenticated user
      if (prefillEmail) {
        // Email from invite session (user clicked link in browser)
        setEmail(prefillEmail);
        console.log('[AcceptInvite] Pre-filled email from session:', prefillEmail);
      } else if (user?.email) {
        // User is already authenticated
        setEmail(user.email);
      }
      
      console.log('[AcceptInvite] Loaded universal invite:', details.teamName, 'by', details.inviterName);
    } catch (err) {
      console.error('[AcceptInvite] Error fetching invite details:', err);
      const errorMessage = getInviteErrorMessage(err);
      setError(errorMessage);
      
      // Check for specific error states
      if (err instanceof InviteAPIError) {
        if (err.errorCode === 'INVITE_EXPIRED' || err.errorCode === 'INVITE_NOT_FOUND') {
          // These are fatal - invite can't be used
          setInviteDetails(null);
        }
      }
    } finally {
      setLoadingInviteData(false);
    }
  };

  /**
   * Fetch team/org data for legacy flow
   */
  const fetchLegacyInviteData = async (tId: string, oId: string) => {
    try {
      setLoadingInviteData(true);
      
      // Fetch team information
      const team = await teamService.getTeam(tId, oId);
      if (team?.teamName) {
        setTeamName(team.teamName);
      }

      // Fetch team members to find the owner/inviter
      const memberships = await teamService.listMembers(tId, oId);
      const inviter = memberships.find((m: any) => m.role === 'owner') || memberships[0];

      if (inviter) {
        setInviterName(inviter.userName || 'Team Member');
        setInviterProfilePicture(inviter.profilePicture);
      }

      // Get organization name
      if (team?.orgId) {
        try {
          const org = await organizationService.getOrganization(team.orgId);
          if (org?.orgName) {
            setOrganizationName(org.orgName);
          }
        } catch (orgError) {
          console.warn('[AcceptInvite] Could not fetch organization:', orgError);
        }
      }
      
      console.log('[AcceptInvite] Loaded legacy invite for team:', team.teamName);
    } catch (err) {
      console.error('[AcceptInvite] Error fetching legacy invite data:', err);
      setError('Failed to load invitation details. The link may be invalid.');
    } finally {
      setLoadingInviteData(false);
    }
  };

  /**
   * Handle sign in for existing users
   */
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
      // After successful sign in, process the invitation
      await processInvitationAfterAuth();
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sign up for new users
   */
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
      const result = await authService.signUp(email, password, 'User');
      
      // Navigate to verification with invite params preserved
      const params: any = {
        userId: result.$id,
        email: result.email || email,
        isInvite: 'true',
      };
      
      // Pass through the appropriate invite params
      if (inviteMode === 'universal' && shortId) {
        params.shortId = shortId;
      } else if (inviteMode === 'legacy') {
        params.teamId = teamId || '';
        params.token = token || '';
        params.orgId = orgId || '';
      }
      
      // Preserve session-based params for install-safe resume
      if (fromSession === 'true') {
        params.fromSession = 'true';
      }
      if (deviceId) {
        params.deviceId = deviceId;
      }
      
      router.push({
        pathname: '/(auth)/verify-email',
        params,
      });
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process the invitation after user is authenticated
   * Handles both universal and legacy flows
   */
  const processInvitationAfterAuth = async () => {
    if (inviteMode === 'universal' && shortId) {
      await processUniversalInvite();
    } else if (inviteMode === 'legacy' && token && orgId) {
      await processLegacyInvite();
    } else {
      setError('Invalid invitation. Please check the link or ask for a new invitation.');
    }
  };

  /**
   * Process universal invite: claim → accept
   */
  const processUniversalInvite = async () => {
    if (!shortId) return;
    
    setAcceptingInvitation(true);
    setError('');

    try {
      // Get current user (should be authenticated at this point)
      const { account } = await import('@/lib/appwrite/client');
      const currentUser = await account.get();
      
      if (!currentUser?.$id) {
        setError('You must be signed in to accept an invitation');
        return;
      }

      // Complete the full flow: claim then accept
      const result = await completeInviteFlow(shortId, currentUser.$id);
      
      console.log('[AcceptInvite] Successfully joined team:', result.teamId);
      
      // Navigate to jobs screen
      router.replace({
        pathname: '/(jobs)',
        params: { joinedTeamId: result.teamId }
      });
      
      // Show success message
      Alert.alert(
        'Welcome!',
        `You've successfully joined ${inviteDetails?.teamName || 'the team'}.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[AcceptInvite] Error processing universal invite:', err);
      
      const errorMessage = getInviteErrorMessage(err);
      
      // Handle specific error cases
      if (err instanceof InviteAPIError) {
        switch (err.errorCode) {
          case 'INVITE_EXPIRED':
            setError('This invitation has expired. Please ask for a new invitation.');
            break;
          case 'INVITE_DECLINED':
            setError('This invitation has been declined.');
            break;
          case 'INVITE_CANCELLED':
            setError('This invitation has been cancelled by the sender.');
            break;
          case 'INVITE_REVOKED':
            setError('This invitation has been revoked.');
            break;
          case 'INVITE_ALREADY_CLAIMED':
            setError('This invitation has already been claimed by someone else.');
            break;
          case 'ALREADY_MEMBER':
            setError('You are already a member of this team.');
            // Still navigate to jobs
            setTimeout(() => {
              router.replace({
                pathname: '/(jobs)',
                params: { joinedTeamId: inviteDetails?.teamId }
              });
            }, 2000);
            break;
          case 'NOT_CLAIMED':
            setError('There was an issue claiming this invitation. Please try again.');
            break;
          case 'CLAIMED_BY_OTHER':
            setError('This invitation was claimed by a different user.');
            break;
          case 'UNAUTHORIZED':
            setError('You must be signed in to accept this invitation.');
            break;
          default:
            setError(errorMessage);
        }
      } else {
        setError(errorMessage || 'Failed to accept invitation. Please try again.');
      }
    } finally {
      setAcceptingInvitation(false);
    }
  };

  /**
   * Process legacy invite using teamService
   */
  const processLegacyInvite = async () => {
    if (!token || !orgId || !teamId) {
      setError('Invalid invitation link - missing required information');
      return;
    }

    setAcceptingInvitation(true);
    setError('');

    try {
      const { account } = await import('@/lib/appwrite/client');
      const currentUser = await account.get();
      
      if (!currentUser?.$id) {
        setError('You must be signed in to accept an invitation');
        return;
      }

      await teamService.acceptInvitation(token, currentUser.$id, orgId);
      
      console.log('[AcceptInvite] Successfully joined team (legacy):', teamId);
      
      router.replace({
        pathname: '/(jobs)',
        params: { joinedTeamId: teamId }
      });
    } catch (err: any) {
      console.error('[AcceptInvite] Error processing legacy invite:', err);
      
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('Invalid or expired')) {
        setError('This invitation is invalid or has expired. Please ask for a new invitation.');
      } else if (errorMessage.includes('Organization mismatch')) {
        setError('This invitation is for a different organization.');
      } else if (errorMessage.includes('Email mismatch')) {
        setError('This invitation was sent to a different email address.');
      } else if (errorMessage.includes('Already a member')) {
        setError('You are already a member of this team.');
        setTimeout(() => {
          router.replace({
            pathname: '/(jobs)',
            params: { joinedTeamId: teamId }
          });
        }, 2000);
      } else {
        setError(getUserFriendlyError(err) || 'Failed to accept invitation.');
      }
    } finally {
      setAcceptingInvitation(false);
    }
  };

  /**
   * Get display data for the UI
   * Works with both universal and legacy flows
   */
  const getDisplayData = () => {
    if (inviteMode === 'universal' && inviteDetails) {
      return {
        inviterName: inviteDetails.inviterName,
        organizationName: inviteDetails.organizationName,
        teamName: inviteDetails.teamName,
        inviterProfilePicture: undefined, // Universal flow doesn't include profile picture
        isClaimable: isInviteClaimable(inviteDetails.status),
      };
    }
    
    // Legacy flow
    return {
      inviterName,
      organizationName,
      teamName,
      inviterProfilePicture,
      isClaimable: true, // Legacy flow doesn't check claim status
    };
  };

  const displayData = getDisplayData();

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
            Please wait while we add you to {displayData.teamName || 'the team'}
          </Text>
        </View>
      </View>
    );
  }

  // Show error if invite is not claimable (universal flow only)
  if (inviteMode === 'universal' && inviteDetails && !displayData.isClaimable) {
    return (
      <View style={styles.container}>
        <View style={styles.inviterCard}>
          <IconSymbol name="xmark.circle" size={64} color="#ff6b6b" />
          <Text style={[styles.inviterName, { marginTop: 16, color: '#ff6b6b' }]}>
            Invitation Unavailable
          </Text>
          <Text style={styles.organizationName}>
            {inviteDetails.status === 'claimed' 
              ? 'This invitation has already been claimed.' 
              : inviteDetails.status === 'accepted'
              ? 'This invitation has already been used.'
              : inviteDetails.status === 'expired'
              ? 'This invitation has expired.'
              : inviteDetails.status === 'declined'
              ? 'This invitation has been declined.'
              : inviteDetails.status === 'cancelled'
              ? 'This invitation has been cancelled by the sender.'
              : inviteDetails.status === 'revoked'
              ? 'This invitation has been revoked.'
              : 'This invitation is no longer available.'}
          </Text>
        </View>
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
            <Text style={{ marginTop: 16, color: '#666' }}>
              Loading invitation...
            </Text>
          </View>
        ) : (
          <View style={styles.inviterCard}>
            <Avatar
              name={displayData.inviterName}
              imageUrl={displayData.inviterProfilePicture}
              size={80}
            />
            {displayData.inviterName ? (
              <Text style={styles.inviterName}>{displayData.inviterName}</Text>
            ) : null}
            {displayData.organizationName ? (
              <Text style={styles.organizationName}>{displayData.organizationName}</Text>
            ) : null}
            {displayData.teamName && (
              <Text style={styles.teamName}>Team: {displayData.teamName}</Text>
            )}
          </View>
        )}

        {/* Invitation Copy */}
        {!loadingInviteData && displayData.inviterName && (
          <Text style={styles.invitationCopy}>
            <Text style={styles.invitationCopyBlue}>You've been invited to join </Text>
            <Text style={styles.invitationCopyBold}>{displayData.inviterName}'s</Text>
            <Text style={styles.invitationCopyBlue}> team on Work Photo Pro...</Text>
          </Text>
        )}

        {/* Title */}
        <Text style={styles.title}>You've been invited</Text>
        <Text style={styles.subtitle}>Verify your device</Text>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email Authentication Form */}
        {!loadingInviteData && displayData.isClaimable && (
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

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={getPlaceholderTextColor()}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoComplete={isSignUp ? 'password-new' : 'password'}
            />

            <TouchableOpacity
              style={[styles.primaryButton, (loading || !displayData.isClaimable) && styles.buttonDisabled]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading || !displayData.isClaimable}
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
        )}

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
  teamName: {
    fontSize: 14,
    color: '#4263eb',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: 14,
    flex: 1,
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
    marginHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
