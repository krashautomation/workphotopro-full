import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { webColors } from '@/styles/webDesignTokens';
import { jobChatService, tagService } from '@/lib/appwrite/database';
import { JobChat, JobChatWithTags } from '@/utils/types';
import { Link, useRouter, useFocusEffect, usePathname, useSegments } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { Mountain, TableProperties, MessageCircle, Plus, Camera, Video, SquareCheck, SquareChevronRight, ChevronRight } from 'lucide-react-native';
import { useJobFilters } from '@/context/JobFilterContext';

export default function Jobs() {
  const { user, isAuthenticated, getUserProfilePicture, getGoogleUserData } = useAuth();
  const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  // Check if we're on the index page (Job Chats)
  const isOnIndexPage = pathname === '/(jobs)' || 
                        pathname === '/(jobs)/' || 
                        pathname === '/(jobs)/index' ||
                        (segments.length === 1 && segments[0] === '(jobs)');
  
  // State for job chat management
  const [jobChats, setJobChats] = useState<JobChatWithTags[]>([]);
  const [filteredJobChats, setFilteredJobChats] = useState<JobChatWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const userRole = (currentTeam as any)?.membershipRole || (currentTeam as any)?.teamData?.role || null;
  const roleDisplay = userRole
    ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`
    : null;
  const isOwnerRole = userRole?.toLowerCase() === 'owner';
  const { filters } = useJobFilters();
  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.memberIds.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

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
          setFilteredJobChats(jobsWithTags);
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

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextFiltered = jobChats.filter((job) => {
      const jobStatusRaw = (job.status ?? 'active').toLowerCase();
      const jobStatus =
        jobStatusRaw === 'current'
          ? 'active'
          : jobStatusRaw === 'complete'
          ? 'completed'
          : jobStatusRaw;

      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(jobStatus as 'active' | 'completed')
      ) {
        return false;
      }

      const assignedTagsArray = Array.isArray((job as any).assignedTags)
        ? ((job as any).assignedTags as any[])
        : [];
      const tagTemplatesArray = Array.isArray((job as any).tagTemplates)
        ? ((job as any).tagTemplates as any[])
        : [];

      if (filters.tagIds.length > 0) {
        const jobTagIds = new Set<string>();

        assignedTagsArray.forEach((tag) => {
          if (!tag) {
            return;
          }
          if (typeof tag === 'string') {
            jobTagIds.add(tag);
            return;
          }

          const potentialIds = [
            tag.$id,
            tag.tagTemplateId,
            tag.tagId,
            tag.id,
          ];
          potentialIds.forEach((value) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              jobTagIds.add(value);
            }
          });
        });

        tagTemplatesArray.forEach((tag) => {
          const templateId = tag?.$id || tag?.tagTemplateId || tag?.id;
          if (typeof templateId === 'string' && templateId.trim().length > 0) {
            jobTagIds.add(templateId);
          }
        });

        const tagIdsField = (job as any).tagIds;
        if (Array.isArray(tagIdsField)) {
          tagIdsField.forEach((value) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              jobTagIds.add(value);
            }
          });
        }

        const hasMatchingTag = filters.tagIds.some((tagId) =>
          jobTagIds.has(tagId)
        );

        if (!hasMatchingTag) {
          return false;
        }
      }

      if (filters.memberIds.length > 0) {
        const jobCreatorId =
          job.createdBy ||
          (job as any).createdById ||
          (job as any).creatorId ||
          (job as any).ownerId ||
          (job as any).userId ||
          null;

        if (!jobCreatorId || !filters.memberIds.includes(jobCreatorId)) {
          return false;
        }
      }

      if (query.length === 0) {
        return true;
      }

      const titleMatch = job.title?.toLowerCase().includes(query);
      const descriptionMatch = job.description?.toLowerCase().includes(query);
      const tagMatch = assignedTagsArray.some((tag: any) => {
        const tagText =
          tag?.name ||
          tag?.title ||
          tag?.label ||
          tag?.text ||
          tag?.icon ||
          '';

        return (
          typeof tagText === 'string' && tagText.toLowerCase().includes(query)
        );
      });

      return Boolean(titleMatch || descriptionMatch || tagMatch);
    });

    setFilteredJobChats(nextFiltered);
  }, [jobChats, searchQuery, filters]);

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
      <View style={styles.achievementsCardWrapper}>
        <Link href="/(jobs)/achievements" asChild>
          <TouchableOpacity style={styles.achievementsCard}>
            <View style={styles.achievementsContent}>
              <View style={styles.achievementsLeft}>
                {/* Experience Header */}
                <View style={styles.progressHeader}>
                  <View style={styles.experiencePill}>
                    <Mountain size={14} color="#22c55e" />
                    <Text style={styles.pillText}>Experience</Text>
                    <Text style={styles.pillNumber}>1,250</Text>
                  </View>
                  <View style={styles.progressLabelContainer}>
                    <Text style={styles.progressLabel}>Progress:</Text>
                    <Text style={styles.progressText}>79%</Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: '79%' }]} />
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Header Card */}
      <TouchableOpacity
        style={styles.headerCard}
        onPress={() => router.push('/(jobs)/teams')}
      >
        <View style={styles.headerCardContent}>
          <View style={styles.headerRowContainer}>
            {/* Team Photo */}
            {currentTeam?.teamPhotoUrl ? (
              <View style={styles.headerTeamPhotoContainer}>
                <Image 
                  source={{ uri: currentTeam.teamPhotoUrl }} 
                  style={styles.headerTeamPhoto}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ) : (
              <View style={styles.headerTeamPhotoPlaceholder}>
                <IconSymbol
                  name="person.3"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            )}
            
            <View style={styles.headerLeftContainer}>
              <Text style={styles.subtitle}>{currentOrganization?.orgName || 'No Organization'}</Text>
              <Text style={styles.subtitle}>{currentTeam?.teamName || 'No Team'}</Text>
            </View>
            <View style={styles.headerRightContainer}>
              {roleDisplay && (
                <View style={[styles.rolePill, isOwnerRole && styles.rolePillOwner]}>
                  <Text style={[styles.rolePillText, isOwnerRole && styles.rolePillTextOwner]}>{roleDisplay}</Text>
                </View>
              )}
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Search & Filter */}
      <View style={styles.searchFilterRow}>
        <View style={[styles.searchInputContainer, hasSearchQuery && styles.searchInputContainerActive]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            returnKeyType="search"
          />
          {hasSearchQuery && (
            <TouchableOpacity
              style={styles.searchClearButton}
              onPress={() => setSearchQuery('')}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={hasSearchQuery ? colors.primary : colors.textSecondary}
          />
          {hasSearchQuery && <View style={styles.searchIndicator} />}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => router.push('/(jobs)/filter-jobs')}
        >
          <TableProperties size={20} color={colors.textSecondary} />
          {hasActiveFilters && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Job Chats List */}
      <FlatList
        data={filteredJobChats}
        keyExtractor={(item) => item.$id}
        extraData={searchQuery}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No jobs match your search</Text>
              <Text style={styles.emptySubtext}>
                Try a different keyword or clear the search to see all jobs.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image 
                source={require('../../assets/images/apple-icon-180x180.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>No jobs in the list</Text>
              <Text style={styles.emptySubtext}>
                Create a new job or change your jobs filter and organize your work photos
              </Text>
              
              <Link href="/(jobs)/web-design-test" asChild>
                <TouchableOpacity style={[globalStyles.secondaryButton, { borderColor: colors.blue }]}>
                  <Text style={[globalStyles.buttonText, { color: colors.blue }]}>Test Web</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )
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
                      <SquareChevronRight
                        size={16}
                        color="#22c55e" // green to match muted background
                      />
                    </View>
                  )}
                  {item.status === 'completed' && (
                    <View style={styles.statusIconContainer}>
                      <SquareCheck
                        size={16}
                        color={webColors.accent} // cyan to match muted background
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
      <View style={[styles.bottomMenu, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/(jobs)')}
        >
          <MessageCircle
            size={24}
            color={isOnIndexPage ? webColors.primary : colors.textSecondary}
          />
          <Text style={[styles.menuButtonText, isOnIndexPage && styles.menuButtonTextActive]}>Job Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/(jobs)/new-job')}
        >
          <Plus
            size={24}
            color={pathname === '/(jobs)/new-job' ? webColors.primary : colors.textSecondary}
          />
          <Text style={[styles.menuButtonText, pathname === '/(jobs)/new-job' && styles.menuButtonTextActive]}>New Job</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push({
            pathname: '/(jobs)/choose-job-for-photo',
            params: { mediaType: 'photo' }
          })}
        >
          <Camera
            size={24}
            color={colors.textSecondary}
          />
          <Text style={styles.menuButtonText}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push({
            pathname: '/(jobs)/choose-job-for-photo',
            params: { mediaType: 'video' }
          })}
        >
          <Video
            size={24}
            color={colors.textSecondary}
          />
          <Text style={styles.menuButtonText}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/(jobs)/teams')}
        >
          <IconSymbol
            name="person.3"
            size={24}
            color={colors.textSecondary}
          />
          <Text style={styles.menuButtonText}>Teams</Text>
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
    backgroundColor: colors.surface,
    borderWidth: 0,
  },
  headerCardContent: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTeamPhotoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTeamPhoto: {
    width: '100%',
    height: '100%',
  },
  headerTeamPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerColumn: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleSwitchContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0,
  },
  switchSymbol: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: 'bold',
    color: colors.text,
    opacity: 0.9,
  },
  rolePill: {
    backgroundColor: 'rgba(40, 247, 248, 0.15)', // cyan accent with opacity
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rolePillOwner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // green (same as old Member color)
  },
  rolePillText: {
    color: webColors.accent, // cyan
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  rolePillTextOwner: {
    color: '#22c55e', // green
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
  searchFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 2,
    flex: 1,
    position: 'relative',
  },
  searchInputContainerActive: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: 0,
    marginRight: 8,
    color: colors.text,
    fontSize: 14,
  },
  searchClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 4,
  },
  searchIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: colors.border,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
    paddingTop: 12,
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
    color: webColors.primary,
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
    width: 20,
    height: 20,
    borderRadius: 3,
    backgroundColor: 'rgba(40, 247, 248, 0.15)', // muted cyan (like Member pill)
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStatusIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // muted green (like Owner pill)
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 10,
    alignItems: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 6,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 0,
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
  experiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  progressBarWrapper: {
    marginBottom: 6,
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
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
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
  achievementsCardWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    position: 'relative',
  },
  infoIconButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 56,
    right: 16,
    zIndex: 20,
    width: 280,
  },
  tooltip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  tooltipText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
  },
});

