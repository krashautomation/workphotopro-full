import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, Notification, COLLECTION_ID } from '@/lib/appwrite/notifications';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/lib/appwrite/client';
import { useFocusEffect } from 'expo-router';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationService.getNotifications(user.$id, {
        limit: 50,
      });
      
      setNotifications(result.documents as unknown as Notification[]);
      
      const count = await notificationService.getUnreadCount(user.$id);
      setUnreadCount(count);
    } catch (err: any) {
      // Handle different error types gracefully
      const errorMessage = err?.message || '';
      
      // If collection doesn't exist, show empty list
      if (errorMessage.includes('Collection with the requested ID could not be found')) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      } 
      // If user is not authorized, treat as no notifications (user might not be fully authenticated yet)
      else if (errorMessage.includes('not authorized') || errorMessage.includes('unauthorized')) {
        console.warn('User not authorized to access notifications - treating as empty');
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      }
      // For other errors, log but don't break the app
      else {
        console.warn('Error loading notifications (non-critical):', err);
        setNotifications([]);
        setUnreadCount(0);
        setError(null); // Don't set error state for authorization issues
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time updates
    if (user) {
      const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
      
      // Note: Real-time subscriptions require Appwrite Realtime SDK
      // For now, we'll skip real-time updates and rely on pull-to-refresh
      // You can implement this later using @appwrite.io/realtime or Appwrite SDK's subscribe method
      
      // Example implementation (commented out until Realtime SDK is set up):
      // const unsubscribe = databases.subscribe(channel, (event: any) => {
      //   if (event.events.some((e: string) => e.includes(`userId.${user.$id}`))) {
      //     loadNotifications();
      //   }
      // });
      // return () => unsubscribe();

      // Poll for updates every 10 seconds to keep badge in sync
      // This ensures the header badge updates when notifications change elsewhere
      const interval = setInterval(() => {
        loadNotifications();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  // Refresh notifications when screen comes into focus
  // This ensures the badge updates when returning from notifications screen
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadNotifications();
      }
    }, [user, loadNotifications])
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.$id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.$id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user]);

  const clearRead = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await notificationService.clearReadNotifications(user.$id);
      // Remove read notifications from local state
      setNotifications(prev => {
        const remaining = prev.filter(n => !n.isRead);
        // Update unread count based on remaining notifications
        setUnreadCount(remaining.length);
        return remaining;
      });
      // Also refresh from server to ensure accuracy
      await loadNotifications();
      return result;
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      throw err;
    }
  }, [user, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearRead,
    refresh: loadNotifications,
  };
}

