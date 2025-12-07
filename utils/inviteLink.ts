/**
 * Generate an invite link for a team
 * Calls the web API to create a short link with Base62 encoding
 * 
 * @param teamId - The team ID to create an invite for
 * @param inviterId - The user ID of the person creating the invite
 * @returns Promise<string> - The short invite link (e.g., https://web.workphotopro.com/links/AbC123)
 */
export async function generateInviteLink(teamId: string, inviterId: string): Promise<string> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_WEB_API_URL || 'https://web.workphotopro.com';
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

