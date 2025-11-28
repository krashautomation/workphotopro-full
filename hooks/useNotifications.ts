import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, COLLECTION_ID } from '@/lib/appwrite/notifications';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/lib/appwrite/client';

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
      // If collection doesn't exist, show empty list
      if (err?.message?.includes('Collection with the requested ID could not be found')) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      } else {
        setError(err as Error);
        console.error('Error loading notifications:', err);
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
    }
  }, [user, loadNotifications]);

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

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}

