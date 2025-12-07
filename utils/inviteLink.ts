/**
 * Get or create an invite link for a team
 * First checks for an existing active invite, then creates a new one if none exists
 * This ensures we reuse the same invite link instead of creating multiple links
 * 
 * @param teamId - The team ID to create an invite for
 * @param inviterId - The user ID of the person creating the invite
 * @returns Promise<string> - The short invite link (e.g., https://web.workphotopro.com/links/AbC123)
 */
export async function generateInviteLink(teamId: string, inviterId: string): Promise<string> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_WEB_API_URL || 'https://web.workphotopro.com';
    
    // First, try to get existing active invite
    try {
      const getResponse = await fetch(`${apiUrl}/api/invites/get?teamId=${encodeURIComponent(teamId)}&inviterId=${encodeURIComponent(inviterId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (getResponse.ok) {
        const existingData = await getResponse.json();
        if (existingData.success && existingData.shortLink) {
          console.log('✅ Reusing existing invite link');
          return existingData.shortLink;
        }
      }
    } catch (getError) {
      // If get endpoint doesn't exist or fails, continue to create new invite
      console.log('No existing invite found, creating new one');
    }
    
    // If no existing invite found, create a new one
    const response = await fetch(`${apiUrl}/api/invites/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId,
        inviterId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create invite: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.shortLink) {
      console.log('✅ Created new invite link');
      return data.shortLink;
    } else {
      throw new Error('Invalid response from invite API');
    }
  } catch (error) {
    console.error('Error generating invite link:', error);
    throw error;
  }
}

/**
 * Generate a deep link invite (for app-to-app)
 * Format: workphotopro://invite?teamId={id}&token={token}
 * 
 * Note: This is used internally after generating the short link
 * The short link redirects to the full invite URL which triggers the deep link
 */
export function generateDeepInviteLink(teamId: string, token: string): string {
  const scheme = 'workphotopro';
  return `${scheme}://invite?teamId=${teamId}&token=${token}`;
}

