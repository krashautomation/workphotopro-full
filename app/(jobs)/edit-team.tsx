import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Input from '@/components/Input';

export default function EditTeamScreen() {
  const { user } = useAuth();
  const { currentTeam, refreshCurrentTeam } = useOrganization();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('');

  // Load current team data
  useEffect(() => {
    if (currentTeam) {
      setTeamName(currentTeam.name || '');
      setEmail(currentTeam.teamData?.email || '');
      setWebsite(currentTeam.teamData?.website || '');
      setAddress(currentTeam.teamData?.address || '');
      setPhone(currentTeam.teamData?.phone || '');
      setDescription(currentTeam.teamData?.description || '');
      setTeamPhotoUrl(currentTeam.teamData?.teamPhotoUrl || '');
    }
  }, [currentTeam]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!teamName.trim()) {
        Alert.alert('Error', 'Team name is required');
        setSaving(false);
        return;
      }

      if (!currentTeam) {
        Alert.alert('Error', 'No team selected');
        setSaving(false);
        return;
      }

      // Update team using the team service
      await teamService.updateTeamDetails(currentTeam.$id, {
        name: teamName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        description: description.trim() || undefined,
        teamPhotoUrl: teamPhotoUrl || undefined,
      });

      // Refresh the current team data in the context
      await refreshCurrentTeam();

      Alert.alert(
        'Success',
        'Team updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating team:', error);
      Alert.alert('Error', 'Failed to update team. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = () => {
    // TODO: Implement photo upload
    Alert.alert('Info', 'Photo upload functionality will be implemented soon.');
  };

  if (!currentTeam) {
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
            onPress={() => router.back()}
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
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <IconSymbol name="photo" size={48} color={Colors.Gray} />
                  <Text style={styles.photoPlaceholderText}>No photo</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={handlePhotoUpload}
              >
                <IconSymbol name="camera" size={20} color={Colors.White} />
                <Text style={styles.photoButtonText}>
                  {teamPhotoUrl ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
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
  photoButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
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
