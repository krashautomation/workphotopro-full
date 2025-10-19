import { avatars } from './client';

export const avatarService = {
  /**
   * Get user initials avatar from Appwrite
   * @param name - User's full name (optional, defaults to current user)
   * @param width - Image width (optional, defaults to 100)
   * @param height - Image height (optional, defaults to 100)
   * @param background - Background color (optional, random if not provided)
   */
  async getInitialsAvatar(name?: string, width: number = 100, height: number = 100, background?: string) {
    try {
      // Validate name parameter
      const validName = name && name.trim() ? name.trim() : '';
      
      // Validate background color
      let validBackground = background;
      if (background && !background.match(/^#[0-9A-F]{6}$/i)) {
        validBackground = undefined;
      }
      
      const avatarUrl = avatars.getInitials({
        name: validName,
        width,
        height,
        background: validBackground || '',
      });
      return avatarUrl.toString();
    } catch (error) {
      console.error('Error getting initials avatar:', error);
      throw error;
    }
  },

  /**
   * Get browser icon from Appwrite
   * @param code - Browser code
   * @param width - Image width (optional, defaults to 100)
   * @param height - Image height (optional, defaults to 100)
   */
  async getBrowserIcon(code: string, width: number = 100, height: number = 100) {
    try {
      const iconUrl = avatars.getBrowser({
        code,
        width,
        height,
      });
      return iconUrl.toString();
    } catch (error) {
      console.error('Error getting browser icon:', error);
      throw error;
    }
  },

  /**
   * Get country flag from Appwrite
   * @param code - Country code (ISO Alpha-2)
   * @param width - Image width (optional, defaults to 100)
   * @param height - Image height (optional, defaults to 100)
   */
  async getFlag(code: string, width: number = 100, height: number = 100) {
    try {
      const flagUrl = avatars.getFlag({
        code,
        width,
        height,
      });
      return flagUrl.toString();
    } catch (error) {
      console.error('Error getting flag:', error);
      throw error;
    }
  },

  /**
   * Get favicon from Appwrite
   * @param url - Website URL
   */
  async getFavicon(url: string) {
    try {
      const faviconUrl = avatars.getFavicon({
        url,
      });
      return faviconUrl.toString();
    } catch (error) {
      console.error('Error getting favicon:', error);
      throw error;
    }
  },

  /**
   * Get QR code from Appwrite
   * @param text - Text to encode
   * @param size - QR code size (optional, defaults to 400)
   * @param margin - Margin from edge (optional, defaults to 1)
   */
  async getQRCode(text: string, size: number = 400, margin: number = 1) {
    try {
      const qrUrl = avatars.getQR({
        text,
        size,
        margin,
      });
      return qrUrl.toString();
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  },

  /**
   * Get image from URL with Appwrite processing
   * @param url - Image URL to process
   * @param width - Resize width (optional, defaults to 400)
   * @param height - Resize height (optional, defaults to 400)
   */
  async getImageFromUrl(url: string, width: number = 400, height: number = 400) {
    try {
      const imageUrl = avatars.getImage({
        url,
        width,
        height,
      });
      return imageUrl.toString();
    } catch (error) {
      console.error('Error getting image from URL:', error);
      throw error;
    }
  },
};
