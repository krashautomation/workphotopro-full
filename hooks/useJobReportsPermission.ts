import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';

export function useJobReportsPermission(teamId?: string) {
  const { user } = useAuth();
  const { currentTeam } = useOrganization();
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.$id) {
        setCanShare(false);
        setLoading(false);
        return;
      }

      const actualTeamId = teamId || currentTeam?.$id;
      if (!actualTeamId) {
        setCanShare(false);
        setLoading(false);
        return;
      }

      try {
        const memberships = await teamService.listMemberships(actualTeamId);
        const userMembership = memberships.memberships.find(
          (m: any) => m.userId === user.$id
        );

        if (userMembership) {
          // Owners always have permission
          const role = userMembership.membershipData?.role || userMembership.roles?.[0] || 'member';
          if (role.toLowerCase() === 'owner' || role.toLowerCase() === 'owners') {
            setCanShare(true);
          } else {
            // Check the permission flag
            setCanShare(userMembership.membershipData?.canShareJobReports === true);
          }
        } else {
          setCanShare(false);
        }
      } catch (error) {
        console.error('Error checking job reports permission:', error);
        setCanShare(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, teamId, currentTeam]);

  return { canShare, loading };
}

