/**
 * Generate an invite link for the current user
 * Format: https://workphotopro.app/invite?code=USER_ID
 * 
 * For production, you may want to:
 * - Use a shorter code/token instead of user ID
 * - Store invite codes in database
 * - Add expiration dates
 * - Track invite usage
 */
export function generateInviteLink(userId: string): string {
  // For now, using simple format with user ID
  // In production, you'd generate a unique invite code
  const baseUrl = 'https://workphotopro.app/invite';
  return `${baseUrl}?code=${userId}`;
}

/**
 * Generate a deep link invite (for app-to-app)
 * Format: workphotopro://invite?code=USER_ID
 */
export function generateDeepInviteLink(userId: string): string {
  const scheme = 'workphotopro';
  return `${scheme}://invite?code=${userId}`;
}

