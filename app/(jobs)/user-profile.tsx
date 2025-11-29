import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Coins } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/globalStyles';
import { jobChatService } from '@/lib/appwrite/database';

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, getGoogleUserData } = useAuth();
  const { currentOrganization, userTeams } = useOrganization();
  const [googleData, setGoogleData] = React.useState<any>(null);
  const [ownedJobsCount, setOwnedJobsCount] = React.useState<number | null>(null);
  const [loadingJobCounts, setLoadingJobCounts] = React.useState(false);

  const getParamString = React.useCallback((value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }, []);

  const nameParam = getParamString(params.name);
  const organizationParam = getParamString(params.organization);
  const imageParam = getParamString(params.imageUrl);
  const contactsCountParam = getParamString(params.contactsCount);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getGoogleUserData();
        if (mounted) {
          setGoogleData(data);
        }
      } catch (error) {
        console.warn('Failed to load Google data for profile screen', error);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [getGoogleUserData]);

  const displayName = React.useMemo(() => {
    if (typeof nameParam === 'string' && nameParam.trim().length > 0) {
      return nameParam.trim();
    }
    return googleData?.displayName || user?.name || 'User';
  }, [googleData?.displayName, nameParam, user?.name]);

  const organizationName = React.useMemo(() => {
    if (typeof organizationParam === 'string' && organizationParam.trim().length > 0) {
      return organizationParam.trim();
    }
    return currentOrganization?.orgName || 'No organization assigned';
  }, [currentOrganization?.orgName, organizationParam]);

  const profileImage = React.useMemo(() => {
    if (typeof imageParam === 'string' && imageParam.trim().length > 0) {
      return imageParam.trim();
    }
    return googleData?.photoUrl || (user as any)?.profileImage || null;
  }, [googleData?.photoUrl, imageParam, user]);

  const contactsCount = React.useMemo(() => {
    const parsed = contactsCountParam ? Number(contactsCountParam) : null;
    if (parsed !== null && !isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
    return 0;
  }, [contactsCountParam]);

  const ownedTeams = React.useMemo(
    () =>
      userTeams.filter(team => {
        const role = ((team as any)?.membershipRole || '') as string;
        return role.toLowerCase() === 'owner';
      }),
    [userTeams]
  );

  const membershipsCount = userTeams.length;
  const ownedTeamsCount = ownedTeams.length;

  React.useEffect(() => {
    let cancelled = false;
    const loadJobCounts = async () => {
      if (ownedTeams.length === 0) {
        setOwnedJobsCount(0);
        return;
      }

      const teamIds = Array.from(new Set(ownedTeams.map(team => team.$id))).filter(Boolean);
      if (teamIds.length === 0) {
        setOwnedJobsCount(0);
        return;
      }

      setLoadingJobCounts(true);
      try {
        const results = await Promise.all(
          teamIds.map(teamId => jobChatService.listJobChats(teamId))
        );
        const total = results.reduce((sum, result) => {
          const count = typeof result?.total === 'number'
            ? result.total
            : Array.isArray(result?.documents)
            ? result.documents.length
            : 0;
          return sum + count;
        }, 0);
        if (!cancelled) {
          setOwnedJobsCount(total);
        }
      } catch (error) {
        console.error('Failed to load job counts for owned teams', error);
        if (!cancelled) {
          setOwnedJobsCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingJobCounts(false);
        }
      }
    };

    loadJobCounts();

    return () => {
      cancelled = true;
    };
  }, [ownedTeams]);


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'User Profile',
          headerShown: true,
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(jobs)/profile-settings')}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
            >
              <IconSymbol name="gearshape" size={18} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Avatar name={displayName} imageUrl={profileImage || undefined} size={80} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.role}>Vancouver, B.C.</Text>
          <Text style={styles.description}>💼 Business Owner & Founder</Text>
          <View style={styles.quickStatsContainer}>
            <Pressable onPress={() => router.push('/(jobs)/contacts')}>
              <Text style={styles.quickStats}>
                <Text style={styles.quickStatNumber}>203 </Text>
                <Text style={styles.quickStatLinkLabel}>CONTACTS</Text>
                <Text style={styles.dotSeparator}> · </Text>
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(jobs)/achievements')}>
              <View style={styles.experienceStat}>
                <Text style={styles.quickStats}>
                  <Text style={styles.quickStatNumber}>157 </Text>
                </Text>
                <Coins size={14} color="#FFD700" strokeWidth={2} />
                <Text style={styles.quickStats}>
                  <Text style={styles.quickStatLinkLabel}>EXPERIENCE</Text>
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{organizationName}</Text>
          <Text style={styles.descriptionText}>
            {currentOrganization?.description || 'No description available'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  role: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  description: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  listTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  experienceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStats: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  quickStatNumber: {
    fontWeight: '700',
    color: '#fff',
  },
  quickStatLabel: {
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  quickStatLinkLabel: {
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
  },
  dotSeparator: {
    fontWeight: '700',
    color: colors.textSecondary,
    fontSize: 24,
  },
});

