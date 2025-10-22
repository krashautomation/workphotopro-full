import { useAuth } from '@/context/AuthContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { jobChatService, tagService } from '@/lib/appwrite/database';
import { JobChat, JobChatWithTags } from '@/utils/types';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';

export default function Jobs() {
  const { user, isAuthenticated, getUserProfilePicture } = useAuth();
  const router = useRouter();
  
  // State for job chat management
  const [jobChats, setJobChats] = useState<JobChatWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);

  /**
   * Load user profile picture
   */
  const loadUserProfilePicture = async () => {
    try {
      const profilePicture = await getUserProfilePicture();
      setUserProfilePicture(profilePicture);
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  /**
   * Load tags for a specific job
   */
  const loadJobTags = async (jobId: string, allTagTemplates: any[]) => {
    try {
      const assignments = await tagService.getJobTagAssignments(jobId);
      const tagTemplateIds = assignments.documents.map((assignment: any) => assignment.tagTemplateId);
      
      if (tagTemplateIds.length > 0) {
        const assignedTemplates = allTagTemplates.filter((template: any) => 
          tagTemplateIds.includes(template.$id)
        );
        return assignedTemplates;
      }
      return [];
    } catch (error) {
      console.log('Error loading tags for job:', jobId, error);
      return [];
    }
  };

  /**
   * Fetch job chats from Appwrite database
   */
  const fetchJobs = async () => {
    try {
      setError(null);
      
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      // Load user profile picture, fetch job chats, and load tag templates in parallel
      await Promise.all([
        loadUserProfilePicture(),
        jobChatService.listJobChats().then(async response => {
          console.log('🔍 Jobs Index: Fetched jobs response:', response);
          console.log('🔍 Jobs Index: Number of jobs:', response.documents.length);
          
          // Load all tag templates once
          const tagTemplatesResponse = await tagService.getActiveTagTemplates();
          const allTagTemplates = tagTemplatesResponse.documents;
          
          // Load tags for each job
          const jobsWithTags = await Promise.all(
            response.documents.map(async (job: any) => {
              const tags = await loadJobTags(job.$id, allTagTemplates);
              return {
                ...job,
                assignedTags: tags,
              } as JobChatWithTags;
            })
          );
          
          setJobChats(jobsWithTags);
        })
      ]);
    } catch (error) {
      console.error('Error fetching job chats:', error);
      setError('Failed to load jobs. Please try again.');
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
      await fetchJobs();
    } catch (error) {
      console.error('Error refreshing jobs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch jobs when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Auto-refresh jobs when screen comes into focus (e.g., returning from job detail)
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 Jobs Index: Screen focused, refreshing jobs list');
      if (isAuthenticated && user) {
        fetchJobs();
      }
    }, [isAuthenticated, user])
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view your jobs</Text>
        <View style={globalStyles.verticalLinkContainer}>
          <Link href="/(auth)/sign-in">
            <Text style={globalStyles.link}>Sign in</Text>
          </Link>
          <Link href="/(auth)/sign-up">
            <Text style={globalStyles.link}>Sign up</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>{user?.name || 'User'}</Text>
          <Text style={styles.subtitle}>Your Jobs</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.newJobButton}
            onPress={() => router.push('/(jobs)/new-job')}
          >
            <Text style={styles.newJobButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(jobs)/profile')}
          >
            <Avatar
              name={user?.name || 'User'}
              imageUrl={userProfilePicture || undefined}
              size={32}
              style={styles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Job Chats List */}
      <FlatList
        data={jobChats}
        keyExtractor={(item) => item.$id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No jobs yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first job to start organizing your work photos
            </Text>
            
            <TouchableOpacity style={globalStyles.button}>
              <Text style={globalStyles.buttonText}>Create Job</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <Link 
            href={{
              pathname: '/(jobs)/[job]',
              params: { job: item.$id },
            }}
            asChild
          >
            <TouchableOpacity style={styles.jobCard}>
              <View style={styles.jobContent}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.jobDescription}>{item.description}</Text>
                )}
                <View style={styles.jobMeta}>
                  <View style={styles.tagsContainer}>
                    {item.assignedTags && item.assignedTags.length > 0 ? (
                      item.assignedTags.map((tag: any, index: number) => (
                        <IconSymbol
                          key={tag.$id || index}
                          name={tag.icon || "circle"}
                          color={tag.color}
                          size={16}
                          style={styles.tagIcon}
                        />
                      ))
                    ) : (
                      <View style={styles.noTagsPlaceholder} />
                    )}
                  </View>
                  <Text style={styles.jobDate}>
                    {new Date(item.$createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.chevron}>
                <Text style={styles.chevronText}>›</Text>
              </View>
            </TouchableOpacity>
          </Link>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  profileAvatar: {
    // No additional styles needed - Avatar component handles its own styling
  },
  newJobButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newJobButtonText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: 'bold',
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
    padding: 20,
  },
  jobCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobContent: {
    flex: 1,
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
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagIcon: {
    marginRight: 2,
  },
  noTagsPlaceholder: {
    width: 16,
    height: 16,
  },
  jobDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chevron: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
});

