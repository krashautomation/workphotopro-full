import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Input from '@/components/Input';
import { account } from '@/lib/appwrite/client';

export default function EditAccountScreen() {
  const { user, getGoogleUserData, refreshUser } = useAuth();
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await getGoogleUserData();
      setGoogleData(data);
      
      // Populate form with current data
      setName(data?.googleName || data?.firstName || user?.name || '');
      setEmail(data?.googleEmail || user?.email || '');
      setFirstName(data?.firstName || '');
      setLastName(data?.lastName || '');
      setDescription((user?.prefs as any)?.description || 'Work Photo Pro fan.');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get current user to preserve ALL existing preferences
      const currentUser = await account.get();
      const currentPrefs = currentUser.prefs || {};
      
      // Build updated preferences by merging existing with new values
      // IMPORTANT: We must preserve ALL existing preferences, only updating specific fields
      const updatedPrefs: Record<string, any> = {
        ...currentPrefs, // Start with ALL existing preferences (this preserves everything)
      };
      
      // Only update the fields we're changing
      updatedPrefs.displayName = name;
      if (firstName !== undefined && firstName !== null) {
        updatedPrefs.firstName = firstName;
      }
      if (lastName !== undefined && lastName !== null) {
        updatedPrefs.lastName = lastName;
      }
      updatedPrefs.description = description || 'Work Photo Pro fan.';
      updatedPrefs.nameUpdatedAt = new Date().toISOString();
      
      // Preserve Google data if it exists
      if (googleData?.googleName) {
        updatedPrefs.googleName = googleData.googleName;
      }
      if (googleData?.googleEmail) {
        updatedPrefs.googleEmail = googleData.googleEmail;
      }
      
      // Explicitly ensure profilePicture is preserved (in case it got lost)
      if (currentPrefs.profilePicture) {
        updatedPrefs.profilePicture = currentPrefs.profilePicture;
      }
      if (currentPrefs.profilePictureUpdated) {
        updatedPrefs.profilePictureUpdated = currentPrefs.profilePictureUpdated;
      }
      
      // Update user preferences (this replaces all preferences, so we must include everything)
      await account.updatePrefs(updatedPrefs);
      
      // Refresh user data in context
      await refreshUser();
      
      Alert.alert(
        'Success',
        'Account updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update account information. Please try again.');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Account' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Account'
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <Input
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <Input
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Work Photo Pro fan."
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <IconSymbol name="info.circle" color="#007AFF" size={20} />
              <Text style={styles.infoText}>
                You can update your display name here. Your Google account information will remain unchanged and your login will continue to work normally.
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
