import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { JobFilterProvider } from '@/context/JobFilterContext';
import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import { Rocket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/globalStyles';
import { webGradients } from '@/styles/webDesignTokens';

function HeaderRight() {
  const router = useRouter();
  const { getUserProfilePicture, getGoogleUserData, user } = useAuth();
  const { currentOrganization } = useOrganization();
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
        <LinearGradient
          colors={webGradients.primary.colors}
          start={webGradients.primary.start}
          end={webGradients.primary.end}
          style={styles.upgradeButton}
        >
          <Rocket size={16} color="#000000" style={{ marginRight: 6 }} />
          <Text style={styles.upgradeButtonText}>Get Premium</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => router.push('/(jobs)/notifications')}
      >
        <IconSymbol
          name="bell"
          size={20}
          color={colors.textSecondary}
        />
        {/* TODO: Add notification badge when unread count > 0 */}
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20, // pill-shaped
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});
