import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { colors } from '@/styles/globalStyles';

type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      enabled: true,
    },
    {
      id: '2',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      enabled: true,
    },
    {
      id: '3',
      title: 'New Job Assignments',
      description: 'Get notified when you\'re assigned to a new job',
      enabled: true,
    },
    {
      id: '4',
      title: 'Photo Uploads',
      description: 'Get notified when photos are uploaded to your jobs',
      enabled: true,
    },
    {
      id: '6',
      title: 'Team Invitations',
      description: 'Get notified when you receive a team invitation',
      enabled: true,
    },
    {
      id: '7',
      title: 'Job Status Updates',
      description: 'Get notified when job status changes',
      enabled: false,
    },
    {
      id: '8',
      title: 'Weekly Summary',
      description: 'Receive a weekly summary of your activity',
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

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
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={setting.enabled ? colors.primary : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
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
