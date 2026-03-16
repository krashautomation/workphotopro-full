/**
 * Device ID Utility
 * 
 * Provides a persistent, unique device identifier for the invite session system.
 * The deviceId is generated once and stored securely using expo-secure-store.
 * This allows invite sessions to be tracked across app installs and resumes.
 * 
 * Usage:
 * ```typescript
 * import { getDeviceId } from '@/utils/deviceId';
 * const deviceId = await getDeviceId();
 * ```
 */

import * as SecureStore from 'expo-secure-store';
import { generateUUID } from './crypto';

const DEVICE_ID_KEY = 'workphotopro_device_id';

/**
 * Get or create a persistent device ID
 * 
 * This function:
 * 1. Checks SecureStore for an existing device ID
 * 2. If not found, generates a new UUID
 * 3. Stores it in SecureStore for persistence
 * 4. Returns the device ID
 * 
 * The device ID persists across:
 * - App restarts
 * - App updates
 * - Device reboots
 * 
 * Note: Will be different after full app reinstall (this is expected behavior)
 * 
 * @returns Promise<string> - The device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (deviceId) {
      console.log('[DeviceId] ✅ Retrieved existing device ID');
      return deviceId;
    }
    
    // Generate new device ID
    deviceId = generateUUID();
    
    // Store it securely
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    
    console.log('[DeviceId] ✅ Generated and stored new device ID');
    return deviceId;
  } catch (error) {
    console.error('[DeviceId] ❌ Error getting device ID:', error);
    
    // Fallback: generate a temporary ID (won't persist, but allows functionality)
    const tempId = generateUUID();
    console.warn('[DeviceId] ⚠️ Using temporary device ID (storage failed)');
    return tempId;
  }
}

/**
 * Reset the device ID
 * Useful for testing or when user wants to clear their device identity
 * 
 * @returns Promise<boolean> - True if reset successful
 */
export async function resetDeviceId(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    console.log('[DeviceId] ✅ Device ID reset');
    return true;
  } catch (error) {
    console.error('[DeviceId] ❌ Error resetting device ID:', error);
    return false;
  }
}

/**
 * Check if a device ID exists
 * 
 * @returns Promise<boolean> - True if device ID exists
 */
export async function hasDeviceId(): Promise<boolean> {
  try {
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    return !!deviceId;
  } catch (error) {
    return false;
  }
}
