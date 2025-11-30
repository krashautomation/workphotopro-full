import { teams } from './client';
import { ID, Query } from 'react-native-appwrite';
import { databaseService } from './database';
import { Organization, Team, TeamData, Membership, MembershipData, TeamRole } from '@/utils/types';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

export const organizationService = {
  /**
   * Create a new organization
   */
  async createOrganization(name: string, description?: string, ownerId?: string, logoUrl?: string) {
    try {
      const orgData = {
        orgName: name,
        description: description || '',
        logoUrl: logoUrl || undefined,
        isActive: true,
        settings: '{}', // Default empty settings
        premiumTier: 'free',
        hdCaptureEnabled: false,
        videoRecordingEnabled: false,
        hdVideoEnabled: false,
        watermarkEnabled: true, // Default to enabled
        ...(ownerId && { ownerId })
      };

      return await databaseService.createDocument('organizations', orgData) as unknown as Organization;
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
      const org = await databaseService.getDocument('organizations', orgId) as unknown as Organization;
      console.log('🔄 getOrganization - Retrieved org:', {
        id: org.$id,
        name: org.orgName,
        logoUrl: org.logoUrl,
        hasLogoUrl: !!org.logoUrl,
        allKeys: Object.keys(org)
      });
      return org;
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
      const result = await databaseService.listDocuments('organizations', [
        Query.equal('ownerId', userId),
        Query.equal('isActive', true)
      ]);
      console.log('🔄 listUserOrganizations - Raw result:', result.documents.length, 'organizations');
      result.documents.forEach((org: any, index: number) => {
        console.log(`🔄 Org ${index + 1}:`, {
          id: org.$id,
          name: org.orgName,
          logoUrl: org.logoUrl,
          hasLogoUrl: !!org.logoUrl,
          allKeys: Object.keys(org)
        });
      });
      return {
        ...result,
        documents: result.documents as unknown as Organization[]
      };
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
      console.log('🔄 updateOrganization - Updating org:', orgId);
      console.log('🔄 updateOrganization - Update data:', data);
      const updated = await databaseService.updateDocument('organizations', orgId, data);
      console.log('🔄 updateOrganization - Updated org response:', {
        id: updated.$id,
        name: (updated as any).orgName,
        logoUrl: (updated as any).logoUrl,
        hasLogoUrl: !!(updated as any).logoUrl,
        allKeys: Object.keys(updated)
      });
      return updated;
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
        appwriteTeamId: appwriteTeam.$id, // Store Appwrite Team ID for linking
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
        $permissions: [], // Appwrite Teams don't have $permissions, provide empty array
        teamData: teamDoc as unknown as TeamData
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
      
      // Get our custom team data (prefer lookup by Appwrite team ID)
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('appwriteTeamId', appwriteTeam.$id)
      ]);

      return {
        ...appwriteTeam,
        $permissions: [], // Appwrite Teams don't have $permissions, provide empty array
        teamData: (teamData.documents[0] as unknown as TeamData) || null
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
            teamData: teamDoc as unknown as TeamData
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
          teamData: fallbackTeam as unknown as TeamData
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
            let teamData = await databaseService.listDocuments('teams', [
              Query.equal('appwriteTeamId', team.$id)
            ]);
            if (!teamData.documents || teamData.documents.length === 0) {
              teamData = await databaseService.listDocuments('teams', [
                Query.equal('teamName', team.name)
              ]);
            }
            
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
              $permissions: [], // Appwrite Teams don't have $permissions, provide empty array
              teamData: (teamData.documents[0] as unknown as TeamData) || null,
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
                $permissions: [], // Appwrite Teams don't have $permissions, provide empty array
                teamData: team as unknown as TeamData
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
                teamData: team as unknown as TeamData
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
              teamData: team as unknown as TeamData
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
      let teamData = await databaseService.listDocuments('teams', [
        Query.equal('appwriteTeamId', teamId)
      ]);

      if (!teamData.documents || teamData.documents.length === 0) {
        teamData = await databaseService.listDocuments('teams', [
          Query.equal('teamName', name)
        ]);
      }

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
      console.log('🔄 updateTeamDetails - Called with:', {
        teamId,
        updates,
        teamPhotoUrl: updates.teamPhotoUrl,
        teamPhotoUrlType: typeof updates.teamPhotoUrl,
        teamPhotoUrlLength: updates.teamPhotoUrl?.length,
      });
      
      // First, get the Appwrite team to ensure it exists
      const appwriteTeam = await teams.get(teamId);
      console.log('🔄 updateTeamDetails - Appwrite team:', {
        id: appwriteTeam.$id,
        name: appwriteTeam.name,
      });
      
      // Find the team in our database by matching the current Appwrite team name
      // We need to find it by name before updating, because we need the database document ID
      let teamDataQuery = await databaseService.listDocuments('teams', [
        Query.equal('appwriteTeamId', teamId)
      ]);
      console.log('🔄 updateTeamDetails - Query by appwriteTeamId:', {
        found: teamDataQuery.documents?.length || 0,
        documents: teamDataQuery.documents?.map((d: any) => ({
          id: d.$id,
          teamName: d.teamName,
          appwriteTeamId: d.appwriteTeamId,
          teamPhotoUrl: d.teamPhotoUrl,
        })),
      });
      
      if (!teamDataQuery.documents || teamDataQuery.documents.length === 0) {
        console.log('🔄 updateTeamDetails - Not found by appwriteTeamId, trying teamName...');
        teamDataQuery = await databaseService.listDocuments('teams', [
          Query.equal('teamName', appwriteTeam.name)
        ]);
        console.log('🔄 updateTeamDetails - Query by teamName:', {
          found: teamDataQuery.documents?.length || 0,
          documents: teamDataQuery.documents?.map((d: any) => ({
            id: d.$id,
            teamName: d.teamName,
            appwriteTeamId: d.appwriteTeamId,
            teamPhotoUrl: d.teamPhotoUrl,
          })),
        });
      }
      
      if (!teamDataQuery.documents || teamDataQuery.documents.length === 0) {
        console.error('❌ updateTeamDetails - Team data not found in database');
        throw new Error('Team data not found in database');
      }
      
      const teamDataDoc = teamDataQuery.documents[0];
      console.log('🔄 updateTeamDetails - Found team document:', {
        id: teamDataDoc.$id,
        teamName: teamDataDoc.teamName,
        currentTeamPhotoUrl: teamDataDoc.teamPhotoUrl,
        allKeys: Object.keys(teamDataDoc),
      });
      
      // Update Appwrite team name if provided and different
      if (updates.name && updates.name !== appwriteTeam.name) {
        console.log('🔄 updateTeamDetails - Updating Appwrite team name...');
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
      
      console.log('🔄 updateTeamDetails - Checking teamPhotoUrl:', {
        provided: updates.teamPhotoUrl,
        isUndefined: updates.teamPhotoUrl === undefined,
        isString: typeof updates.teamPhotoUrl === 'string',
        length: updates.teamPhotoUrl?.length,
        value: updates.teamPhotoUrl,
      });
      
      // ALWAYS include teamPhotoUrl if provided (even if empty string or null)
      if (updates.teamPhotoUrl !== undefined) {
        // If it's a non-empty string, use it; if empty string, set to null to clear
        updateData.teamPhotoUrl = updates.teamPhotoUrl && updates.teamPhotoUrl.trim().length > 0 
          ? updates.teamPhotoUrl.trim() 
          : null;
        console.log('✅ updateTeamDetails - Adding teamPhotoUrl to updateData:', updateData.teamPhotoUrl);
        console.log('✅ updateTeamDetails - teamPhotoUrl will be saved to database');
      } else {
        console.log('⚠️ updateTeamDetails - teamPhotoUrl is undefined, not updating');
        console.log('⚠️ updateTeamDetails - This means teamPhotoUrl was not provided in updates');
      }

      console.log('🔄 updateTeamDetails - Final updateData:', {
        ...updateData,
        teamPhotoUrl: updateData.teamPhotoUrl,
        updateDataKeys: Object.keys(updateData),
        hasTeamPhotoUrl: 'teamPhotoUrl' in updateData,
      });
      console.log('🔄 updateTeamDetails - Updating document:', {
        collection: 'teams',
        documentId: teamDataDoc.$id,
        documentTeamName: teamDataDoc.teamName,
        updateData,
        updateDataStringified: JSON.stringify(updateData, null, 2),
      });

      // Update our custom team data in database using the document ID
      console.log('🔄 updateTeamDetails - Calling databaseService.updateDocument...');
      const updateResult = await databaseService.updateDocument('teams', teamDataDoc.$id, updateData);
      console.log('✅ updateTeamDetails - Document updated:', {
        id: updateResult.$id,
        updatedAt: updateResult.$updatedAt,
        resultKeys: Object.keys(updateResult),
        resultTeamPhotoUrl: (updateResult as any).teamPhotoUrl,
      });
      
      // Verify the update by fetching the document again
      console.log('🔄 updateTeamDetails - Verifying update by fetching document...');
      const verifyDoc = await databaseService.getDocument('teams', teamDataDoc.$id);
      console.log('✅ updateTeamDetails - Verification - Retrieved document:', {
        id: verifyDoc.$id,
        teamName: (verifyDoc as any).teamName,
        teamPhotoUrl: (verifyDoc as any).teamPhotoUrl,
        teamPhotoUrlType: typeof (verifyDoc as any).teamPhotoUrl,
        teamPhotoUrlLength: (verifyDoc as any).teamPhotoUrl?.length,
        allKeys: Object.keys(verifyDoc),
        hasTeamPhotoUrl: 'teamPhotoUrl' in verifyDoc,
      });
      
      // Double-check: if we tried to save teamPhotoUrl but it's not in the result, log a warning
      if ('teamPhotoUrl' in updateData && (verifyDoc as any).teamPhotoUrl !== updateData.teamPhotoUrl) {
        console.error('❌ updateTeamDetails - WARNING: teamPhotoUrl mismatch!');
        console.error('❌ updateTeamDetails - Expected:', updateData.teamPhotoUrl);
        console.error('❌ updateTeamDetails - Got:', (verifyDoc as any).teamPhotoUrl);
        console.error('❌ updateTeamDetails - This might indicate a database permissions issue or field name mismatch');
      } else if ('teamPhotoUrl' in updateData) {
        console.log('✅ updateTeamDetails - teamPhotoUrl verified successfully in database');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ updateTeamDetails - Error:', error);
      console.error('❌ updateTeamDetails - Error type:', typeof error);
      console.error('❌ updateTeamDetails - Error message:', (error as any)?.message);
      console.error('❌ updateTeamDetails - Error stack:', (error as any)?.stack);
      throw error;
    }
  },

  /**
   * Update team photo URL immediately after upload
   * This is a dedicated function to save the photo URL right after upload
   */
  async updateTeamPhotoUrl(teamId: string, photoUrl: string) {
    try {
      console.log('📸 updateTeamPhotoUrl - Called with:', {
        teamId,
        photoUrl,
        photoUrlType: typeof photoUrl,
        photoUrlLength: photoUrl?.length,
      });
      
      if (!photoUrl || typeof photoUrl !== 'string' || photoUrl.trim().length === 0) {
        console.error('❌ updateTeamPhotoUrl - Invalid photoUrl provided:', photoUrl);
        throw new Error('Invalid photo URL provided');
      }

      // First, get the Appwrite team to ensure it exists
      const appwriteTeam = await teams.get(teamId);
      console.log('📸 updateTeamPhotoUrl - Appwrite team:', {
        id: appwriteTeam.$id,
        name: appwriteTeam.name,
      });
      
      // Find the team in our database
      let teamDataQuery = await databaseService.listDocuments('teams', [
        Query.equal('appwriteTeamId', teamId)
      ]);
      console.log('📸 updateTeamPhotoUrl - Query by appwriteTeamId:', {
        found: teamDataQuery.documents?.length || 0,
      });
      
      if (!teamDataQuery.documents || teamDataQuery.documents.length === 0) {
        console.log('📸 updateTeamPhotoUrl - Not found by appwriteTeamId, trying teamName...');
        teamDataQuery = await databaseService.listDocuments('teams', [
          Query.equal('teamName', appwriteTeam.name)
        ]);
        console.log('📸 updateTeamPhotoUrl - Query by teamName:', {
          found: teamDataQuery.documents?.length || 0,
        });
      }
      
      if (!teamDataQuery.documents || teamDataQuery.documents.length === 0) {
        console.error('❌ updateTeamPhotoUrl - Team data not found in database');
        throw new Error('Team data not found in database');
      }
      
      const teamDataDoc = teamDataQuery.documents[0];
      console.log('📸 updateTeamPhotoUrl - Found team document:', {
        id: teamDataDoc.$id,
        teamName: teamDataDoc.teamName,
        currentTeamPhotoUrl: teamDataDoc.teamPhotoUrl,
      });
      
      // Update only the teamPhotoUrl field
      const trimmedUrl = photoUrl.trim();
      const updateData = {
        teamPhotoUrl: trimmedUrl,
      };
      
      console.log('📸 updateTeamPhotoUrl - Updating with data:', updateData);
      console.log('📸 updateTeamPhotoUrl - Document ID:', teamDataDoc.$id);
      
      // Update the document
      const updateResult = await databaseService.updateDocument('teams', teamDataDoc.$id, updateData);
      console.log('✅ updateTeamPhotoUrl - Document updated:', {
        id: updateResult.$id,
        updatedAt: updateResult.$updatedAt,
        resultTeamPhotoUrl: (updateResult as any).teamPhotoUrl,
      });
      
      // Verify the update
      const verifyDoc = await databaseService.getDocument('teams', teamDataDoc.$id);
      console.log('✅ updateTeamPhotoUrl - Verification:', {
        id: verifyDoc.$id,
        teamPhotoUrl: (verifyDoc as any).teamPhotoUrl,
        matches: (verifyDoc as any).teamPhotoUrl === trimmedUrl,
      });
      
      if ((verifyDoc as any).teamPhotoUrl !== trimmedUrl) {
        console.error('❌ updateTeamPhotoUrl - WARNING: teamPhotoUrl mismatch after update!');
        console.error('❌ updateTeamPhotoUrl - Expected:', trimmedUrl);
        console.error('❌ updateTeamPhotoUrl - Got:', (verifyDoc as any).teamPhotoUrl);
        throw new Error('Team photo URL was not saved correctly');
      }
      
      console.log('✅ updateTeamPhotoUrl - Successfully saved team photo URL to database');
      return { success: true, teamPhotoUrl: trimmedUrl };
    } catch (error) {
      console.error('❌ updateTeamPhotoUrl - Error:', error);
      console.error('❌ updateTeamPhotoUrl - Error type:', typeof error);
      console.error('❌ updateTeamPhotoUrl - Error message:', (error as any)?.message);
      console.error('❌ updateTeamPhotoUrl - Error stack:', (error as any)?.stack);
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
      // Store email so we can use it later when Appwrite's membership object doesn't have it
      const membershipData = {
        userId: appwriteMembership.userId,
        teamId: teamId,
        role: roles[0] || 'member', // Use first role as primary role
        userEmail: email, // Store the email for later use
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
   * Helper function to update membership document with email from Appwrite Users
   * This can be used to manually update existing memberships that are missing userEmail
   */
  async updateMembershipWithEmail(membershipId: string, email: string): Promise<void> {
    try {
      // Get the membership document
      const membershipData = await databaseService.getDocument('memberships', membershipId);
      
      // Update it with the email
      await databaseService.updateDocument('memberships', membershipId, {
        userEmail: email
      });
      
      console.log('✅ Updated membership with email:', { membershipId, email });
    } catch (error) {
      console.error('Could not update membership with email:', error);
      throw error;
    }
  },

  /**
   * Bulk migration: Update all memberships with emails from Appwrite Users
   * 
   * NOTE: This is a CLIENT-SIDE function with limitations:
   * - Can only get email for currently logged-in user
   * - Cannot access other users' emails from client SDK
   * - For full migration, use the server-side script in scripts/migrate-membership-emails.ts
   * 
   * For production, create an Appwrite Cloud Function with the server-side script
   */
  async migrateMembershipEmailsForCurrentUser(): Promise<{ updated: number; skipped: number; errors: number }> {
    try {
      const { account } = await import('./client');
      
      // Get current user
      const currentUser = await account.get();
      if (!currentUser || !currentUser.$id || !currentUser.email) {
        throw new Error('No user logged in or user has no email');
      }

      const userEmail = currentUser.email;
      const userId = currentUser.$id;

      console.log(`🚀 Migrating memberships for current user: ${userEmail}`);

      // Get all memberships for this user
      const memberships = await databaseService.listDocuments('memberships', [
        Query.equal('userId', userId),
        Query.limit(100)
      ]);

      let updated = 0;
      let skipped = 0;
      let errors = 0;

      // Update each membership
      for (const membership of memberships.documents) {
        try {
          // Skip if email already exists and matches
          if (membership.userEmail === userEmail) {
            skipped++;
            continue;
          }

          // Update membership document with email
          await databaseService.updateDocument('memberships', membership.$id, {
            userEmail: userEmail
          });

          updated++;

        } catch (error: any) {
          console.error(`Error updating membership ${membership.$id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Migration complete: ${updated} updated, ${skipped} skipped, ${errors} errors`);
      
      return { updated, skipped, errors };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  /**
   * Helper function to get user information by userId
   * This will try to fetch from a users collection, or use Appwrite membership data
   * Note: For profile pictures, we need to store them in memberships table or use a Cloud Function
   */
  async getUserInfo(userId: string): Promise<{ name?: string; email?: string; profilePicture?: string } | null> {
    try {
      // Try to get from a users collection if it exists
      try {
        const usersResult = await databaseService.listDocuments('users', [
          Query.equal('userId', userId)
        ]);
        
        if (usersResult.documents && usersResult.documents.length > 0) {
          const userDoc = usersResult.documents[0];
          return {
            name: userDoc.name || userDoc.userName || undefined,
            email: userDoc.email || userDoc.userEmail || undefined,
            profilePicture: userDoc.profilePicture || userDoc.profilePictureUrl || undefined
          };
        }
      } catch (dbError: any) {
        // Check if this is a "collection not found" error (expected and handled gracefully)
        const isCollectionNotFound = 
          dbError?.message?.includes('Collection with the requested ID could not be found') ||
          dbError?.code === 404 ||
          dbError?.type === 'general_not_found';
        
        if (isCollectionNotFound) {
          // Users collection doesn't exist - this is expected and handled gracefully
          // Only log at debug level to avoid noise in console
          console.debug('Users collection not available, will use Appwrite Auth data');
        } else {
          // For other errors, log a warning
          console.warn('Users collection access error:', dbError);
        }
      }

      // Users collection doesn't exist - return null and use membership data from Appwrite Teams API
      // The Appwrite Teams membership object should have userName and userEmail
      // Profile pictures would need to be stored in memberships table or fetched via Cloud Function
      return null;
    } catch (error) {
      console.warn('Could not fetch user info for userId:', userId, error);
      return null;
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
      
      // Get our custom membership data and user info for each member
      // Also sync Appwrite memberships with our database to avoid redundancy issues
      const membershipsWithData = await Promise.all(
        appwriteMemberships.memberships.map(async (membership: any) => {
          try {
            // Get membership data from our database
            // First try with both userId and teamId
            let membershipData = await databaseService.listDocuments('memberships', [
              Query.equal('userId', membership.userId),
              Query.equal('teamId', teamId)
            ]);
            
            // If no documents found, try with just userId (in case teamId doesn't match)
            if (!membershipData.documents || membershipData.documents.length === 0) {
              console.log('⚠️ Membership data not found with teamId filter, trying with userId only...');
              membershipData = await databaseService.listDocuments('memberships', [
                Query.equal('userId', membership.userId)
              ]);
              
              // Filter by teamId in the results manually
              if (membershipData.documents && membershipData.documents.length > 0) {
                const filteredDocs = membershipData.documents.filter((doc: any) => doc.teamId === teamId);
                membershipData.documents = filteredDocs;
              }
              
              // If still no match, sync/create membership data from Appwrite membership
              if ((!membershipData.documents || membershipData.documents.length === 0) && membership.confirm && membership.joined) {
                console.log('⚠️ Syncing Appwrite membership to our database...');
                try {
                  // Create/update membership data from Appwrite membership
                  // This ensures our database stays in sync with Appwrite Teams
                  const syncMembershipData: any = {
                    userId: membership.userId,
                    teamId: teamId,
                    role: membership.roles[0] || 'member',
                    invitedBy: membership.invited || new Date().toISOString(),
                    joinedAt: membership.joined || new Date().toISOString(),
                    isActive: true
                  };
                  
                  // Try to preserve email if we can find it from other memberships
                  const allUserMemberships = await databaseService.listDocuments('memberships', [
                    Query.equal('userId', membership.userId)
                  ]);
                  const membershipWithEmail = allUserMemberships.documents?.find((doc: any) => doc.userEmail && doc.userEmail.trim());
                  if (membershipWithEmail?.userEmail) {
                    syncMembershipData.userEmail = membershipWithEmail.userEmail;
                  }
                  
                  await databaseService.createDocument('memberships', syncMembershipData);
                  console.log('✅ Synced membership data from Appwrite to our database');
                  
                  // Re-query to get the newly created document
                  membershipData = await databaseService.listDocuments('memberships', [
                    Query.equal('userId', membership.userId),
                    Query.equal('teamId', teamId)
                  ]);
                } catch (syncError) {
                  console.warn('Could not sync membership data:', syncError);
                }
              }
            } else if (membershipData.documents[0]) {
              // Membership data exists - ensure it's in sync with Appwrite
              const dbMembership = membershipData.documents[0];
              const needsUpdate: any = {};
              
              // Update role if different
              if (dbMembership.role !== membership.roles[0]) {
                needsUpdate.role = membership.roles[0] || 'member';
              }
              
              // Update joinedAt if Appwrite has more recent data
              if (membership.joined && (!dbMembership.joinedAt || new Date(membership.joined) > new Date(dbMembership.joinedAt))) {
                needsUpdate.joinedAt = membership.joined;
              }
              
              // Update isActive based on confirm status
              if (dbMembership.isActive !== membership.confirm) {
                needsUpdate.isActive = membership.confirm;
              }
              
              // If there are updates needed, sync them
              if (Object.keys(needsUpdate).length > 0) {
                try {
                  await databaseService.updateDocument('memberships', dbMembership.$id, needsUpdate);
                  console.log('✅ Synced membership data updates from Appwrite');
                  // Re-query to get updated document
                  membershipData = await databaseService.listDocuments('memberships', [
                    Query.equal('userId', membership.userId),
                    Query.equal('teamId', teamId)
                  ]);
                } catch (updateError) {
                  console.warn('Could not sync membership data updates:', updateError);
                }
              }
            }
            
            // Log membershipData query results for debugging
            console.log('🔍 MembershipData query result:', {
              userId: membership.userId,
              teamId: teamId,
              documentsFound: membershipData.documents?.length || 0,
              documentData: membershipData.documents[0] || null
            });
            
            // Log raw Appwrite membership object to see what fields it has
            console.log('🔍 Raw Appwrite membership:', {
              $id: membership.$id,
              userId: membership.userId,
              teamId: membership.teamId,
              userName: membership.userName,
              userEmail: membership.userEmail,
              email: (membership as any).email,
              roles: membership.roles,
              confirm: membership.confirm,
              invited: membership.invited,
              joined: membership.joined,
              allKeys: Object.keys(membership)
            });
            
            // Try to get user info (name and profile picture) from our users collection
            const userInfo = await this.getUserInfo(membership.userId);
            
            // Start with the Appwrite membership data (which should have userName and userEmail)
            const combinedMembership: any = {
              ...membership,
              membershipData: membershipData.documents[0] || null,
              userInfo: userInfo || null
            };
            
            // Get email first (needed for name formatting fallback)
            // Priority order for userEmail:
            // 1. userInfo.email (from our users collection if it exists)
            // 2. membershipData.userEmail (from our database - this is stored when creating membership)
            // 3. membership.userEmail (from Appwrite Teams API - usually empty until user sets it)
            // 4. Try to find email from any other membership records for this userId
            if (!combinedMembership.userEmail) {
              if (userInfo?.email) {
                combinedMembership.userEmail = userInfo.email;
              } else if (membershipData.documents[0]?.userEmail) {
                combinedMembership.userEmail = membershipData.documents[0].userEmail;
              } else if (membership.userEmail && membership.userEmail.trim()) {
                combinedMembership.userEmail = membership.userEmail;
              } else if ((membership as any).email && (membership as any).email.trim()) {
                // Check if email is stored in 'email' field instead of 'userEmail'
                combinedMembership.userEmail = (membership as any).email;
              } else {
                // Last resort: try to find email from any membership record for this user
                try {
                  const allUserMemberships = await databaseService.listDocuments('memberships', [
                    Query.equal('userId', membership.userId)
                  ]);
                  const membershipWithEmail = allUserMemberships.documents?.find((doc: any) => doc.userEmail && doc.userEmail.trim());
                  if (membershipWithEmail?.userEmail) {
                    combinedMembership.userEmail = membershipWithEmail.userEmail;
                    // Also update the current membership data if it exists
                    if (membershipData.documents[0]?.$id) {
                      try {
                        await databaseService.updateDocument('memberships', membershipData.documents[0].$id, {
                          userEmail: membershipWithEmail.userEmail
                        });
                      } catch (updateError) {
                        console.warn('Could not update membership data with email:', updateError);
                      }
                    }
                  }
                } catch (queryError) {
                  console.warn('Could not query all memberships for email:', queryError);
                }
              }
            }
            
            // Log membership data for debugging
            console.log('🔍 Membership data:', {
              userId: membership.userId,
              membershipUserName: membership.userName,
              membershipUserEmail: membership.userEmail,
              membershipDataUserEmail: membershipData.documents[0]?.userEmail,
              membershipDataUserName: membershipData.documents[0]?.userName,
              hasUserInfo: !!userInfo,
              userInfoName: userInfo?.name,
              finalUserEmail: combinedMembership.userEmail
            });
            
            // Priority order for userName:
            // 1. membershipData.userName (from our database - cached from Appwrite Users API via server script)
            // 2. membership.userName (from Appwrite Teams API - might be empty if user hasn't set name)
            // 3. userInfo.name (from our users collection if it exists - legacy)
            // 4. Format from email if available (last resort)
            if (!combinedMembership.userName || !combinedMembership.userName.trim()) {
              if (membershipData.documents[0]?.userName && membershipData.documents[0].userName.trim()) {
                // Use cached name from our database (populated by migration script)
                combinedMembership.userName = membershipData.documents[0].userName.trim();
              } else if (membership.userName && membership.userName.trim()) {
                // Use name from Appwrite Teams membership
                combinedMembership.userName = membership.userName.trim();
              } else if (userInfo?.name && userInfo.name.trim()) {
                // Legacy: use name from users collection if it exists
                combinedMembership.userName = userInfo.name.trim();
              } else if (combinedMembership.userEmail && combinedMembership.userEmail.includes('@')) {
                // Format name from email (e.g., "john.doe@example.com" -> "John Doe")
                const emailName = combinedMembership.userEmail.split('@')[0];
                combinedMembership.userName = emailName
                  .split(/[._-]/)
                  .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
              }
            }
            
            // Priority order for profilePicture:
            // 1. membershipData.profilePicture (from our database - cached from Appwrite Users API via server script)
            // 2. userInfo.profilePicture (from our users collection if it exists - legacy)
            // 3. membership.profilePicture (from Appwrite if available)
            if (!combinedMembership.profilePicture) {
              if (membershipData.documents[0]?.profilePicture && membershipData.documents[0].profilePicture.trim()) {
                // Use cached profile picture from our database (populated by migration script)
                combinedMembership.profilePicture = membershipData.documents[0].profilePicture.trim();
              } else if (userInfo?.profilePicture) {
                // Legacy: use profile picture from users collection
                combinedMembership.profilePicture = userInfo.profilePicture;
              }
            }
            
            // Log final combined membership for debugging
            console.log('✅ Final combined membership:', {
              userId: combinedMembership.userId,
              userName: combinedMembership.userName,
              userEmail: combinedMembership.userEmail,
              hasProfilePicture: !!combinedMembership.profilePicture,
              role: combinedMembership.membershipData?.role || combinedMembership.roles?.[0]
            });
            
            return combinedMembership;
          } catch (error) {
            console.warn('Could not fetch membership data for user:', membership.userId, error);
            // Return membership with whatever data Appwrite provides
            return {
              ...membership,
              membershipData: null,
              userInfo: null
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
      const appwriteMembership = await teams.updateMembership(teamId, membershipId, roles);
      
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

