export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  timestamp: any;
}

export const auditService = {
  fetchLogs: async (limit: number = 30, offset: number = 0) => {
    const response = await fetch(`/api/audit-logs?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    const data = await response.json();
    return data.logs as AuditLog[];
  },

  logAction: async (payload: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to log action');
    return await response.json();
  },

  deleteLog: async (id: string) => {
    const response = await fetch(`/api/audit-logs/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'فشل حذف السجل');
    }
    return await response.json();
  },

  clearOldLogs: async (days: number = 30) => {
    const response = await fetch(`/api/audit-logs/old?days=${days}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to clear old logs');
    }
    return await response.json() as { success: boolean; count?: number; message?: string };
  },

  clearAllLogs: async () => {
    const response = await fetch('/api/audit-logs/old?all=true', {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'فشل مسح السجلات بالكامل');
    }
    return await response.json() as { success: boolean; count?: number; message?: string };
  }
};
