import { ID, Query } from 'react-native-appwrite';
import { databaseService } from './database';
import { teamService as customTeamService } from '@/services/teamService';
import { Organization, TeamData, MembershipData } from '@/utils/types';

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
   * Create a new team (using custom database implementation)
   * 
   * @deprecated Use teamService.createTeam() from @/services/teamService instead
   */
  async createTeam(name: string, orgId: string, description?: string, roles?: string[], userId?: string) {
    if (!userId) {
      throw new Error('userId is required to create a team');
    }
    
    try {
      // Use custom team service
      const team = await customTeamService.createTeam(name, orgId, userId, description);
      
      return {
        $id: team.$id,
        name: team.teamName,
        $createdAt: team.$createdAt,
        $updatedAt: team.$updatedAt,
        $permissions: [],
        teamData: team
      };
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID (using custom database implementation)
   * 
   * @deprecated Use teamService.getTeam() from @/services/teamService instead
   */
  async getTeam(teamId: string, orgId?: string) {
    try {
      let effectiveOrgId = orgId;
      if (!effectiveOrgId) {
        // Fallback: get orgId from team directly
        const teamDoc = await databaseService.getDocument('teams', teamId);
        effectiveOrgId = teamDoc.orgId;
        if (!effectiveOrgId) {
          throw new Error('Team does not have an organization ID');
        }
      }
      
      const team = await customTeamService.getTeam(teamId, effectiveOrgId);
      
      return {
        $id: team.$id,
        name: team.teamName,
        $createdAt: team.$createdAt,
        $updatedAt: team.$updatedAt,
        $permissions: [],
        teamData: team
      };
    } catch (error) {
      console.error('Get team error:', error);
      throw error;
    }
  },

  /**
   * List all teams the current user is a member of
   * 
   * @deprecated Use teamService.listTeams() from @/services/teamService instead
   */
  async listTeams(userId: string, orgId: string) {
    try {
      const teams = await customTeamService.listTeams(userId, orgId);
      
      const teamsWithData = await Promise.all(
        teams.map(async (team: TeamData) => {
          // Get membership info to check user's role
          let membershipRole = null;
          try {
            const membership = await customTeamService.getMembership(team.$id, userId, orgId);
            membershipRole = membership?.role || null;
          } catch (error) {
            console.warn('Could not fetch membership data for team:', team.teamName);
          }
          
          return {
            $id: team.$id,
            name: team.teamName,
            $createdAt: team.$createdAt,
            $updatedAt: team.$updatedAt,
            $permissions: [],
            teamData: team,
            membershipRole: membershipRole
          };
        })
      );

      return {
        teams: teamsWithData,
        total: teamsWithData.length
      };
    } catch (error) {
      console.error('List teams error:', error);
      throw error;
    }
  },

  /**
   * List teams for a specific organization
   * 
   * @deprecated Use database query directly or teamService.listTeams() instead
   */
  async listOrganizationTeams(orgId: string) {
    try {
      const teamData = await databaseService.listDocuments('teams', [
        Query.equal('orgId', orgId),
        Query.equal('isActive', true)
      ]);

      const teamsWithData = teamData.documents.map((team: any) => ({
        $id: team.$id,
        name: team.teamName,
        $createdAt: team.$createdAt,
        $updatedAt: team.$updatedAt,
        $permissions: [],
        teamData: team as TeamData
      }));

      return {
        teams: teamsWithData,
        total: teamsWithData.length
      };
    } catch (error) {
      console.error('List organization teams error:', error);
      throw error;
    }
  },

  /**
   * Update team name
   * 
   * @deprecated Use teamService.updateTeam() from @/services/teamService instead
   */
  async updateTeam(teamId: string, name: string, description?: string, orgId?: string) {
    try {
      if (!orgId) {
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }
      
      if (!orgId) {
        throw new Error('Organization ID is required');
      }
      
      const updates: any = { teamName: name };
      if (description !== undefined) {
        updates.description = description;
      }
      
      const updated = await customTeamService.updateTeam(teamId, orgId, updates);
      
      return {
        $id: updated.$id,
        name: updated.teamName,
        $createdAt: updated.$createdAt,
        $updatedAt: updated.$updatedAt,
        $permissions: []
      };
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  },

  /**
   * Update team details (all fields)
   * 
   * @deprecated Use teamService.updateTeam() from @/services/teamService instead
   */
  async updateTeamDetails(
    teamId: string,
    updates: {
      name?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      description?: string;
      teamPhotoUrl?: string;
    },
    orgId?: string
  ) {
    try {
      if (!orgId) {
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Prepare update data for database
      const updateData: any = {};
      if (updates.name) updateData.teamName = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.teamPhotoUrl !== undefined) {
        updateData.teamPhotoUrl = updates.teamPhotoUrl && updates.teamPhotoUrl.trim().length > 0
          ? updates.teamPhotoUrl.trim()
          : null;
      }

      await customTeamService.updateTeam(teamId, orgId, updateData);

      return { success: true };
    } catch (error) {
      console.error('Update team details error:', error);
      throw error;
    }
  },

  /**
   * Update team photo URL immediately after upload
   * 
   * @deprecated Use teamService.updateTeam() from @/services/teamService instead
   */
  async updateTeamPhotoUrl(teamId: string, photoUrl: string, orgId?: string) {
    try {
      if (!photoUrl || typeof photoUrl !== 'string' || photoUrl.trim().length === 0) {
        throw new Error('Invalid photo URL provided');
      }

      if (!orgId) {
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const trimmedUrl = photoUrl.trim();
      await customTeamService.updateTeam(teamId, orgId, { teamPhotoUrl: trimmedUrl });

      return { success: true, teamPhotoUrl: trimmedUrl };
    } catch (error) {
      console.error('Update team photo URL error:', error);
      throw error;
    }
  },

  /**
   * Delete a team (soft delete via custom database implementation)
   * 
   * @deprecated Use teamService.deleteTeam() from @/services/teamService instead
   */
  async deleteTeam(teamId: string, orgId?: string) {
    try {
      if (!orgId) {
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Use custom team service for soft delete
      await customTeamService.deleteTeam(teamId, orgId);

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
   * 
   * @deprecated Use teamService.inviteMember() from @/services/teamService instead
   */
  async createMembership(
    teamId: string,
    email: string,
    roles: string[],
    url: string,
    invitedBy: string,
    orgId?: string
  ) {
    try {
      if (!orgId) {
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Use custom invitation system
      const result = await customTeamService.inviteMember(
        teamId,
        orgId,
        email,
        roles,
        invitedBy
      );

      return result.invitation;
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
   * List team members from our custom database
   */
  async listMemberships(teamId: string) {
    try {
      const memberships = await databaseService.listDocuments('memberships', [
        Query.equal('teamId', teamId),
        Query.equal('isActive', true)
      ]);

      return {
        memberships: memberships.documents,
        total: memberships.documents.length
      };
    } catch (error) {
      console.error('Error listing memberships:', error);
      return { memberships: [], total: 0 };
    }
  },

  /**
   * Update membership roles
   * 
   * @deprecated Use teamService.updateMemberRole() from @/services/teamService instead
   */
  async updateMembershipRoles(
    teamId: string,
    membershipId: string,
    roles: string[],
    orgId?: string
  ) {
    try {
      if (!orgId) {
        const membership = await databaseService.getDocument('memberships', membershipId);
        orgId = membership.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const updated = await customTeamService.updateMemberRole(
        teamId,
        membershipId,
        roles,
        orgId
      );

      return updated;
    } catch (error) {
      console.error('Update membership roles error:', error);
      throw error;
    }
  },

  /**
   * Update membership permission for sharing job reports
   * 
   * @deprecated This will be moved to a separate permission service
   */
  async updateMembershipJobReportsPermission(
    teamId: string,
    membershipId: string,
    canShare: boolean
  ) {
    try {
      // Update our custom membership data directly
      const membershipData = await databaseService.listDocuments('memberships', [
        Query.equal('$id', membershipId),
        Query.equal('teamId', teamId)
      ]);

      if (membershipData.documents.length > 0) {
        await databaseService.updateDocument('memberships', membershipData.documents[0].$id, {
          canShareJobReports: canShare
        });
      } else {
        throw new Error('Membership data not found');
      }

      return { success: true };
    } catch (error) {
      console.error('Update membership permission error:', error);
      throw error;
    }
  },

  /**
   * Delete team membership (soft delete via custom database implementation)
   * 
   * @deprecated Use teamService.removeMember() from @/services/teamService instead
   */
  async deleteMembership(teamId: string, membershipId: string, orgId?: string) {
    try {
      if (!orgId) {
        const membership = await databaseService.getDocument('memberships', membershipId);
        orgId = membership.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      await customTeamService.removeMember(teamId, membershipId, orgId);

      return { success: true };
    } catch (error) {
      console.error('Delete membership error:', error);
      throw error;
    }
  },

  /**
   * Get team membership by ID
   * 
   * @deprecated Use teamService.getMembership() from @/services/teamService instead
   */
  async getMembership(teamId: string, userId: string, orgId?: string) {
    try {
      if (!orgId) {
        // Try to get orgId from team
        const team = await databaseService.getDocument('teams', teamId);
        orgId = team.orgId;
      }

      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const membership = await customTeamService.getMembership(teamId, userId, orgId);
      return membership;
    } catch (error) {
      console.error('Get membership error:', error);
      throw error;
    }
  },

  /**
   * Update team membership status (accept invitation)
   * 
   * @deprecated Use teamService.acceptInvitation() from @/services/teamService instead
   */
  async updateMembershipStatus(
    token: string,
    userId: string,
    orgId?: string
  ) {
    try {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const result = await customTeamService.acceptInvitation(token, userId, orgId);
      return result;
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

