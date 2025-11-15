import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Colors } from '@/utils/colors';
import { webColors } from '@/styles/webDesignTokens';
import { IconSymbol } from '@/components/IconSymbol';
import Input from '@/components/Input';

export default function NewTeamScreen() {
  const { user } = useAuth();
  const { currentOrganization, createTeam } = useOrganization();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    try {
      setSaving(true);
      
      if (!teamName.trim()) {
        Alert.alert('Error', 'Team name is required');
        return;
      }

      if (!currentOrganization?.$id) {
        Alert.alert('Error', 'No organization selected. Please select an organization first.');
        return;
      }

      // Create new team using context method
      await createTeam(teamName.trim(), description.trim());
      
      Alert.alert(
        'Success',
        'Team created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back and then navigate to teams to trigger refresh
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrganization) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Create Team' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No organization selected</Text>
          <Text style={styles.errorSubtext}>
            Please create or select an organization first before creating a team.
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
      <Stack.Screen options={{ title: 'Create Team' }} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Image 
            source={require('@/assets/images/create-team.png')} 
            style={styles.headerImage}
            resizeMode="contain"
          />
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <IconSymbol name="info.circle" color={webColors.primary} size={20} />
              <Text style={styles.infoText}>
                You are creating a new team in {currentOrganization.orgName}. This team will be added to the "My Teams" tab.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Team Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Team Name</Text>
              <Input
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Enter team name"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Enter team description"
                multiline={true}
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            </View>
          </View>

          {/* Create Button */}
          <View style={styles.saveButtonContainer}>
            <Pressable 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleCreate}
              disabled={saving}
            >
              <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
                {saving ? 'Creating...' : 'Create Team'}
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
  loadingText: {
    fontSize: 16,
    color: Colors.Text,
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
  headerImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
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
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.Secondary,
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.Text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: webColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.Gray,
  },
  saveButtonText: {
    color: webColors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: Colors.White,
  },
});
