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
      // Send Email OTP instead of creating password-based account
      const result = await authService.sendEmailOTP(email);
      
      // Create default organization and team for new user
      try {
        await createDefaultWorkspace(result.userId, name, email);
      } catch (workspaceError) {
        console.warn('Failed to create default workspace:', workspaceError);
        // Don't fail signup if workspace creation fails
      }
      
      // Return userId and email for OTP verification screen
      return {
        userId: result.userId,
        email: result.email,
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
      try {
        await createDefaultWorkspace(user.$id, user.name || 'User', user.email);
      } catch (workspaceError) {
        console.warn('Failed to create default workspace for Google user:', workspaceError);
        // Don't fail signin if workspace creation fails
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
   */
  const createDefaultWorkspace = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Creating default workspace for user:', userId);
      
      // Check if user already has organizations (avoid duplicates)
      const existingOrgs = await organizationService.listUserOrganizations(userId);
      if (existingOrgs.documents.length > 0) {
        console.log('🏢 User already has organizations, skipping workspace creation');
        return;
      }

      // Create organization with placeholder data
      const orgName = `${userName}'s Organization`;
      const orgDescription = `Welcome to ${userName}'s workspace!`;
      
      const organization = await organizationService.createOrganization(
        orgName,
        orgDescription,
        userId
      );
      
      console.log('🏢 Created organization:', organization.$id);

      // Create default team
      const teamName = `${userName} Team`;
      const teamDescription = `Your personal team in ${orgName}`;
      
      const team = await teamService.createTeam(
        teamName,
        organization.$id,
        teamDescription,
        ['owner'] // User is the owner of their default team
      );
      
      console.log('🏢 Created team:', team.$id);
      
      return { organization, team };
    } catch (error) {
      console.error('🏢 Error creating default workspace:', error);
      throw error;
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

