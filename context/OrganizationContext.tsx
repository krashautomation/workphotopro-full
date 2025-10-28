import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { organizationService, teamService } from '@/lib/appwrite/teams';
import { Organization, Team, OrganizationContextType } from '@/utils/types';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

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
      const orgsResponse = await organizationService.listUserOrganizations(user.$id);
      const orgs = orgsResponse.documents;
      setUserOrganizations(orgs);

      // Load user's teams (where they are member)
      const teamsResponse = await teamService.listTeams(user.$id);
      const teams = teamsResponse.teams;
      setUserTeams(teams);

      // If user has no organizations, create a default one
      if (orgs.length === 0) {
        console.log('🏢 No organizations found, creating default workspace for existing user');
        try {
          const { organization, team } = await createDefaultWorkspace(
            user.$id, 
            user.name || 'User', 
            user.email
          );
          
          if (organization) {
            setUserOrganizations([organization]);
            setCurrentOrganization(organization);
          }
          
          if (team) {
            setUserTeams([team]);
            setCurrentTeam(team);
          }
        } catch (error) {
          console.error('Failed to create default workspace for existing user:', error);
        }
      } else {
        // Use functional update to get the current state
        setCurrentOrganization(prevOrg => {
          if (prevOrg) {
            // Update the current organization with fresh data
            const updatedOrg = orgs.find(org => org.$id === prevOrg.$id);
            return updatedOrg || orgs[0];
          } else {
            // Set default organization if none selected
            return orgs[0];
          }
        });
        
        if (teams.length > 0 && !currentTeam) {
          setCurrentTeam(teams[0]);
        }
      }

    } catch (error) {
      console.error('Error loading user organizations and teams:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch to a different organization
   */
  const switchOrganization = async (orgId: string) => {
    try {
      const org = await organizationService.getOrganization(orgId);
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
        const orgsResponse = await organizationService.listUserOrganizations(user.$id);
        const teamsResponse = await teamService.listTeams(user.$id);
        const teams = teamsResponse.teams;
        setUserTeams(teams);
        
        // Try to find the team in the fresh data
        team = teams.find(t => t.$id === teamId);
        if (!team) {
          throw new Error('Team not found');
        }
      }
      
      setCurrentTeam(team);
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

      const org = await organizationService.createOrganization(name, description, user.$id);
      
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
      
      if (newTeam) {
        setCurrentTeam(newTeam);
      }

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
   */
  const createDefaultWorkspace = async (userId: string, userName: string, userEmail: string) => {
    try {
      console.log('🏢 Creating default workspace for user:', userId);
      
      // Check if user already has organizations (avoid duplicates)
      const existingOrgs = await organizationService.listUserOrganizations(userId);
      if (existingOrgs.documents.length > 0) {
        console.log('🏢 User already has organizations, skipping workspace creation');
        return;
      }

      // Create organization with placeholder data
      const orgName = `${userName}'s Organization`;
      const orgDescription = `Welcome to ${userName}'s workspace!`;
      
      const organization = await organizationService.createOrganization(
        orgName,
        orgDescription,
        userId
      );
      
      console.log('🏢 Created organization:', organization.$id);

      // Create default team
      const teamName = `${userName} Team`;
      const teamDescription = `Your personal team in ${orgName}`;
      
      const team = await teamService.createTeam(
        teamName,
        organization.$id,
        teamDescription,
        ['owner'], // User is the owner of their default team
        userId // Pass userId to create membership
      );
      
      console.log('🏢 Created team:', team.$id);
      
      return { organization, team };
    } catch (error) {
      console.error('🏢 Error creating default workspace:', error);
      throw error;
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
    if (typeof teamOrId === 'string') {
      // If it's a string, use the existing switchTeam logic
      const team = userTeams.find(t => t.$id === teamOrId);
      if (!team) {
        throw new Error('Team not found');
      }
      setCurrentTeam(team);
    } else {
      // If it's a team object, use it directly
      setCurrentTeam(teamOrId);
    }
  };

  const value: OrganizationContextType = {
    currentOrganization,
    currentTeam,
    userOrganizations,
    userTeams,
    loading,
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
