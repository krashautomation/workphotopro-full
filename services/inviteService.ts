/**
 * Universal Invite Service
 * 
 * Handles the new universal deep link invite flow:
 * https://workphotopro.com/invite/{shortId}
 * 
 * API Endpoints:
 * - GET /api/invites/details - Get invite details (inviter name, org name)
 * - POST /api/invites/claim - Claim the invite for current user
 * - POST /api/invites/accept - Accept invite and create membership
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_WEB_API_URL || 'https://workphotopro.com';

/**
 * Response from GET /api/invites/details
 */
export interface UniversalInviteDetails {
  shortId: string;
  inviterName: string;
  inviterEmail?: string;
  organizationName: string;
  organizationId: string;
  teamName: string;
  teamId: string;
  role: string;
  status: 'pending' | 'claimed' | 'accepted' | 'expired';
  claimedBy?: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Response from POST /api/invites/claim
 */
export interface ClaimInviteResponse {
  success: boolean;
  message: string;
  claimedAt: string;
  shortId: string;
}

/**
 * Response from POST /api/invites/accept
 */
export interface AcceptInviteResponse {
  success: boolean;
  message: string;
  membershipId: string;
  teamId: string;
  organizationId: string;
  acceptedAt: string;
}

/**
 * Custom error for invite API failures
 */
export class InviteAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'InviteAPIError';
  }
}

/**
 * Get invite details by shortId
 * Shows invite info before user authenticates
 * 
 * @param shortId - The short invite ID from the URL
 * @returns Promise<UniversalInviteDetails>
 */
export async function getInviteDetails(shortId: string): Promise<UniversalInviteDetails> {
  console.log(`[InviteService] Fetching invite details for: ${shortId}`);
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/invites/details?shortId=${encodeURIComponent(shortId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new InviteAPIError(
          'Invite not found or invalid.',
          404,
          'INVITE_NOT_FOUND'
        );
      }
      if (response.status === 410) {
        throw new InviteAPIError(
          'This invite has expired.',
          410,
          'INVITE_EXPIRED'
        );
      }
      throw new InviteAPIError(
        data.message || 'Failed to fetch invite details',
        response.status,
        data.errorCode
      );
    }

    console.log(`[InviteService] ✅ Fetched invite details for: ${shortId}`);
    return data as UniversalInviteDetails;
  } catch (error) {
    if (error instanceof InviteAPIError) {
      throw error;
    }
    console.error('[InviteService] ❌ Error fetching invite details:', error);
    throw new InviteAPIError(
      'Failed to load invite details. Please check your connection and try again.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Claim an invite for the current user
 * Must be called after user is authenticated
 * State: pending → claimed
 * 
 * @param shortId - The short invite ID
 * @param userId - Current authenticated user's ID
 * @returns Promise<ClaimInviteResponse>
 */
export async function claimInvite(
  shortId: string,
  userId: string
): Promise<ClaimInviteResponse> {
  console.log(`[InviteService] Claiming invite: ${shortId} for user: ${userId}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/invites/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortId,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        if (data.alreadyClaimedByYou) {
          // Already claimed by current user - this is fine
          console.log(`[InviteService] Invite already claimed by current user`);
          return {
            success: true,
            message: 'Invite already claimed',
            claimedAt: data.claimedAt,
            shortId,
          };
        }
        throw new InviteAPIError(
          'This invite has already been claimed by someone else.',
          409,
          'INVITE_ALREADY_CLAIMED'
        );
      }
      if (response.status === 404) {
        throw new InviteAPIError(
          'Invite not found or invalid.',
          404,
          'INVITE_NOT_FOUND'
        );
      }
      if (response.status === 410) {
        throw new InviteAPIError(
          'This invite has expired.',
          410,
          'INVITE_EXPIRED'
        );
      }
      throw new InviteAPIError(
        data.message || 'Failed to claim invite',
        response.status,
        data.errorCode
      );
    }

    console.log(`[InviteService] ✅ Claimed invite: ${shortId}`);
    return data as ClaimInviteResponse;
  } catch (error) {
    if (error instanceof InviteAPIError) {
      throw error;
    }
    console.error('[InviteService] ❌ Error claiming invite:', error);
    throw new InviteAPIError(
      'Failed to claim invite. Please try again.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Accept an invite and create membership
 * Must be called after claimInvite succeeds
 * State: claimed → accepted
 * Server creates the membership record
 * 
 * @param shortId - The short invite ID
 * @param userId - Current authenticated user's ID
 * @returns Promise<AcceptInviteResponse>
 */
export async function acceptInvite(
  shortId: string,
  userId: string
): Promise<AcceptInviteResponse> {
  console.log(`[InviteService] Accepting invite: ${shortId} for user: ${userId}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/invites/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortId,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        if (data.alreadyMember) {
          throw new InviteAPIError(
            'You are already a member of this team.',
            409,
            'ALREADY_MEMBER'
          );
        }
        if (data.notClaimed) {
          throw new InviteAPIError(
            'You must claim this invite before accepting it.',
            409,
            'NOT_CLAIMED'
          );
        }
        if (data.claimedByOther) {
          throw new InviteAPIError(
            'This invite was claimed by a different user.',
            409,
            'CLAIMED_BY_OTHER'
          );
        }
      }
      if (response.status === 404) {
        throw new InviteAPIError(
          'Invite not found or invalid.',
          404,
          'INVITE_NOT_FOUND'
        );
      }
      if (response.status === 410) {
        throw new InviteAPIError(
          'This invite has expired.',
          410,
          'INVITE_EXPIRED'
        );
      }
      throw new InviteAPIError(
        data.message || 'Failed to accept invite',
        response.status,
        data.errorCode
      );
    }

    console.log(`[InviteService] ✅ Accepted invite: ${shortId}, membership: ${data.membershipId}`);
    return data as AcceptInviteResponse;
  } catch (error) {
    if (error instanceof InviteAPIError) {
      throw error;
    }
    console.error('[InviteService] ❌ Error accepting invite:', error);
    throw new InviteAPIError(
      'Failed to accept invite. Please try again.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Complete the full invite flow: claim then accept
 * Helper method for convenience
 * 
 * @param shortId - The short invite ID
 * @param userId - Current authenticated user's ID
 * @returns Promise<AcceptInviteResponse>
 */
export async function completeInviteFlow(
  shortId: string,
  userId: string
): Promise<AcceptInviteResponse> {
  console.log(`[InviteService] Starting complete invite flow for: ${shortId}`);
  
  try {
    // Step 1: Claim the invite
    await claimInvite(shortId, userId);
    
    // Step 2: Accept the invite
    const result = await acceptInvite(shortId, userId);
    
    console.log(`[InviteService] ✅ Completed invite flow for: ${shortId}`);
    return result;
  } catch (error) {
    console.error('[InviteService] ❌ Error in complete invite flow:', error);
    throw error;
  }
}

/**
 * Get a user-friendly error message for invite errors
 * 
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getInviteErrorMessage(error: any): string {
  if (error instanceof InviteAPIError) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an invite is in a claimable state
 * 
 * @param status - The invite status
 * @returns boolean indicating if invite can be claimed
 */
export function isInviteClaimable(status: string): boolean {
  return status === 'pending';
}

/**
 * Check if an invite is in an acceptable state
 * 
 * @param status - The invite status
 * @param claimedBy - User ID who claimed the invite
 * @param currentUserId - Current user's ID
 * @returns boolean indicating if invite can be accepted
 */
export function isInviteAcceptable(
  status: string,
  claimedBy: string | undefined,
  currentUserId: string
): boolean {
  return status === 'claimed' && claimedBy === currentUserId;
}

// ==========================================
// INVITE SESSION MANAGEMENT (Install-Safe Resume)
// ==========================================

/**
 * Invite Session - Tracks invite clicks for install-safe resume
 * 
 * When a user clicks an invite link in a browser but doesn't have the app,
 * the web app creates an invite session with the deviceId.
 * 
 * Later, when the app is installed and launched, it checks for pending
 * invite sessions and can resume the invite flow.
 */

/**
 * Invite Session data structure
 */
export interface InviteSession {
  sessionId: string;
  deviceId: string;
  shortId: string;
  status: 'pending' | 'claimed' | 'accepted' | 'expired';
  inviterName: string;
  organizationName: string;
  teamName: string;
  email?: string; // Email of the invited user (if known)
  createdAt: string;
  expiresAt: string;
  claimedBy?: string;
  claimedAt?: string;
  acceptedAt?: string;
}

/**
 * Response from GET /api/invites/session
 */
export interface InviteSessionResponse {
  hasSession: boolean;
  session?: InviteSession;
  message?: string;
}

/**
 * Maximum age of an invite session to be considered valid (7 days in milliseconds)
 */
export const INVITE_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if an invite session is still valid (not expired)
 * 
 * @param session - The invite session to check
 * @returns boolean - True if session is valid and not expired
 */
export function isInviteSessionValid(session: InviteSession): boolean {
  // Check if session is already accepted
  if (session.status === 'accepted') {
    console.log('[InviteService] Session already accepted');
    return false;
  }
  
  // Check if session is expired
  if (session.status === 'expired') {
    console.log('[InviteService] Session status is expired');
    return false;
  }
  
  // Check if session is older than 7 days
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  if (sessionAge > INVITE_SESSION_MAX_AGE) {
    console.log('[InviteService] Session expired (older than 7 days)');
    return false;
  }
  
  // Check explicit expiration date
  if (new Date(session.expiresAt) < new Date()) {
    console.log('[InviteService] Session passed expiration date');
    return false;
  }
  
  return true;
}

/**
 * Check for pending invite session by deviceId
 * Called on app launch to resume install-safe invites
 * 
 * @param deviceId - The device identifier
 * @returns Promise<InviteSessionResponse> - Session data if found
 */
export async function checkInviteSession(
  deviceId: string
): Promise<InviteSessionResponse> {
  console.log(`[InviteService] Checking for invite session with deviceId: ${deviceId.substring(0, 8)}...`);
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/invites/session?deviceId=${encodeURIComponent(deviceId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        // No session found - this is normal
        console.log('[InviteService] No pending invite session found');
        return {
          hasSession: false,
          message: 'No pending invite session',
        };
      }
      
      throw new InviteAPIError(
        data.message || 'Failed to check invite session',
        response.status,
        data.errorCode
      );
    }

    // Validate session if found
    if (data.session) {
      const session = data.session as InviteSession;
      
      if (!isInviteSessionValid(session)) {
        console.log('[InviteService] Session found but not valid');
        return {
          hasSession: false,
          session,
          message: 'Session expired or already used',
        };
      }
      
      console.log(`[InviteService] ✅ Found valid invite session: ${session.shortId}`);
      return {
        hasSession: true,
        session,
      };
    }

    return {
      hasSession: false,
      message: 'No session data',
    };
  } catch (error) {
    if (error instanceof InviteAPIError) {
      throw error;
    }
    console.error('[InviteService] ❌ Error checking invite session:', error);
    throw new InviteAPIError(
      'Failed to check for invite sessions. Please try again.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Resume an invite from a session
 * This is a convenience method that:
 * 1. Fetches the latest invite details using the shortId from session
 * 2. Returns the invite details for display
 * 
 * @param session - The invite session to resume
 * @returns Promise<UniversalInviteDetails>
 */
export async function resumeInviteFromSession(
  session: InviteSession
): Promise<UniversalInviteDetails> {
  console.log(`[InviteService] Resuming invite from session: ${session.shortId}`);
  
  // Get the latest invite details
  const inviteDetails = await getInviteDetails(session.shortId);
  
  // The session may have older data, so we use the fresh invite details
  // but keep any session-specific info (like email if pre-filled)
  console.log(`[InviteService] ✅ Resumed invite: ${inviteDetails.teamName} by ${inviteDetails.inviterName}`);
  
  return inviteDetails;
}

/**
 * Complete invite flow from session
 * Combines session check + claim + accept in one operation
 * Used when user is already authenticated and we want to auto-accept
 * 
 * @param deviceId - Device identifier
 * @param userId - Current authenticated user's ID
 * @returns Promise<AcceptInviteResponse | null> - Null if no valid session
 */
export async function completeInviteFromSession(
  deviceId: string,
  userId: string
): Promise<AcceptInviteResponse | null> {
  console.log(`[InviteService] Attempting to complete invite from session`);
  
  try {
    // Check for session
    const sessionResponse = await checkInviteSession(deviceId);
    
    if (!sessionResponse.hasSession || !sessionResponse.session) {
      console.log('[InviteService] No valid session to complete');
      return null;
    }
    
    const session = sessionResponse.session;
    
    // Check if already claimed by someone else
    if (session.claimedBy && session.claimedBy !== userId) {
      throw new InviteAPIError(
        'This invite was claimed by a different user',
        409,
        'CLAIMED_BY_OTHER'
      );
    }
    
    // Complete the invite flow
    const result = await completeInviteFlow(session.shortId, userId);
    
    console.log(`[InviteService] ✅ Completed invite from session: ${result.membershipId}`);
    return result;
  } catch (error) {
    console.error('[InviteService] ❌ Error completing invite from session:', error);
    throw error;
  }
}
