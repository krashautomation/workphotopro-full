import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Switch, Linking } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import TagTestComponent from '@/components/TagTestComponent';

export default function ProfileScreen() {
  const { user, getGoogleUserData, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [imageTimestamps, setImageTimestamps] = useState(true);
  const [storeImagesLocally, setStoreImagesLocally] = useState(false);
  const [fullHDImages, setFullHDImages] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  // Test component state
  const [showTagTest, setShowTagTest] = useState(false);

  useEffect(() => {
    loadGoogleData();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from edit account)
  useFocusEffect(
    React.useCallback(() => {
      loadGoogleData();
    }, [])
  );

  const loadGoogleData = async () => {
    try {
      const data = await getGoogleUserData();
      setGoogleData(data);
    } catch (error) {
      console.error('Error loading Google data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        },
      ]
    );
  };


  const handleContactUs = () => {
    Linking.openURL('https://workphotopro.com/contact');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://workphotopro.com/privacy');
  };

  const handleTermsConditions = () => {
    Linking.openURL('https://workphotopro.com/terms-of-service');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showTagTest) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Tag Database Test' }} />
        <TagTestComponent />
        <Pressable
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            backgroundColor: Colors.Error,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
          }}
          onPress={() => setShowTagTest(false)}
        >
          <Text style={{ color: Colors.White, fontWeight: '600' }}>Close Test</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <UserProfile 
            size={120} 
            showEditButton={true}
            showName={true}
          />
          
          {/* Joined Date */}
          <View style={styles.joinedDateContainer}>
            <Text style={styles.joinedDateText}>
              Joined {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'Not available'}
            </Text>
          </View>
        </View>

        {/* User Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable onPress={() => {
            console.log('Edit account button pressed');
            router.push('/edit-account');
          }}>
            <IconSymbol name="pencil" color="#007AFF" size={16} />
          </Pressable>
        </View>
        
        <View style={styles.infoSection}>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {googleData?.displayName || googleData?.googleName || googleData?.firstName || user?.name || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {googleData?.googleEmail || user?.email || 'Not provided'}
            </Text>
          </View>
          
          {googleData?.firstName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{googleData.firstName}</Text>
            </View>
          )}
          
          {googleData?.lastName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{googleData.lastName}</Text>
            </View>
          )}
          
          {googleData?.locale && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Locale</Text>
              <Text style={styles.infoValue}>{googleData.locale}</Text>
            </View>
          )}
        </View>

        {/* Organization Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Organization</Text>
          <Pressable onPress={() => {
            console.log('Edit organization button pressed');
            console.log('Current organization before navigation:', currentOrganization);
            console.log('Organization name:', currentOrganization?.orgName);
            console.log('Organization description:', currentOrganization?.description);
            router.push('/(jobs)/edit-organization');
          }}>
            <IconSymbol name="pencil" color="#007AFF" size={16} />
          </Pressable>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>
              {currentOrganization?.orgName || 'No Organization'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {currentOrganization?.description || 'No description available'}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          
          <View style={styles.settingsCard}>
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="clock.badge.checkmark" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Image timestamps</Text>
              </View>
              <Switch
                value={imageTimestamps}
                onValueChange={setImageTimestamps}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
              />
            </Pressable>
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="internaldrive" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Store images locally</Text>
              </View>
              <Switch
                value={storeImagesLocally}
                onValueChange={setStoreImagesLocally}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
              />
            </Pressable>
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="4k.tv" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Full HD images</Text>
              </View>
              <Switch
                value={fullHDImages}
                onValueChange={setFullHDImages}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
              />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={() => router.push('/(jobs)/archived-teams')}>
              <View style={styles.settingLeft}>
                <IconSymbol name="archivebox.fill" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Archived teams</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="folder.badge.plus" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Local images</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="bell" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
              />
            </Pressable>
          </View>
        </View>

        {/* Additional Settings Section */}
        <View style={styles.additionalSettingsSection}>
          <View style={styles.settingsCard}>
            <Pressable style={styles.settingItem} onPress={handleContactUs}>
              <View style={styles.settingLeft}>
                <IconSymbol name="envelope.badge" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Contact us</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={handlePrivacyPolicy}>
              <View style={styles.settingLeft}>
                <IconSymbol name="shield.checkered" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Privacy policy</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={handleTermsConditions}>
              <View style={styles.settingLeft}>
                <IconSymbol name="doc.text.magnifyingglass" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Terms & conditions</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol name="app.badge" color="#22C55E" size={20} />
                <Text style={styles.settingText}>App version</Text>
              </View>
              <Text style={styles.versionText}>0.1.22.165</Text>
            </View>
            
            <Pressable 
              style={styles.settingItem}
              onPress={() => setShowTagTest(true)}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="tag" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Test Tag Database</Text>
              </View>
              <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
            </Pressable>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol name="arrow.right.square" color={Colors.White} size={20} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.Text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  joinedDateContainer: {
    marginTop: 8,
  },
  joinedDateText: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoSection: {
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.Text,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.Gray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.Text,
  },
  settingsSection: {
    marginBottom: 20,
  },
  additionalSettingsSection: {
    marginBottom: 20,
  },
  settingsCard: {
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Gray + '20',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: Colors.Text,
    marginLeft: 12,
  },
  versionText: {
    fontSize: 14,
    color: Colors.Gray,
    fontWeight: '500',
  },
  actionsSection: {
    marginTop: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
  },
  signOutText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});