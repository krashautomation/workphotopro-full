import { useAuth } from '@/context/AuthContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import { Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';

// Placeholder work groups data
const myMemberships = [
  {
    id: '1',
    name: 'Construction Team',
    organization: 'Acme Co.',
    memberCount: 12,
    description: 'Main construction crew for building projects',
    role: 'Team Member',
    isActive: true,
  },
  {
    id: '2',
    name: 'Electrical Team',
    organization: 'Acme Co.',
    memberCount: 8,
    description: 'Specialized electrical installation and maintenance',
    role: 'Team Lead',
    isActive: true,
  },
];

const myWorkGroups = [
  {
    id: '3',
    name: 'Project Alpha Team',
    organization: 'Acme Co.',
    memberCount: 5,
    description: 'Special project team for high-priority assignments',
    role: 'Manager',
    isActive: true,
  },
];

export default function WorkGroups() {
  const { user, isAuthenticated, getUserProfilePicture, getGoogleUserData } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'memberships' | 'myGroups'>('memberships');
  const [loading, setLoading] = useState(false);

  /**
   * Get display name with proper fallback logic
   */
  const getDisplayName = () => {
    return user?.name || 'User';
  };

  /**
   * Handle work group selection
   */
  const handleWorkGroupSelect = (workGroupId: string) => {
    console.log('Selected work group:', workGroupId);
    // TODO: Implement work group selection logic
    router.back();
  };

  /**
   * Handle create work group
   */
  const handleCreateWorkGroup = () => {
    console.log('Create work group pressed');
    // TODO: Navigate to create work group screen
  };

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view work groups</Text>
        <View style={globalStyles.verticalLinkContainer}>
          <Link href="/(auth)/sign-in">
            <Text style={globalStyles.link}>Sign in</Text>
          </Link>
          <Link href="/(auth)/sign-up">
            <Text style={globalStyles.link}>Sign up</Text>
          </Link>
        </View>
      </View>
    );
  }

  const currentData = activeTab === 'memberships' ? myMemberships : myWorkGroups;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Work Groups</Text>
          <Text style={styles.subtitle}>Select your work group</Text>
        </View>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="xmark"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'memberships' && styles.activeTab
          ]}
          onPress={() => setActiveTab('memberships')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'memberships' && styles.activeTabText
          ]}>
            My Memberships
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'myGroups' && styles.activeTab
          ]}
          onPress={() => setActiveTab('myGroups')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'myGroups' && styles.activeTabText
          ]}>
            My Work Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Work Groups List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'memberships' ? 'No memberships yet' : 'No work groups yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'memberships' 
                ? 'Join a work group to get started'
                : 'Create your first work group to start organizing your team'
              }
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.workGroupCard,
              item.isActive ? styles.activeCard : styles.inactiveCard
            ]}
            onPress={() => handleWorkGroupSelect(item.id)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.workGroupName}>{item.name}</Text>
                <View style={styles.statusIndicator}>
                  <IconSymbol
                    name={item.isActive ? "checkmark.circle.fill" : "pause.circle.fill"}
                    size={16}
                    color={item.isActive ? colors.success : colors.textMuted}
                  />
                </View>
              </View>
              <Text style={styles.organizationName}>{item.organization}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.roleText}>Role: {item.role}</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.memberCount}>
                  <IconSymbol
                    name="person.2"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.memberCountText}>{item.memberCount} members</Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Work Group Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateWorkGroup}
        >
          <IconSymbol
            name="plus"
            size={20}
            color={colors.text}
          />
          <Text style={styles.createButtonText}>Create Work Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Add padding to account for bottom button
  },
  workGroupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  activeCard: {
    // Active cards have default styling
  },
  inactiveCard: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workGroupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusIndicator: {
    marginLeft: 8,
  },
  organizationName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  roleContainer: {
    marginBottom: 12,
  },
  roleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
