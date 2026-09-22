import { activation_codes } from '../db/schema';

export interface ActivationCode {
  id: string;
  code: string;
  schoolId: string;
  role: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
}

export const activationCodesService = {
  fetchCodes: async (schoolId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    if (role) params.append('role', role);
    
    const response = await fetch(`/api/activation-codes?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch activation codes');
    const data = await response.json();
    return data.codes;
  },

  generateCodes: async (schoolId: string, role: string, count: number, prefix?: string) => {
    const response = await fetch('/api/activation-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId, role, count, prefix })
    });
    if (!response.ok) throw new Error('Failed to generate codes');
    return await response.json();
  },

  syncToSql: async (codes: any) => {
    let codeList: any[] = [];
    if (Array.isArray(codes)) {
      codeList = codes;
    } else if (codes && Array.isArray(codes.codes)) {
      codeList = codes.codes;
    } else if (codes && typeof codes === 'object') {
      codeList = Object.values(codes).filter(Boolean);
    }

    const response = await fetch('/api/activation-codes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: codeList })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to sync codes');
    }
    return await response.json();
  },

  updateStatus: async (id: string, used: boolean, usedBy?: string) => {
    const response = await fetch(`/api/activation-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ used, usedBy, usedAt: used ? new Date().toISOString() : null })
    });
    if (!response.ok) throw new Error('Failed to update code status');
    return await response.json();
  },

  deleteCode: async (id: string) => {
    const response = await fetch(`/api/activation-codes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete code');
    return await response.json();
  }
};
