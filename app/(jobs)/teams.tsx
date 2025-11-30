import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { webColors } from '@/styles/webDesignTokens';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';

import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { teamService, organizationService } from '@/lib/appwrite/teams';
import { teams } from '@/lib/appwrite/client';
import { databaseService } from '@/lib/appwrite/database';
import { Query } from 'react-native-appwrite';
import { Team } from '@/utils/types';



export default function Teams() {
  const { user, isAuthenticated } = useAuth();
  const { userOrganizations, userTeams, loadUserData, switchTeam, currentTeam } = useOrganization();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'memberships' | 'myTeams'>('myTeams');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myOwnedTeams, setMyOwnedTeams] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const hasInitializedRef = useRef(false);

  /**
   * Load teams from organizations owned by the user
   */
  const loadMyTeams = useCallback(async () => {
    if (!user?.$id || userOrganizations.length === 0) {
      setMyOwnedTeams([]);
      return;
    }

    try {
      setLoading(true);
      const ownedOrgIds = userOrganizations.map(org => org.$id);
      
      // Fetch teams for each owned organization
      const teamsPromises = ownedOrgIds.map(async (orgId) => {
        try {
          const response = await teamService.listOrganizationTeams(orgId);
          // Filter only teams from organizations owned by the user
          return response.teams || [];
        } catch (error) {
          console.error('Error loading teams for org:', orgId, error);
          return [];
        }
      });

      const teamsArrays = await Promise.all(teamsPromises);
      const allTeams = teamsArrays.flat();
      
      // Add membershipRole property to each team for consistency
      const teamsWithRoles = await Promise.all(
        allTeams.map(async (team) => {
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
      
      // Filter to only show teams from owned organizations
      // This prevents teams created in non-owned orgs from showing
      setMyOwnedTeams(teamsWithRoles);
    } catch (error) {
      console.error('Error loading my teams:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.$id, userOrganizations]);

  /**
   * Load data when component mounts or user organizations change
   */
  useEffect(() => {
    loadMyTeams();
  }, [loadMyTeams]);

  /**
   * Get display name with proper fallback logic
   */
  const getDisplayName = () => {
    return user?.name || 'User';
  };

  /**
   * Handle team selection
   */
  const handleTeamSelect = async (team: any) => {
    try {
      await switchTeam(team); // Pass the full team object
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
    
    const teamName = currentTeam.name || 'Team';
    
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

  // Filter userTeams to only show teams where user is a MEMBER but NOT an OWNER
  const membershipsOnly = userTeams.filter((team) => {
    // Check if user's role is "owner" in this team
    const isOwnerRole = (team as any).membershipRole === 'owner';
    
    // Check if this team belongs to an organization owned by the user
    const isFromOwnedOrg = myOwnedTeams.some(ownedTeam => ownedTeam.$id === team.$id);
    
    // Exclude if user is owner OR if team is from owned org
    return !isOwnerRole && !isFromOwnedOrg;
  });

  const currentData = activeTab === 'memberships' ? membershipsOnly : myOwnedTeams;

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
            My Memberships
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
          keyExtractor={(item) => item.$id || item.id}
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
          renderItem={({ item }) => {
            const teamName = item.name || item.teamData?.teamName || 'Unnamed Team';
            const description = item.teamData?.description || item.description || '';
            const isActive = item.teamData?.isActive !== false;
            const isCurrentTeam = currentTeam?.$id === item.$id;
            const membershipRole = (item as any).membershipRole || 'member';
            const isOwner = membershipRole === 'owner';
            
            return (
              <TouchableOpacity 
                style={[
                  styles.teamCard,
                  isActive ? styles.activeCard : styles.inactiveCard,
                  isCurrentTeam && styles.currentTeamCard
                ]}
                onPress={() => handleTeamSelect(item)}
              >
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
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
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
});
