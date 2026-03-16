/**
 * useInviteSession Hook
 * 
 * Manages install-safe invite session checking and resume functionality.
 * This hook should be used in the root layout to check for pending invite
 * sessions on app launch.
 * 
 * Flow:
 * 1. App launches
 * 2. Get or create deviceId
 * 3. Check for pending invite sessions (< 7 days old)
 * 4. If found, navigate to invite screen with session data
 * 5. Allow user to claim/accept the invite
 * 
 * Usage:
 * ```typescript
 * const { checkSession, isChecking, hasSession, session, error } = useInviteSession();
 * 
 * // Check on app launch
 * useEffect(() => {
 *   checkSession();
 * }, []);
 * ```
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { getDeviceId } from '@/utils/deviceId';
import {
  checkInviteSession,
  completeInviteFromSession,
  type InviteSession,
  type AcceptInviteResponse,
  InviteAPIError,
  getInviteErrorMessage,
} from '@/services/inviteService';

export interface UseInviteSessionReturn {
  /** Check for pending invite sessions */
  checkSession: (options?: CheckSessionOptions) => Promise<void>;
  /** Whether currently checking for sessions */
  isChecking: boolean;
  /** Whether a valid session was found */
  hasSession: boolean;
  /** The invite session data if found */
  session: InviteSession | null;
  /** Any error that occurred during checking */
  error: string | null;
  /** Clear the current session state */
  clearSession: () => void;
  /** Complete the invite flow (for authenticated users) */
  completeInvite: (userId: string) => Promise<AcceptInviteResponse | null>;
  /** Whether completion is in progress */
  isCompleting: boolean;
}

export interface CheckSessionOptions {
  /** Whether to automatically navigate to invite screen if session found */
  autoNavigate?: boolean;
  /** Whether to auto-complete if user is authenticated */
  autoComplete?: boolean;
  /** User ID if already authenticated */
  userId?: string;
  /** Callback when session is found */
  onSessionFound?: (session: InviteSession) => void;
  /** Callback when no session found */
  onNoSession?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Hook for managing invite sessions
 * 
 * @returns UseInviteSessionReturn
 */
export function useInviteSession(): UseInviteSessionReturn {
  const router = useRouter();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [session, setSession] = useState<InviteSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear the current session state
   */
  const clearSession = useCallback(() => {
    setHasSession(false);
    setSession(null);
    setError(null);
  }, []);

  /**
   * Check for pending invite sessions
   * 
   * @param options - Check session options
   */
  const checkSession = useCallback(async (options: CheckSessionOptions = {}) => {
    const {
      autoNavigate = true,
      autoComplete = false,
      userId,
      onSessionFound,
      onNoSession,
      onError,
    } = options;

    setIsChecking(true);
    setError(null);

    try {
      // Get device ID
      const deviceId = await getDeviceId();
      
      // Check for invite session
      const response = await checkInviteSession(deviceId);

      if (response.hasSession && response.session) {
        const sessionData = response.session;
        console.log('[useInviteSession] ✅ Found invite session:', sessionData.shortId);
        
        setHasSession(true);
        setSession(sessionData);

        // Call callback if provided
        onSessionFound?.(sessionData);

        // If user is authenticated and autoComplete is enabled, complete immediately
        if (userId && autoComplete) {
          try {
            const result = await completeInviteFromSession(deviceId, userId);
            if (result) {
              // Navigate to team dashboard
              router.replace({
                pathname: '/(jobs)',
                params: { joinedTeamId: result.teamId, fromInviteSession: 'true' }
              });
              
              Alert.alert(
                'Welcome!',
                `You've successfully joined ${sessionData.teamName || 'the team'} via your invite link.`,
                [{ text: 'OK' }]
              );
              
              clearSession();
              return;
            }
          } catch (completeError) {
            console.error('[useInviteSession] Auto-complete failed:', completeError);
            // Continue to manual flow
          }
        }

        // Navigate to invite screen if autoNavigate is enabled
        if (autoNavigate) {
          // Build navigation params
          const params: Record<string, string> = {
            shortId: sessionData.shortId,
            fromSession: 'true',
            deviceId: deviceId, // Pass deviceId for later use
          };

          // If email is known from session, pre-fill it
          if (sessionData.email) {
            params.prefillEmail = sessionData.email;
          }

          router.push({
            pathname: '/(auth)/accept-invite',
            params,
          });
        }
      } else {
        console.log('[useInviteSession] No pending invite session');
        setHasSession(false);
        setSession(null);
        onNoSession?.();
      }
    } catch (err) {
      const errorMessage = getInviteErrorMessage(err);
      console.error('[useInviteSession] Error checking session:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsChecking(false);
    }
  }, [router, clearSession]);

  /**
   * Complete the invite flow for the current session
   * 
   * @param userId - The authenticated user's ID
   * @returns Promise<AcceptInviteResponse | null>
   */
  const completeInvite = useCallback(async (userId: string): Promise<AcceptInviteResponse | null> => {
    if (!session) {
      console.warn('[useInviteSession] No session to complete');
      return null;
    }

    setIsCompleting(true);

    try {
      const deviceId = await getDeviceId();
      const result = await completeInviteFromSession(deviceId, userId);
      
      if (result) {
        console.log('[useInviteSession] ✅ Completed invite from session');
        clearSession();
      }
      
      return result;
    } catch (err) {
      const errorMessage = getInviteErrorMessage(err);
      console.error('[useInviteSession] Error completing invite:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsCompleting(false);
    }
  }, [session, clearSession]);

  return {
    checkSession,
    isChecking,
    hasSession,
    session,
    error,
    clearSession,
    completeInvite,
    isCompleting,
  };
}

/**
 * Check for invite session on app launch
 * This is a convenience function for use in _layout.tsx
 * 
 * @param router - Expo router instance
 * @param userId - Optional user ID if already authenticated
 * @returns Promise<void>
 */
export async function checkInviteSessionOnLaunch(
  router: ReturnType<typeof useRouter>,
  userId?: string
): Promise<void> {
  console.log('[InviteSession] Checking for pending invite sessions on app launch...');
  
  try {
    // Get device ID
    const deviceId = await getDeviceId();
    
    // Check for invite session
    const response = await checkInviteSession(deviceId);

    if (response.hasSession && response.session) {
      const session = response.session;
      console.log('[InviteSession] ✅ Found pending invite session:', session.shortId);

      // If user is authenticated, try to auto-complete
      if (userId) {
        try {
          const result = await completeInviteFromSession(deviceId, userId);
          if (result) {
            console.log('[InviteSession] ✅ Auto-completed invite for authenticated user');
            
            // Show success alert
            setTimeout(() => {
              Alert.alert(
                'Welcome Back!',
                `You've successfully joined ${session.teamName || 'the team'} via your invite link.`,
                [{ text: 'OK' }]
              );
            }, 500);
            
            // Navigate to jobs with joined team
            router.replace({
              pathname: '/(jobs)',
              params: { joinedTeamId: result.teamId, fromInviteSession: 'true' }
            });
            return;
          }
        } catch (autoCompleteError) {
          console.log('[InviteSession] Auto-complete failed, showing invite screen:', autoCompleteError);
          // Fall through to manual invite screen
        }
      }

      // Navigate to invite screen (for unauthenticated users or auto-complete failure)
      const params: Record<string, string> = {
        shortId: session.shortId,
        fromSession: 'true',
        deviceId: deviceId,
      };

      if (session.email) {
        params.prefillEmail = session.email;
      }

      console.log('[InviteSession] Navigating to invite screen with session');
      router.push({
        pathname: '/(auth)/accept-invite',
        params,
      });
    } else {
      console.log('[InviteSession] No pending invite sessions found');
    }
  } catch (error) {
    console.error('[InviteSession] Error checking for invite session:', error);
    // Silently fail - don't block app launch
  }
}
