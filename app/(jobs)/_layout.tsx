import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import Avatar from '@/components/Avatar';

function HeaderRight() {
  const router = useRouter();
  const { getUserProfilePicture, getGoogleUserData, user } = useAuth();
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
    <TouchableOpacity 
      style={{ marginRight: 16 }}
      onPress={() => router.push('/(jobs)/profile')}
    >
      <Avatar
        name={displayName}
        imageUrl={profilePicture || undefined}
        size={32}
      />
    </TouchableOpacity>
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
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Jobs',
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
        name="profile"
        options={{
          headerShown: true,
          title: 'Profile',
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
        name="invite"
        options={{
          headerShown: true,
          title: 'Invite to Team',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
