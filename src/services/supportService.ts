export interface SupportTicket {
  id: string;
  studentName: string;
  grade?: string;
  issueType: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'resolved';
  isGroup?: boolean;
  adminReply?: string;
  role?: 'student' | 'teacher' | 'staff' | 'parent';
  broadcastId?: string;
  replyToTicketId?: string;
  senderType?: string;
  readByAdmin?: boolean;
  readByStudent?: boolean;
  schoolId?: string;
  userId?: string;
}

export const supportService = {
  fetchTickets: async (schoolId?: string, userId?: string, altIds?: string[], userRole?: string) => {
    let url = `/api/support-tickets?`;
    if (schoolId) url += `schoolId=${schoolId}&`;
    if (userRole) url += `userRole=${userRole}&`;
    let ids = [];
    if (userId) ids.push(userId);
    if (altIds) ids = [...ids, ...altIds];
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length > 0) {
      url += `userIds=${uniqueIds.join(',')}&`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch support tickets');
    const data = await response.json();
    return data.tickets as SupportTicket[];
  },

  createTicket: async (payload: Omit<SupportTicket, 'id' | 'timestamp'>) => {
    const response = await fetch('/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create support ticket');
    return await response.json();
  },

  updateTicket: async (id: string, updates: Partial<SupportTicket>) => {
    const response = await fetch(`/api/support-tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update support ticket');
    return await response.json();
  },

  deleteTicket: async (id: string, userId?: string) => {
    let url = `/api/support-tickets/${id}`;
    if (userId) url += `?userId=${userId}`;
    const response = await fetch(url, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete support ticket');
    return await response.json();
  },

  clearAllTickets: async (userId: string) => {
    const response = await fetch(`/api/support-tickets-clear-all?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear all support tickets');
    return await response.json();
  }
};
