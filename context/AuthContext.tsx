import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '@/lib/appwrite/auth';
import { organizationService, teamService } from '@/lib/appwrite/teams';
import { Models } from 'react-native-appwrite';

type User = Models.User<Models.Preferences>;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ userId: string; email: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  getUserProfilePicture: () => Promise<string | null>;
  getGoogleUserData: () => Promise<any>;
  updateUserProfilePicture: (pictureUrl: string) => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      await checkAuth();
    } catch (error) {
      console.error('Sign in error in context:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Create account with email and password
      const user = await authService.signUp(email, password, name);
      
      // Send verification email (OTP) and get userId for OTP verification
      const verificationResult = await authService.sendVerificationEmail(email);
      
      // Create default organization and team for new user
      // This is non-blocking - errors won't prevent signup
      const workspaceResult = await createDefaultWorkspace(user.$id, name, email);
      if (workspaceResult.organization && workspaceResult.team) {
        console.log('✅ Default workspace created successfully');
      } else {
        console.warn('⚠️ Default workspace creation skipped or failed - user can still sign up');
      }
      
      // Return user email and userId for check-email screen (OTP verification)
      return {
        userId: verificationResult.userId,
        email: verificationResult.email,
      };
    } catch (error) {
      console.error('Sign up error in context:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error in context:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🟢 AuthContext: Starting Google OAuth...');
      const user = await authService.signInWithGoogle();
      console.log('🟢 AuthContext: OAuth successful, user:', user);
      
      // Check if this is a new user and create default workspace
      // This is non-blocking - errors won't prevent login
      const workspaceResult = await createDefaultWorkspace(user.$id, user.name || 'User', user.email);
      if (workspaceResult.organization && workspaceResult.team) {
        console.log('✅ Default workspace created successfully');
      } else {
        console.warn('⚠️ Default workspace creation skipped or failed - user can still use the app');
      }
      
      setUser(user);
      console.log('🟢 AuthContext: User state updated');
    } catch (error) {
      console.error('🔴 AuthContext: Google OAuth sign in error:', error);
      throw error;
    }
  };

  const getUserProfilePicture = async () => {
    return await authService.getUserProfilePicture();
  };

  const getGoogleUserData = async () => {
    return await authService.getGoogleUserData();
  };

  const updateUserProfilePicture = async (pictureUrl: string) => {
    return await authService.updateUserProfilePicture(pictureUrl);
  };

  /**
   * Create default organization and team for new users
   * This is a non-blocking operation - errors won't prevent login
   */
  const createDefaultWorkspace = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Creating default workspace for user:', userId);
      
      // Check if user already has organizations (avoid duplicates)
      // This may fail if user doesn't have read permissions - that's OK, we'll continue
      let existingOrgs;
      try {
        existingOrgs = await organizationService.listUserOrganizations(userId);
        if (existingOrgs.documents.length > 0) {
          console.log('🏢 User already has organizations, skipping workspace creation');
          return { organization: null, team: null };
        }
      } catch (listError: any) {
        // If we can't list organizations due to permissions, log but continue
        console.warn('⚠️ Cannot check existing organizations (permission error):', listError.message);
        console.warn('⚠️ This may indicate that collection permissions need to be configured in Appwrite Console');
        // Continue with workspace creation attempt - maybe we can create but not read
      }

      // Create organization with placeholder data
      const orgName = `${userName}'s Organization`;
      const orgDescription = `Welcome to ${userName}'s workspace!`;
      
      let organization;
      try {
        organization = await organizationService.createOrganization(
          orgName,
          orgDescription,
          userId
        );
        console.log('✅ Created organization:', organization.$id);
      } catch (createOrgError: any) {
        // Organization creation failed - likely permission issue
        console.error('❌ Failed to create organization:', createOrgError.message);
        console.error('❌ This indicates the "organizations" collection may need permissions configured in Appwrite Console');
        console.error('❌ Required permissions: "create" for authenticated users');
        // Don't throw - workspace creation is optional
        return { organization: null, team: null };
      }

      // Create default team
      const teamName = `${userName} Team`;
      const teamDescription = `Your personal team in ${orgName}`;
      
      let team;
      try {
        team = await teamService.createTeam(
          teamName,
          organization.$id,
          teamDescription,
          ['owner'], // User is the owner of their default team
          userId // Pass userId to create membership
        );
        console.log('✅ Created team:', team.$id);
      } catch (createTeamError: any) {
        // Team creation failed - log but don't throw
        console.error('❌ Failed to create team:', createTeamError.message);
        console.error('❌ This indicates the "teams" or "memberships" collections may need permissions configured');
        console.error('❌ Required permissions: "create" for authenticated users');
        // Organization was created but team wasn't - return what we have
        return { organization, team: null };
      }
      
      return { organization, team };
    } catch (error: any) {
      // Catch-all for any unexpected errors
      console.error('❌ Unexpected error creating default workspace:', error);
      console.error('❌ Error details:', error.message);
      console.warn('⚠️ Workspace creation failed but login will continue');
      // Return null values to indicate failure without throwing
      return { organization: null, team: null };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    signInWithGoogle,
    getUserProfilePicture,
    getGoogleUserData,
    updateUserProfilePicture,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

