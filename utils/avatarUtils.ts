/**
 * Utility functions for avatar generation and color management
 */

/**
 * Generate a consistent background color based on a string (like username)
 * @param str - The string to generate a color from
 * @returns HSL color string
 */
export const generateAvatarColor = (str: string): string => {
  if (!str || !str.trim()) {
    return 'hsl(200, 50%, 50%)'; // Default blue color
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to a color using HSL for better consistency
  const hue = Math.abs(hash) % 360;
  const saturation = 70 + (Math.abs(hash) % 20); // 70-90% saturation
  const lightness = 45 + (Math.abs(hash) % 20); // 45-65% lightness
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Generate initials from a full name
 * @param fullName - The full name to extract initials from
 * @returns String of initials (1-2 characters)
 */
export const generateInitials = (fullName: string): string => {
  if (!fullName || !fullName.trim()) {
    return '?';
  }
  
  const names = fullName.trim().split(' ').filter(name => name.length > 0);
  
  if (names.length === 0) {
    return '?';
  }
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  // Take first letter of first and last name
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Validate if a color string is a valid hex color
 * @param color - The color string to validate
 * @returns Boolean indicating if the color is valid
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Convert RGB color to hex format
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
