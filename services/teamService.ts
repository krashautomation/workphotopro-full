/**
 * Team Service - Abstraction Layer for Team Operations
 * 
 * This service provides a unified interface for all team-related operations,
 * abstracting away the underlying implementation (Appwrite Teams vs Custom Database).
 * 
 * FEATURE FLAG: EXPO_PUBLIC_USE_CUSTOM_TEAMS
 * - When false: Uses Appwrite Teams SDK (legacy)
 * - When true: Uses pure database implementation (target)
 * 
 * All team operations throughout the app should use this service instead of
 * directly calling Appwrite Teams SDK or database methods.
 * 
 * @example
 * ```typescript
 * import { teamService } from '@/services/teamService';
 * 
 * // Create a team
 * const team = await teamService.createTeam('My Team', orgId, userId);
 * 
 * // List teams
 * const teams = await teamService.listTeams(userId, orgId);
 * 
 * // Invite member
 * await teamService.inviteMember(teamId, orgId, 'user@example.com', ['member'], userId);
 * ```
 */

import { ID, Query } from 'react-native-appwrite';
import { databaseService } from '@/lib/appwrite/database';
import { teams as appwriteTeams, account } from '@/lib/appwrite/client';
import { generateSecureToken, hashToken } from '@/utils/crypto';
import { 
  Team, 
  TeamData, 
  Membership, 
  MembershipData,
  Organization 
} from '@/utils/types';

// Feature flag to toggle between implementations
const USE_CUSTOM_TEAMS = process.env.EXPO_PUBLIC_USE_CUSTOM_TEAMS === 'true';

console.log(`🔧 TeamService initialized with USE_CUSTOM_TEAMS=${USE_CUSTOM_TEAMS}`);

/**
 * Team Service - All team operations go through here
 */
export const teamService = {
  // ==========================================
  // TEAM CRUD OPERATIONS
  // ==========================================

  /**
   * Create a new team
   * 
   * @param name - Team name
   * @param orgId - Organization ID
   * @param userId - Creator user ID
   * @param description - Optional team description
   * @returns Created team document
   */
  async createTeam(
    name: string, 
    orgId: string, 
    userId: string, 
    description?: string
  ): Promise<TeamData> {
    console.log(`[TeamService] Creating team: ${name} in org: ${orgId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customCreateTeam(name, orgId, userId, description);
    }
    return this._appwriteCreateTeam(name, orgId, userId, description);
  },

  /**
   * Get team by ID with organization validation
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID (for validation)
   * @returns Team document
   */
  async getTeam(teamId: string, orgId: string): Promise<TeamData> {
    console.log(`[TeamService] Getting team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customGetTeam(teamId, orgId);
    }
    return this._appwriteGetTeam(teamId, orgId);
  },

  /**
   * List all teams for a user within an organization
   * 
   * @param userId - User ID
   * @param orgId - Organization ID
   * @returns Array of teams
   */
  async listTeams(userId: string, orgId: string): Promise<TeamData[]> {
    console.log(`[TeamService] Listing teams for user: ${userId} in org: ${orgId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customListTeams(userId, orgId);
    }
    return this._appwriteListTeams(userId, orgId);
  },

  /**
   * Update team details
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @param updates - Partial team data to update
   * @returns Updated team document
   */
  async updateTeam(
    teamId: string, 
    orgId: string, 
    updates: Partial<TeamData>
  ): Promise<TeamData> {
    console.log(`[TeamService] Updating team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customUpdateTeam(teamId, orgId, updates);
    }
    return this._appwriteUpdateTeam(teamId, orgId, updates);
  },

  /**
   * Delete team (soft delete)
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @returns Success status
   */
  async deleteTeam(teamId: string, orgId: string): Promise<{ success: boolean }> {
    console.log(`[TeamService] Deleting team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customDeleteTeam(teamId, orgId);
    }
    return this._appwriteDeleteTeam(teamId, orgId);
  },

  // ==========================================
  // MEMBERSHIP OPERATIONS
  // ==========================================

  /**
   * Invite a member to join the team
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @param email - Email address to invite
   * @param roles - Array of roles (e.g., ['member', 'admin'])
   * @param invitedBy - User ID sending the invitation
   * @returns Invitation details
   */
  async inviteMember(
    teamId: string,
    orgId: string,
    email: string,
    roles: string[],
    invitedBy: string
  ): Promise<{ invitation: any; token: string }> {
    console.log(`[TeamService] Inviting member: ${email} to team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customInviteMember(teamId, orgId, email, roles, invitedBy);
    }
    return this._appwriteInviteMember(teamId, orgId, email, roles, invitedBy);
  },

  /**
   * Remove member from team
   * 
   * @param teamId - Team ID
   * @param membershipId - Membership ID
   * @param orgId - Organization ID
   * @returns Success status
   */
  async removeMember(
    teamId: string,
    membershipId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    console.log(`[TeamService] Removing member: ${membershipId} from team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customRemoveMember(teamId, membershipId, orgId);
    }
    return this._appwriteRemoveMember(teamId, membershipId, orgId);
  },

  /**
   * Get membership details for a user in a team
   * 
   * @param teamId - Team ID
   * @param userId - User ID
   * @param orgId - Organization ID
   * @returns Membership document or null
   */
  async getMembership(
    teamId: string,
    userId: string,
    orgId: string
  ): Promise<MembershipData | null> {
    console.log(`[TeamService] Getting membership for user: ${userId} in team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customGetMembership(teamId, userId, orgId);
    }
    return this._appwriteGetMembership(teamId, userId, orgId);
  },

  /**
   * List all members of a team
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @returns Array of memberships
   */
  async listMembers(teamId: string, orgId: string): Promise<MembershipData[]> {
    console.log(`[TeamService] Listing members for team: ${teamId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customListMembers(teamId, orgId);
    }
    return this._appwriteListMembers(teamId, orgId);
  },

  /**
   * Update member role
   * 
   * @param teamId - Team ID
   * @param membershipId - Membership ID
   * @param roles - New roles array
   * @param orgId - Organization ID
   * @returns Updated membership
   */
  async updateMemberRole(
    teamId: string,
    membershipId: string,
    roles: string[],
    orgId: string
  ): Promise<MembershipData> {
    console.log(`[TeamService] Updating role for member: ${membershipId}`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customUpdateRole(teamId, membershipId, roles, orgId);
    }
    return this._appwriteUpdateRole(teamId, membershipId, roles, orgId);
  },

  /**
   * Accept an invitation to join a team
   * 
   * @param token - Invitation token
   * @param userId - User ID accepting
   * @param orgId - Organization ID
   * @returns Success status
   */
  async acceptInvitation(
    token: string,
    userId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    console.log(`[TeamService] Accepting invitation with token`);
    
    if (USE_CUSTOM_TEAMS) {
      return this._customAcceptInvitation(token, userId, orgId);
    }
    return this._appwriteAcceptInvitation(token, userId, orgId);
  },

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Check if user is a member of a team
   * 
   * @param userId - User ID
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @returns Boolean indicating membership
   */
  async isTeamMember(userId: string, teamId: string, orgId: string): Promise<boolean> {
    const membership = await this.getMembership(teamId, userId, orgId);
    return membership !== null && membership.isActive;
  },

  /**
   * Get user's role in a team
   * 
   * @param userId - User ID
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @returns Role string or null
   */
  async getUserRole(userId: string, teamId: string, orgId: string): Promise<string | null> {
    const membership = await this.getMembership(teamId, userId, orgId);
    return membership?.role || null;
  },

  /**
   * Check if user has specific role in team
   * 
   * @param userId - User ID
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @param roles - Array of allowed roles
   * @returns Boolean
   */
  async hasRole(
    userId: string, 
    teamId: string, 
    orgId: string, 
    roles: string[]
  ): Promise<boolean> {
    const userRole = await this.getUserRole(userId, teamId, orgId);
    return userRole !== null && roles.includes(userRole);
  },

  /**
   * Get count of team members
   * 
   * @param teamId - Team ID
   * @param orgId - Organization ID
   * @returns Member count
   */
  async getMemberCount(teamId: string, orgId: string): Promise<number> {
    const members = await this.listMembers(teamId, orgId);
    return members.length;
  },

  // ==========================================
  // CUSTOM IMPLEMENTATION (Target)
  // ==========================================

  async _customCreateTeam(
    name: string,
    orgId: string,
    userId: string,
    description?: string
  ): Promise<TeamData> {
    // Validate org access
    const org = await databaseService.getDocument('organizations', orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    // Create team
    const teamData = {
      teamName: name,
      orgId,
      description: description || '',
      isActive: true,
      settings: '{}',
      createdBy: userId,
    };

    const team = await databaseService.createDocument('teams', teamData);

    // Create owner membership
    await databaseService.createDocument('memberships', {
      userId,
      teamId: team.$id,
      orgId,
      role: 'owner',
      invitedBy: userId,
      joinedAt: new Date().toISOString(),
      isActive: true,
    });

    console.log(`[TeamService] Custom: Created team ${team.$id}`);
    return team as unknown as TeamData;
  },

  async _customGetTeam(teamId: string, orgId: string): Promise<TeamData> {
    const team = await databaseService.getDocument('teams', teamId);
    
    // Validate orgId
    if (team.orgId !== orgId) {
      throw new Error('Access denied: organization mismatch');
    }

    return team as unknown as TeamData;
  },

  async _customListTeams(userId: string, orgId: string): Promise<TeamData[]> {
    // Get memberships for user
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('userId', userId),
      Query.equal('orgId', orgId),
      Query.equal('isActive', true),
    ]);

    if (memberships.documents.length === 0) {
      return [];
    }

    const teamIds = memberships.documents.map((m: any) => m.teamId);

    // Get all teams in single query (N+1 fix)
    const teams = await databaseService.listDocuments('teams', [
      Query.equal('$id', teamIds),
      Query.equal('orgId', orgId),
      Query.equal('isActive', true),
    ]);

    return teams.documents as unknown as TeamData[];
  },

  async _customUpdateTeam(
    teamId: string,
    orgId: string,
    updates: Partial<TeamData>
  ): Promise<TeamData> {
    // Verify access
    await this._customGetTeam(teamId, orgId);

    const allowedUpdates = ['teamName', 'description', 'email', 'website', 'address', 'phone', 'teamPhotoUrl'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        filteredUpdates[key] = (updates as any)[key];
      }
    }

    const updated = await databaseService.updateDocument('teams', teamId, filteredUpdates);
    return updated as unknown as TeamData;
  },

  async _customDeleteTeam(teamId: string, orgId: string): Promise<{ success: boolean }> {
    // Verify team exists and belongs to org
    const team = await this._customGetTeam(teamId, orgId);

    // Soft delete memberships using paginated query
    const { paginatedList } = await import('@/utils/paginatedList');
    const memberships = await paginatedList('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('orgId', orgId),
      Query.equal('isActive', true),
    ]);

    for (const membership of memberships) {
      await databaseService.updateDocument('memberships', membership.$id, {
        isActive: false,
      });
    }

    // Soft delete team
    await databaseService.updateDocument('teams', teamId, {
      isActive: false,
    });

    console.log(`[TeamService] Custom: Soft-deleted team ${teamId} and ${memberships.length} memberships`);
    return { success: true };
  },

  async _customInviteMember(
    teamId: string,
    orgId: string,
    email: string,
    roles: string[],
    invitedBy: string
  ): Promise<{ invitation: any; token: string }> {
    // Verify team exists and belongs to org
    await this._customGetTeam(teamId, orgId);

    // Check for existing pending invitation
    const existing = await databaseService.listDocuments('invitations', [
      Query.equal('teamId', teamId),
      Query.equal('invitedEmail', email.toLowerCase()),
      Query.equal('status', 'pending'),
    ]);

    if (existing.documents.length > 0) {
      throw new Error('Pending invitation already exists for this email');
    }

    // Generate token
    const token = generateSecureToken(32);
    const tokenHash = await hashToken(token);

    // Set expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await databaseService.createDocument('invitations', {
      teamId,
      orgId,
      invitedBy,
      invitedEmail: email.toLowerCase(),
      role: roles[0] || 'member',
      tokenHash,
      status: 'pending',
      sentAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // Send email (via cloud function)
    await this._sendInvitationEmail(email, teamId, token, expiresAt);

    return { invitation, token };
  },

  async _customRemoveMember(
    teamId: string,
    membershipId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    // Verify membership belongs to team and org
    const membership = await databaseService.getDocument('memberships', membershipId);

    if (membership.teamId !== teamId || membership.orgId !== orgId) {
      throw new Error('Membership not found in this team/organization');
    }

    // Prevent removing the last owner
    if (membership.role === 'owner') {
      const owners = await databaseService.listDocuments('memberships', [
        Query.equal('teamId', teamId),
        Query.equal('orgId', orgId),
        Query.equal('role', 'owner'),
        Query.equal('isActive', true),
      ]);

      if (owners.documents.length <= 1) {
        throw new Error('Cannot remove the last owner of the team');
      }
    }

    // Soft delete
    await databaseService.updateDocument('memberships', membershipId, {
      isActive: false,
    });

    console.log(`[TeamService] Custom: Removed member ${membershipId} from team ${teamId}`);
    return { success: true };
  },

  async _customGetMembership(
    teamId: string,
    userId: string,
    orgId: string
  ): Promise<MembershipData | null> {
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('userId', userId),
      Query.equal('orgId', orgId),
      Query.equal('isActive', true),
    ]);

    if (memberships.documents.length === 0) {
      return null;
    }

    return memberships.documents[0] as unknown as MembershipData;
  },

  async _customListMembers(teamId: string, orgId: string): Promise<MembershipData[]> {
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('orgId', orgId),
      Query.equal('isActive', true),
    ]);

    return memberships.documents as unknown as MembershipData[];
  },

  async _customUpdateRole(
    teamId: string,
    membershipId: string,
    roles: string[],
    orgId: string
  ): Promise<MembershipData> {
    // Verify membership
    const membership = await databaseService.getDocument('memberships', membershipId);

    if (membership.teamId !== teamId || membership.orgId !== orgId) {
      throw new Error('Membership not found');
    }

    const newRole = roles[0] || 'member';

    // Prevent demoting the last owner
    if (membership.role === 'owner' && newRole !== 'owner') {
      const owners = await databaseService.listDocuments('memberships', [
        Query.equal('teamId', teamId),
        Query.equal('orgId', orgId),
        Query.equal('role', 'owner'),
        Query.equal('isActive', true),
      ]);

      if (owners.documents.length <= 1) {
        throw new Error('Cannot demote the last owner of the team');
      }
    }

    const updated = await databaseService.updateDocument('memberships', membershipId, {
      role: newRole,
    });

    console.log(`[TeamService] Custom: Updated role for member ${membershipId} to ${newRole}`);
    return updated as unknown as MembershipData;
  },

  async _customAcceptInvitation(
    token: string,
    userId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    const tokenHash = await hashToken(token);

    // Find invitation
    const invitations = await databaseService.listDocuments('invitations', [
      Query.equal('tokenHash', tokenHash),
      Query.equal('status', 'pending'),
    ]);

    if (invitations.documents.length === 0) {
      throw new Error('Invalid or expired invitation');
    }

    const invitation = invitations.documents[0];

    // Verify orgId
    if (invitation.orgId !== orgId) {
      throw new Error('Organization mismatch');
    }

    // Check expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      await databaseService.updateDocument('invitations', invitation.$id, {
        status: 'expired',
      });
      throw new Error('Invitation expired');
    }

    // Verify email matches current user
    const user = await account.get();
    if (user.email.toLowerCase() !== invitation.invitedEmail) {
      throw new Error('Email mismatch');
    }

    // Create membership
    await databaseService.createDocument('memberships', {
      userId,
      teamId: invitation.teamId,
      orgId: invitation.orgId,
      role: invitation.role,
      userEmail: user.email,
      userName: user.name,
      invitedBy: invitation.invitedBy,
      joinedAt: new Date().toISOString(),
      isActive: true,
    });

    // Update invitation
    await databaseService.updateDocument('invitations', invitation.$id, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: userId,
    });

    return { success: true };
  },

  // ==========================================
  // APPWRITE IMPLEMENTATION (Legacy)
  // ==========================================

  async _appwriteCreateTeam(
    name: string,
    orgId: string,
    userId: string,
    description?: string
  ): Promise<TeamData> {
    // Create in Appwrite
    const appwriteTeam = await appwriteTeams.create(ID.unique(), name);

    // Create in our database
    const teamData = {
      teamName: name,
      appwriteTeamId: appwriteTeam.$id,
      orgId,
      description: description || '',
      isActive: true,
      settings: '{}',
    };

    const team = await databaseService.createDocument('teams', teamData);

    // Create owner membership
    await databaseService.createDocument('memberships', {
      userId,
      teamId: team.$id,
      role: 'owner',
      invitedBy: userId,
      joinedAt: new Date().toISOString(),
      isActive: true,
    });

    console.log(`[TeamService] Appwrite: Created team ${team.$id}`);
    return team as unknown as TeamData;
  },

  async _appwriteGetTeam(teamId: string, orgId: string): Promise<TeamData> {
    // Get from database
    const teamData = await databaseService.listDocuments('teams', [
      Query.equal('$id', teamId),
    ]);

    if (teamData.documents.length === 0) {
      throw new Error('Team not found');
    }

    const team = teamData.documents[0] as unknown as TeamData;

    // Validate orgId
    if (team.orgId !== orgId) {
      throw new Error('Access denied: organization mismatch');
    }

    // Get Appwrite team (for side effects/logging only in legacy mode)
    if (team.appwriteTeamId) {
      try {
        await appwriteTeams.get(team.appwriteTeamId);
        return team;
      } catch (error) {
        console.warn('Appwrite team not found, using database only');
        return team;
      }
    }

    return team;
  },

  async _appwriteListTeams(userId: string, orgId: string): Promise<TeamData[]> {
    // Get from Appwrite
    const appwriteTeamsList = await appwriteTeams.list();

    // Filter to only teams in this org
    const teamsWithData: TeamData[] = [];

    for (const appwriteTeam of appwriteTeamsList.teams) {
      const dbTeams = await databaseService.listDocuments('teams', [
        Query.equal('appwriteTeamId', appwriteTeam.$id),
        Query.equal('orgId', orgId),
      ]);

      if (dbTeams.documents.length > 0) {
        // Return DB team only (simplified for type safety)
        teamsWithData.push(dbTeams.documents[0] as unknown as TeamData);
      }
    }

    return teamsWithData;
  },

  async _appwriteUpdateTeam(
    teamId: string,
    orgId: string,
    updates: Partial<TeamData>
  ): Promise<TeamData> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    // Update in Appwrite if name changed (legacy mode)
    if (updates.teamName && team.appwriteTeamId) {
      await appwriteTeams.updateName(team.appwriteTeamId, updates.teamName);
    }

    // Update in database
    const allowedUpdates = ['teamName', 'description', 'email', 'website', 'address', 'phone', 'teamPhotoUrl'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        filteredUpdates[key] = (updates as any)[key];
      }
    }

    const updated = await databaseService.updateDocument('teams', teamId, filteredUpdates);
    return updated as unknown as TeamData;
  },

  async _appwriteDeleteTeam(teamId: string, orgId: string): Promise<{ success: boolean }> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    // Delete from Appwrite
    if (team.appwriteTeamId) {
      try {
        await appwriteTeams.delete(team.appwriteTeamId);
      } catch (error) {
        console.warn('Could not delete from Appwrite:', error);
      }
    }

    // Soft delete memberships
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
    ]);

    for (const membership of memberships.documents) {
      await databaseService.updateDocument('memberships', membership.$id, {
        isActive: false,
      });
    }

    // Soft delete team
    await databaseService.updateDocument('teams', teamId, {
      isActive: false,
    });

    return { success: true };
  },

  async _appwriteInviteMember(
    teamId: string,
    orgId: string,
    email: string,
    roles: string[],
    invitedBy: string
  ): Promise<{ invitation: any; token: string }> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    if (!team.appwriteTeamId) {
      throw new Error('Appwrite team ID not found');
    }

    // Create Appwrite membership
    const url = `${process.env.EXPO_PUBLIC_APP_URL}/accept-invite`;
    const membership = await appwriteTeams.createMembership(
      team.appwriteTeamId,
      roles,
      email,
      undefined,
      undefined,
      url
    );

    // Store in our database
    const membershipData = {
      userId: membership.userId || '',
      teamId,
      role: roles[0] || 'member',
      userEmail: email,
      invitedBy,
      joinedAt: new Date().toISOString(),
      isActive: true,
    };

    const doc = await databaseService.createDocument('memberships', membershipData);

    return { 
      invitation: membership,
      token: membership.$id  // Appwrite uses membership ID as token
    };
  },

  async _appwriteRemoveMember(
    teamId: string,
    membershipId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    if (!team.appwriteTeamId) {
      throw new Error('Appwrite team ID not found');
    }

    // Delete from Appwrite
    await appwriteTeams.deleteMembership(team.appwriteTeamId, membershipId);

    // Soft delete in database
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
    ]);

    for (const membership of memberships.documents) {
      await databaseService.updateDocument('memberships', membership.$id, {
        isActive: false,
      });
    }

    return { success: true };
  },

  async _appwriteGetMembership(
    teamId: string,
    userId: string,
    orgId: string
  ): Promise<MembershipData | null> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    if (!team.appwriteTeamId) {
      return null;
    }

    // Get from Appwrite
    const appwriteMemberships = await appwriteTeams.listMemberships(team.appwriteTeamId);
    const appwriteMembership = appwriteMemberships.memberships.find(
      (m: any) => m.userId === userId
    );

    if (!appwriteMembership) {
      return null;
    }

    // Get from database
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('userId', userId),
    ]);

    if (memberships.documents.length === 0) {
      return null;
    }

    // Return DB membership only (simplified for type safety)
    return memberships.documents[0] as unknown as MembershipData;
  },

  async _appwriteListMembers(teamId: string, orgId: string): Promise<MembershipData[]> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    if (!team.appwriteTeamId) {
      return [];
    }

    // Get from database only (simplified for type safety)
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('isActive', true),
    ]);

    return memberships.documents as unknown as MembershipData[];
  },

  async _appwriteUpdateRole(
    teamId: string,
    membershipId: string,
    roles: string[],
    orgId: string
  ): Promise<MembershipData> {
    const team = await this._appwriteGetTeam(teamId, orgId);

    if (!team.appwriteTeamId) {
      throw new Error('Appwrite team ID not found');
    }

    // Update in Appwrite
    const updated = await appwriteTeams.updateMembership(
      team.appwriteTeamId,
      membershipId,
      roles
    );

    // Update in database
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
    ]);

    const dbMembership = memberships.documents.find((m: any) => m.userId === updated.userId);
    if (dbMembership) {
      await databaseService.updateDocument('memberships', dbMembership.$id, {
        role: roles[0] || 'member',
      });
    }

    // Return DB membership instead (simplified for type safety)
    const dbResult = await databaseService.listDocuments('memberships', [
      Query.equal('teamId', teamId),
      Query.equal('isActive', true),
    ]);
    const result = dbResult.documents.find((m: any) => m.userId === updated.userId);
    return result as unknown as MembershipData;
  },

  async _appwriteAcceptInvitation(
    token: string,
    userId: string,
    orgId: string
  ): Promise<{ success: boolean }> {
    // Find which team this invitation is for
    const teams = await databaseService.listDocuments('teams', [
      Query.equal('orgId', orgId),
    ]);

    for (const team of teams.documents) {
      if (!team.appwriteTeamId) continue;

      try {
        await appwriteTeams.updateMembershipStatus(
          team.appwriteTeamId,
          token,
          userId,
          token  // secret is same as membership ID in Appwrite
        );

        // Update membership in database
        const memberships = await databaseService.listDocuments('memberships', [
          Query.equal('teamId', team.$id),
        ]);

        const membership = memberships.documents.find((m: any) => m.userId === userId);
        if (membership) {
          await databaseService.updateDocument('memberships', membership.$id, {
            isActive: true,
          });
        }

        return { success: true };
      } catch (error) {
        // Try next team
        continue;
      }
    }

    throw new Error('Invitation not found');
  },

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  async _sendInvitationEmail(
    email: string,
    teamId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    const team = await databaseService.getDocument('teams', teamId);
    const invitationLink = `${process.env.EXPO_PUBLIC_APP_URL}/accept-invite?token=${token}`;

    // TODO: Wire up actual email provider (SendGrid, Resend, etc.)
    // This is currently stubbed - the invitation is created but email is not sent
    // When ready, implement the email send via Appwrite Cloud Function:
    //
    // await functions.createExecution(
    //   'sendInvitationEmail',
    //   JSON.stringify({
    //     to: email,
    //     teamName: team.teamName,
    //     invitationLink,
    //     expiresAt: expiresAt.toISOString(),
    //   })
    // );

    console.log(`[TeamService] 📧 Invitation email stubbed (not sent):`);
    console.log(`  To: ${email}`);
    console.log(`  Team: ${team.teamName}`);
    console.log(`  Link: ${invitationLink}`);
    console.log(`  Expires: ${expiresAt.toISOString()}`);
    console.log(`  Token: ${token}`);
    console.log(`  TODO: Implement email sending via Appwrite Cloud Function`);

    // Don't throw - invitation is still created in database
    // Email can be retried later or sent manually
  },
};

// Export type for consumers
export type TeamService = typeof teamService;

// Default export for convenience
export default teamService;
