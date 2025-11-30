import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { organizationService, teamService } from '@/lib/appwrite/teams';
import { Organization, Team, OrganizationContextType } from '@/utils/types';

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
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Refresh the current team data
   */
  const refreshCurrentTeam = async () => {
    if (!currentTeam?.$id) return;
    
    try {
      const updatedTeam = await teamService.getTeam(currentTeam.$id);
      setCurrentTeam(updatedTeam);
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
        setUserOrganizations(orgs);
      } catch (orgsError: any) {
        // Permission error when trying to list organizations
        console.warn('⚠️ Cannot load organizations (permission error):', orgsError.message);
        console.warn('⚠️ This indicates the "organizations" collection may need "read" permission for authenticated users');
        setUserOrganizations([]);
      }

      // Load user's teams (where they are member)
      // This may also fail if user doesn't have read permissions
      let teams: Team[] = [];
      try {
        const teamsResponse = await teamService.listTeams(user.$id);
        teams = teamsResponse.teams;
        setUserTeams(teams);
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
      const org = applyOrgDefaults(await organizationService.getOrganization(orgId));
      setCurrentOrganization(org);
      
      // Load teams for this organization
      const teamsResponse = await teamService.listOrganizationTeams(orgId);
      setUserTeams(teamsResponse.teams);
      
      // Set first team as current if available
      if (teamsResponse.teams.length > 0) {
        setCurrentTeam(teamsResponse.teams[0]);
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
      // Find the team in the current userTeams list by Appwrite ID
      let team = userTeams.find(t => t.$id === teamId);
      
      if (!team) {
        // Reload data and get fresh teams
        if (!user?.$id) {
          throw new Error('User not authenticated');
        }
        const teamsResponse = await teamService.listTeams(user.$id);
        const teams = teamsResponse.teams;
        setUserTeams(teams);
        
        // Try to find the team in the fresh data
        team = teams.find(t => t.$id === teamId);
        if (!team) {
          throw new Error('Team not found');
        }
      }
      
      // Fetch detailed team info (ensures teamData with orgId)
      const detailedTeam = await teamService.getTeam(team.$id);
      const mergedTeam = {
        ...detailedTeam,
        membershipRole: (team as any).membershipRole ?? (detailedTeam as any).membershipRole ?? null,
      } as unknown as Team;
      setCurrentTeam(mergedTeam);

      let orgId = detailedTeam.teamData?.orgId;

      if (!orgId) {
        console.warn('Unable to determine organization for team:', detailedTeam.$id);
        return;
      }

      try {
        const org = applyOrgDefaults(await organizationService.getOrganization(orgId));
        setCurrentOrganization(org);
      } catch (error) {
        console.error('Error loading organization for team:', error);
      }
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

      // Create the team
      await teamService.createTeam(name, currentOrganization.$id, description, ['owner'], user.$id);
      
      // Reload user data to get the complete team info with membership role
      await loadUserData();
      
      // Get the newly created team from the updated userTeams
      const updatedTeams = await teamService.listTeams(user.$id);
      const newTeam = updatedTeams.teams.find(t => t.name === name);
      
      if (!newTeam) {
        throw new Error('Failed to create team');
      }

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

      // Use a placeholder URL for now - in production, this should be your app's deep link
      const inviteUrl = `workphotopro://team-invite?teamId=${teamId}`;
      
      await teamService.createMembership(teamId, email, roles, inviteUrl, user.$id);
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
      await teamService.updateMembershipRoles(teamId, membershipId, roles);
      
      // Refresh team data
      const team = await teamService.getTeam(teamId);
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
      await teamService.deleteMembership(teamId, membershipId);
      
      // Refresh team data
      const team = await teamService.getTeam(teamId);
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
          teamDescription,
          ['owner'], // User is the owner of their default team
          userId // Pass userId to create membership
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
  const switchTeamDirect = async (teamOrId: Team | string) => {
    let team: Team | null = null;
    
    if (typeof teamOrId === 'string') {
      // If it's a string, use the existing switchTeam logic
      team = userTeams.find(t => t.$id === teamOrId) || null;
      if (!team) {
        throw new Error('Team not found');
      }
    } else {
      // If it's a team object, use it directly
      team = teamOrId;
    }
    
    console.log('🔍 switchTeamDirect: Switching to team:', {
      teamId: team.$id,
      teamName: team.name,
      hasTeamData: !!team.teamData,
      orgId: team.teamData?.orgId
    });
    
    // Set the current team
    setCurrentTeam(team);
    
    // Update currentOrganization to match the team's organization
    if (team?.teamData?.orgId) {
      try {
        console.log('🔍 switchTeamDirect: Fetching organization:', team.teamData.orgId);
        const org = applyOrgDefaults(
          await organizationService.getOrganization(team.teamData.orgId)
        );
        console.log('🔍 switchTeamDirect: Fetched organization:', org.orgName);
        setCurrentOrganization(org);
      } catch (error) {
        console.error('Error fetching organization for team:', error);
        // Continue even if organization fetch fails
      }
    } else {
      console.warn('🔍 switchTeamDirect: No orgId found in team.teamData');
    }
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
