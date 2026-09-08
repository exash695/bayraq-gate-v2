import { realtimeManager } from '../lib/realtimeManager';

export const notificationService = {
  sendNotification: async (payload: {
    userId?: string;
    recipientId?: string;
    title: string;
    message: string;
    body?: string;
    type?: string;
    recipientRole?: string;
    icon?: string;
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    schoolId?: string;
    metadata?: any;
    data?: any;
  }) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        recipientId: payload.recipientId || payload.userId,
        body: payload.body || payload.message
      })
    });
    if (!response.ok) throw new Error('Failed to send notification');
    return await response.json();
  },

  fetchNotifications: async (userId: string) => {
    const response = await fetch(`/api/notifications/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    const data = await response.json();
    return data.notifications || [];
  },

  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    const fetch = async () => {
      try {
        const notifs = await notificationService.fetchNotifications(userId);
        callback(notifs);
      } catch (e) {}
    };
    fetch();
    const unsub = realtimeManager.subscribe('notifications', () => {
      fetch();
    });
    return () => unsub();
  },

  markAsRead: async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return await response.json();
  }
};
