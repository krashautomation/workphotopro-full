import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors } from '@/styles/globalStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/lib/appwrite/notifications';

export default function Notifications() {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh } = useNotifications();

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationType = (type: string): 'info' | 'warning' | 'success' | 'error' => {
    switch (type) {
      case 'task_completed':
      case 'job_assigned':
      case 'photo_uploaded':
        return 'success';
      case 'job_updated':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getNotificationIcon = (type: 'info' | 'warning' | 'success' | 'error') => {
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

  const getNotificationColor = (type: 'info' | 'warning' | 'success' | 'error') => {
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

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>Error loading notifications</Text>
        <Text style={styles.emptySubtext}>{error.message}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => {
          const notificationType = getNotificationType(item.type);
          const timestamp = formatTimestamp(item.$createdAt);
          
          return (
            <TouchableOpacity
              style={[
                styles.notificationCard,
                !item.isRead && styles.notificationCardUnread,
              ]}
              onPress={() => {
                if (!item.isRead) {
                  markAsRead(item.$id);
                }
              }}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: getNotificationColor(notificationType) + '20' },
                    ]}
                  >
                    <IconSymbol
                      name={getNotificationIcon(notificationType)}
                      size={20}
                      color={getNotificationColor(notificationType)}
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
                    <Text style={styles.notificationTimestamp}>{timestamp}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
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
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
