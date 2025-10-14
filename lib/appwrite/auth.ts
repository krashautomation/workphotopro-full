import { account } from './client';
import { ID } from 'appwrite';

export const authService = {
  /**
   * Create a new user account
   */
  async signUp(email: string, password: string, name: string) {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current logged in user
   */
  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  },

  /**
   * Send email verification (old method - kept for backward compatibility)
   */
  async sendVerificationEmail() {
    try {
      const url = 'workphotopro://verify-email';
      return await account.createVerification(url);
    } catch (error) {
      console.error('Send verification error:', error);
      throw error;
    }
  },

  /**
   * Verify email with userId and secret from verification link (old method)
   */
  async verifyEmail(userId: string, secret: string) {
    try {
      return await account.updateVerification(userId, secret);
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  /**
   * Send Email OTP - Sends a 6-digit code to user's email
   * Returns userId and secret needed for verification
   */
  async sendEmailOTP(email: string) {
    try {
      const token = await account.createEmailToken(ID.unique(), email);
      return {
        userId: token.userId,
        email: email,
      };
    } catch (error) {
      console.error('Send Email OTP error:', error);
      throw error;
    }
  },

  /**
   * Verify Email OTP - Verify the 6-digit code and create session
   */
  async verifyEmailOTP(userId: string, otp: string) {
    try {
      const session = await account.createSession(userId, otp);
      return session;
    } catch (error) {
      console.error('Verify Email OTP error:', error);
      throw error;
    }
  },

  /**
   * Send password recovery email
   */
  async forgotPassword(email: string) {
    try {
      const url = 'workphotopro://reset-password';
      return await account.createRecovery(email, url);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with userId, secret from recovery link, and new password
   */
  async resetPassword(userId: string, secret: string, password: string) {
    try {
      return await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Update user name
   */
  async updateName(name: string) {
    try {
      return await account.updateName(name);
    } catch (error) {
      console.error('Update name error:', error);
      throw error;
    }
  },

  /**
   * Update user email
   */
  async updateEmail(email: string, password: string) {
    try {
      return await account.updateEmail(email, password);
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string, oldPassword: string) {
    try {
      return await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },
};

