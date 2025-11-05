import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { jobChatService, tagService } from '@/lib/appwrite/database';
import { JobChat, JobChatWithTags } from '@/utils/types';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { Coins, Gem } from 'lucide-react-native';

export default function Jobs() {
  const { user, isAuthenticated, getUserProfilePicture, getGoogleUserData } = useAuth();
  const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
  const router = useRouter();
  
  // State for job chat management
  const [jobChats, setJobChats] = useState<JobChatWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [googleData, setGoogleData] = useState<any>(null);

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
   * Load Google user data
   */
  const loadGoogleUserData = async () => {
    try {
      const data = await getGoogleUserData();
      setGoogleData(data);
    } catch (error) {
      console.error('Error loading Google user data:', error);
    }
  };

  /**
   * Get display name with proper fallback logic
   */
  const getDisplayName = () => {
    return googleData?.displayName || googleData?.googleName || googleData?.firstName || user?.name || 'User';
  };

  /**
   * Get relative time string (e.g., "3 hours", "2 days", "14 minutes")
   */
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const updatedAt = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - updatedAt.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'}`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'}`;
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

      if (!currentTeam?.$id) {
        console.log('No team selected, skipping job fetch');
        setJobChats([]);
        setLoading(false);
        return;
      }

      // Load user profile picture, Google user data, fetch job chats, and load tag templates in parallel
      await Promise.all([
        loadUserProfilePicture(),
        loadGoogleUserData(),
        jobChatService.listJobChats(currentTeam.$id, currentOrganization?.$id).then(async response => {
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

  // Fetch jobs when component mounts or user/team changes
  useEffect(() => {
    if (isAuthenticated && user && currentTeam) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentTeam]);

  // Auto-refresh jobs when screen comes into focus (e.g., returning from job detail)
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 Jobs Index: Screen focused, refreshing jobs list');
      if (isAuthenticated && user && currentTeam) {
        fetchJobs();
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
      {/* Achievements Card */}
      <Link href="/(jobs)/achievements" asChild>
        <TouchableOpacity style={styles.achievementsCard}>
          <View style={styles.achievementsContent}>
            <View style={styles.achievementsLeft}>
              {/* Progress Label and Percentage */}
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressText}>79%</Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: '79%' }]} />
                </View>
              </View>
              
              {/* Pills */}
              <View style={styles.pillsContainer}>
                <View style={styles.pill}>
                  <Coins size={14} color="#FFD700" />
                  <Text style={styles.pillText}>Experience</Text>
                  <Text style={styles.pillNumber}>1,250</Text>
                </View>
                <View style={styles.pill}>
                  <Gem size={14} color="#9333EA" />
                  <Text style={styles.pillText}>Achievements</Text>
                  <Text style={styles.pillNumber}>12</Text>
                </View>
              </View>
            </View>
            
            {/* Eye Emojis */}
            <Text style={styles.eyeEmojis}>👀</Text>
          </View>
        </TouchableOpacity>
      </Link>

      {/* Header Card */}
      <TouchableOpacity 
        style={styles.headerCard}
        onPress={() => router.push('/(jobs)/teams')}
      >
        <View style={styles.headerCardContent}>
          <View style={styles.switchIconContainer}>
            <IconSymbol
              name="arrow.left.arrow.right"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>
              <Text style={styles.boldText}>Organization:</Text> {currentOrganization?.orgName || 'No Organization'}
            </Text>
            <Text style={styles.subtitle}>
              <Text style={styles.boldText}>Team:</Text> {currentTeam?.name || 'No Team'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <Text style={styles.switchSymbol}>⇄</Text>
          </View>
        </View>
      </TouchableOpacity>

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
            <Image 
              source={require('../../assets/images/green-man.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
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
                <View style={styles.jobTopContent}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                    <View style={styles.jobHeaderRight}>
                      <Text style={styles.jobDate}>
                        {getRelativeTime(item.$updatedAt)}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text style={styles.jobDescription} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
                  ) : (
                    <View style={styles.descriptionPlaceholder} />
                  )}
                </View>
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
                  {item.status === 'active' && (
                    <View style={styles.activeStatusIconContainer}>
                      <Text style={styles.activeStatusIcon}>👈</Text>
                    </View>
                  )}
                  {item.status === 'completed' && (
                    <View style={styles.statusIconContainer}>
                      <IconSymbol
                        name="checkmark"
                        size={10}
                        color={colors.background}
                      />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Menu */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/(jobs)/team')}
        >
          <IconSymbol
            name="person.3"
            size={24}
            color={colors.textSecondary}
          />
          <Text style={styles.menuButtonText}>Team</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/(jobs)/new-job')}
        >
          <IconSymbol
            name="camera"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.menuButtonText, styles.menuButtonTextActive]}>New Job</Text>
        </TouchableOpacity>
      </View>
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
  headerCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  headerCardContent: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  switchIconContainer: {
    paddingTop: 2,
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
  boldText: {
    fontWeight: 'bold',
    color: colors.text,
    opacity: 0.9,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchSymbol: {
    fontSize: 28,
    color: colors.text,
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
  infoContainer: {
    marginTop: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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
  bottomMenu: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  menuButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  menuButtonTextActive: {
    color: colors.primary,
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
    paddingTop: 4,
    paddingBottom: 100, // Add padding to account for bottom menu
  },
  jobCard: {
    backgroundColor: colors.surface,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 90,
  },
  jobContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  jobTopContent: {
    minHeight: 0,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 12,
  },
  statusIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStatusIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStatusIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  jobDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
    flexShrink: 1,
    height: 18,
  },
  descriptionPlaceholder: {
    height: 18,
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  separator: {
    height: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyImage: {
    width: 280,
    height: 280,
    marginBottom: 24,
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
  achievementsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    position: 'relative',
  },
  achievementsLeft: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressBarWrapper: {
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    position: 'relative',
  },
  progressText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  pillNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  eyeEmojis: {
    fontSize: 20,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

