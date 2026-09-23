import { realtimeManager } from '../lib/realtimeManager';
import { pushNotificationManager } from './pushNotificationManager';

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
    // توحيد العنوان الرسمي للبوابة: بوابة بيرق
    let rawTitle = payload.title || 'إشعار جديد';
    if (!rawTitle.includes('بوابة بيرق') && !rawTitle.includes('بيرق')) {
      rawTitle = `بوابة بيرق: ${rawTitle}`;
    }

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        title: rawTitle,
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
    // ربط تلقائي لتوكن الإشعارات الخارجية بمجرد الاشتراك
    pushNotificationManager.initNativePush(userId).catch(() => {});

    const fetch = async () => {
      try {
        const notifs = await notificationService.fetchNotifications(userId);
        callback(notifs);
      } catch (e) {}
    };
    fetch();
    const unsub = realtimeManager.subscribe('notifications', (eventData: any) => {
      fetch();
      // إذا ورد إشعار جديد في الويب، إظهار إشعار خارجي محلي
      if (eventData?.data && eventData.data.recipientId === userId) {
        pushNotificationManager.showLocalNotification(eventData.data.title || 'بوابة بيرق: إشعار جديد', {
          body: eventData.data.body || ''
        });
      }
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
