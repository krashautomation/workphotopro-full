import { teams } from './client';
import { ID } from 'appwrite';

export const teamService = {
  /**
   * Create a new team (organization)
   */
  async createTeam(name: string, roles?: string[]) {
    try {
      return await teams.create(ID.unique(), name, roles);
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID
   */
  async getTeam(teamId: string) {
    try {
      return await teams.get(teamId);
    } catch (error) {
      console.error('Get team error:', error);
      throw error;
    }
  },

  /**
   * List all teams the current user is a member of
   */
  async listTeams() {
    try {
      return await teams.list();
    } catch (error) {
      console.error('List teams error:', error);
      throw error;
    }
  },

  /**
   * Update team name
   */
  async updateTeam(teamId: string, name: string) {
    try {
      return await teams.updateName(teamId, name);
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string) {
    try {
      return await teams.delete(teamId);
    } catch (error) {
      console.error('Delete team error:', error);
      throw error;
    }
  },

  /**
   * Create team membership (invite user)
   */
  async createMembership(
    teamId: string,
    email: string,
    roles: string[],
    url: string
  ) {
    try {
      return await teams.createMembership(teamId, roles, email, undefined, undefined, url);
    } catch (error) {
      console.error('Create membership error:', error);
      throw error;
    }
  },

  /**
   * List team members
   */
  async listMemberships(teamId: string) {
    try {
      return await teams.listMemberships(teamId);
    } catch (error) {
      console.error('List memberships error:', error);
      throw error;
    }
  },

  /**
   * Update membership roles
   */
  async updateMembershipRoles(
    teamId: string,
    membershipId: string,
    roles: string[]
  ) {
    try {
      return await teams.updateMembershipRoles(teamId, membershipId, roles);
    } catch (error) {
      console.error('Update membership roles error:', error);
      throw error;
    }
  },

  /**
   * Delete team membership
   */
  async deleteMembership(teamId: string, membershipId: string) {
    try {
      return await teams.deleteMembership(teamId, membershipId);
    } catch (error) {
      console.error('Delete membership error:', error);
      throw error;
    }
  },
};

