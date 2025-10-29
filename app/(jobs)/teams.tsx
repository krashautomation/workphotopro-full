import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

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
  
  const [activeTab, setActiveTab] = useState<'memberships' | 'myTeams'>('memberships');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myOwnedTeams, setMyOwnedTeams] = useState<any[]>([]);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Teams</Text>
          <Text style={styles.subtitle}>Select your team</Text>
        </View>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="xmark"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
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
      </View>

      {/* Teams List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.$id || item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
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
            
            return (
              <TouchableOpacity 
                style={[
                  styles.teamCard,
                  isActive ? styles.activeCard : styles.inactiveCard,
                  isCurrentTeam && styles.currentTeamCard
                ]}
                onPress={() => handleTeamSelect(item)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.teamNameContainer}>
                      <Text style={styles.teamName}>{teamName}</Text>
                      {isCurrentTeam && (
                        <View style={styles.currentTeamBadge}>
                          <Text style={styles.currentTeamBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.statusIndicator}>
                      <IconSymbol
                        name={isActive ? "checkmark.circle.fill" : "pause.circle.fill"}
                        size={16}
                        color={isActive ? colors.success : colors.textMuted}
                      />
                    </View>
                  </View>
                  {description ? (
                    <Text style={styles.description}>{description}</Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        {activeTab === 'myTeams' && currentTeam && (
          <TouchableOpacity 
            style={styles.deleteTeamButton}
            onPress={handleDeleteTeam}
          >
            <IconSymbol
              name="trash"
              size={20}
              color="#ef4444"
            />
            <Text style={styles.deleteTeamButtonText}>Delete Team</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateTeam}
        >
          <IconSymbol
            name="plus"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.createButtonText}>Create Team</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => {
            router.push('/(jobs)/get-premium');
          }}
        >
          <IconSymbol
            name="creditcard"
            size={20}
            color="#FFD700"
          />
          <Text style={styles.premiumButtonText}>Get Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => {
            router.push('/(jobs)/team-settings');
          }}
        >
          <IconSymbol
            name="gearshape"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.settingsButtonText}>Team Settings</Text>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  listContent: {
    padding: 20,
    paddingBottom: 240, // Add padding to account for bottom buttons (increased for new buttons)
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  activeCard: {
    // Active cards have default styling
  },
  inactiveCard: {
    opacity: 0.6,
  },
  currentTeamCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  currentTeamBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentTeamBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  statusIndicator: {
    marginLeft: 8,
  },
  organizationName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  roleContainer: {
    marginBottom: 12,
  },
  roleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteTeamButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteTeamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  createButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  premiumButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  settingsButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
