import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { usePermissions } from '@/utils/permissions';
import { globalStyles, colors } from '@/styles/globalStyles';
import { jobChatService } from '@/lib/appwrite/database';
import { JobChat } from '@/utils/types';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useState, useEffect, useCallback } from 'react';

export default function TrashedJobs() {
  const { user, isAuthenticated } = useAuth();
  const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
  const { canDeleteJob } = usePermissions();
  const router = useRouter();
  
  // State for trashed jobs management
  const [trashedJobs, setTrashedJobs] = useState<JobChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringJobId, setRestoringJobId] = useState<string | null>(null);

  /**
   * Fetch soft-deleted jobs from Appwrite database
   */
  const fetchTrashedJobs = async () => {
    try {
      setError(null);
      
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      if (!currentTeam?.$id) {
        console.log('No team selected, skipping trashed jobs fetch');
        setTrashedJobs([]);
        setLoading(false);
        return;
      }

      // Fetch soft-deleted jobs (jobs with deletedAt field set)
      const response = await jobChatService.listDeletedJobChats();
      
      // Filter by current team since listDeletedJobChats doesn't support team filtering
      const teamJobs = response.documents.filter((job: any) => 
        job.teamId === currentTeam.$id
      );
      
      console.log('🔍 Trashed Jobs: Fetched deleted jobs response:', response);
      console.log('🔍 Trashed Jobs: Number of deleted jobs:', teamJobs.length);
      
      setTrashedJobs(teamJobs);
    } catch (error) {
      console.error('Error fetching trashed jobs:', error);
      setError('Failed to load trashed jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTrashedJobs();
    } catch (error) {
      console.error('Error refreshing trashed jobs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Restore a job by setting its deletedAt field to null
   */
  const handleRestoreJob = async (jobId: string, jobTitle: string) => {
    // Check permission before restoring
    if (!canDeleteJob) {
      console.error('❌ TrashedJobs: Permission denied: User cannot restore jobs');
      Alert.alert(
        'Permission Denied', 
        'Only team owners can restore deleted jobs.'
      );
      return;
    }
    
    try {
      setRestoringJobId(jobId);
      
      // Restore the job by setting deletedAt to null
      await jobChatService.restoreJobChat(jobId);
      
      // Remove the job from the trashed jobs list
      setTrashedJobs(prevJobs => prevJobs.filter(job => job.$id !== jobId));
      
      Alert.alert(
        'Job Restored',
        `"${jobTitle}" has been restored and is now active.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error restoring job:', error);
      Alert.alert(
        'Error',
        'Failed to restore job. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoringJobId(null);
    }
  };

  /**
   * Show confirmation dialog before restoring a job
   */
  const confirmRestoreJob = (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Restore Job',
      `Are you sure you want to restore "${jobTitle}"? It will become active again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => handleRestoreJob(jobId, jobTitle) }
      ]
    );
  };

  // Fetch trashed jobs when component mounts or user/team changes
  useEffect(() => {
    if (isAuthenticated && user && currentTeam) {
      fetchTrashedJobs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentTeam]);

  // Auto-refresh trashed jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 Trashed Jobs: Screen focused, refreshing trashed jobs list');
      if (isAuthenticated && user && currentTeam) {
        fetchTrashedJobs();
      }
    }, [isAuthenticated, user, currentTeam])
  );

  // Show loading state
  if (loading || orgLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view trashed jobs</Text>
      </View>
    );
  }

  // Show message if no team is selected
  if (!currentTeam) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>No team selected</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check delete permission - show permission denied screen if not owner
  if (!canDeleteJob) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Trashed Jobs</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.permissionDeniedContainer}>
          <IconSymbol name="lock" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Permission Denied</Text>
          <Text style={styles.emptySubtext}>
            Only team owners can access trashed jobs.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Trashed Jobs</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Team Info */}
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{currentTeam.teamName}</Text>
        <Text style={styles.teamSubtext}>
          {trashedJobs.length} deleted job{trashedJobs.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Trashed Jobs List */}
      <FlatList
        data={trashedJobs}
        keyExtractor={(item) => item.$id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="trash"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No trashed jobs</Text>
            <Text style={styles.emptySubtext}>
              Jobs that are deleted will appear here
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <View style={styles.jobContent}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.jobDescription}>{item.description}</Text>
              )}
              <View style={styles.jobMeta}>
                <Text style={styles.jobDate}>
                  Deleted on {new Date(item.deletedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {canDeleteJob && (
              <TouchableOpacity 
                style={[
                  styles.restoreButton,
                  restoringJobId === item.$id && styles.restoreButtonDisabled
                ]}
                onPress={() => confirmRestoreJob(item.$id, item.title)}
                disabled={restoringJobId === item.$id}
              >
                {restoringJobId === item.$id ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <View style={styles.restoreButtonContent}>
                    <IconSymbol
                      name="arrow.uturn.backward"
                      size={16}
                      color={colors.text}
                    />
                    <Text style={styles.restoreButtonText}>Restore</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 36,
  },
  teamInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  teamSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: colors.surface,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobContent: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jobDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  jobStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  restoreButton: {
    backgroundColor: '#3b82f6', // Blue-500
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  restoreButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  restoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restoreButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
