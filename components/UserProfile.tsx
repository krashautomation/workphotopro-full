import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Avatar from './Avatar';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from './IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '@/lib/appwrite/client';
import { ID } from 'react-native-appwrite';
import { appwriteConfig } from '@/utils/appwrite';

interface UserProfileProps {
  /** Show edit button */
  showEditButton?: boolean;
  /** Size of the profile picture */
  size?: number;
  /** Show user name below avatar */
  showName?: boolean;
  /** Custom onPress handler */
  onPress?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  showEditButton = false,
  size = 80,
  showName = true,
  onPress,
}) => {
  const { user, getUserProfilePicture, getGoogleUserData, updateUserProfilePicture } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [picture, data] = await Promise.all([
        getUserProfilePicture(),
        getGoogleUserData(),
      ]);
      setProfilePicture(picture);
      setGoogleData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploading(true);
      
      console.log('🔄 Starting avatar upload...');
      console.log('🔄 Image URI:', imageUri);
      console.log('🔄 User ID:', user?.$id);
      console.log('🔄 Bucket ID:', appwriteConfig.bucket);
      
      // Use the same upload logic as the working [job].tsx
      if (!appwriteConfig.bucket) {
        Alert.alert('Configuration Error', 'Bucket ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file.');
        return;
      }

      if (!user?.$id) {
        Alert.alert('Authentication Error', 'User not authenticated. Please sign in again.');
        return;
      }

      // Create a unique file ID
      const fileId = ID.unique();

      // Create a file object from the image URI (same as [job].tsx)
      const filename = `avatar-${user.$id}-${Date.now()}.jpg`;
      
      // Fetch the image and create a proper file object
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create file object for React Native Appwrite
      const file = {
        uri: imageUri,
        name: filename,
        type: blob.type || 'image/jpeg',
        size: blob.size,
      };

      console.log('🔄 Uploading to storage bucket...');

      // Upload to Appwrite Storage
      const uploadResponse = await storage.createFile(
        appwriteConfig.bucket,
        fileId,
        file
      );

      console.log('🔄 Upload response:', uploadResponse);

      // Check if response is valid (same as [job].tsx)
      if (!uploadResponse || !uploadResponse.$id) {
        throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
      }

      // Get the file URL (same as [job].tsx)
      const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

      console.log('🔄 Generated public file URL:', fileUrl);

      // Update user profile picture with the public URL
      console.log('🔄 Updating user profile picture...');
      await updateUserProfilePicture(fileUrl);
      
      // Refresh the profile picture
      setProfilePicture(fileUrl);
      
      console.log('✅ Avatar upload completed successfully');
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      Alert.alert('Error', `Failed to upload profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await updateUserProfilePicture('');
      setProfilePicture(null);
      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    }
  };

  const handleEditProfile = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      { 
        text: 'Take Photo', 
        onPress: () => pickImage('camera')
      },
      { 
        text: 'Choose from Library', 
        onPress: () => pickImage('library')
      },
    ];

    // Add remove option if there's a profile picture
    if (profilePicture) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive' as const,
        onPress: removeAvatar
      });
    }

    Alert.alert(
      'Update Profile Picture',
      'Choose how you want to update your profile picture',
      options
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload profile pictures.');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.granted === false) {
          Alert.alert('Permission Required', 'Please allow camera access to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const displayName = googleData?.googleName || googleData?.firstName || user?.name || 'User';
  const userEmail = googleData?.googleEmail || user?.email || '';

  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          name={displayName}
          imageUrl={profilePicture || undefined}
          size={size}
          style={styles.avatar}
        />
        
        {showEditButton && (
          <Pressable
            style={[styles.editButton, { width: size * 0.3, height: size * 0.3 }]}
            onPress={handleEditProfile}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.White} size={size * 0.15} />
            ) : (
              <IconSymbol name="pencil" color={Colors.White} size={size * 0.15} />
            )}
          </Pressable>
        )}
      </View>

      {showName && (
        <View style={styles.nameContainer}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          {userEmail && (
            <Text style={styles.email} numberOfLines={1}>
              {userEmail}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    // Additional avatar styles if needed
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.Primary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.White,
  },
  nameContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.Text,
    textAlign: 'center',
  },
  email: {
    fontSize: 12,
    color: Colors.Gray,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default UserProfile;
