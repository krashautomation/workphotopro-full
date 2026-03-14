import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, LogBox } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Input from '@/components/Input';
import { storage } from '@/lib/appwrite/client';
import { ID } from 'react-native-appwrite';
import { appwriteConfig } from '@/utils/appwrite';

// Safe logging function that won't break if console methods are overridden
const safeLog = (...args: any[]) => {
  try {
    if (typeof console !== 'undefined' && console.log) {
      console.log(...args);
    }
  } catch (e) {
    // Silently fail if logging breaks
  }
};

const safeError = (...args: any[]) => {
  try {
    if (typeof console !== 'undefined' && console.error) {
      console.error(...args);
    }
  } catch (e) {
    // Silently fail if logging breaks
  }
};

const safeWarn = (...args: any[]) => {
  try {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(...args);
    }
  } catch (e) {
    // Silently fail if logging breaks
  }
};

export default function EditTeamScreen() {
  // Enable LogBox to show errors
  useEffect(() => {
    try {
      LogBox.ignoreLogs(['customLogHandler']); // Ignore the customLogHandler warning
    } catch (e) {
      // LogBox might not be available
    }
  }, []);

  const { user } = useAuth();
  const { currentTeam, refreshCurrentTeam } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('');
  
  // Use ref to track uploaded photo URL that hasn't been saved yet
  // This prevents useEffect from overwriting it
  const unsavedPhotoUrlRef = useRef<string | null>(null);

  // Load current team data
  useEffect(() => {
    console.log('🔄 EditTeamScreen - useEffect triggered');
    console.log('🔄 EditTeamScreen - currentTeam:', currentTeam ? {
      id: currentTeam.$id,
      teamName: currentTeam.teamName,
      teamPhotoUrl: currentTeam.teamPhotoUrl,
    } : 'null');
    console.log('🔄 EditTeamScreen - Current teamPhotoUrl state:', teamPhotoUrl);
    
    if (currentTeam) {
      const teamData = {
        teamName: currentTeam.teamName || '',
        email: currentTeam.email || '',
        website: currentTeam.website || '',
        address: currentTeam.address || '',
        phone: currentTeam.phone || '',
        description: currentTeam.description || '',
        teamPhotoUrl: currentTeam.teamPhotoUrl || '',
      };
      
      console.log('🔄 EditTeamScreen - Loading team data:', teamData);
      console.log('🔄 EditTeamScreen - teamPhotoUrl from DB:', teamData.teamPhotoUrl);
      console.log('🔄 EditTeamScreen - teamPhotoUrl from state:', teamPhotoUrl);
      
      // Check if we have an unsaved photo URL that should be preserved
      const hasUnsavedPhoto = unsavedPhotoUrlRef.current && unsavedPhotoUrlRef.current.length > 0;
      const shouldUpdatePhotoUrl = !hasUnsavedPhoto && (!teamPhotoUrl || teamPhotoUrl === teamData.teamPhotoUrl);
      
      setTeamName(teamData.teamName);
      setEmail(teamData.email);
      setWebsite(teamData.website);
      setAddress(teamData.address);
      setPhone(teamData.phone);
      setDescription(teamData.description);
      
      if (shouldUpdatePhotoUrl) {
        console.log('🔄 EditTeamScreen - Updating teamPhotoUrl from DB');
        setTeamPhotoUrl(teamData.teamPhotoUrl);
        unsavedPhotoUrlRef.current = null; // Clear ref since we're loading from DB
      } else if (hasUnsavedPhoto) {
        console.log('🔄 EditTeamScreen - Preserving unsaved photo URL from ref');
        console.log('🔄 EditTeamScreen - Unsaved value:', unsavedPhotoUrlRef.current);
        setTeamPhotoUrl(unsavedPhotoUrlRef.current);
      } else {
        console.log('🔄 EditTeamScreen - Preserving local teamPhotoUrl state (uploaded but not saved)');
        console.log('🔄 EditTeamScreen - Local value:', teamPhotoUrl);
      }
      
      console.log('✅ EditTeamScreen - Team data loaded successfully');
    } else {
      console.warn('⚠️ EditTeamScreen - No currentTeam available');
    }
  }, [currentTeam]);

  const handleSave = async () => {
    try {
      console.log('💾 EditTeamScreen - handleSave called');
      setSaving(true);
      
      console.log('💾 EditTeamScreen - Form state:', {
        teamName: teamName.trim(),
        email: email.trim() || '(empty)',
        phone: phone.trim() || '(empty)',
        website: website.trim() || '(empty)',
        address: address.trim() || '(empty)',
        description: description.trim() || '(empty)',
        teamPhotoUrl: teamPhotoUrl || '(empty)',
      });
      
      if (!teamName.trim()) {
        console.error('❌ EditTeamScreen - Validation failed: Team name is required');
        Alert.alert('Error', 'Team name is required');
        setSaving(false);
        return;
      }

      if (!currentTeam) {
        console.error('❌ EditTeamScreen - Validation failed: No team selected');
        console.error('❌ EditTeamScreen - currentTeam:', currentTeam);
        Alert.alert('Error', 'No team selected');
        setSaving(false);
        return;
      }

      safeLog('💾 EditTeamScreen - Preparing update data...');
      // Check both state and ref for photo URL (ref takes priority as it's the source of truth for unsaved photos)
      const photoUrlToSave = unsavedPhotoUrlRef.current || teamPhotoUrl;
      
      safeLog('💾 EditTeamScreen - teamPhotoUrl state value:', teamPhotoUrl);
      safeLog('💾 EditTeamScreen - unsavedPhotoUrlRef value:', unsavedPhotoUrlRef.current);
      safeLog('💾 EditTeamScreen - photoUrlToSave (final):', photoUrlToSave);
      safeLog('💾 EditTeamScreen - photoUrlToSave type:', typeof photoUrlToSave);
      safeLog('💾 EditTeamScreen - photoUrlToSave length:', photoUrlToSave?.length);
      safeLog('💾 EditTeamScreen - photoUrlToSave truthy check:', !!photoUrlToSave);
      
      // Ensure teamPhotoUrl is included if it exists (even if empty string, we want to save it)
      const updateData: any = {
        name: teamName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        description: description.trim() || undefined,
      };
      
      // Always include teamPhotoUrl if it exists (don't convert empty string to undefined)
      // Check if photoUrlToSave has a value (not undefined, not null, not empty string)
      if (photoUrlToSave && typeof photoUrlToSave === 'string' && photoUrlToSave.trim().length > 0) {
        const trimmedUrl = photoUrlToSave.trim();
        updateData.teamPhotoUrl = trimmedUrl;
        safeLog('✅ EditTeamScreen - Including teamPhotoUrl in update:', trimmedUrl);
        safeLog('✅ EditTeamScreen - teamPhotoUrl will be saved to database');
        safeLog('✅ EditTeamScreen - Source:', unsavedPhotoUrlRef.current ? 'ref' : 'state');
      } else if (photoUrlToSave === '') {
        // If explicitly empty string, set to null to clear the photo
        updateData.teamPhotoUrl = null;
        safeLog('🔄 EditTeamScreen - Clearing teamPhotoUrl (empty string -> null)');
      } else {
        safeLog('⚠️ EditTeamScreen - photoUrlToSave is undefined/null/empty, not updating field');
        safeLog('⚠️ EditTeamScreen - photoUrlToSave value:', photoUrlToSave);
        safeLog('⚠️ EditTeamScreen - This means the photo URL was not set');
        safeLog('⚠️ EditTeamScreen - State value:', teamPhotoUrl);
        safeLog('⚠️ EditTeamScreen - Ref value:', unsavedPhotoUrlRef.current);
      }
      
      safeLog('💾 EditTeamScreen - Final update data:', JSON.stringify(updateData, null, 2));
      safeLog('💾 EditTeamScreen - Update data.teamPhotoUrl:', updateData.teamPhotoUrl);
      safeLog('💾 EditTeamScreen - Update data keys:', Object.keys(updateData));
      safeLog('💾 EditTeamScreen - Has teamPhotoUrl in updateData:', 'teamPhotoUrl' in updateData);
      safeLog('💾 EditTeamScreen - Team ID:', currentTeam.$id);

      // Update team using the team service
      safeLog('💾 EditTeamScreen - Calling teamService.updateTeamDetails...');
      safeLog('💾 EditTeamScreen - updateData being sent:', JSON.stringify(updateData, null, 2));
      await teamService.updateTeamDetails(currentTeam.$id, updateData);
      safeLog('✅ EditTeamScreen - Team details updated successfully');
      
      // Clear the unsaved photo ref since we just saved it
      if (unsavedPhotoUrlRef.current) {
        safeLog('🔄 EditTeamScreen - Clearing unsaved photo ref (photo was saved)');
        unsavedPhotoUrlRef.current = null;
      }

      // Refresh the current team data in the context
      safeLog('🔄 EditTeamScreen - Refreshing current team data...');
      await refreshCurrentTeam();
      safeLog('✅ EditTeamScreen - Current team data refreshed');

      console.log('✅ EditTeamScreen - Save operation completed successfully');
      Alert.alert(
        'Success',
        'Team updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🔄 EditTeamScreen - Navigating back...');
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ EditTeamScreen - Error updating team:', error);
      console.error('❌ EditTeamScreen - Error type:', typeof error);
      console.error('❌ EditTeamScreen - Error message:', error?.message);
      console.error('❌ EditTeamScreen - Error stack:', error?.stack);
      console.error('❌ EditTeamScreen - Error details:', {
        name: error?.name,
        code: error?.code,
        type: error?.type,
        response: error?.response,
        toString: error?.toString(),
      });
      Alert.alert('Error', 'Failed to update team. Please try again.');
    } finally {
      console.log('🔄 EditTeamScreen - Setting saving to false');
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('📷 EditTeamScreen - pickImage called');
      console.log('📷 EditTeamScreen - Requesting media library permissions...');
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📷 EditTeamScreen - Permission result:', {
        granted: permissionResult.granted,
        status: permissionResult.status,
        canAskAgain: permissionResult.canAskAgain,
      });
      
      if (permissionResult.granted === false) {
        console.error('❌ EditTeamScreen - Permission denied:', permissionResult);
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload team photo.');
        return;
      }

      console.log('📷 EditTeamScreen - Permission granted, configuring image picker...');
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for team photo
        quality: 0.8,
      };
      console.log('📷 EditTeamScreen - Image picker options:', options);

      console.log('📷 EditTeamScreen - Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync(options);
      console.log('📷 EditTeamScreen - Image picker result:', {
        canceled: result.canceled,
        assetsCount: result.assets?.length || 0,
        firstAsset: result.assets?.[0] ? {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type,
          fileSize: result.assets[0].fileSize,
        } : null,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 EditTeamScreen - Image selected, starting upload...');
        await uploadTeamPhoto(result.assets[0].uri);
      } else {
        console.log('📷 EditTeamScreen - Image picker canceled or no asset selected');
      }
    } catch (error: any) {
      console.error('❌ EditTeamScreen - Error picking image:', error);
      console.error('❌ EditTeamScreen - Error type:', typeof error);
      console.error('❌ EditTeamScreen - Error message:', error?.message);
      console.error('❌ EditTeamScreen - Error stack:', error?.stack);
      console.error('❌ EditTeamScreen - Error details:', {
        name: error?.name,
        code: error?.code,
        type: error?.type,
        toString: error?.toString(),
      });
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadTeamPhoto = async (imageUri: string) => {
    let errorOccurred = false;
    let errorDetails: any = null;
    
    // Clear any previous errors
    setUploadError(null);
    
    try {
      safeLog('📤 EditTeamScreen - uploadTeamPhoto called');
      safeLog('📤 EditTeamScreen - Image URI:', imageUri);
      setUploadingPhoto(true);
      
      console.log('📤 EditTeamScreen - Appwrite config:', {
        bucket: appwriteConfig.bucket,
        endpoint: appwriteConfig.endpoint,
        projectId: appwriteConfig.projectId,
        hasBucket: !!appwriteConfig.bucket,
      });
      
      if (!appwriteConfig.bucket) {
        console.error('❌ EditTeamScreen - Bucket ID not configured');
        console.error('❌ EditTeamScreen - appwriteConfig:', appwriteConfig);
        Alert.alert(
          'Configuration Error', 
          'Bucket ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file and restart the app.'
        );
        return;
      }

      if (!currentTeam?.$id) {
        console.error('❌ EditTeamScreen - Team ID not found');
        console.error('❌ EditTeamScreen - currentTeam:', currentTeam);
        Alert.alert('Error', 'Team ID not found');
        return;
      }

      // Create a unique file ID
      const fileId = ID.unique();
      const filename = `team-photo-${currentTeam.$id}-${Date.now()}.jpg`;
      console.log('📤 EditTeamScreen - Generated file ID:', fileId);
      console.log('📤 EditTeamScreen - Generated filename:', filename);
      
      console.log('📤 EditTeamScreen - Fetching image blob from URI...');
      console.log('📤 EditTeamScreen - Fetching:', imageUri);
      
      // Fetch the image and create a proper file object
      const response = await fetch(imageUri);
      console.log('📤 EditTeamScreen - Fetch response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📤 EditTeamScreen - Blob created:', {
        type: blob.type,
        size: blob.size,
        sizeMB: (blob.size / 1024 / 1024).toFixed(2),
      });
      
      // Create file object for React Native Appwrite
      const file = {
        uri: imageUri,
        name: filename,
        type: blob.type || 'image/jpeg',
        size: blob.size,
      };

      console.log('📤 EditTeamScreen - File object created:', {
        fileId,
        filename: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        uri: file.uri.substring(0, 50) + '...',
      });

      console.log('📤 EditTeamScreen - Uploading to storage bucket...');
      console.log('📤 EditTeamScreen - Storage params:', {
        bucketId: appwriteConfig.bucket,
        fileId,
        fileName: file.name,
      });

      // Upload to Appwrite Storage
      const uploadResponse = await storage.createFile(
        appwriteConfig.bucket,
        fileId,
        file
      );

      console.log('📤 EditTeamScreen - Upload response received:', {
        $id: uploadResponse?.$id,
        $createdAt: uploadResponse?.$createdAt,
        name: uploadResponse?.name,
        mimeType: uploadResponse?.mimeType,
        sizeOriginal: uploadResponse?.sizeOriginal,
        responseKeys: uploadResponse ? Object.keys(uploadResponse) : [],
      });

      // Check if response is valid
      if (!uploadResponse || !uploadResponse.$id) {
        console.error('❌ EditTeamScreen - Invalid upload response:', uploadResponse);
        throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
      }

      // Get the file URL
      const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;
      console.log('📤 EditTeamScreen - Generated file URL:', fileUrl);

      console.log('✅ EditTeamScreen - Team photo uploaded successfully');
      console.log('✅ EditTeamScreen - File details:', {
        fileId: uploadResponse.$id,
        fileUrl,
        size: uploadResponse.sizeOriginal,
        mimeType: uploadResponse.mimeType,
      });

      // Update the teamPhotoUrl state and ref
      safeLog('🔄 EditTeamScreen - Updating teamPhotoUrl state...');
      setTeamPhotoUrl(fileUrl);
      unsavedPhotoUrlRef.current = fileUrl; // Store in ref to prevent useEffect from overwriting
      safeLog('✅ EditTeamScreen - teamPhotoUrl state updated');
      safeLog('✅ EditTeamScreen - Unsaved photo URL stored in ref:', fileUrl);
      setUploadError(null); // Clear any errors
      
      // Save the photo URL to database immediately after upload
      safeLog('💾 EditTeamScreen - Saving teamPhotoUrl to database immediately...');
      try {
        if (!currentTeam?.$id) {
          throw new Error('Team ID not found');
        }
        
        await teamService.updateTeamPhotoUrl(currentTeam.$id, fileUrl);
        safeLog('✅ EditTeamScreen - Team photo URL saved to database successfully');
        
        // Refresh team data to get the updated photo URL
        safeLog('🔄 EditTeamScreen - Refreshing team data after photo save...');
        await refreshCurrentTeam();
        safeLog('✅ EditTeamScreen - Team data refreshed');
        
        Alert.alert('Success', 'Team photo uploaded and saved successfully!');
      } catch (saveError: any) {
        safeError('❌ EditTeamScreen - Error saving photo URL to database:', saveError);
        safeError('❌ EditTeamScreen - Photo URL will be saved when you click "Save Changes"');
        // Don't show error alert - photo is uploaded, just not saved to DB yet
        // User can still save it manually by clicking "Save Changes"
        Alert.alert(
          'Photo Uploaded', 
          'Team photo uploaded successfully! The URL will be saved when you click "Save Changes".'
        );
      }
    } catch (error: any) {
      errorOccurred = true;
      errorDetails = error;
      
      // Use safe error logging
      safeError('❌ EditTeamScreen - Error uploading team photo:', error);
      safeError('❌ EditTeamScreen - Error type:', typeof error);
      safeError('❌ EditTeamScreen - Error name:', error?.name);
      safeError('❌ EditTeamScreen - Error message:', error?.message);
      safeError('❌ EditTeamScreen - Error code:', error?.code);
      safeError('❌ EditTeamScreen - Error type (property):', error?.type);
      safeError('❌ EditTeamScreen - Error stack:', error?.stack);
      safeError('❌ EditTeamScreen - Error response:', error?.response);
      
      // Try to stringify error safely
      try {
        safeError('❌ EditTeamScreen - Error toString:', error?.toString());
        safeError('❌ EditTeamScreen - Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (stringifyError) {
        safeError('❌ EditTeamScreen - Could not stringify error:', stringifyError);
      }
      
      // Also show error in alert with details
      const errorMsg = error?.message || String(error) || 'Unknown error';
      safeError('❌ EditTeamScreen - Error message for alert:', errorMsg);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload team photo. ';
      
      if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        safeError('❌ EditTeamScreen - Permission/authorization error detected');
        errorMessage += 'Please check storage bucket permissions in Appwrite Console.';
      } else if (error?.message?.includes('file type') || error?.message?.includes('extension')) {
        safeError('❌ EditTeamScreen - File type error detected');
        errorMessage += 'This file type is not allowed. Please use JPG, PNG, or GIF.';
      } else if (error?.message?.includes('size') || error?.message?.includes('too large')) {
        safeError('❌ EditTeamScreen - File size error detected');
        errorMessage += 'File is too large. Please use an image smaller than 10MB.';
      } else {
        safeError('❌ EditTeamScreen - Unknown error type');
        errorMessage += errorMsg;
      }
      
      safeError('❌ EditTeamScreen - Final error message:', errorMessage);
      
      // Set error state for visual display
      setUploadError(errorMessage);
      
      // Show alert with error details
      Alert.alert(
        'Upload Failed', 
        errorMessage,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Show Details', 
            onPress: () => {
              const details = `Error: ${errorMsg}\n\nType: ${typeof error}\nCode: ${error?.code || 'N/A'}\nName: ${error?.name || 'N/A'}\n\nStack: ${error?.stack?.substring(0, 200) || 'N/A'}`;
              Alert.alert('Error Details', details, [{ text: 'OK' }]);
              // Also log to console
              safeError('❌ Full error details:', details);
            }
          }
        ]
      );
    } finally {
      safeLog('🔄 EditTeamScreen - Setting uploadingPhoto to false');
      setUploadingPhoto(false);
      
      // Log final state
      if (errorOccurred) {
        safeError('❌ EditTeamScreen - Upload completed with error');
        safeError('❌ EditTeamScreen - Error details:', errorDetails);
      } else {
        safeLog('✅ EditTeamScreen - Upload completed successfully');
      }
    }
  };

  const handlePhotoUpload = () => {
    console.log('📷 EditTeamScreen - handlePhotoUpload called');
    console.log('📷 EditTeamScreen - uploadingPhoto state:', uploadingPhoto);
    
    if (uploadingPhoto) {
      console.warn('⚠️ EditTeamScreen - Upload already in progress, ignoring request');
      return;
    }
    
    console.log('📷 EditTeamScreen - Calling pickImage...');
    pickImage();
  };

  if (!currentTeam) {
    console.warn('⚠️ EditTeamScreen - No currentTeam, showing error screen');
    console.warn('⚠️ EditTeamScreen - currentTeam value:', currentTeam);
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Team' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No team selected</Text>
          <Text style={styles.errorSubtext}>
            Please select a team to edit.
          </Text>
          <Pressable 
            style={styles.backButton}
            onPress={() => {
              console.log('🔄 EditTeamScreen - Back button pressed');
              router.back();
            }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Team' }} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {/* Team Photo Section */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Team Photo</Text>
            <View style={styles.photoContainer}>
              {teamPhotoUrl ? (
                <Image 
                  source={{ uri: teamPhotoUrl }} 
                  style={styles.teamPhoto}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <IconSymbol name="photo" size={48} color={Colors.Gray} />
                  <Text style={styles.photoPlaceholderText}>No photo</Text>
                </View>
              )}
              <TouchableOpacity 
                style={[styles.photoButton, uploadingPhoto && styles.photoButtonDisabled]}
                onPress={handlePhotoUpload}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.White} />
                    <Text style={styles.photoButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol name="camera" size={20} color={Colors.White} />
                    <Text style={styles.photoButtonText}>
                      {teamPhotoUrl ? 'Change Photo' : 'Add Photo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {uploadError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{uploadError}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Team Information Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Team Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Team Name *</Text>
              <Input
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Enter team name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter team email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter team phone number"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <Input
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                keyboardType="url"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <Input
                value={address}
                onChangeText={setAddress}
                placeholder="Enter team address"
                multiline={true}
                numberOfLines={2}
                style={[styles.input, styles.textArea]}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Enter team description"
                multiline={true}
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <IconSymbol name="info.circle" color="#007AFF" size={20} />
              <Text style={styles.infoText}>
                You can update your team information here. Fields marked with * are required.
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <Pressable 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.Gray,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.Background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.Gray + '30',
  },
  teamPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: Colors.Gray,
    marginTop: 8,
  },
  photoButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonDisabled: {
    opacity: 0.6,
  },
  photoButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.Background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.Text,
    borderWidth: 1,
    borderColor: Colors.Gray + '60',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.Gray,
  },
  saveButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
  },
});
