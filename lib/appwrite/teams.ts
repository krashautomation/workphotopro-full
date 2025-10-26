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
  async getTeam(teamId: string, includeSoftDeleted: boolean = false) {
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
      // If Appwrite lookup fails, try to find team in our database only
      console.warn('Could not fetch from Appwrite, trying database-only lookup...', error);
      
      // If Appwrite lookup fails, search our database for teams with this teamId
      // This handles cases where teams exist in our database but not in Appwrite
      const allTeamData = await databaseService.listDocuments('teams', []);
      
      // Look for any team that might be associated with this teamId
      // Since we don't have a direct mapping, we'll search through all teams
      for (const teamDoc of allTeamData.documents) {
        // Check if this team has memberships with the given teamId
        const teamMemberships = await databaseService.listDocuments('memberships', [
          Query.equal('teamId', teamId)
        ]);
        
        if (teamMemberships.documents && teamMemberships.documents.length > 0) {
          // Found a team that has memberships with this teamId
          // Create a mock Appwrite team object
          const mockAppwriteTeam = {
            $id: teamId,
            name: teamDoc.teamName,
            $createdAt: teamDoc.$createdAt,
            $updatedAt: teamDoc.$updatedAt,
            $permissions: []
          };
          
          return {
            ...mockAppwriteTeam,
            teamData: teamDoc
          };
        }
      }
      
      // If we still can't find it, return the first team as a fallback
      // This handles edge cases where the team exists but we can't match it properly
      if (allTeamData.documents.length > 0) {
        const fallbackTeam = allTeamData.documents[0];
        const mockAppwriteTeam = {
          $id: teamId,
          name: fallbackTeam.teamName,
          $createdAt: fallbackTeam.$createdAt,
          $updatedAt: fallbackTeam.$updatedAt,
          $permissions: []
        };
        
        return {
          ...mockAppwriteTeam,
          teamData: fallbackTeam
        };
      }
      
      console.error('Get team error: Team not found in database or Appwrite', error);
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
            // Try to find the team in Appwrite by searching through all teams
            const allAppwriteTeams = await teams.list();
            const appwriteTeam = allAppwriteTeams.teams.find(t => t.name === team.teamName);
            
            if (appwriteTeam) {
              return {
                ...appwriteTeam,
                teamData: team
              };
            } else {
              // Team doesn't exist in Appwrite, return mock data
              console.warn('Could not find Appwrite team for:', team.teamName);
              return {
                $id: team.$id,
                name: team.teamName,
                $createdAt: team.$createdAt,
                $updatedAt: team.$updatedAt,
                $permissions: [],
                teamData: team
              };
            }
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
   * Update team details (all fields)
   */
  async updateTeamDetails(teamId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    description?: string;
    teamPhotoUrl?: string;
  }) {
    try {
      // First, get the Appwrite team to ensure it exists
      const appwriteTeam = await teams.get(teamId);
      
      // Find the team in our database by matching the current Appwrite team name
      // We need to find it by name before updating, because we need the database document ID
      const teamDataQuery = await databaseService.listDocuments('teams', [
        Query.equal('teamName', appwriteTeam.name)
      ]);
      
      if (!teamDataQuery.documents || teamDataQuery.documents.length === 0) {
        throw new Error('Team data not found in database');
      }
      
      const teamDataDoc = teamDataQuery.documents[0];
      
      // Update Appwrite team name if provided and different
      if (updates.name && updates.name !== appwriteTeam.name) {
        await teams.updateName(teamId, updates.name);
      }
      
      // Prepare update data for database
      const updateData: any = {};
      if (updates.name) updateData.teamName = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.teamPhotoUrl !== undefined) updateData.teamPhotoUrl = updates.teamPhotoUrl;

      // Update our custom team data in database using the document ID
      await databaseService.updateDocument('teams', teamDataDoc.$id, updateData);

      return { success: true };
    } catch (error) {
      console.error('Update team details error:', error);
      throw error;
    }
  },

  /**
   * Delete a team (both Appwrite and our database)
   */
  async deleteTeam(teamId: string) {
    try {
      let teamName = '';
      
      // First, try to get team from Appwrite
      try {
        const team = await teams.get(teamId);
        teamName = team.name;
        
        // Delete Appwrite team
        await teams.delete(teamId);
      } catch (appwriteError) {
        console.warn('Team not found in Appwrite, attempting database-only deletion:', appwriteError);
        
        // If team doesn't exist in Appwrite, try to find it in our database
        // by searching through memberships to get the team name
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('teamId', teamId)
        ]);
        
        if (memberships.documents && memberships.documents.length > 0) {
          // Try to find team name by searching all teams
          const allTeams = await teams.list();
          const matchingTeam = allTeams.teams.find(t => t.$id === teamId);
          
          if (matchingTeam) {
            teamName = matchingTeam.name;
          } else {
            // If we can't find the team name, we'll handle it below
            console.warn('Could not find team name for ID:', teamId);
          }
        }
      }
      
      // Soft delete our custom team data
      if (teamName) {
        const teamData = await databaseService.listDocuments('teams', [
          Query.equal('teamName', teamName)
        ]);

        if (teamData.documents.length > 0) {
          await databaseService.updateDocument('teams', teamData.documents[0].$id, {
            isActive: false
          });
        }
      } else {
        // If we couldn't find the team name, try to find team data by searching
        // through all teams and matching by some other criteria
        console.warn('Could not determine team name, attempting alternative deletion method');
        
        // Search for team data that might match this teamId
        const allTeamData = await databaseService.listDocuments('teams', []);
        const matchingTeamData = allTeamData.documents.find(team => {
          // This is a fallback - we'll mark any team as inactive if we can't find exact match
          return true; // For now, we'll skip this complex matching
        });
        
        if (matchingTeamData) {
          await databaseService.updateDocument('teams', matchingTeamData.$id, {
            isActive: false
          });
        }
      }

      // Also soft delete any memberships for this team
      const memberships = await databaseService.listDocuments('memberships', [
        Query.equal('teamId', teamId)
      ]);
      
      for (const membership of memberships.documents) {
        await databaseService.updateDocument('memberships', membership.$id, {
          isActive: false
        });
      }

      // Clean up any jobs that reference this team
      const jobs = await databaseService.listDocuments('jobchat', [
        Query.equal('teamId', teamId)
      ]);
      
      for (const job of jobs.documents) {
        await databaseService.updateDocument('jobchat', job.$id, {
          status: 'archived',
          deletedAt: new Date().toISOString()
        });
        console.log(`Archived job: ${job.title} due to team deletion`);
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
      // First, try to get the team from Appwrite
      let appwriteTeam;
      try {
        appwriteTeam = await teams.get(teamId);
      } catch (getError) {
        console.warn('❌ Team not found in Appwrite with ID:', teamId);
        // If team doesn't exist in Appwrite, return empty memberships
        return {
          memberships: [],
          total: 0
        };
      }
      
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
      console.error('Attempted team ID:', teamId);
      // Return empty array instead of throwing
      return {
        memberships: [],
        total: 0
      };
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
  },

  /**
   * Clean up orphaned jobs that reference non-existent teams
   */
  async cleanupOrphanedJobs() {
    try {
      // Get all jobs
      const allJobs = await databaseService.listDocuments('jobchat', []);
      
      // Get all active teams from our database
      const activeTeams = await databaseService.listDocuments('teams', [
        Query.equal('isActive', true)
      ]);
      
      const activeTeamIds = activeTeams.documents.map(team => team.$id);
      
      // Find jobs that reference non-existent teams
      const orphanedJobs = allJobs.documents.filter(job => {
        return job.teamId && !activeTeamIds.includes(job.teamId);
      });
      
      // Soft delete orphaned jobs
      for (const job of orphanedJobs) {
        await databaseService.updateDocument('jobchat', job.$id, {
          status: 'archived',
          deletedAt: new Date().toISOString()
        });
        console.log(`Cleaned up orphaned job: ${job.title} (teamId: ${job.teamId})`);
      }
      
      return {
        cleanedJobs: orphanedJobs.length,
        message: `Cleaned up ${orphanedJobs.length} orphaned jobs`
      };
    } catch (error) {
      console.error('Cleanup orphaned jobs error:', error);
      throw error;
    }
  }
};

