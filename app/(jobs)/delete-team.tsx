import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { teamService } from '@/lib/appwrite/teams';

export default function DeleteTeam() {
  const router = useRouter();
  const { teamId, teamName } = useLocalSearchParams<{ teamId: string; teamName: string }>();
  const { loadUserData, currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [teamExists, setTeamExists] = useState(false);

  // Validate team exists when component mounts
  useEffect(() => {
    const validateTeam = async () => {
      if (!teamId) {
        setIsValidating(false);
        return;
      }

      try {
        // Try to get the team to see if it exists (including soft-deleted teams)
        await teamService.getTeam(teamId, true);
        setTeamExists(true);
      } catch (error) {
        console.warn('Team validation failed:', error);
        setTeamExists(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateTeam();
  }, [teamId]);

  const handleDeleteTeam = async () => {
    if (!teamId) {
      Alert.alert('Error', 'Workspace ID is missing');
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete the team using teamService
      await teamService.deleteTeam(teamId);
      
      // Clean up any orphaned jobs that might reference non-existent teams
      try {
        await teamService.cleanupOrphanedJobs();
      } catch (cleanupError) {
        console.warn('Could not clean up orphaned jobs:', cleanupError);
      }
      
      // Reload user data to refresh the teams list
      await loadUserData();
      
      Alert.alert('Success', 'Workspace archived successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error archiving workspace:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to archive workspace. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Team with the requested ID could not be found')) {
          errorMessage = 'This workspace may have already been deleted or is no longer accessible.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to delete this workspace.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Remove Workspace',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
        }}
      />
      
      <View style={styles.container}>
        {/* Content Area */}
        <View style={styles.content}>
          {isValidating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#666" />
              <Text style={styles.loadingText}>Validating workspace...</Text>
            </View>
          ) : !teamExists ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                This workspace could not be found or may have already been deleted.
              </Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.text}>
                Delete a Team group will remove it from you and your team's list and prevent you from receiving notifications for activity.
              </Text>
              
              <Text style={styles.text}>
                This can be reversed at any time through the Team settings menu.
              </Text>

              <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteTeam}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Remove Team</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Bottom Grey Area */}
        <View style={styles.bottomArea} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
