import { realtimeManager } from '../lib/realtimeManager';

export const broadcastService = {
  getBroadcasts: async (schoolId?: string, limit: number = 40) => {
    try {
      const url = `/api/broadcasts?schoolId=${schoolId || 'all'}&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return data.success && Array.isArray(data.broadcasts) ? data.broadcasts : [];
    } catch (e) {
      console.warn("getBroadcasts error:", e);
      return [];
    }
  },

  subscribeToBroadcasts: (schoolId: string | undefined, callback: (broadcasts: any[]) => void, limit: number = 40) => {
    let isCancelled = false;

    const fetchBroadcasts = async () => {
      if (isCancelled) return;
      const list = await broadcastService.getBroadcasts(schoolId, limit);
      if (!isCancelled) {
        callback(list);
      }
    };

    fetchBroadcasts();

    const unsub1 = realtimeManager.subscribe('broadcasts', () => {
      fetchBroadcasts();
    });
    const unsub2 = realtimeManager.subscribe('school_announcements', () => {
      fetchBroadcasts();
    });

    // Fast local event listener for 0ms cross-component synchronization
    const handleLocalEvent = () => {
      fetchBroadcasts();
    };
    window.addEventListener('app_broadcast_event', handleLocalEvent);

    // Fast fallback polling (2.5s instead of 12s) to ensure instant synchronization even without active WS
    const interval = setInterval(fetchBroadcasts, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('app_broadcast_event', handleLocalEvent);
      unsub1();
      unsub2();
    };
  },

  sendBroadcast: async (broadcastData: {
    schoolId: string;
    message: string;
    targetGrades: string[];
    durationHours: number;
    author?: string;
    subject?: string;
    targetLocation?: string;
    type?: string;
    isSchoolBroadcast?: boolean;
  }) => {
    const payload = {
      ...broadcastData,
      type: broadcastData.type || 'school_broadcast',
      isSchoolBroadcast: true,
      targetLocation: broadcastData.targetLocation || 'ticker'
    };

    const response = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send broadcast');
    }

    const result = await response.json();
    try {
      realtimeManager?.trigger?.('broadcasts', result);
      realtimeManager?.trigger?.('school_announcements', result);
      window.dispatchEvent(new CustomEvent('app_broadcast_event', { detail: { action: 'INSERT', data: result } }));
    } catch (err) {
      console.warn('[BroadcastService] realtime trigger warning:', err);
    }
    return result;
  },

  updateBroadcast: async (id: string, message: string) => {
    const response = await fetch(`/api/broadcasts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Failed to update broadcast');
    const result = await response.json();
    try {
      realtimeManager?.trigger?.('broadcasts', { id, message, action: 'UPDATE' });
      realtimeManager?.trigger?.('school_announcements', { id, message, action: 'UPDATE' });
      window.dispatchEvent(new CustomEvent('app_broadcast_event', { detail: { action: 'UPDATE', id, message } }));
    } catch (err) {
      console.warn('[BroadcastService] realtime trigger warning:', err);
    }
    return result;
  },

  deleteBroadcast: async (id: string) => {
    const response = await fetch(`/api/broadcasts/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete broadcast');
    const result = await response.json();
    try {
      realtimeManager?.trigger?.('broadcasts', { id, action: 'DELETE' });
      realtimeManager?.trigger?.('school_announcements', { id, action: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app_broadcast_event', { detail: { action: 'DELETE', id } }));
    } catch (err) {
      console.warn('[BroadcastService] realtime trigger warning:', err);
    }
    return result;
  }
};
