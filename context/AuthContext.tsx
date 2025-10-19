import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '@/lib/appwrite/auth';
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

