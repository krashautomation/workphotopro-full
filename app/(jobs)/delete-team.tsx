import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { teamService } from '@/lib/appwrite/teams';
import { databaseService } from '@/lib/appwrite/database';
import { Query } from 'react-native-appwrite';

export default function DeleteTeam() {
  const router = useRouter();
  const { teamId, teamName } = useLocalSearchParams<{ teamId: string; teamName: string }>();
  const { loadUserData, currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [teamExists, setTeamExists] = useState(false);
  const [canDeleteTeam, setCanDeleteTeam] = useState(false);
  const [organizationTeamCount, setOrganizationTeamCount] = useState(0);

  // Validate team exists and check if user can delete it
  useEffect(() => {
    const validateTeam = async () => {
      if (!teamId || !currentOrganization?.$id || !user?.$id) {
        setIsValidating(false);
        return;
      }

      try {
        // Try to get the team to see if it exists
        await teamService.getTeam(teamId, currentOrganization.$id);
        setTeamExists(true);

        // Count how many teams the user OWNS (not just belongs to) in this organization
        const orgTeamsResponse = await teamService.listOrganizationTeams(currentOrganization.$id);
        
        // Check each team for user ownership
        let ownedTeamCount = 0;
        for (const team of orgTeamsResponse.teams) {
          const membership = await teamService.getMembership(team.$id, user.$id, currentOrganization.$id);
          if (membership?.role === 'owner') {
            ownedTeamCount++;
          }
        }
        
        setOrganizationTeamCount(ownedTeamCount);

        // User can only delete if they own more than one team
        setCanDeleteTeam(ownedTeamCount > 1);
      } catch (error) {
        console.warn('Team validation failed:', error);
        setTeamExists(false);
        setCanDeleteTeam(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateTeam();
  }, [teamId, currentOrganization?.$id, user?.$id]);

  const handleDeleteTeam = async () => {
    if (!teamId) {
      Alert.alert('Error', 'Workspace ID is missing');
      return;
    }

    if (!currentOrganization?.$id) {
      Alert.alert('Error', 'Organization information is missing');
      return;
    }

    // Check if user can delete this team (must own more than one team)
    if (!canDeleteTeam) {
      Alert.alert(
        'Cannot Delete Team',
        'Cannot delete your only team. Create another team first before deleting this one.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete the team using teamService with orgId
      await teamService.deleteTeam(teamId, currentOrganization.$id);
      
      // Force-set our database team inactive by name as a safety net
      if (teamName) {
        try {
          const teamDocs = await databaseService.listDocuments('teams', [
            Query.equal('teamName', String(teamName)),
          ]);
          for (const doc of teamDocs.documents) {
            if (doc.isActive !== false) {
              await databaseService.updateDocument('teams', doc.$id, { isActive: false });
            }
          }
        } catch (forceErr) {
          console.warn('Force inactivate team in DB failed:', forceErr);
        }
      }
      
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
          onPress: () => router.push('/(jobs)/teams'),
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
          ) : !canDeleteTeam ? (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Cannot delete your only team.
              </Text>
              <Text style={styles.warningSubText}>
                Create another team first before deleting this one.
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
                Deleting a Team group will remove it from you and your team's list and prevent you from receiving notifications for activity.
              </Text>
              
              <Text style={styles.text}>
                This can be reversed at any time through the User settings menu.
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
    backgroundColor: '#000000',
  },
  content: {
    backgroundColor: '#000000',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
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
    backgroundColor: '#000000',
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
  warningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#000000',
  },
  warningText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: '600',
  },
  warningSubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
