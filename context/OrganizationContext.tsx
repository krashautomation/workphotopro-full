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
      const teamsResponse = await teamService.listTeams();
      const teams = teamsResponse.teams;
      setUserTeams(teams);

      // Set default organization and team if none selected
      if (orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0]);
      }
      
      if (teams.length > 0 && !currentTeam) {
        setCurrentTeam(teams[0]);
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
      const team = await teamService.getTeam(teamId);
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

      const team = await teamService.createTeam(name, currentOrganization.$id, description);
      
      // Add to user's teams
      setUserTeams(prev => [...prev, team]);
      
      // Set as current team if it's the first one
      if (userTeams.length === 0) {
        setCurrentTeam(team);
      }

      return team;
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

  const value: OrganizationContextType = {
    currentOrganization,
    currentTeam,
    userOrganizations,
    userTeams,
    loading,
    switchOrganization,
    switchTeam,
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
