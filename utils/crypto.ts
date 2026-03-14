/**
 * Crypto utilities for secure token generation and hashing
 * 
 * Uses expo-crypto for React Native compatibility
 */

import * as ExpoCrypto from 'expo-crypto';

/**
 * Generate a cryptographically secure random token
 * 
 * Uses ExpoCrypto.getRandomBytes() which provides cryptographically secure random bytes.
 * 
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = ExpoCrypto.getRandomBytes(length);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, length * 2);
}

/**
 * Hash a token using SHA-256
 * 
 * @param token - Token to hash
 * @returns Hex-encoded hash string (64 characters)
 */
export async function hashToken(token: string): Promise<string> {
  const hash = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    token
  );
  return hash;
}

/**
 * Generate a short invitation code (6 characters)
 * Useful for manual entry scenarios
 * 
 * @returns Short code string (uppercase letters and numbers, excluding similar chars)
 */
export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters: 0, O, 1, I
  let code = '';
  
  const array = ExpoCrypto.getRandomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  
  return code;
}

/**
 * Verify a token against its hash
 * 
 * @param token - Plain text token
 * @param hash - Stored hash
 * @returns Boolean indicating match
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  const computedHash = await hashToken(token);
  return computedHash === hash;
}

/**
 * Generate a UUID v4 (random)
 * Useful for generating unique IDs when Appwrite's ID.unique() isn't available
 * 
 * @returns UUID string
 */
export function generateUUID(): string {
  const array = ExpoCrypto.getRandomBytes(16);
  
  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0'));
  
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}
