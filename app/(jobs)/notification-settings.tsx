import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/globalStyles';
import { useAuth } from '@/context/AuthContext';
import { notificationPreferencesService, NotificationPreferences, NotificationType } from '@/lib/appwrite/notificationPreferences';

type NotificationSetting = {
  id: string;
  key: NotificationType;
  title: string;
  description: string;
  enabled: boolean;
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      key: 'push_notifications',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      enabled: true,
    },
    {
      id: '2',
      key: 'email_notifications',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      enabled: true,
    },
    {
      id: '3',
      key: 'job_assigned',
      title: 'New Job Assignments',
      description: 'Get notified when you\'re assigned to a new job',
      enabled: true,
    },
    {
      id: '4',
      key: 'photo_uploaded',
      title: 'Photo Uploads',
      description: 'Get notified when photos are uploaded to your jobs',
      enabled: true,
    },
    {
      id: '5',
      key: 'task_created',
      title: 'New Tasks',
      description: 'Get notified when new tasks are created',
      enabled: true,
    },
    {
      id: '6',
      key: 'team_invite',
      title: 'Team Invitations',
      description: 'Get notified when you receive a team invitation',
      enabled: true,
    },
    {
      id: '7',
      key: 'job_status_updates',
      title: 'Job Status Updates',
      description: 'Get notified when job status changes',
      enabled: false,
    },
    {
      id: '8',
      key: 'weekly_summary',
      title: 'Weekly Summary',
      description: 'Receive a weekly summary of your activity',
      enabled: false,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Load preferences from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const prefs = await notificationPreferencesService.getPreferences(user.$id);
      
      // Update settings with database values
      setSettings(prev => prev.map(setting => ({
        ...setting,
        enabled: prefs[setting.key] ?? setting.enabled,
      })));
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (id: string) => {
    if (!user || saving) return;

    const setting = settings.find(s => s.id === id);
    if (!setting) return;

    const newValue = !setting.enabled;
    
    // Optimistically update UI
    setSettings(prev =>
      prev.map(s =>
        s.id === id ? { ...s, enabled: newValue } : s
      )
    );

    // Save to database
    try {
      setSaving(id);
      await notificationPreferencesService.updatePreference(
        user.$id,
        setting.key,
        newValue
      );
    } catch (error) {
      console.error('Error saving notification preference:', error);
      // Revert on error
      setSettings(prev =>
        prev.map(s =>
          s.id === id ? { ...s, enabled: !newValue } : s
        )
      );
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {settings
          .filter((setting) => setting.title !== 'Comments')
          .map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>{setting.description}</Text>
              </View>
              {saving === setting.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={setting.enabled ? colors.primary : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              )}
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
