import { teams } from './client';
import { ID, Query } from 'react-native-appwrite';
import { databaseService } from './database';
import { Organization, Team, TeamData, Membership, MembershipData, TeamRole } from '@/utils/types';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

export const organizationService = {
  /**
   * Create a new organization
   */
  async createOrganization(name: string, description?: string, ownerId?: string) {
    try {
      const orgData = {
        orgName: name,
        description: description || '',
        isActive: true,
        settings: '{}', // Default empty settings
        ...(ownerId && { ownerId })
      };

      return await databaseService.createDocument('organizations', orgData);
    } catch (error) {
      console.error('Create organization error:', error);
      throw error;
    }
  },

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string) {
    try {
      return await databaseService.getDocument('organizations', orgId);
    } catch (error) {
      console.error('Get organization error:', error);
      throw error;
    }
  },

  /**
   * List organizations for a user
   */
  async listUserOrganizations(userId: string) {
    try {
      return await databaseService.listDocuments('organizations', [
        Query.equal('ownerId', userId),
        Query.equal('isActive', true)
      ]);
    } catch (error) {
      console.error('List user organizations error:', error);
      throw error;
    }
  },

  /**
   * Update organization
   */
  async updateOrganization(orgId: string, data: Partial<Organization>) {
    try {
      return await databaseService.updateDocument('organizations', orgId, data);
    } catch (error) {
      console.error('Update organization error:', error);
      throw error;
    }
  },

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(orgId: string) {
    try {
      return await databaseService.updateDocument('organizations', orgId, {
        isActive: false
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      throw error;
    }
  }
};

export const teamService = {
  /**
   * Create a new team (both Appwrite Teams and our database)
   */
  async createTeam(name: string, orgId: string, description?: string, roles?: string[], userId?: string) {
    try {
      // Create Appwrite Team
      const appwriteTeam = await teams.create(ID.unique(), name, roles);
      
      // Create our custom team data
      const teamData = {
        teamName: name,
        orgId: orgId,
        description: description || '',
        isActive: true,
        settings: '{}' // Default empty settings
      };

      const teamDoc = await databaseService.createDocument('teams', teamData);
      
      // Create membership for the creator as owner
      if (userId) {
        try {
          const membershipData = {
            userId: userId,
            teamId: appwriteTeam.$id,
            role: 'owner',
            invitedBy: userId,
            joinedAt: new Date().toISOString(),
            isActive: true
          };

          await databaseService.createDocument('memberships', membershipData);
        } catch (membershipError) {
          console.error('Could not create membership record:', membershipError);
          // Don't fail team creation if membership creation fails
        }
      }
      
      return {
        ...appwriteTeam,
        teamData: teamDoc
      };
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID (both Appwrite and our database)
   */
  async getTeam(teamId: string) {
    try {
      // Try to get from Appwrite first
      const appwriteTeam = await teams.get(teamId);
      
      // Get our custom team data
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('teamName', appwriteTeam.name)
      ]);

      return {
        ...appwriteTeam,
        teamData: teamData.documents[0] || null
      };
    } catch (error) {
      // If Appwrite lookup fails, try to construct from database
      console.warn('Could not fetch from Appwrite, trying database...', error);
      
      // Search for team by ID in memberships
      const memberships = await databaseService.listDocuments('memberships', [
        Query.equal('teamId', teamId)
      ]);
      
      if (memberships.documents && memberships.documents.length > 0) {
        // Found membership, but we need to find the team name
        // Since we don't have it, we need to search all teams
        const allTeams = await teams.list();
        const matchingTeam = allTeams.teams.find(t => t.$id === teamId);
        
        if (matchingTeam) {
          const teamData = await databaseService.listDocuments('teams', [
            Query.equal('teamName', matchingTeam.name)
          ]);
          
          return {
            ...matchingTeam,
            teamData: teamData.documents[0] || null
          };
        }
      }
      
      console.error('Get team error: Team not found', error);
      throw error;
    }
  },

  /**
   * List all teams the current user is a member of
   */
  async listTeams(userId?: string) {
    try {
      const appwriteTeams = await teams.list();
      
      // Get our custom team data and membership info for each team
      const teamsWithData = await Promise.all(
        appwriteTeams.teams.map(async (team) => {
          try {
            // Get team data from our database
            const teamData = await databaseService.listDocuments('teams', [
              Query.equal('teamName', team.name)
            ]);
            
            // Only return teams that exist in our database
            if (!teamData.documents || teamData.documents.length === 0) {
              return null; // Skip teams not in our database
            }
            
            // Get membership info to check user's role (from our database)
            let membershipRole = null;
            if (userId) {
              try {
                const memberships = await databaseService.listDocuments('memberships', [
                  Query.equal('userId', userId),
                  Query.equal('teamId', team.$id),
                  Query.equal('isActive', true)
                ]);
                
                if (memberships.documents && memberships.documents.length > 0) {
                  membershipRole = memberships.documents[0].role || null;
                }
              } catch (error) {
                console.warn('Could not fetch membership data for team:', team.name);
              }
            }
            
            return {
              ...team,
              teamData: teamData.documents[0] || null,
              membershipRole: membershipRole || null
            };
          } catch (error) {
            console.warn('Could not fetch team data for:', team.name);
            return null; // Skip teams with errors
          }
        })
      );

      // Filter out null values (teams not in our database or with errors)
      const validTeams = teamsWithData.filter(team => team !== null);

      return {
        teams: validTeams,
        total: validTeams.length
      };
    } catch (error) {
      console.error('List teams error:', error);
      throw error;
    }
  },

  /**
   * List teams for a specific organization
   */
  async listOrganizationTeams(orgId: string) {
    try {
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('orgId', orgId),
        Query.equal('isActive', true)
      ]);

      // Get Appwrite team data for each team
      const teamsWithAppwriteData = await Promise.all(
        teamData.documents.map(async (team) => {
          try {
            const appwriteTeam = await teams.get(team.teamName); // Assuming teamName matches Appwrite team name
            return {
              ...appwriteTeam,
              teamData: team
            };
          } catch (error) {
            console.warn('Could not fetch Appwrite team data for:', team.teamName);
            return {
              $id: team.$id,
              name: team.teamName,
              $createdAt: team.$createdAt,
              $updatedAt: team.$updatedAt,
              $permissions: [],
              teamData: team
            };
          }
        })
      );

      return {
        teams: teamsWithAppwriteData,
        total: teamsWithAppwriteData.length
      };
    } catch (error) {
      console.error('List organization teams error:', error);
      throw error;
    }
  },

  /**
   * Update team name (both Appwrite and our database)
   */
  async updateTeam(teamId: string, name: string, description?: string) {
    try {
      // Update Appwrite team
      const appwriteTeam = await teams.updateName(teamId, name);
      
      // Update our custom team data
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('teamName', name) // Find by current name first
      ]);

      if (teamData.documents.length > 0) {
        const updateData: any = { teamName: name };
        if (description !== undefined) {
          updateData.description = description;
        }
        
        await databaseService.updateDocument('teams', teamData.documents[0].$id, updateData);
      }

      return appwriteTeam;
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  },

  /**
   * Delete a team (both Appwrite and our database)
   */
  async deleteTeam(teamId: string) {
    try {
      // Get team name before deleting
      const team = await teams.get(teamId);
      
      // Delete Appwrite team
      await teams.delete(teamId);
      
      // Soft delete our custom team data
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('teamName', team.name)
      ]);

      if (teamData.documents.length > 0) {
        await databaseService.updateDocument('teams', teamData.documents[0].$id, {
          isActive: false
        });
      }

      return { success: true };
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
    url: string,
    invitedBy: string
  ) {
    try {
      // Create Appwrite membership
      const appwriteMembership = await teams.createMembership(teamId, roles, email, undefined, undefined, url);
      
      // Create our custom membership data
      const membershipData = {
        userId: appwriteMembership.userId,
        teamId: teamId,
        role: roles[0] || 'member', // Use first role as primary role
        invitedBy: invitedBy,
        joinedAt: new Date().toISOString(),
        isActive: true
      };

      await databaseService.createDocument('memberships', membershipData);
      
      return appwriteMembership;
    } catch (error) {
      console.error('Create membership error:', error);
      throw error;
    }
  },

  /**
   * List team members (both Appwrite and our database)
   */
  async listMemberships(teamId: string) {
    try {
      const appwriteMemberships = await teams.listMemberships(teamId);
      
      // Get our custom membership data for each member
      const membershipsWithData = await Promise.all(
        appwriteMemberships.memberships.map(async (membership) => {
          try {
            const membershipData = await databaseService.listDocuments('memberships', [
              Query.equal('userId', membership.userId),
              Query.equal('teamId', teamId)
            ]);
            
            return {
              ...membership,
              membershipData: membershipData.documents[0] || null
            };
          } catch (error) {
            console.warn('Could not fetch membership data for user:', membership.userId);
            return {
              ...membership,
              membershipData: null
            };
          }
        })
      );

      return {
        ...appwriteMemberships,
        memberships: membershipsWithData
      };
    } catch (error) {
      console.error('List memberships error:', error);
      throw error;
    }
  },

  /**
   * Update membership roles (both Appwrite and our database)
   */
  async updateMembershipRoles(
    teamId: string,
    membershipId: string,
    roles: string[]
  ) {
    try {
      // Update Appwrite membership
      const appwriteMembership = await teams.updateMembershipRoles(teamId, membershipId, roles);
      
      // Update our custom membership data
      const membershipData = await databaseService.listDocuments('memberships', [
        Query.equal('userId', appwriteMembership.userId),
        Query.equal('teamId', teamId)
      ]);

      if (membershipData.documents.length > 0) {
        await databaseService.updateDocument('memberships', membershipData.documents[0].$id, {
          role: roles[0] || 'member' // Use first role as primary role
        });
      }

      return appwriteMembership;
    } catch (error) {
      console.error('Update membership roles error:', error);
      throw error;
    }
  },

  /**
   * Delete team membership (both Appwrite and our database)
   */
  async deleteMembership(teamId: string, membershipId: string) {
    try {
      // Get membership info before deleting
      const membership = await teams.getMembership(teamId, membershipId);
      
      // Delete Appwrite membership
      await teams.deleteMembership(teamId, membershipId);
      
      // Soft delete our custom membership data
      const membershipData = await databaseService.listDocuments('memberships', [
        Query.equal('userId', membership.userId),
        Query.equal('teamId', teamId)
      ]);

      if (membershipData.documents.length > 0) {
        await databaseService.updateDocument('memberships', membershipData.documents[0].$id, {
          isActive: false
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Delete membership error:', error);
      throw error;
    }
  },

  /**
   * Get team membership by ID
   */
  async getMembership(teamId: string, membershipId: string) {
    try {
      return await teams.getMembership(teamId, membershipId);
    } catch (error) {
      console.error('Get membership error:', error);
      throw error;
    }
  },

  /**
   * Update team membership status (accept invitation)
   */
  async updateMembershipStatus(
    teamId: string,
    membershipId: string,
    userId: string,
    secret: string
  ) {
    try {
      return await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
    } catch (error) {
      console.error('Update membership status error:', error);
      throw error;
    }
  }
};

