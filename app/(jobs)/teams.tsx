import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { webColors } from '@/styles/webDesignTokens';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback, useRef } from 'react';

import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { teamService } from '@/services/teamService';
import { databaseService } from '@/lib/appwrite/database';
import { Query } from 'react-native-appwrite';
import { TeamData } from '@/utils/types';



export default function Teams() {
  const { user, isAuthenticated } = useAuth();
  const { userOrganizations, userTeams, loadUserData, switchTeam, currentTeam, currentOrganization } = useOrganization();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'memberships' | 'myTeams'>('myTeams');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myOwnedTeams, setMyOwnedTeams] = useState<any[]>([]);
  const [allMembershipsTeams, setAllMembershipsTeams] = useState<any[]>([]);
  const [membershipRole, setMembershipRole] = useState<string>('member');
  const flatListRef = useRef<FlatList>(null);
  const hasInitializedRef = useRef(false);

  /**
   * Fetch user's membership role for current team
   */
  useEffect(() => {
    const fetchMembershipRole = async () => {
      if (!user?.$id || !currentTeam?.$id) {
        setMembershipRole('member');
        return;
      }

      try {
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('userId', user.$id),
          Query.equal('teamId', currentTeam.$id),
          Query.equal('isActive', true)
        ]);

        if (memberships.documents && memberships.documents.length > 0) {
          setMembershipRole(memberships.documents[0].role || 'member');
        } else {
          // Check if user is the team creator (owner)
          if (currentTeam.createdBy === user.$id) {
            setMembershipRole('owner');
          } else {
            setMembershipRole('member');
          }
        }
      } catch (error) {
        console.warn('Could not fetch membership role:', error);
        // Default to member on error
        setMembershipRole('member');
      }
    };

    fetchMembershipRole();
  }, [user?.$id, currentTeam?.$id, currentTeam?.createdBy]);

  /**
   * Load teams from current organization
   */
  const loadMyTeams = useCallback(async () => {
    if (!user?.$id || !currentOrganization?.$id) {
      setMyOwnedTeams([]);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch teams for current organization only
      const teams = await teamService.listTeams(user.$id, currentOrganization.$id);
      
      // Add membershipRole property to each team for consistency
      const teamsWithRoles = await Promise.all(
        (teams || []).map(async (team) => {
          try {
            // Fetch membership from our database (not Appwrite)
            const memberships = await databaseService.listDocuments('memberships', [
              Query.equal('userId', user.$id),
              Query.equal('teamId', team.$id),
              Query.equal('isActive', true)
            ]);
            
            return {
              ...team,
              membershipRole: memberships.documents[0]?.role || 'owner'
            };
          } catch (error) {
            return {
              ...team,
              membershipRole: 'owner'
            };
          }
        })
      );
      
      setMyOwnedTeams(teamsWithRoles);
    } catch (error) {
      console.error('Error loading my teams:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.$id, currentOrganization?.$id]);

  /**
   * Load all memberships across ALL orgs (for My Memberships tab)
   */
  const loadAllMemberships = useCallback(async () => {
    if (!user?.$id) {
      setAllMembershipsTeams([]);
      return;
    }

    try {
      // Fetch all memberships for this user across all orgs
      const memberships = await databaseService.listDocuments('memberships', [
        Query.equal('userId', user.$id),
        Query.equal('isActive', true)
      ]);

      if (!memberships.documents || memberships.documents.length === 0) {
        setAllMembershipsTeams([]);
        return;
      }

      // Get unique teamIds where user is a member (not owner)
      const memberTeamIds = memberships.documents
        .filter((m: any) => m.role === 'member')
        .map((m: any) => m.teamId);

      if (memberTeamIds.length === 0) {
        setAllMembershipsTeams([]);
        return;
      }

      // Fetch team details for each membership
      const teamsPromises = memberTeamIds.map(async (teamId: string) => {
        try {
          // Get team details - need to find which org it belongs to first
          const membership = memberships.documents.find((m: any) => m.teamId === teamId);
          if (!membership) return null;

          const team = await teamService.getTeam(teamId, membership.orgId);
          return {
            ...team,
            membershipRole: 'member'
          };
        } catch (error) {
          console.warn(`Could not fetch team ${teamId}:`, error);
          return null;
        }
      });

      const teams = (await Promise.all(teamsPromises)).filter(Boolean);
      setAllMembershipsTeams(teams);
      
      console.log('✅ Loaded all membership teams:', teams.map((t: any) => ({
        id: t.$id,
        name: t.teamName,
        role: t.membershipRole
      })));
    } catch (error) {
      console.error('Error loading all memberships:', error);
      setAllMembershipsTeams([]);
    }
  }, [user?.$id]);

  /**
   * Load data when component mounts or user organizations change
   */
  useEffect(() => {
    loadMyTeams();
    loadAllMemberships();
  }, [loadMyTeams, loadAllMemberships]);

  /**
   * Get display name with proper fallback logic
   */
  const getDisplayName = () => {
    return user?.name || 'User';
  };

  /**
   * Handle team selection
   */
  const handleTeamSelect = async (team: TeamData) => {
    try {
      console.log('🔍 teams.tsx - handleTeamSelect called:', {
        teamId: team?.$id,
        teamName: team?.teamName,
        teamMembershipRole: (team as any)?.membershipRole,
        teamKeys: Object.keys(team || {}),
        teamFull: JSON.stringify(team, null, 2).substring(0, 500)
      });
      
      await switchTeam(team); // Pass the full team object
      
      console.log('🔍 teams.tsx - After switchTeam, checking currentTeam:', {
        currentTeamId: currentTeam?.$id,
        currentTeamMembershipRole: (currentTeam as any)?.membershipRole
      });
      
      router.push('/(jobs)');
    } catch (error) {
      console.error('Error switching team:', error);
    }
  };

  /**
   * Handle create team
   */
  const handleCreateTeam = () => {
    router.push('/(jobs)/new-team');
  };

  /**
   * Handle delete team
   */
  const handleDeleteTeam = () => {
    if (!currentTeam) return;
    
    const teamName = currentTeam.teamName || 'Team';
    
    router.push({
      pathname: '/(jobs)/delete-team',
      params: { teamId: currentTeam.$id, teamName },
    });
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Refresh organization context data
      await loadUserData();
      // Reload owned teams
      await loadMyTeams();
      // Reload all memberships
      await loadAllMemberships();
    } catch (error) {
      console.error('Error refreshing teams:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view teams</Text>
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

  // Use allMembershipsTeams for My Memberships tab (teams from ALL orgs where user is member)
  const membershipsOnly = allMembershipsTeams;

  const currentData = activeTab === 'memberships' ? membershipsOnly : myOwnedTeams;
  
  // Debug logging for current team and role
  useEffect(() => {
    if (currentTeam) {
      console.log('🔍 teams.tsx - Current team updated:', {
        teamId: currentTeam.$id,
        teamName: currentTeam.teamName,
        membershipRole: (currentTeam as any)?.membershipRole,
        membershipRoleType: typeof (currentTeam as any)?.membershipRole,
        hasMembershipRole: 'membershipRole' in (currentTeam as any),
        currentTeamKeys: Object.keys(currentTeam),
        fullCurrentTeam: JSON.stringify(currentTeam, null, 2).substring(0, 1000)
      });
    } else {
      console.log('🔍 teams.tsx - No current team set');
    }
  }, [currentTeam]);

  /**
   * Initialize tab and scroll to active team - runs only once on initial load
   */
  useEffect(() => {
    // Only run once when data is loaded and we haven't initialized yet
    if (hasInitializedRef.current || loading || !currentTeam?.$id) {
      return;
    }

    // Wait for both data sources to be available
    if (myOwnedTeams.length === 0 && membershipsOnly.length === 0) {
      return;
    }

    // Determine which tab the current team belongs to
    const isInMyTeams = myOwnedTeams.some(team => team.$id === currentTeam.$id);
    const isInMemberships = membershipsOnly.some(team => team.$id === currentTeam.$id);

    // Set the correct tab first
    if (isInMyTeams) {
      setActiveTab('myTeams');
    } else if (isInMemberships) {
      setActiveTab('memberships');
    }

    // Mark as initialized
    hasInitializedRef.current = true;
  }, [loading, currentTeam, myOwnedTeams, membershipsOnly]);

  /**
   * Scroll to active team after tab is set and data is ready
   */
  useEffect(() => {
    // Only scroll if we've initialized and have data
    if (!hasInitializedRef.current || loading || !currentTeam?.$id || currentData.length === 0) {
      return;
    }

    const activeIndex = currentData.findIndex(team => team.$id === currentTeam.$id);
    if (activeIndex >= 0 && flatListRef.current) {
      // Use a longer timeout to ensure the list is fully rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: activeIndex,
          animated: false, // Instant scroll so it's visible immediately
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [currentData, loading, currentTeam, activeTab]);

  /**
   * Reset initialization flag when navigating away (screen loses focus)
   */
  useFocusEffect(
    useCallback(() => {
      // Cleanup: Reset when screen loses focus (user navigates away)
      return () => {
        hasInitializedRef.current = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Teams</Text>
          <Text style={styles.subtitle}>Select your team</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'myTeams' && styles.activeTab
          ]}
          onPress={() => setActiveTab('myTeams')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'myTeams' && styles.activeTabText
          ]}>
            My Teams
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'memberships' && styles.activeTab
          ]}
          onPress={() => setActiveTab('memberships')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'memberships' && styles.activeTabText
          ]}>
            Member Of
          </Text>
        </TouchableOpacity>
      </View>

      {/* Teams List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={webColors.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={currentData}
          keyExtractor={(item) => item.$id}
          onScrollToIndexFailed={(info) => {
            // Handle scroll failure gracefully
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={webColors.accent}
              colors={[webColors.accent]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === 'memberships' ? 'No memberships yet' : 'No teams yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'memberships' 
                  ? 'Join a team to get started'
                  : 'Create your first team to start organizing your work'
                }
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: TeamData }) => {
            const teamName = item.teamName || 'Unnamed Team';
            const description = item.description || '';
            const teamPhotoUrl = item.teamPhotoUrl;
            const isActive = item.isActive !== false;
            const isCurrentTeam = currentTeam?.$id === item.$id;
            const membershipRole = (item as any).membershipRole || 'member';
            const isOwner = membershipRole === 'owner';
            
            // Look up organization name
            const orgName = userOrganizations.find(
              o => o.$id === item.orgId
            )?.orgName || '';
            
            return (
              <TouchableOpacity 
                style={[
                  styles.teamCard,
                  isActive ? styles.activeCard : styles.inactiveCard,
                  isCurrentTeam && styles.currentTeamCard
                ]}
                onPress={() => handleTeamSelect(item)}
              >
                {/* Team Photo */}
                <View style={styles.teamPhotoContainer}>
                  {teamPhotoUrl ? (
                    <Image 
                      source={{ uri: teamPhotoUrl }} 
                      style={styles.teamPhoto}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.teamPhotoPlaceholder}>
                      <IconSymbol
                        name="person.3"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                </View>
                
                <View style={styles.teamContent}>
                  <View style={styles.teamHeader}>
                    <Text style={styles.teamName}>{teamName}</Text>
                    <View style={styles.badgeContainer}>
                      <View style={[
                        styles.roleBadge,
                        isOwner && styles.roleBadgeOwner
                      ]}>
                        <Text style={[
                          styles.roleBadgeText,
                          isOwner && styles.roleBadgeTextOwner
                        ]}>
                          {isOwner ? 'Owner' : 'Member'}
                        </Text>
                      </View>
                      {isCurrentTeam && (
                        <View style={styles.currentTeamBadge}>
                          <Text style={styles.currentTeamBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {description ? (
                    <Text style={styles.description}>{description}</Text>
                  ) : null}
                  {orgName ? (
                    <Text style={styles.orgName}>{orgName}</Text>
                  ) : null}
                </View>
                <View style={styles.chevron}>
                  <IconSymbol
                    name="chevron.right"
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Menu */}
      <View style={styles.bottomContainer}>
        {activeTab === 'myTeams' && currentTeam && (
          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteTeam}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                name="trash"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.menuItemText}>Delete Team</Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {/* Create Team button - only show if user owns the current organization */}
        {currentOrganization?.ownerId === user?.$id && (
          <TouchableOpacity style={styles.menuItem} onPress={handleCreateTeam}>
            <View style={styles.menuItemLeft}>
              <IconSymbol
                name="plus"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.menuItemText}>Create Team</Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {currentTeam && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              router.push('/(jobs)/team');
            }}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                name="person.3"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.menuItemText}>Team Members (invite)</Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            router.push('/(jobs)/get-premium');
          }}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol
              name="creditcard"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.menuItemText}>Get Premium</Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {currentTeam && (() => {
          const isOwner = membershipRole === 'owner';
          
          // Verbose logging for debugging
          console.log('🔍 teams.tsx - Team Settings visibility check:', {
            hasCurrentTeam: !!currentTeam,
            currentTeamId: currentTeam?.$id,
            currentTeamName: currentTeam?.teamName,
            membershipRole: membershipRole,
            membershipRoleType: typeof membershipRole,
            membershipRoleLowercase: membershipRole?.toLowerCase(),
            isOwner: isOwner,
            isOwnerCheck: membershipRole === 'owner',
            currentTeamKeys: Object.keys(currentTeam || {}),
            currentTeamFull: JSON.stringify(currentTeam, null, 2).substring(0, 500) // First 500 chars
          });
          
          if (!isOwner) {
            console.log('❌ teams.tsx - Team Settings HIDDEN: User is not owner', {
              membershipRole,
              expectedRole: 'owner',
              comparison: membershipRole === 'owner'
            });
            return null;
          }
          
          console.log('✅ teams.tsx - Team Settings VISIBLE: User is owner');
          
          return (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('🔍 teams.tsx - Team Settings clicked, navigating...');
                router.push('/(jobs)/team-settings');
              }}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  name="gearshape"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.menuItemText}>Team Settings</Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })()}
        <View style={styles.bottomPadding} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: webColors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#000000',
  },
  listContent: {
    padding: 20,
    paddingBottom: 240, // Add padding to account for bottom menu
  },
  teamCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamPhoto: {
    width: '100%',
    height: '100%',
  },
  teamPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCard: {
    // Active cards have default styling
  },
  inactiveCard: {
    opacity: 0.6,
  },
  currentTeamCard: {
    backgroundColor: 'rgba(40, 247, 248, 0.1)', // Using accent cyan from webDesignTokens
  },
  teamContent: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(40, 247, 248, 0.15)', // cyan accent with opacity
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleBadgeOwner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // green (same as old Member color)
  },
  roleBadgeText: {
    color: webColors.accent, // cyan
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  roleBadgeTextOwner: {
    color: '#22c55e', // green
  },
  currentTeamBadge: {
    backgroundColor: webColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentTeamBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  chevron: {
    marginLeft: 12,
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
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  bottomPadding: {
    paddingBottom: 30,
  },
  orgName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
