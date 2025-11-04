import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors } from '@/styles/globalStyles';
import { IconSymbol } from '@/components/IconSymbol';

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
};

// Fake placeholder notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New job assigned',
    message: 'You have been assigned to the "Kitchen Remodel" job',
    timestamp: '2 hours ago',
    isRead: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'Photo uploaded',
    message: 'John uploaded 5 new photos to "Bathroom Renovation"',
    timestamp: '5 hours ago',
    isRead: false,
    type: 'success',
  },
  {
    id: '3',
    title: 'Team invitation',
    message: 'You have been invited to join "ABC Construction" team',
    timestamp: '1 day ago',
    isRead: true,
    type: 'info',
  },
  {
    id: '4',
    title: 'Job completed',
    message: 'The "Office Space" job has been marked as completed',
    timestamp: '2 days ago',
    isRead: true,
    type: 'success',
  },
  {
    id: '5',
    title: 'Comment added',
    message: 'Sarah added a comment on photo #23 in "Kitchen Remodel"',
    timestamp: '3 days ago',
    isRead: true,
    type: 'info',
  },
  {
    id: '6',
    title: 'Permission update',
    message: 'Your role in "Design Team" has been updated to Admin',
    timestamp: '1 week ago',
    isRead: true,
    type: 'success',
  },
  {
    id: '7',
    title: 'New team member',
    message: 'Mike joined the "Construction Crew" team',
    timestamp: '1 week ago',
    isRead: true,
    type: 'info',
  },
];

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const toggleReadStatus = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: !notif.isRead } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'checkmark.circle';
      case 'warning':
        return 'exclamationmark.triangle';
      case 'error':
        return 'xmark.circle';
      default:
        return 'info.circle';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return colors.primary;
      case 'warning':
        return '#f59e0b';
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <View style={styles.headerActionsRow}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => router.push('/(jobs)/notification-settings')}
            style={styles.settingsButton}
          >
            <IconSymbol
              name="gearshape"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationCard,
              !item.isRead && styles.notificationCardUnread,
            ]}
            onPress={() => toggleReadStatus(item.id)}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(item.type) + '20' },
                  ]}
                >
                  <IconSymbol
                    name={getNotificationIcon(item.type)}
                    size={20}
                    color={getNotificationColor(item.type)}
                  />
                </View>
                                                  <View style={styles.notificationTextContainer}>
                   <View style={styles.notificationHeader}>
                     <Text
                       style={[
                         styles.notificationTitle,
                         !item.isRead && styles.notificationTitleUnread,
                       ]}
                     >
                       {item.title}
                     </Text>
                     {!item.isRead && <View style={styles.unreadDot} />}
                   </View>
                   <Text style={styles.notificationMessage}>{item.message}</Text>
                   <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
                 </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="bell.slash"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up!
            </Text>
          </View>
        )}
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
  headerActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  markAllButton: {
    // No additional styles needed
  },
  settingsButton: {
    padding: 4,
  },
  markAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  notificationCardUnread: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.surface,
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
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
