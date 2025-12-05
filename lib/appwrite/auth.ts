import { account } from './client';
import { ID, OAuthProvider } from 'react-native-appwrite';
import * as WebBrowser from 'expo-web-browser';

export const authService = {
  /**
   * Create a new user account and create a session
   * User is automatically logged in after account creation
   */
  async signUp(email: string, password: string, name: string) {
    try {
      // Normalize email (trim and lowercase) to match sign-in behavior
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log('🔐 Creating account for email:', normalizedEmail);
      
      // Create the account
      const user = await account.create(ID.unique(), normalizedEmail, password, name);
      
      console.log('✅ Account created, creating session...');
      
      // Create a session immediately after account creation
      // User is now logged in and can access the app
      await account.createEmailPasswordSession(normalizedEmail, password);
      
      console.log('✅ Sign up successful, session created');
      return user;
    } catch (error: any) {
      // Error details will be logged by error handler
      // Just re-throw - don't log here to avoid duplicate logs
      throw error;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      // Normalize email (trim and lowercase)
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log('🔐 Attempting sign in for email:', normalizedEmail);
      
      const session = await account.createEmailPasswordSession(normalizedEmail, password);
      
      console.log('✅ Sign in successful, session created');
      return session;
    } catch (error: any) {
      // Error details will be logged by error handler
      // Just re-throw - don't log here to avoid duplicate logs
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
      console.log('🔐 Getting current user...');
      
      // Add timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('getCurrentUser timeout after 10 seconds'));
        }, 10000);
      });
      
      const userPromise = account.get();
      const user = await Promise.race([userPromise, timeoutPromise]);
      
      console.log('✅ Current user retrieved:', user ? user.email : 'null');
      return user;
    } catch (error: any) {
      // Check if it's a timeout error or a real auth error
      if (error?.message?.includes('timeout')) {
        console.warn('⚠️ getCurrentUser timeout - network may be slow or unavailable');
      } else {
        console.log('⚠️ getCurrentUser error:', error?.message || error);
      }
      // Return null instead of throwing - this allows the app to continue
      return null;
    }
  },

  /**
   * Send email verification - sends Email OTP (6-digit code) to user's email
   * Returns userId needed for verification
   * Note: Using OTP instead of email links to avoid URL registration requirements
   */
  async sendVerificationEmail(email?: string) {
    try {
      // Get current user email if not provided
      if (!email) {
        const user = await this.getCurrentUser();
        if (!user || !user.email) {
          throw new Error('No email available. Please provide an email address.');
        }
        email = user.email;
      }
      
      // Send Email OTP instead of verification link
      // Note: createEmailToken doesn't require a URL parameter for OTP verification
      const token = await account.createEmailToken(ID.unique(), email);
      return {
        userId: token.userId,
        email: email,
      };
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
      // Note: createEmailToken doesn't require a URL parameter for OTP verification
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
      // Use HTTPS URL instead of custom scheme - Appwrite requires valid HTTP/HTTPS URLs
      const url = 'https://web.workphotopro.com/reset-password';
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

  /**
   * Sign in with Google OAuth using proper OAuth2 flow with deep links
   * Following the exact pattern from Appwrite React Native documentation
   */
  async signInWithGoogle() {
    try {
      console.log('🔵 Starting Google OAuth flow following Appwrite docs...');
      
      // Get project ID from environment
      const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
      if (!projectId) {
        throw new Error('Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID in environment variables');
      }
      
      // Use Appwrite callback scheme format: appwrite-callback-<PROJECT_ID>://
      // This is the standard Appwrite callback format and should work without additional registration
      // Fallback to app scheme (workphotopro://) if Appwrite callback doesn't work
      const appwriteCallbackScheme = `appwrite-callback-${projectId}://`;
      const appScheme = 'workphotopro://';
      
      // Try Appwrite callback scheme first (recommended), fallback to app scheme
      const redirectUri = appwriteCallbackScheme;
      const scheme = redirectUri;
      
      console.log('🔵 Using redirect URI:', redirectUri);
      console.log('🔵 Scheme:', scheme);
      console.log('🔵 Project ID:', projectId);
      
      // Start OAuth flow
      console.log('🔵 Creating OAuth2 token...');
      const loginUrl = await account.createOAuth2Token({
        provider: OAuthProvider.Google,
        success: redirectUri,
        failure: redirectUri,
        scopes: ['profile', 'email', 'openid'], // Add scopes to get profile picture
      });
      
      console.log('🔵 OAuth login URL generated:', loginUrl);
      
      // Open loginUrl and listen for the scheme redirect
      console.log('🔵 Opening OAuth session...');
      const result = await WebBrowser.openAuthSessionAsync(`${loginUrl}`, scheme);
      
      console.log('🔵 WebBrowser result:', {
        type: result.type,
        url: result.type === 'success' ? result.url : undefined
      });
      
      if (result.type === 'success') {
        return await this.processOAuthResult(result.url);
      } else if (result.type === 'cancel') {
        console.log('🔴 OAuth flow cancelled by user');
        throw new Error('OAuth authentication cancelled by user');
      } else {
        console.log('🔴 OAuth flow failed:', result.type);
        throw new Error(`OAuth authentication failed: ${result.type}`);
      }
    } catch (error) {
      console.error('🔴 Google OAuth sign in error:', error);
      throw error;
    }
  },


  /**
   * Process OAuth result and create session
   * Following the exact pattern from Appwrite React Native documentation
   */
  async processOAuthResult(redirectUrl: string) {
    try {
      console.log('🔵 Processing OAuth redirect:', redirectUrl);
      
      // Extract credentials from OAuth redirect URL
      const url = new URL(redirectUrl);
      const secret = url.searchParams.get('secret');
      const userId = url.searchParams.get('userId');
      
      console.log('🔵 Extracted parameters:', {
        secret: secret ? '***' : 'null',
        userId: userId
      });
      
      // Check if we have the required credentials
      if (!secret || !userId) {
        console.log('🔴 Missing OAuth credentials in redirect URL');
        throw new Error('OAuth authentication failed - missing credentials in redirect URL');
      }
      
      // Create session with OAuth credentials
      console.log('🔵 Creating session with OAuth credentials...');
      await account.createSession({
        userId,
        secret
      });
      
      console.log('🔵 Session created successfully');
      
      // Get the current user to verify authentication
      console.log('🔵 Getting current user...');
      const user = await this.getCurrentUser();
      
      if (!user) {
        throw new Error('Failed to get user after OAuth session creation');
      }
      
      console.log('🔵 Google OAuth sign in successful!', user);
      console.log('🔵 User prefs:', user.prefs);
      console.log('🔵 User prefs picture:', user.prefs?.picture);
      console.log('🔵 User prefs keys:', user.prefs ? Object.keys(user.prefs) : 'No prefs');
      
      // Store Google profile picture and additional data if available
      if (user.prefs) {
        try {
          await this.storeGoogleUserData(user.$id, user.prefs);
        } catch (error) {
          console.warn('Failed to store Google user data:', error);
          // Don't throw here as it's not critical for sign-in
        }
      } else {
        console.warn('🔴 No user preferences found - Google data may not be available');
        // Try to get Google profile data directly
        try {
          await this.fetchGoogleProfileData(user.$id);
        } catch (error) {
          console.warn('Failed to fetch Google profile data directly:', error);
        }
      }
      
      return user;
    } catch (error) {
      console.error('🔴 Error processing OAuth result:', error);
      throw error;
    }
  },

  /**
   * Get OAuth session information
   */
  async getOAuthSession(sessionId: string = 'current') {
    try {
      const session = await account.getSession(sessionId);
      return session;
    } catch (error) {
      console.error('Get OAuth session error:', error);
      throw error;
    }
  },


  /**
   * Store Google user data including profile picture and other info
   */
  async storeGoogleUserData(userId: string, googleData: any) {
    try {
      console.log('🔵 Storing Google user data:', googleData);
      
      // Extract and clean Google user data
      const userData: any = {};
      
      // Store profile picture if available
      if (googleData.picture) {
        userData.profilePicture = googleData.picture;
      }
      
      // Store additional Google data
      if (googleData.name) userData.googleName = googleData.name;
      if (googleData.email) userData.googleEmail = googleData.email;
      if (googleData.given_name) userData.firstName = googleData.given_name;
      if (googleData.family_name) userData.lastName = googleData.family_name;
      if (googleData.locale) userData.locale = googleData.locale;
      
      // Add timestamp for when data was last updated
      userData.googleDataUpdated = new Date().toISOString();
      
      // Update user preferences with Google data
      await account.updatePrefs(userData);
      console.log('🔵 Google user data stored successfully:', userData);
    } catch (error) {
      console.error('Store Google user data error:', error);
      throw error;
    }
  },

  /**
   * Get user profile picture from preferences
   */
  async getUserProfilePicture(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      return user?.prefs?.profilePicture || null;
    } catch (error) {
      console.error('Get profile picture error:', error);
      return null;
    }
  },

  /**
   * Get all Google user data from preferences
   */
  async getGoogleUserData(): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      return user?.prefs || null;
    } catch (error) {
      console.error('Get Google user data error:', error);
      return null;
    }
  },

  /**
   * Update user profile picture manually
   */
  async updateUserProfilePicture(pictureUrl: string) {
    try {
      await account.updatePrefs({
        profilePicture: pictureUrl,
        profilePictureUpdated: new Date().toISOString(),
      });
      console.log('Profile picture updated successfully');
    } catch (error) {
      console.error('Update profile picture error:', error);
      throw error;
    }
  },

  /**
   * Fetch Google profile data directly from Google API
   */
  async fetchGoogleProfileData(userId: string) {
    try {
      console.log('🔵 Attempting to fetch Google profile data directly...');
      
      // Get the OAuth session to access the access token
      const session = await this.getOAuthSession();
      console.log('🔵 OAuth session:', session);
      
      // Note: This is a fallback approach - Appwrite should provide the data automatically
      // If this is needed, we would need to implement Google API calls with the access token
      console.log('🔵 Direct Google API fetch not implemented - relying on Appwrite OAuth data');
      
    } catch (error) {
      console.error('Error fetching Google profile data:', error);
      throw error;
    }
  },
};

