// Note: Install expo-crypto if not already installed: npx expo install expo-crypto
import * as Crypto from 'expo-crypto';

/**
 * Normalize phone number by removing all non-digit characters
 * Example: "+1 (555) 123-4567" → "15551234567"
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalize email by lowercasing and trimming
 * Example: "John.Doe@Example.COM" → "john.doe@example.com"
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input
  );
  return hash;
}

/**
 * Hash a phone number
 * Normalizes the phone number first, then hashes it
 */
export async function hashPhoneNumber(phone: string): Promise<string> {
  const normalized = normalizePhoneNumber(phone);
  return hashString(normalized);
}

/**
 * Hash an email address
 * Normalizes the email first, then hashes it
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  return hashString(normalized);
}

/**
 * Get the primary contact hash for a contact
 * Prefers phone hash over email hash (phone is more unique)
 */
export function getContactHash(phoneHash: string | null, emailHash: string | null): string {
  if (phoneHash) return phoneHash;
  if (emailHash) return emailHash;
  throw new Error('Contact must have at least phone or email hash');
}

/**
 * Hash multiple contacts in batch
 * Returns array of { phoneHash, emailHash, contactHash, contactType }
 */
export async function hashContacts(
  contacts: Array<{ phoneNumbers?: Array<{ number: string }>; emails?: Array<{ email: string }> }>
): Promise<Array<{ phoneHash: string | null; emailHash: string | null; contactHash: string; contactType: 'phone' | 'email' }>> {
  const hashedContacts = await Promise.all(
    contacts.map(async (contact) => {
      let phoneHash: string | null = null;
      let emailHash: string | null = null;

      // Hash first phone number if available
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const phone = contact.phoneNumbers[0].number;
        if (phone) {
          phoneHash = await hashPhoneNumber(phone);
        }
      }

      // Hash first email if available
      if (contact.emails && contact.emails.length > 0) {
        const email = contact.emails[0].email;
        if (email) {
          emailHash = await hashEmail(email);
        }
      }

      // Determine contact hash and type
      const contactHash = getContactHash(phoneHash, emailHash);
      const contactType: 'phone' | 'email' = phoneHash ? 'phone' : 'email';

      return {
        phoneHash,
        emailHash,
        contactHash,
        contactType,
      };
    })
  );

  return hashedContacts;
}

