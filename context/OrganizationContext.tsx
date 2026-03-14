import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { organizationService } from '@/lib/appwrite/teams';
import { teamService } from '@/services/teamService';
import { databaseService } from '@/lib/appwrite/database';
import { Organization, Team, OrganizationContextType, TeamData } from '@/utils/types';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const applyOrgDefaults = (org: Organization): Organization => ({
  ...org,
  premiumTier: org.premiumTier || 'free',
  hdCaptureEnabled: org.hdCaptureEnabled ?? false,
  timestampEnabled: org.timestampEnabled ?? true,
  watermarkEnabled: org.watermarkEnabled ?? true,
  videoRecordingEnabled: org.videoRecordingEnabled ?? false,
  hdVideoEnabled: org.hdVideoEnabled ?? false,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentTeam, setCurrentTeam] = useState<TeamData | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userTeams, setUserTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Refresh the current team data
   */
  const refreshCurrentTeam = async () => {
    if (!currentTeam?.$id || !currentOrganization?.$id) return;
    
    try {
      const updatedTeam = await teamService.getTeam(currentTeam.$id, currentOrganization.$id);
      
      // Preserve membershipRole from current team if it exists
      const preservedMembershipRole = (currentTeam as any)?.membershipRole;
      
      // If membershipRole is missing, fetch it
      let membershipRole = preservedMembershipRole;
      if (!membershipRole && user?.$id) {
        try {
          const { databaseService } = await import('@/lib/appwrite/database');
          const { Query } = await import('react-native-appwrite');
          const memberships = await databaseService.listDocuments('memberships', [
            Query.equal('userId', user.$id),
            Query.equal('teamId', currentTeam.$id),
            Query.equal('isActive', true)
          ]);
          
          if (memberships.documents && memberships.documents.length > 0) {
            membershipRole = memberships.documents[0].role || 'member';
          }
        } catch (error) {
          console.warn('Could not fetch membership role when refreshing team:', error);
        }
      }
      
      // Merge updated team with preserved membershipRole
      const teamWithRole = {
        ...updatedTeam,
        membershipRole: membershipRole || preservedMembershipRole || null
      } as unknown as TeamData;
      
      setCurrentTeam(teamWithRole);
    } catch (error) {
      console.error('Error refreshing current team:', error);
    }
  };

  /**
   * Load user's organizations and teams
   */
  const loadUserData = async () => {
    if (!user?.$id || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load user's organizations (where they are owner)
      // This may fail if user doesn't have read permissions
      let orgs: Organization[] = [];
      try {
        const orgsResponse = await organizationService.listUserOrganizations(user.$id);
        orgs = orgsResponse.documents.map(applyOrgDefaults);
      } catch (orgsError: any) {
        // Permission error when trying to list organizations
        console.warn('⚠️ Cannot load organizations (permission error):', orgsError.message);
        console.warn('⚠️ This indicates the "organizations" collection may need "read" permission for authenticated users');
      }

      // Also load organizations where user is a team member (via memberships)
      try {
        const { Query } = await import('react-native-appwrite');
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('userId', user.$id),
          Query.equal('isActive', true)
        ]);
        
        // Get unique orgIds from memberships
        const orgIdsFromMemberships = [...new Set(memberships.documents?.map((m: any) => m.orgId) || [])];
        
        // Fetch organizations for those orgIds
        const orgsFromMemberships = await Promise.all(
          orgIdsFromMemberships.map(async (orgId: string) => {
            try {
              const org = await organizationService.getOrganization(orgId);
              return applyOrgDefaults(org);
            } catch (error) {
              console.warn(`⚠️ Could not load organization ${orgId}:`, error);
              return null;
            }
          })
        );
        
        // Combine owned orgs with orgs from memberships, removing duplicates
        const allOrgs = [...orgs];
        orgsFromMemberships.forEach(org => {
          if (org && !allOrgs.some(o => o.$id === org.$id)) {
            allOrgs.push(org);
          }
        });
        
        orgs = allOrgs;
        setUserOrganizations(orgs);
        
        console.log('✅ Loaded organizations:', orgs.map(o => ({ id: o.$id, name: o.orgName })));
      } catch (error) {
        console.warn('⚠️ Could not load organizations from memberships:', error);
        setUserOrganizations(orgs);
      }

      // Load user's teams (where they are member) for all organizations
      // This may also fail if user doesn't have read permissions
      let teams: TeamData[] = [];
      try {
        // Load teams for each organization the user belongs to
        const allTeamsPromises = orgs.map(org => 
          teamService.listTeams(user.$id, org.$id).catch(err => {
            console.warn(`⚠️ Cannot load teams for org ${org.$id}:`, err.message);
            return [];
          })
        );
        const teamsArrays = await Promise.all(allTeamsPromises);
        teams = teamsArrays.flat();
        
        // Fetch user's memberships to get roles
        try {
          const { Query } = await import('react-native-appwrite');
          const memberships = await databaseService.listDocuments('memberships', [
            Query.equal('userId', user.$id),
            Query.equal('isActive', true)
          ]);
          
          // Create a map of teamId -> role
          const membershipRoles: Record<string, string> = {};
          memberships.documents?.forEach((m: any) => {
            membershipRoles[m.teamId] = m.role;
          });
          
          // Attach membershipRole to each team
          teams = teams.map(team => ({
            ...team,
            membershipRole: membershipRoles[team.$id] || 'member'
          })) as any;
          
          console.log('✅ Attached membership roles to teams:', teams.map((t: any) => ({ 
            teamId: t.$id, 
            teamName: t.teamName, 
            role: t.membershipRole 
          })));
        } catch (membershipError) {
          console.warn('⚠️ Could not fetch membership roles:', membershipError);
          // Continue without roles - teams will default to member
        }
        
        setUserTeams(teams as any);
      } catch (teamsError: any) {
        // Permission error when trying to list teams
        console.warn('⚠️ Cannot load teams (permission error):', teamsError.message);
        console.warn('⚠️ This indicates the "teams" collection may need "read" permission for authenticated users');
        setUserTeams([]);
      }

      // If user has no organizations, try to create a default one
      if (orgs.length === 0) {
        console.log('🏢 No organizations found, attempting to create default workspace for existing user');
        const { organization, team } = await createDefaultWorkspace(
          user.$id, 
          user.name || 'User', 
          user.email
        );
        
        if (organization) {
          const normalizedOrg = applyOrgDefaults(organization);
          setUserOrganizations([normalizedOrg]);
          setCurrentOrganization(normalizedOrg);
        }
        
        if (team) {
          setUserTeams([team]);
          setCurrentTeam(team);
        }
      } else {
        // Use functional update to get the current state
        setCurrentOrganization(prevOrg => {
          if (prevOrg) {
            // Update the current organization with fresh data
            const updatedOrg = orgs.find(org => org.$id === prevOrg.$id);
            console.log('🔄 OrganizationContext - Updating current organization');
            console.log('🔄 Previous org logoUrl:', prevOrg.logoUrl);
            console.log('🔄 Updated org logoUrl:', updatedOrg?.logoUrl);
            console.log('🔄 All orgs:', orgs.map(o => ({ id: o.$id, name: o.orgName, logoUrl: o.logoUrl })));
            const finalOrg = updatedOrg || orgs[0];
            console.log('🔄 Final org logoUrl:', finalOrg?.logoUrl);
            return finalOrg;
          } else {
            // Set default organization if none selected
            console.log('🔄 OrganizationContext - Setting default organization');
            console.log('🔄 Default org logoUrl:', orgs[0]?.logoUrl);
            return orgs[0];
          }
        });
        
        if (teams.length > 0 && !currentTeam) {
          setCurrentTeam(teams[0]);
        }
      }

    } catch (error: any) {
      // Catch-all for unexpected errors
      console.error('❌ Error loading user organizations and teams:', error);
      console.error('❌ Error details:', error.message);
      console.warn('⚠️ User data loading failed, but app will continue');
      // Set empty arrays so app can continue
      setUserOrganizations([]);
      setUserTeams([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch to a different organization
   */
  const switchOrganization = async (orgId: string) => {
    try {
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }
      
      const org = applyOrgDefaults(await organizationService.getOrganization(orgId));
      setCurrentOrganization(org);
      
      // Load teams for this organization
      let teams = await teamService.listTeams(user.$id, orgId);
      
      // Fetch user's memberships to get roles
      try {
        const { Query } = await import('react-native-appwrite');
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('userId', user.$id),
          Query.equal('isActive', true)
        ]);
        
        const membershipRoles: Record<string, string> = {};
        memberships.documents?.forEach((m: any) => {
          membershipRoles[m.teamId] = m.role;
        });
        
        teams = teams.map(team => ({
          ...team,
          membershipRole: membershipRoles[team.$id] || 'member'
        })) as any;
      } catch (membershipError) {
        console.warn('⚠️ Could not fetch membership roles:', membershipError);
      }
      
      setUserTeams(teams);
      
      // Set first team as current if available
      if (teams.length > 0) {
        setCurrentTeam(teams[0]);
      } else {
        setCurrentTeam(null);
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  };

  /**
   * Switch to a different team
   */
  const switchTeam = async (teamId: string) => {
    try {
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }
      
      // Find the team in the current userTeams list
      let team = userTeams.find((t: TeamData) => t.$id === teamId);
      
      if (!team) {
        // Reload data and get fresh teams for all organizations
        const allTeamsPromises = userOrganizations.map(org => 
          teamService.listTeams(user.$id, org.$id).catch(err => {
            console.warn(`⚠️ Cannot load teams for org ${org.$id}:`, err.message);
            return [];
          })
        );
        const teamsArrays = await Promise.all(allTeamsPromises);
        const teams = teamsArrays.flat();
        setUserTeams(teams);
        
        // Try to find the team in the fresh data
        team = teams.find((t: TeamData) => t.$id === teamId);
        if (!team) {
          throw new Error('Team not found');
        }
      }
      
      // Fetch detailed team info with org validation
      const detailedTeam = await teamService.getTeam(team.$id, team.orgId);
      setCurrentTeam(detailedTeam);

      // Note: We do NOT switch currentOrganization here.
      // currentOrganization should remain as the user's owned organization.
      // The user can work in teams across different orgs while keeping their
      // "home" organization context stable.
    } catch (error) {
      console.error('Error switching team:', error);
      throw error;
    }
  };

  /**
   * Create a new organization
   */
  const createOrganization = async (name: string, description?: string) => {
    try {
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      const org = applyOrgDefaults(
        await organizationService.createOrganization(name, description, user.$id)
      );
      
      // Add to user's organizations
      setUserOrganizations(prev => [...prev, org]);
      
      // Set as current organization if it's the first one
      if (userOrganizations.length === 0) {
        setCurrentOrganization(org);
      }

      return org;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  /**
   * Create a new team
   */
  const createTeam = async (name: string, description?: string) => {
    try {
      if (!currentOrganization?.$id) {
        throw new Error('No organization selected');
      }
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      // Create the team (new API: name, orgId, userId, description?)
      const newTeam = await teamService.createTeam(name, currentOrganization.$id, user.$id, description);
      
      // Reload user data to get the complete team info with membership role
      await loadUserData();
      
      setCurrentTeam(newTeam);
      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  };

  /**
   * Invite user to team
   */
  const inviteToTeam = async (teamId: string, email: string, roles: string[]) => {
    try {
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }
      if (!currentOrganization?.$id) {
        throw new Error('No organization selected');
      }

      await teamService.inviteMember(teamId, currentOrganization.$id, email, roles, user.$id);
    } catch (error) {
      console.error('Error inviting user to team:', error);
      throw error;
    }
  };

  /**
   * Update membership role
   */
  const updateMembershipRole = async (teamId: string, membershipId: string, roles: string[]) => {
    try {
      if (!currentOrganization?.$id) {
        throw new Error('No organization selected');
      }

      await teamService.updateMemberRole(teamId, membershipId, roles, currentOrganization.$id);
      
      // Refresh team data
      const team = await teamService.getTeam(teamId, currentOrganization.$id);
      setCurrentTeam(team);
    } catch (error) {
      console.error('Error updating membership role:', error);
      throw error;
    }
  };

  /**
   * Remove user from team
   */
  const removeFromTeam = async (teamId: string, membershipId: string) => {
    try {
      if (!currentOrganization?.$id) {
        throw new Error('No organization selected');
      }

      await teamService.removeMember(teamId, membershipId, currentOrganization.$id);
      
      // Refresh team data
      const team = await teamService.getTeam(teamId, currentOrganization.$id);
      setCurrentTeam(team);
    } catch (error) {
      console.error('Error removing user from team:', error);
      throw error;
    }
  };

  /**
   * Create default organization and team for new users
   * This is a non-blocking operation - errors won't prevent login
   */
  const createDefaultWorkspace = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Creating default workspace for user:', userId);
      
      // Check if user already has organizations (avoid duplicates)
      // This may fail if user doesn't have read permissions - that's OK, we'll continue
      let existingOrgs;
      try {
        existingOrgs = await organizationService.listUserOrganizations(userId);
        if (existingOrgs.documents.length > 0) {
          console.log('🏢 User already has organizations, skipping workspace creation');
          return { organization: null, team: null };
        }
      } catch (listError: any) {
        // If we can't list organizations due to permissions, log but continue
        console.warn('⚠️ Cannot check existing organizations (permission error):', listError.message);
        console.warn('⚠️ This may indicate that collection permissions need to be configured in Appwrite Console');
        // Continue with workspace creation attempt - maybe we can create but not read
      }

      // Create organization with placeholder data
      const orgName = `${userName}'s Organization`;
      const orgDescription = `Welcome to ${userName}'s workspace!`;
      
      let organization;
      try {
        organization = await organizationService.createOrganization(
          orgName,
          orgDescription,
          userId
        );
        console.log('✅ Created organization:', organization.$id);
      } catch (createOrgError: any) {
        // Organization creation failed - likely permission issue
        console.error('❌ Failed to create organization:', createOrgError.message);
        console.error('❌ This indicates the "organizations" collection may need permissions configured in Appwrite Console');
        console.error('❌ Required permissions: "create" for authenticated users');
        // Don't throw - workspace creation is optional
        return { organization: null, team: null };
      }

      // Create default team
      const teamName = `${userName} Team`;
      const teamDescription = `Your personal team in ${orgName}`;
      
      let team;
      try {
        team = await teamService.createTeam(
          teamName,
          organization.$id,
          userId,
          teamDescription
        );
        console.log('✅ Created team:', team.$id);
      } catch (createTeamError: any) {
        // Team creation failed - log but don't throw
        console.error('❌ Failed to create team:', createTeamError.message);
        console.error('❌ This indicates the "teams" or "memberships" collections may need permissions configured');
        console.error('❌ Required permissions: "create" for authenticated users');
        // Organization was created but team wasn't - return what we have
        return { organization, team: null };
      }
      
      return { organization, team };
    } catch (error: any) {
      // Catch-all for any unexpected errors
      console.error('❌ Unexpected error creating default workspace:', error);
      console.error('❌ Error details:', error.message);
      console.warn('⚠️ Workspace creation failed but login will continue');
      // Return null values to indicate failure without throwing
      return { organization: null, team: null };
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setCurrentOrganization(null);
      setCurrentTeam(null);
      setUserOrganizations([]);
      setUserTeams([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Switch to a different team (accepts team object or teamId)
   */
  const switchTeamDirect = async (teamOrId: TeamData | string) => {
    const teamId = typeof teamOrId === 'string' ? teamOrId : teamOrId.$id;
    const orgId = typeof teamOrId === 'string' ? 'unknown' : teamOrId.orgId;
    console.log('switchTeam called with:', teamId, orgId);
    let team: TeamData | null = null;
    
    if (typeof teamOrId === 'string') {
      // If it's a string, find the team in userTeams
      team = userTeams.find((t: TeamData) => t.$id === teamOrId) || null;
      if (!team) {
        throw new Error('Team not found');
      }
    } else {
      // If it's a team object, use it directly
      team = teamOrId;
    }
    
    // Always fetch membershipRole to ensure it's current
    if (user?.$id) {
      try {
        const { databaseService } = await import('@/lib/appwrite/database');
        const { Query } = await import('react-native-appwrite');
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('userId', user.$id),
          Query.equal('teamId', team.$id),
          Query.equal('isActive', true)
        ]);
        
        if (memberships.documents && memberships.documents.length > 0) {
          (team as any).membershipRole = memberships.documents[0].role || 'member';
        } else {
          // If no membership found, preserve existing role or default to 'member'
          (team as any).membershipRole = (team as any).membershipRole || 'member';
        }
      } catch (error) {
        console.warn('Could not fetch membership role for team:', error);
        // Preserve existing role or default to 'member' if we can't fetch
        (team as any).membershipRole = (team as any).membershipRole || 'member';
      }
    } else {
      // If no user, preserve existing role or default to 'member'
      (team as any).membershipRole = (team as any).membershipRole || 'member';
    }
    
    console.log('🔍 switchTeamDirect: Switching to team:', {
      teamId: team.$id,
      teamName: team.teamName,
      orgId: team.orgId,
      membershipRole: (team as any).membershipRole
    });
    
    // Set the current team
    setCurrentTeam(team);
    
    // Note: We do NOT switch currentOrganization here.
    // currentOrganization should remain as the user's owned organization.
    // This allows users to work in teams across different orgs while keeping
    // their "home" organization context stable for "My Teams" tab.
  };

  const currentOrgPremiumTier = currentOrganization?.premiumTier || 'free';
  const isHDCaptureEnabled = currentOrganization?.hdCaptureEnabled ?? false;
  const isCurrentOrgPremium =
    currentOrgPremiumTier !== 'free' || isHDCaptureEnabled;

  const value: OrganizationContextType = {
    currentOrganization,
    currentTeam,
    userOrganizations,
    userTeams,
    loading,
    currentOrgPremiumTier,
    isCurrentOrgPremium,
    isHDCaptureEnabled,
    loadUserData,
    refreshCurrentTeam,
    switchOrganization,
    switchTeam: switchTeamDirect,
    createOrganization,
    createTeam,
    inviteToTeam,
    updateMembershipRole,
    removeFromTeam,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};
