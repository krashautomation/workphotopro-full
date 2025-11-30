import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Building2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Input from '@/components/Input';
import { organizationService } from '@/lib/appwrite/teams';
import { useFocusEffect } from 'expo-router';
import { storage } from '@/lib/appwrite/client';
import { ID } from 'react-native-appwrite';
import { appwriteConfig } from '@/utils/appwrite';

export default function EditOrganizationScreen() {
  const { user } = useAuth();
  const { currentOrganization, userOrganizations, createOrganization, loadUserData } = useOrganization();
  
  // Get the user's owned organization (same logic as profile-settings.tsx)
  const profileOrganization = React.useMemo(() => {
    const ownedOrgs = userOrganizations.filter(org => org.ownerId === user?.$id);
    return ownedOrgs[0] || (currentOrganization?.ownerId === user?.$id ? currentOrganization : null);
  }, [userOrganizations, user?.$id, currentOrganization]);
  
  // Use profileOrganization (owned org) for editing, fallback to currentOrganization
  const organizationToEdit = profileOrganization || currentOrganization;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (organizationToEdit) {
        // Editing existing organization - fetch fresh data from database
        console.log('🔄 Loading organization:', currentOrganization.orgName);
        console.log('🔄 Organization logoUrl from context:', currentOrganization.logoUrl);
        
        // Fetch fresh organization data to ensure we have latest logoUrl
        try {
          const freshOrg = await organizationService.getOrganization(organizationToEdit.$id);
          console.log('🔄 Fresh organization logoUrl:', freshOrg?.logoUrl);
          setOrgName(freshOrg.orgName || '');
          setDescription(freshOrg.description || '');
          setLogoUrl(freshOrg.logoUrl || '');
        } catch (error) {
          console.warn('Failed to fetch fresh org data, using context data:', error);
          // Fallback to context data if fetch fails
          setOrgName(organizationToEdit.orgName || '');
          setDescription(organizationToEdit.description || '');
          setLogoUrl(organizationToEdit.logoUrl || '');
        }
        setIsCreating(false);
      } else {
        // No organization exists, will create new one
        setOrgName('');
        setDescription('');
        setLogoUrl('');
        setIsCreating(true);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    console.log('useEffect triggered, currentOrganization:', currentOrganization?.orgName);
    console.log('🔄 Current organization logoUrl:', currentOrganization?.logoUrl);
    loadOrganizationData();
  }, [organizationToEdit, loadOrganizationData]);

  // Refresh data when screen comes into focus (e.g., returning from image picker)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused, reloading organization data');
      loadOrganizationData();
    }, [loadOrganizationData])
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!orgName.trim()) {
        Alert.alert('Error', 'Organization name is required');
        return;
      }

      if (isCreating) {
        // Create new organization using context method
        // Note: createOrganization doesn't support logoUrl yet, so we'll update after creation
        const newOrg = await createOrganization(orgName.trim(), description.trim());
        
        // If logo was uploaded, update the organization with logoUrl
        if (logoUrl && newOrg?.$id) {
          await organizationService.updateOrganization(newOrg.$id, {
            logoUrl: logoUrl.trim()
          });
          await loadUserData();
        }
        
        Alert.alert(
          'Success',
          'Organization created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        // Update existing organization
        if (!organizationToEdit?.$id) {
          Alert.alert('Error', 'Organization ID not found');
          return;
        }

        const updateData: any = {
          orgName: orgName.trim(),
          description: description.trim(),
        };
        
        // Only include logoUrl if it has a value
        if (logoUrl && logoUrl.trim()) {
          updateData.logoUrl = logoUrl.trim();
        } else {
          // Explicitly set to null to clear the logo
          updateData.logoUrl = null;
        }
        
        console.log('🔄 Updating organization with data:', updateData);
        console.log('🔄 Current logoUrl state:', logoUrl);
        console.log('🔄 Organization ID:', organizationToEdit.$id);
        console.log('🔄 Organization name:', organizationToEdit.orgName);
        console.log('🔄 Is owned org:', organizationToEdit.ownerId === user?.$id);
        
        const updatedOrg = await organizationService.updateOrganization(organizationToEdit.$id, updateData);
        
        console.log('🔄 Updated organization response:', updatedOrg);
        console.log('🔄 Updated organization logoUrl:', updatedOrg?.logoUrl);
        
        // Refresh the organization data in context
        await loadUserData();
        
        // Also explicitly refresh organization to ensure logoUrl is loaded
        if (organizationToEdit?.$id) {
          const refreshedOrg = await organizationService.getOrganization(organizationToEdit.$id);
          console.log('🔄 Refreshed organization:', refreshedOrg);
          console.log('🔄 Refreshed organization logoUrl:', refreshedOrg?.logoUrl);
          
          // Update local state with refreshed data to ensure UI updates immediately
          if (refreshedOrg?.logoUrl) {
            setLogoUrl(refreshedOrg.logoUrl);
            console.log('🔄 Updated local logoUrl state from refreshed org');
          }
        }
        
        Alert.alert(
          'Success',
          'Organization updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      Alert.alert('Error', 'Failed to save organization. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  const uploadLogo = async (imageUri: string) => {
    try {
      setUploadingLogo(true);
      
      console.log('🔄 Starting logo upload...');
      console.log('🔄 Image URI:', imageUri);
      console.log('🔄 Bucket ID:', appwriteConfig.bucket);
      
      if (!appwriteConfig.bucket) {
        Alert.alert(
          'Configuration Error', 
          'Bucket ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file and restart the app.'
        );
        return;
      }

      if (!organizationToEdit?.$id && !isCreating) {
        Alert.alert('Error', 'Organization ID not found');
        return;
      }

      // Create a unique file ID
      const fileId = ID.unique();
      const filename = `org-logo-${organizationToEdit?.$id || 'new'}-${Date.now()}.jpg`;
      
      console.log('🔄 Fetching image blob...');
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

      console.log('🔄 Uploading to storage bucket...', { fileId, filename, type: file.type, size: file.size });

      // Upload to Appwrite Storage
      const uploadResponse = await storage.createFile(
        appwriteConfig.bucket,
        fileId,
        file
      );

      console.log('🔄 Upload response:', uploadResponse);

      // Check if response is valid
      if (!uploadResponse || !uploadResponse.$id) {
        throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
      }

      // Get the file URL
      const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

      console.log('✅ Logo uploaded successfully:', fileUrl);

      // Update the logoUrl state
      setLogoUrl(fileUrl);
      
      Alert.alert('Success', 'Logo uploaded successfully! Click "Save Changes" to save it to your organization.');
    } catch (error: any) {
      console.error('❌ Error uploading logo:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload logo. ';
      
      if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        errorMessage += 'Please check storage bucket permissions in Appwrite Console.';
      } else if (error?.message?.includes('file type') || error?.message?.includes('extension')) {
        errorMessage += 'This file type is not allowed. Please use JPG, PNG, or GIF.';
      } else if (error?.message?.includes('size') || error?.message?.includes('too large')) {
        errorMessage += 'File is too large. Please use an image smaller than 10MB.';
      } else {
        errorMessage += error?.message || 'Unknown error occurred.';
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingLogo(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload organization logo.');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for logo
        quality: 0.8,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        await uploadLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleLogoPress = () => {
    if (uploadingLogo) return;
    pickImage();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Organization' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading organization information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: isCreating ? 'Create Organization' : 'Edit Organization'
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Organization Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Organization Name</Text>
              <Input
                value={orgName}
                onChangeText={setOrgName}
                placeholder="Enter organization name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photo Icon</Text>
              <Pressable 
                style={styles.logoContainer}
                onPress={handleLogoPress}
                disabled={uploadingLogo}
              >
                {(() => {
                  console.log('🖼️ Edit Organization - Rendering logo, logoUrl state:', logoUrl);
                  console.log('🖼️ Edit Organization - Current organization logoUrl:', currentOrganization?.logoUrl);
                  return logoUrl ? (
                    <Image
                      source={{ uri: logoUrl }}
                      style={styles.logoPreview}
                      contentFit="cover"
                      onError={(error) => {
                        console.error('🖼️ Edit Organization - Image load error:', error);
                      }}
                      onLoad={() => {
                        console.log('🖼️ Edit Organization - Image loaded successfully');
                      }}
                    />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Building2 size={32} color={Colors.Gray} strokeWidth={2} />
                    </View>
                  );
                })()}
                <View style={styles.editIconOverlay}>
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color={Colors.White} />
                  ) : (
                    <IconSymbol name="pencil" color={Colors.White} size={16} />
                  )}
                </View>
              </Pressable>
              <Text style={styles.inputHint}>
                Tap to upload a logo. Leave empty to use default Building icon.
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Enter organization description"
                multiline={true}
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
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
                {saving ? 'Saving...' : (isCreating ? 'Create Organization' : 'Save Changes')}
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.Text,
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
  formSection: {
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
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
    borderColor: Colors.Gray + '30',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: Colors.Gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: 'relative',
    marginTop: 8,
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.Background,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.Background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.Gray + '30',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.Background,
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
