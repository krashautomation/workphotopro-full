import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { JobFilterProvider } from '@/context/JobFilterContext';
import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { Crown, ChevronRight } from 'lucide-react-native';
import { colors } from '@/styles/globalStyles';
import { useNotifications } from '@/hooks/useNotifications';

function HeaderRight() {
  const router = useRouter();
  const { getUserProfilePicture, getGoogleUserData, user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { unreadCount } = useNotifications();
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
  const [googleData, setGoogleData] = React.useState<any>(null);

  React.useEffect(() => {
    const loadData = async () => {
      const pic = await getUserProfilePicture();
      setProfilePicture(pic);
      const data = await getGoogleUserData();
      setGoogleData(data);
    };
    loadData();
  }, []);

  const displayName = googleData?.displayName || googleData?.googleName || googleData?.firstName || user?.name || 'User';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 }}>
      <TouchableOpacity 
        onPress={() => router.push('/(jobs)/get-premium')}
      >
        <View style={styles.upgradeButton}>
          <Crown size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.upgradeButtonText}>Get Premium</Text>
          <ChevronRight size={14} color="#ffffff" style={{ marginLeft: 0 }} />
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => router.push('/(jobs)/notifications')}
        style={styles.bellButton}
      >
        <IconSymbol
          name="bell"
          size={24}
          color={colors.textSecondary}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => {
          const params: Record<string, string> = {};
          if (displayName) params.name = displayName;
          if (currentOrganization?.orgName) params.organization = currentOrganization.orgName;
          if (profilePicture) params.imageUrl = profilePicture;
          router.push({ pathname: '/(jobs)/user-profile', params });
        }}
      >
        <Avatar
          name={displayName}
          imageUrl={profilePicture || undefined}
          size={32}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function JobsLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <JobFilterProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: 'Jobs list',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
            headerRight: () => <HeaderRight />,
          }}
        />
        <Stack.Screen
          name="new-job"
          options={{
            headerShown: true,
            title: 'New Job',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="profile-settings"
          options={{
            headerShown: true,
            title: 'Profile',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            headerShown: true,
            title: 'User Profile',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="[job]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="team"
          options={{
            headerShown: true,
            title: 'Team',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="edit-tags"
          options={{
            headerShown: true,
            title: 'Edit Tags',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="edit-tag"
          options={{
            headerShown: true,
            title: 'Edit Tag',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="edit-organization"
          options={{
            headerShown: true,
            title: 'Edit Organization',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="new-team"
          options={{
            headerShown: true,
            title: 'Create Team',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="edit-team"
          options={{
            headerShown: true,
            title: 'Edit Team',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="invite"
          options={{
            headerShown: true,
            title: 'Invite to Team',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: 'Notifications',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{
            headerShown: true,
            title: 'Notification Settings',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="filter-jobs"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="video-camera"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </JobFilterProvider>
  );
}

const styles = StyleSheet.create({
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
