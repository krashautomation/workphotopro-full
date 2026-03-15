import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { colors } from '@/styles/globalStyles';
import { databaseService } from '@/lib/appwrite/database';
import { Query } from 'react-native-appwrite';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { TeamData } from '@/utils/types';
import { usePermissions } from '@/utils/permissions';

export default function ArchivedTeams() {
  const { user, isAuthenticated } = useAuth();
  const { currentOrganization, loading: orgLoading, loadUserData } = useOrganization();
  const { canEditTeamSettings } = usePermissions();
  const router = useRouter();

  const [archivedTeams, setArchivedTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringTeamId, setRestoringTeamId] = useState<string | null>(null);

  const fetchArchivedTeams = async () => {
    try {
      setError(null);

      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      if (!currentOrganization?.$id) {
        setArchivedTeams([]);
        setLoading(false);
        return;
      }

      const response = await databaseService.listDocuments('teams', [
        Query.equal('orgId', currentOrganization.$id),
        Query.equal('isActive', false),
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]);

      setArchivedTeams(response.documents as unknown as TeamData[]);
    } catch (err) {
      console.error('Error fetching archived teams:', err);
      setError('Failed to load archived teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchArchivedTeams();
    } catch (err) {
      console.error('Error refreshing archived teams:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const restoreAssociatedJobchats = async (teamId: string) => {
    try {
      // Find jobchats for this team and reactivate them
      const jobs = await databaseService.listDocuments('jobchat', [
        Query.equal('teamId', teamId),
        Query.limit(100),
      ]);

      let restoredCount = 0;
      for (const job of jobs.documents) {
        if (job.deletedAt || job.status === 'archived') {
          await databaseService.updateDocument('jobchat', job.$id, {
            deletedAt: null,
            status: 'active',
          });
          restoredCount += 1;
        }
      }
      return { restored: restoredCount };
    } catch (err) {
      console.warn('Error restoring associated jobchats:', err);
      return { restored: 0 };
    }
  };

  const handleRestoreTeam = async (teamDoc: TeamData) => {
    if (!canEditTeamSettings) {
      Alert.alert('Permission Denied', 'Only team owners can restore archived teams.');
      return;
    }

    try {
      setRestoringTeamId(teamDoc.$id);

      // Reactivate the team document
      await databaseService.updateDocument('teams', teamDoc.$id, { isActive: true });

      // Best-effort restoration of related jobchats
      const { restored } = await restoreAssociatedJobchats(teamDoc.$id);

      // Refresh user data so the team shows up in lists again
      await loadUserData();

      // Remove from local list
      setArchivedTeams(prev => prev.filter(t => t.$id !== teamDoc.$id));

      Alert.alert(
        'Team Restored',
        restored > 0
          ? `"${teamDoc.teamName}" and ${restored} job${restored === 1 ? '' : 's'} restored.`
          : `"${teamDoc.teamName}" restored. No associated jobs were updated.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error restoring team:', err);
      Alert.alert('Error', 'Failed to restore team. Please try again.', [{ text: 'OK' }]);
    } finally {
      setRestoringTeamId(null);
    }
  };

  const confirmRestoreTeam = (teamDoc: TeamData) => {
    Alert.alert(
      'Restore Team',
      `Are you sure you want to restore "${teamDoc.teamName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => handleRestoreTeam(teamDoc) },
      ]
    );
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchArchivedTeams();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentOrganization]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user && currentOrganization) {
        fetchArchivedTeams();
      }
    }, [isAuthenticated, user, currentOrganization])
  );

  if (loading || orgLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view archived teams</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Archived Teams</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={archivedTeams}
        keyExtractor={(item) => item.$id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="archivebox"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No archived teams</Text>
            <Text style={styles.emptySubtext}>
              Teams you archive will appear here
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.teamCard}>
            <View style={styles.teamContent}>
              <Text style={styles.teamName}>{item.teamName}</Text>
              {item.description ? (
                <Text style={styles.teamDescription}>{item.description}</Text>
              ) : null}
              <View style={styles.teamMeta}>
                <Text style={styles.teamDate}>
                  Archived on {new Date(item.$updatedAt || item.$createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.restoreButton,
                restoringTeamId === item.$id && styles.restoreButtonDisabled,
              ]}
              onPress={() => confirmRestoreTeam(item)}
              disabled={restoringTeamId === item.$id}
            >
              {restoringTeamId === item.$id ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.restoreButtonText}>Restore</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 36,
  },
  errorBanner: {
    backgroundColor: colors.surface,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  teamCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContent: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  teamMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  restoreButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  restoreButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  restoreButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});


