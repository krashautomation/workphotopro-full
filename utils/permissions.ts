import { useMemo } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';

export type PermissionFeature =
  | 'canCreateTeam'
  | 'canDeleteTeam'
  | 'canInviteMember'
  | 'canRemoveMember'
  | 'canEditTeamSettings'
  | 'canCreateJob'
  | 'canDeleteJob'
  | 'canUploadPhoto'
  | 'canRecordVideo'
  | 'canToggleWatermark'
  | 'canToggleHD'
  | 'canGenerateReport'
  | 'canExportReport'
  | 'canShareReport'
  | 'canManageTags'
  | 'canManageBilling';

export interface PermissionsResult {
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isPremium: boolean;
  isTrial: boolean;
  isFree: boolean;
  canCreateTeam: boolean;
  canDeleteTeam: boolean;
  canInviteMember: boolean;
  canRemoveMember: boolean;
  canEditTeamSettings: boolean;
  canCreateJob: boolean;
  canDeleteJob: boolean;
  canUploadPhoto: boolean;
  canRecordVideo: boolean;
  canToggleWatermark: boolean;
  canToggleHD: boolean;
  canGenerateReport: boolean;
  canExportReport: boolean;
  canShareReport: boolean;
  canManageTags: boolean;
  canManageBilling: boolean;
}

type NormalizedRole = 'owner' | 'admin' | 'member' | 'unknown';
type NormalizedPlan = 'premium' | 'trial' | 'free';

function normalizeRole(role?: string | null): NormalizedRole {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'owner' || normalized === 'owners') return 'owner';
  if (normalized === 'admin' || normalized === 'admins') return 'admin';
  if (normalized === 'member' || normalized === 'members') return 'member';
  return 'unknown';
}

function normalizePlan(plan?: string | null): NormalizedPlan {
  const normalized = (plan || '').toLowerCase();
  if (normalized === 'trial') return 'trial';
  if (normalized === 'free' || normalized.length === 0) return 'free';
  return 'premium';
}

export function hasFeatureAccess(feature: string, role: string, plan: string): boolean {
  const normalizedRole = normalizeRole(role);
  const normalizedPlan = normalizePlan(plan);

  const isOwner = normalizedRole === 'owner';
  const isAdmin = normalizedRole === 'admin';
  const isMember = normalizedRole === 'member';
  const hasRole = isOwner || isAdmin || isMember;
  const isPaid = normalizedPlan === 'premium' || normalizedPlan === 'trial';

  switch (feature as PermissionFeature) {
    case 'canCreateTeam':
      return isOwner;
    case 'canDeleteTeam':
      // Last-team guard requires additional context outside this pure helper.
      return isOwner;
    case 'canInviteMember':
      return isOwner;
    case 'canRemoveMember':
      return isOwner;
    case 'canEditTeamSettings':
      return isOwner;
    case 'canCreateJob':
      return hasRole;
    case 'canDeleteJob':
      // Creator-based exception requires job + user context outside this pure helper.
      return isOwner;
    case 'canUploadPhoto':
      return hasRole;
    case 'canRecordVideo':
      return isPaid;
    case 'canToggleWatermark':
      return isOwner && isPaid;
    case 'canToggleHD':
      return isPaid;
    case 'canGenerateReport':
      return isPaid;
    case 'canExportReport':
      return isPaid;
    case 'canShareReport':
      // canShareJobReports flag requires membership context outside this pure helper.
      return isPaid;
    case 'canManageTags':
      return isOwner || isAdmin;
    case 'canManageBilling':
      return isOwner;
    default:
      return false;
  }
}

export function usePermissions(jobCreatedBy?: string) {
  const { user } = useAuth();
  const {
    currentOrganization,
    currentTeam,
    userTeams,
    isCurrentOrgPremium,
  } = useOrganization();

  return useMemo<PermissionsResult>(() => {
    const role = normalizeRole((currentTeam as any)?.membershipRole);
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    const isMember = role === 'member';
    const hasRole = isOwner || isAdmin || isMember;

    const expiryRaw = currentOrganization?.subscriptionExpiryDate;
    const expiryTime = expiryRaw ? new Date(expiryRaw).getTime() : 0;
    const hasActiveExpiry = Number.isFinite(expiryTime) && expiryTime > Date.now();

    const tier = (currentOrganization?.premiumTier || 'free').toLowerCase();
    const isTrial = tier === 'trial' && hasActiveExpiry;
    const isPremium = isCurrentOrgPremium && !isTrial;
    const isFree = !isPremium && !isTrial;

    const currentOrgId = currentOrganization?.$id;
    const ownedTeamsInCurrentOrg = userTeams.filter((team) => {
      const teamRole = normalizeRole((team as any)?.membershipRole);
      const sameOrg = !!currentOrgId && team.orgId === currentOrgId;
      return sameOrg && teamRole === 'owner';
    }).length;
    const isLastOwnedTeam = ownedTeamsInCurrentOrg <= 1;

    const isPaid = isPremium || isTrial;
    const membershipData = (currentTeam as any)?.membershipData;
    const canShareJobReports =
      membershipData?.canShareJobReports === true ||
      (currentTeam as any)?.canShareJobReports === true;

    const currentUserId = user?.$id;
    const isCurrentUserJobCreator =
      !!currentUserId &&
      typeof jobCreatedBy === 'string' &&
      jobCreatedBy === currentUserId;

    return {
      isOwner,
      isAdmin,
      isMember,

      isPremium,
      isTrial,
      isFree,

      canCreateTeam: isOwner,
      canDeleteTeam: isOwner && !isLastOwnedTeam,
      canInviteMember: isOwner,
      canRemoveMember: isOwner,
      canEditTeamSettings: isOwner,
      canCreateJob: hasRole,
      canDeleteJob: isOwner || isCurrentUserJobCreator,
      canUploadPhoto: hasRole,
      canRecordVideo: isPaid,
      canToggleWatermark: isOwner && isPaid,
      canToggleHD: isPaid,
      canGenerateReport: isPaid,
      canExportReport: isPaid,
      canShareReport: isPaid && canShareJobReports,
      canManageTags: isOwner || isAdmin,
      canManageBilling: isOwner,
    };
  }, [
    currentOrganization,
    currentTeam,
    jobCreatedBy,
    isCurrentOrgPremium,
    user?.$id,
    userTeams,
  ]);
}
