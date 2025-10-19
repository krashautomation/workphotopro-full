import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/utils/colors';
import { generateAvatarColor, generateInitials, isValidHexColor } from '@/utils/avatarUtils';

interface AvatarProps {
  /** User's full name for initials fallback */
  name?: string;
  /** URL of user's profile picture (e.g., from Google OAuth) */
  imageUrl?: string;
  /** Size of the avatar */
  size?: number;
  /** Background color for initials avatar (optional, random if not provided) */
  backgroundColor?: string;
  /** Text color for initials */
  textColor?: string;
  /** Additional styles */
  style?: any;
  /** Callback when image fails to load */
  onImageError?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  imageUrl,
  size = 40,
  backgroundColor,
  textColor = Colors.White,
  style,
  onImageError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [initialsAvatarUrl, setInitialsAvatarUrl] = useState<string | null>(null);

  // Use utility function for generating initials
  const getInitials = (fullName: string): string => {
    return generateInitials(fullName);
  };

  // Temporarily disable Appwrite initials avatar to prevent errors
  // TODO: Re-enable once Appwrite validation issues are resolved
  React.useEffect(() => {
    // Skip Appwrite initials for now
    setInitialsAvatarUrl(null);
  }, [name, size, backgroundColor, imageUrl]);

  const handleImageError = () => {
    setImageError(true);
    onImageError?.();
  };

  const avatarStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...style,
  };

  // Show Google profile picture if available and no error
  if (imageUrl && !imageError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={avatarStyles}
        onError={handleImageError}
        resizeMode="cover"
      />
    );
  }

  // Show Appwrite initials avatar if available
  if (initialsAvatarUrl && !imageUrl) {
    return (
      <Image
        source={{ uri: initialsAvatarUrl }}
        style={avatarStyles}
        onError={() => setInitialsAvatarUrl(null)}
        resizeMode="cover"
      />
    );
  }

  // Use utility function for generating background color
  const getBackgroundColor = (userName: string): string => {
    if (backgroundColor && isValidHexColor(backgroundColor)) {
      return backgroundColor;
    }
    
    return generateAvatarColor(userName);
  };

  // Fallback to simple initials
  if (name && name.trim()) {
    const bgColor = getBackgroundColor(name.trim());
    
    return (
      <View
        style={[
          avatarStyles,
          styles.initialsContainer,
          { backgroundColor: bgColor },
        ]}
      >
        <Text
          style={[
            styles.initialsText,
            { color: textColor, fontSize: size * 0.4 },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  }

  // Default fallback
  return (
    <View style={[avatarStyles, styles.defaultContainer]}>
      <Text style={[styles.initialsText, { color: textColor, fontSize: size * 0.4 }]}>
        ?
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Gray,
  },
  initialsText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Avatar;
