import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Switch, Linking } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import TagTestComponent from '@/components/TagTestComponent';
import { userPreferencesService } from '@/lib/appwrite/database';
import { ResolutionPreference, TimestampPreference } from '@/utils/types';
import { organizationService } from '@/lib/appwrite/teams';
import { UserPlus, Building2 } from 'lucide-react-native';
import { Image } from 'expo-image';

export default function ProfileScreen() {
  const { user, getGoogleUserData, signOut } = useAuth();
  const {
    currentOrganization,
    userOrganizations,
    userTeams,
    loadUserData,
  } = useOrganization();
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const expoExtra = Constants.expoConfig?.extra as { appVersion?: string } | undefined;
  const manifestExtra = (Constants.manifest as { extra?: { appVersion?: string } } | null)?.extra;
  const appVersion = expoExtra?.appVersion ?? manifestExtra?.appVersion ?? '0.1.0-alpha';
  
  // Settings state
  const [imageTimestamps, setImageTimestamps] = useState(true);
  const [storeImagesLocally, setStoreImagesLocally] = useState(false);
  const [fullHDImages, setFullHDImages] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [imageWatermark, setImageWatermark] = useState(true);
  const [updatingOrgWatermark, setUpdatingOrgWatermark] = useState(false);
  const [hdPreferences, setHdPreferences] = useState<Record<string, ResolutionPreference>>({});
  const [timestampPreferences, setTimestampPreferences] = useState<Record<string, TimestampPreference>>({});
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingHdPreference, setSavingHdPreference] = useState(false);
  const [updatingOrgHd, setUpdatingOrgHd] = useState(false);
  const [savingTimestampPreference, setSavingTimestampPreference] = useState(false);
  const [updatingOrgTimestamp, setUpdatingOrgTimestamp] = useState(false);
  const [videoRecordingEnabled, setVideoRecordingEnabled] = useState(false);
  const [hdVideoEnabled, setHdVideoEnabled] = useState(false);
  const [updatingOrgVideoRecording, setUpdatingOrgVideoRecording] = useState(false);
  const [updatingOrgHdVideo, setUpdatingOrgHdVideo] = useState(false);
  
  const ownedOrganizations = React.useMemo(
    () => userOrganizations.filter(org => org.ownerId === user?.$id),
    [userOrganizations, user?.$id]
  );

  const profileOrganization =
    ownedOrganizations[0] ||
    (currentOrganization?.ownerId === user?.$id ? currentOrganization : null);

  const ownedTeams = React.useMemo(
    () =>
      userTeams.filter(team => {
        const role = ((team as any)?.membershipRole || '') as string;
        return role?.toLowerCase() === 'owner';
      }),
    [userTeams]
  );

  const profileTeam = React.useMemo(() => {
    if (!profileOrganization) return null;
    return (
      ownedTeams.find(team => team.orgId === profileOrganization.$id) ||
      ownedTeams[0] ||
      null
    );
  }, [ownedTeams, profileOrganization]);

  const premiumTier = profileOrganization?.premiumTier || 'free';
  const hasPremium = premiumTier !== 'free';
  const canManageOrgHd = !!profileOrganization && profileOrganization.ownerId === user?.$id;
  const orgHdEnabled = profileOrganization?.hdCaptureEnabled ?? false;
  const orgWatermarkEnabled = profileOrganization?.watermarkEnabled ?? true;
  const orgVideoRecordingEnabled = profileOrganization?.videoRecordingEnabled ?? false;
  const orgHdVideoEnabled = profileOrganization?.hdVideoEnabled ?? false;
  const switchDisabled =
    !profileOrganization ||
    !profileTeam ||
    loadingPreferences ||
    savingHdPreference ||
    updatingOrgHd ||
    !hasPremium ||
    (!canManageOrgHd && !orgHdEnabled);
  const watermarkSwitchDisabled =
    !profileOrganization ||
    !profileTeam ||
    loadingPreferences ||
    updatingOrgWatermark ||
    !hasPremium ||
    !canManageOrgHd;
  const orgTimestampEnabled = profileOrganization?.timestampEnabled ?? true;
  const timestampSwitchDisabled =
    !profileOrganization ||
    !profileTeam ||
    loadingPreferences ||
    savingTimestampPreference ||
    updatingOrgTimestamp ||
    !hasPremium ||
    (!canManageOrgHd && !orgTimestampEnabled);
  const videoRecordingSwitchDisabled =
    !profileOrganization ||
    !profileTeam ||
    loadingPreferences ||
    updatingOrgVideoRecording ||
    !hasPremium ||
    !canManageOrgHd;
  const hdVideoSwitchDisabled =
    !profileOrganization ||
    !profileTeam ||
    loadingPreferences ||
    updatingOrgHdVideo ||
    !hasPremium ||
    !canManageOrgHd ||
    !orgVideoRecordingEnabled;
  
  // Test component state
  const [showTagTest, setShowTagTest] = useState(false);

  useEffect(() => {
    loadGoogleData();
  }, []);

useEffect(() => {
  const fetchPreferences = async () => {
    if (!user?.$id) {
      setHdPreferences({});
      setFullHDImages(false);
      setTimestampPreferences({});
      setImageTimestamps(true);
      return;
    }
    setLoadingPreferences(true);
    try {
      const prefs = await userPreferencesService.getUserPreferences(user.$id);
      if (!prefs) {
        setHdPreferences({});
        setTimestampPreferences({});
        setFullHDImages(false);
        setImageTimestamps(true);
        return;
      }
      const hdPrefs = prefs.hdPreferences || {};
      const timestampPrefs = prefs.timestampPreferences || {};
      setHdPreferences(hdPrefs);
      setTimestampPreferences(timestampPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setTimestampPreferences({});
    } finally {
      setLoadingPreferences(false);
    }
  };

  fetchPreferences();
}, [user?.$id]);

useEffect(() => {
  if (updatingOrgHd || savingHdPreference || updatingOrgTimestamp || savingTimestampPreference) {
    return;
  }

  if (!profileOrganization?.$id) {
    setFullHDImages(false);
    setImageTimestamps(true);
    return;
  }

  const orgPreference = hdPreferences[profileOrganization.$id];
  const prefersHd = orgPreference
    ? orgPreference === 'hd'
    : (profileOrganization.hdCaptureEnabled ?? orgHdEnabled);

  setFullHDImages(orgHdEnabled && prefersHd);

  const orgPref = timestampPreferences[profileOrganization.$id];
  const derivedTimestamp = hasPremium
    ? orgPref
      ? orgPref === 'on'
      : (profileOrganization.timestampEnabled ?? orgTimestampEnabled)
    : orgTimestampEnabled;

  setImageTimestamps(derivedTimestamp);

}, [
  profileOrganization?.$id,
  hdPreferences,
  orgHdEnabled,
  timestampPreferences,
  orgTimestampEnabled,
  hasPremium,
  updatingOrgHd,
  savingHdPreference,
  updatingOrgTimestamp,
  savingTimestampPreference,
]);

useEffect(() => {
  if (!profileOrganization?.$id) {
    setImageWatermark(true);
    setVideoRecordingEnabled(false);
    setHdVideoEnabled(false);
    return;
  }

  setImageWatermark(profileOrganization.watermarkEnabled ?? true);
  setVideoRecordingEnabled(profileOrganization.videoRecordingEnabled ?? false);
  setHdVideoEnabled(profileOrganization.hdVideoEnabled ?? false);
}, [profileOrganization?.$id, profileOrganization?.watermarkEnabled, profileOrganization?.videoRecordingEnabled, profileOrganization?.hdVideoEnabled]);

  // Refresh data when screen comes into focus (e.g., returning from edit account or edit organization)
  // Use a ref to track if we've already loaded to prevent infinite loops
  const hasLoadedRef = React.useRef(false);
  
  useFocusEffect(
    React.useCallback(() => {
      // Only load once per focus session
      if (!hasLoadedRef.current) {
        loadGoogleData();
        loadUserData();
        hasLoadedRef.current = true;
      }
      
      // Reset flag when component unmounts
      return () => {
        hasLoadedRef.current = false;
      };
    }, []) // Empty deps - only run on focus
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

  const handleHdToggle = async (value: boolean) => {
    if (!user?.$id || !profileOrganization?.$id) {
      Alert.alert('Error', 'Unable to change HD setting. Please try again later.');
      return;
    }

    const orgId = profileOrganization.$id;
    const previousPreference = hdPreferences[orgId] || 'standard';
    const previousOrgHd = orgHdEnabled;
    const revertValue = previousOrgHd && previousPreference === 'hd';
    const revertState = () => {
      setFullHDImages(revertValue);
      setHdPreferences(prev => ({
        ...prev,
        [orgId]: previousPreference,
      }));
    };

    if (value && !hasPremium) {
      Alert.alert('Premium Required', 'Upgrade to enable Full HD images for this organization.');
      revertState();
      return;
    }

    if (value && !previousOrgHd && !canManageOrgHd) {
      Alert.alert(
        'Owner Required',
        'Ask an organization owner to enable HD captures for this team.'
      );
      revertState();
      return;
    }

    const nextPreferences: Record<string, ResolutionPreference> = {
      ...hdPreferences,
      [orgId]: value ? 'hd' : 'standard',
    };

    setFullHDImages(value);
    setHdPreferences(nextPreferences);

    try {
      if (value && !previousOrgHd && canManageOrgHd) {
        setUpdatingOrgHd(true);
        await organizationService.updateOrganization(orgId, { hdCaptureEnabled: true });
        await loadUserData();
      } else if (!value && previousOrgHd && canManageOrgHd) {
        setUpdatingOrgHd(true);
        await organizationService.updateOrganization(orgId, { hdCaptureEnabled: false });
        await loadUserData();
      }

      setSavingHdPreference(true);
      await userPreferencesService.updateUserPreferences(user.$id, {
        hdPreferences: nextPreferences,
      });
    } catch (error) {
      console.error('Error updating HD preference:', error);
      Alert.alert('Error', 'Failed to update HD setting. Please try again.');
      revertState();
      await loadUserData().catch(() => {});
    } finally {
      setSavingHdPreference(false);
      setUpdatingOrgHd(false);
    }
  };

  const handleTimestampToggle = async (value: boolean) => {
    if (!user?.$id || !profileOrganization?.$id) {
      Alert.alert('Error', 'Unable to change timestamp setting. Please try again later.');
      return;
    }

    const orgId = profileOrganization.$id;
    const hadOverride = Object.prototype.hasOwnProperty.call(timestampPreferences, orgId);
    const previousOrgTimestamp = orgTimestampEnabled;
    const previousPreference: TimestampPreference = hadOverride
      ? timestampPreferences[orgId]
      : previousOrgTimestamp
      ? 'on'
      : 'off';

    const revertValue = hasPremium ? previousPreference !== 'off' : orgTimestampEnabled;

    const revertState = () => {
      setImageTimestamps(revertValue);
      setTimestampPreferences(prev => {
        const next = { ...prev };
        if (hadOverride) {
          if (hasPremium) {
            next[orgId] = previousPreference;
          } else {
            delete next[orgId];
          }
        }
        return next;
      });
    };

    if (!hasPremium) {
      Alert.alert('Premium Required', 'Upgrade to enable timestamp overlays for this organization.');
      revertState();
      return;
    }

    if (value && !previousOrgTimestamp && !canManageOrgHd) {
      Alert.alert(
        'Owner Required',
        'Ask an organization owner to enable timestamps for this team.'
      );
      revertState();
      return;
    }

    const nextPreferences: Record<string, TimestampPreference> = (() => {
      if (!hasPremium) {
        return { ...timestampPreferences };
      }
      if (value) {
        return {
          ...timestampPreferences,
          [orgId]: 'on',
        };
      } else {
        const next = { ...timestampPreferences };
        if (hadOverride) {
          delete next[orgId];
        } else {
          next[orgId] = 'off';
        }
        return next;
      }
    })();

    setImageTimestamps(value);
    setTimestampPreferences(nextPreferences);

    try {
      if (value && !previousOrgTimestamp && canManageOrgHd) {
        setUpdatingOrgTimestamp(true);
        await organizationService.updateOrganization(orgId, { timestampEnabled: true });
        await loadUserData();
      } else if (!value && previousOrgTimestamp && canManageOrgHd) {
        setUpdatingOrgTimestamp(true);
        await organizationService.updateOrganization(orgId, { timestampEnabled: false });
        await loadUserData();
      }

      setSavingTimestampPreference(true);
      await userPreferencesService.updateUserPreferences(user.$id, {
        timestampPreferences: nextPreferences,
      });
    } catch (error) {
      console.error('Error updating timestamp preference:', error);
      Alert.alert('Error', 'Failed to update timestamp setting. Please try again.');
      revertState();
      await loadUserData().catch(() => {});
    } finally {
      setSavingTimestampPreference(false);
      setUpdatingOrgTimestamp(false);
    }
  };

  const handleWatermarkToggle = async (value: boolean) => {
    if (!user?.$id || !profileOrganization?.$id) {
      Alert.alert('Error', 'Unable to change watermark setting. Please try again later.');
      return;
    }

    if (!hasPremium) {
      Alert.alert('Premium Required', 'Upgrade to enable watermarks for this organization.');
      return;
    }

    if (!canManageOrgHd) {
      Alert.alert('Owner Required', 'Only organization owners can change watermark settings.');
      return;
    }

    const orgId = profileOrganization.$id;
    const previousValue = orgWatermarkEnabled;

    setImageWatermark(value);

    try {
      setUpdatingOrgWatermark(true);
      await organizationService.updateOrganization(orgId, { watermarkEnabled: value });
      await loadUserData();
    } catch (error) {
      console.error('Error updating watermark preference:', error);
      Alert.alert('Error', 'Failed to update watermark setting. Please try again.');
      setImageWatermark(previousValue);
      await loadUserData().catch(() => {});
    } finally {
      setUpdatingOrgWatermark(false);
    }
  };

  const handleVideoRecordingToggle = async (value: boolean) => {
    if (!user?.$id || !profileOrganization?.$id) {
      Alert.alert('Error', 'Unable to change video recording setting. Please try again later.');
      return;
    }

    if (!hasPremium) {
      Alert.alert('Premium Required', 'Upgrade to enable video recording for this organization.');
      return;
    }

    if (!canManageOrgHd) {
      Alert.alert('Owner Required', 'Only organization owners can change video recording settings.');
      return;
    }

    const orgId = profileOrganization.$id;
    const previousValue = orgVideoRecordingEnabled;

    setVideoRecordingEnabled(value);

    // If disabling video recording, also disable HD video
    if (!value && orgHdVideoEnabled) {
      setHdVideoEnabled(false);
    }

    try {
      setUpdatingOrgVideoRecording(true);
      await organizationService.updateOrganization(orgId, { 
        videoRecordingEnabled: value,
        ...(value ? {} : { hdVideoEnabled: false }) // Disable HD video if disabling video recording
      });
      await loadUserData();
    } catch (error) {
      console.error('Error updating video recording preference:', error);
      Alert.alert('Error', 'Failed to update video recording setting. Please try again.');
      setVideoRecordingEnabled(previousValue);
      await loadUserData().catch(() => {});
    } finally {
      setUpdatingOrgVideoRecording(false);
    }
  };

  const handleHdVideoToggle = async (value: boolean) => {
    if (!user?.$id || !profileOrganization?.$id) {
      Alert.alert('Error', 'Unable to change HD video setting. Please try again later.');
      return;
    }

    if (!hasPremium) {
      Alert.alert('Premium Required', 'Upgrade to enable HD video for this organization.');
      return;
    }

    if (!canManageOrgHd) {
      Alert.alert('Owner Required', 'Only organization owners can change HD video settings.');
      return;
    }

    if (!orgVideoRecordingEnabled) {
      Alert.alert('Video Recording Required', 'Enable video recording first to use HD video.');
      return;
    }

    const orgId = profileOrganization.$id;
    const previousValue = orgHdVideoEnabled;

    setHdVideoEnabled(value);

    try {
      setUpdatingOrgHdVideo(true);
      await organizationService.updateOrganization(orgId, { hdVideoEnabled: value });
      await loadUserData();
    } catch (error) {
      console.error('Error updating HD video preference:', error);
      Alert.alert('Error', 'Failed to update HD video setting. Please try again.');
      setHdVideoEnabled(previousValue);
      await loadUserData().catch(() => {});
    } finally {
      setUpdatingOrgHdVideo(false);
    }
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

        {/* Manage Contacts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Manage Contacts</Text>
        </View>
        <View style={styles.settingsCard}>
          <Pressable
            style={styles.settingItem}
            onPress={() => router.push('/(jobs)/invite-contacts')}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrapper}>
                <UserPlus color={Colors.Text} size={18} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Invite contacts</Text>
            </View>
            <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
          </Pressable>
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
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {(user?.prefs as any)?.description || 'Work Photo Pro fan.'}
            </Text>
          </View>
        </View>

        {/* Organization Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Organization</Text>
          <Pressable onPress={() => {
            console.log('Edit organization button pressed');
            console.log('Profile organization before navigation:', profileOrganization);
            router.push('/(jobs)/edit-organization');
          }}>
            <IconSymbol name="pencil" color="#007AFF" size={16} />
          </Pressable>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>
              {profileOrganization?.orgName || 'No Organization'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Photo Icon</Text>
            <View style={styles.logoContainer}>
              {profileOrganization?.logoUrl ? (
                <Image
                  source={{ uri: profileOrganization.logoUrl }}
                  style={styles.logoPreview}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Building2 size={24} color={Colors.Gray} strokeWidth={2} />
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {profileOrganization?.description || 'No description available'}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Organization Settings</Text>
          </View>
          
          <View style={styles.settingsCard}>
            <Pressable
              style={styles.settingItem}
              disabled={hasPremium}
              onPress={() => {
                if (!hasPremium) {
                  Alert.alert('Premium Required', 'Upgrade to enable timestamp overlays for this organization.');
                }
              }}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="clock.badge.checkmark" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Image timestamps</Text>
              </View>
              <Switch
                value={imageTimestamps}
                onValueChange={handleTimestampToggle}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
                disabled={timestampSwitchDisabled}
              />
            </Pressable>
            {!hasPremium && (
              <Text style={styles.disabledHint}>
                Upgrade this organization to enable timestamp overlays for all members.
              </Text>
            )}
            {hasPremium && !orgTimestampEnabled && !canManageOrgHd && (
              <Text style={styles.disabledHint}>
                Only owners can enable timestamps for this organization.
              </Text>
            )}
            
            <Pressable
              style={styles.settingItem}
              disabled={hasPremium}
              onPress={() => {
                if (!hasPremium) {
                  Alert.alert('Premium Required', 'Upgrade to enable watermarks for this organization.');
                }
              }}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="photo" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Image watermark</Text>
              </View>
              <Switch
                value={imageWatermark}
                onValueChange={handleWatermarkToggle}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
                disabled={watermarkSwitchDisabled}
              />
            </Pressable>
            {!hasPremium && (
              <Text style={styles.disabledHint}>
                Upgrade this organization to enable watermark overlays for all members.
              </Text>
            )}
            {hasPremium && !canManageOrgHd && (
              <Text style={styles.disabledHint}>
                Only owners can change watermark settings for this organization.
              </Text>
            )}
            
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
            
            <Pressable
              style={styles.settingItem}
              disabled={hasPremium}
              onPress={() => {
                if (!hasPremium) {
                  Alert.alert('Premium Required', 'Upgrade to enable Full HD images for this organization.');
                }
              }}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="4k.tv" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Full HD images</Text>
              </View>
              <Switch
                value={fullHDImages}
                onValueChange={handleHdToggle}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
                disabled={switchDisabled}
              />
            </Pressable>
            {!hasPremium && (
              <Text style={styles.disabledHint}>
                Upgrade this organization to enable HD captures for all members.
              </Text>
            )}
            {hasPremium && !orgHdEnabled && !canManageOrgHd && (
              <Text style={styles.disabledHint}>
                Only owners can enable HD captures for this organization.
              </Text>
            )}
            
            <Pressable
              style={styles.settingItem}
              disabled={!hasPremium}
              onPress={() => {
                if (!hasPremium) {
                  Alert.alert('Premium Required', 'Upgrade to enable video recording for this organization.');
                }
              }}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="video" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Enable video camera</Text>
              </View>
              <Switch
                value={videoRecordingEnabled}
                onValueChange={handleVideoRecordingToggle}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
                disabled={videoRecordingSwitchDisabled}
              />
            </Pressable>
            {!hasPremium && (
              <Text style={styles.disabledHint}>
                Upgrade this organization to enable video recording for all members.
              </Text>
            )}
            {hasPremium && !canManageOrgHd && (
              <Text style={styles.disabledHint}>
                Only owners can change video recording settings for this organization.
              </Text>
            )}
            
            <Pressable
              style={styles.settingItem}
              disabled={!hasPremium || !orgVideoRecordingEnabled}
              onPress={() => {
                if (!hasPremium) {
                  Alert.alert('Premium Required', 'Upgrade to enable HD video for this organization.');
                } else if (!orgVideoRecordingEnabled) {
                  Alert.alert('Video Recording Required', 'Enable video recording first to use HD video.');
                }
              }}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="video.fill" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Enable HD Video</Text>
              </View>
              <Switch
                value={hdVideoEnabled}
                onValueChange={handleHdVideoToggle}
                trackColor={{ false: Colors.Gray, true: "#22C55E" }}
                thumbColor={Colors.White}
                disabled={hdVideoSwitchDisabled}
              />
            </Pressable>
            {!hasPremium && (
              <Text style={styles.disabledHint}>
                Upgrade this organization to enable HD video recording for all members.
              </Text>
            )}
            {hasPremium && !orgVideoRecordingEnabled && (
              <Text style={styles.disabledHint}>
                Enable video recording first to use HD video.
              </Text>
            )}
            {hasPremium && orgVideoRecordingEnabled && !canManageOrgHd && (
              <Text style={styles.disabledHint}>
                Only owners can change HD video settings for this organization.
              </Text>
            )}
            
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
              <Text style={styles.versionText}>{appVersion}</Text>
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
            
            <Pressable 
              style={styles.settingItem}
              onPress={() => router.push('/(jobs)/settings/cache')}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="externaldrive" color="#22C55E" size={20} />
                <Text style={styles.settingText}>Cache Settings</Text>
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
  logoContainer: {
    marginTop: 8,
  },
  logoPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.Background,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.Background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.Gray + '30',
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
  disabledHint: {
    fontSize: 12,
    color: Colors.Gray,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 44,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E20',
    alignItems: 'center',
    justifyContent: 'center',
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