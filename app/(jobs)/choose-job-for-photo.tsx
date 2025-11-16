import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { jobChatService } from '@/lib/appwrite/database';
import { Colors } from '@/utils/colors';
import { JobChat } from '@/utils/types';
import { globalStyles, colors as globalColors } from '@/styles/globalStyles';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ChooseJobForPhoto() {
  const { user, isAuthenticated } = useAuth();
  const { currentTeam, currentOrganization } = useOrganization();
  const { mediaType = 'photo' } = useLocalSearchParams<{ mediaType?: 'photo' | 'video' }>();
  const router = useRouter();
  
  const isVideo = mediaType === 'video';

  const [jobs, setJobs] = useState<JobChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const loadJobs = async () => {
    try {
      setError(null);
      setIsLoadingJobs(true);

      if (!user?.$id || !isAuthenticated) {
        throw new Error('User not authenticated');
      }

      if (!currentTeam?.$id) {
        setJobs([]);
        return;
      }

      const response = await jobChatService.listJobChats(
        currentTeam.$id,
        currentOrganization?.$id,
      );

      // Map Appwrite documents to JobChat format
      const jobsWithId = response.documents.map((doc: any) => ({
        ...doc,
        id: doc.$id, // Map $id to id for backwards compatibility
      })) as JobChat[];

      setJobs(jobsWithId);
    } catch (err) {
      console.error('Error loading jobs for photo flow:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, currentTeam, currentOrganization?.$id]);

  const handleCreateNewJob = () => {
    if (!currentTeam?.$id || !currentOrganization?.$id) {
      Alert.alert(
        'Select a Team',
        'Please select a team and organization before creating a job.',
      );
      return;
    }

    router.push({
      pathname: '/(jobs)/new-job',
      params: { 
        photoFlow: 'true',
        mediaType: isVideo ? 'video' : 'photo',
      },
    });
  };

  const handleNext = () => {
    if (!selectedJobId) {
      return;
    }

    router.push({
      pathname: isVideo ? '/(jobs)/video-camera' : '/(jobs)/camera',
      params: {
        jobId: selectedJobId,
        photoFlow: 'true',
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ title: isVideo ? 'Select Job for Video' : 'Select Job for Photo' }} />
        <View style={globalStyles.centeredContainer}>
          <Text style={globalStyles.body}>
            Please sign in to attach {isVideo ? 'videos' : 'photos'} to jobs.
          </Text>
        </View>
      </>
    );
  }

  if (!currentTeam?.$id || !currentOrganization?.$id) {
    return (
      <>
        <Stack.Screen options={{ title: isVideo ? 'Select Job for Video' : 'Select Job for Photo' }} />
        <View style={globalStyles.centeredContainer}>
          <Text style={styles.infoText}>
            {isVideo ? 'Videos' : 'Photos'} must be stored inside a Job. Please choose a company and
            team first.
          </Text>
          <Pressable
            style={[globalStyles.primaryButton, { marginTop: 16 }]}
            onPress={() => router.push('/(jobs)/teams')}
          >
            <Text style={globalStyles.buttonText}>Choose Team</Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: isVideo ? 'Select Job for Video' : 'Select Job for Photo' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={globalColors.primary} />
          <Text style={styles.loadingText}>Loading jobs…</Text>
        </View>
      </>
    );
  }

  return (
      <>
        <Stack.Screen options={{ title: isVideo ? 'Select Job for Video' : 'Select Job for Photo' }} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              All {isVideo ? 'videos' : 'photos'} must be stored in a Job.
            </Text>
            <Text style={styles.subtitle}>
              Would you like to create a new job for this {isVideo ? 'video' : 'photo'} or attach it to
              an existing job?
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.primaryAction}
              onPress={handleCreateNewJob}
            >
              <Text style={styles.primaryActionTitle}>Create a new job</Text>
              <Text style={styles.primaryActionSubtitle}>
                Start a fresh job for this {isVideo ? 'video' : 'photo'}.
              </Text>
            </Pressable>

          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <Text style={styles.secondaryLabel}>Select an existing job</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={jobs}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoadingJobs}
          onRefresh={loadJobs}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a new job first, then you can attach this {isVideo ? 'video' : 'photo'}.
              </Text>
              <Pressable
                style={[globalStyles.primaryButton, { marginTop: 16 }]}
                onPress={handleCreateNewJob}
              >
                <Text style={globalStyles.buttonText}>Create a new job</Text>
              </Pressable>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = selectedJobId === item.$id;
            return (
              <Pressable
                onPress={() => setSelectedJobId(item.$id)}
                style={[
                  styles.jobCard,
                  isSelected && styles.jobCardSelected,
                ]}
              >
                <View style={styles.jobCardHeader}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {item.title || 'Untitled Job'}
                  </Text>
                  <Text style={styles.jobDate}>
                    {new Date(item.$updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                {item.description ? (
                  <Text style={styles.jobDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : (
                  <Text style={styles.jobDescriptionPlaceholder}>
                    No description
                  </Text>
                )}
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedJobId && styles.nextButtonDisabled,
            ]}
            disabled={!selectedJobId}
            onPress={handleNext}
          >
            <Text
              style={[
                styles.nextButtonText,
                !selectedJobId && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.Gray,
  },
  actionsRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  primaryAction: {
    backgroundColor: globalColors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: globalColors.primary,
  },
  primaryActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: globalColors.text,
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: globalColors.textSecondary,
  },
  orDivider: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: globalColors.border,
  },
  orText: {
    fontSize: 12,
    color: globalColors.textSecondary,
  },
  secondaryLabel: {
    fontSize: 14,
    color: globalColors.textSecondary,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: globalColors.surface,
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: globalColors.error,
  },
  errorText: {
    color: globalColors.error,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 90,
  },
  jobCard: {
    backgroundColor: globalColors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  jobCardSelected: {
    borderColor: globalColors.primary,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: globalColors.text,
    flex: 1,
    marginRight: 8,
  },
  jobDate: {
    fontSize: 12,
    color: globalColors.textMuted,
  },
  jobDescription: {
    fontSize: 13,
    color: globalColors.textSecondary,
  },
  jobDescriptionPlaceholder: {
    fontSize: 13,
    color: globalColors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: globalColors.surface,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
  },
  nextButton: {
    backgroundColor: globalColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.Secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: globalColors.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: globalColors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: globalColors.textSecondary,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: Colors.Text,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});


