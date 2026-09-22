import { useState, useEffect } from 'react';

export interface RolePermission {
  id: string;
  name: string;
  student: boolean;
  parent: boolean;
  teacher: boolean;
  driver: boolean;
  supervisor: boolean;
  admin: boolean;
  [key: string]: any;
}

export interface SecuritySettings {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  allowMultiDeviceLogin: boolean;
  requirePinForFinance: boolean;
  permissionsMatrix: RolePermission[];
  updatedAt?: string;
}

export const DEFAULT_CAPABILITIES: RolePermission[] = [
  { id: 'view_grades', name: '📊 عرض الدرجات والشهادات', student: true, parent: true, teacher: true, driver: false, supervisor: true, admin: true },
  { id: 'enter_attendance', name: '📝 تسجيل الحضور والغياب اليومي', student: false, parent: false, teacher: true, driver: false, supervisor: true, admin: true },
  { id: 'track_bus', name: '🚌 تتبع حافلات النقل المباشر', student: true, parent: true, teacher: false, driver: true, supervisor: false, admin: true },
  { id: 'generate_codes', name: '🔑 توليد وإصدار أكواد التفعيل', student: false, parent: false, teacher: false, driver: false, supervisor: false, admin: true },
  { id: 'live_broadcast', name: '📢 البث الإذاعي والتنبيهات المباشرة', student: false, parent: false, teacher: true, driver: false, supervisor: true, admin: true },
  { id: 'ai_radar', name: '📡 رادار الذكاء وتحدي 60 ثانية', student: true, parent: true, teacher: true, driver: false, supervisor: true, admin: true },
  { id: 'financial_view', name: '💰 الاطلاع على الموقف المالي والرسوم', student: false, parent: true, teacher: false, driver: false, supervisor: false, admin: true },
  { id: 'edit_school_info', name: '⚙️ تعديل بيانات وهوية المدرسة', student: false, parent: false, teacher: false, driver: false, supervisor: false, admin: true },
];

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  allowMultiDeviceLogin: true,
  requirePinForFinance: true,
  permissionsMatrix: DEFAULT_CAPABILITIES,
  updatedAt: new Date().toISOString()
};

const STORAGE_KEY = 'bayraq_security_settings';
const EVENT_NAME = 'bayraq_security_settings_changed';

let cachedSettings: SecuritySettings | null = null;

export const securityService = {
  getSettingsSync(): SecuritySettings {
    if (cachedSettings) return cachedSettings;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedSettings = { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(stored) };
        return cachedSettings;
      }
    } catch (e) {}
    return DEFAULT_SECURITY_SETTINGS;
  },

  async fetchSettings(): Promise<SecuritySettings> {
    try {
      const res = await fetch('/api/security/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          const merged: SecuritySettings = {
            ...DEFAULT_SECURITY_SETTINGS,
            ...data.settings,
            permissionsMatrix: (data.settings.permissionsMatrix && data.settings.permissionsMatrix.length > 0)
              ? data.settings.permissionsMatrix
              : DEFAULT_CAPABILITIES
          };
          cachedSettings = merged;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
          return merged;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch security settings from server:', err);
    }
    return this.getSettingsSync();
  },

  async saveSettings(updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const current = this.getSettingsSync();
    const merged: SecuritySettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    cachedSettings = merged;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));

    try {
      await fetch('/api/security/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.error('Error saving security settings to server:', err);
    }

    return merged;
  },

  canRoleAccess(role: string | undefined | null, capabilityId: string): boolean {
    if (!role) return false;
    const normRole = role.toLowerCase().trim();
    if (normRole === 'developer' || normRole === 'dev' || normRole === 'superadmin') {
      return true;
    }

    // Map role variants to standard keys
    let roleKey: string = normRole;
    if (normRole.includes('admin')) roleKey = 'admin';
    else if (normRole.includes('teach')) roleKey = 'teacher';
    else if (normRole.includes('parent')) roleKey = 'parent';
    else if (normRole.includes('student')) roleKey = 'student';
    else if (normRole.includes('driver')) roleKey = 'driver';
    else if (normRole.includes('supervis')) roleKey = 'supervisor';

    const settings = this.getSettingsSync();
    const matrix = settings.permissionsMatrix || DEFAULT_CAPABILITIES;
    const capability = matrix.find(c => c.id === capabilityId);
    if (!capability) return true; // default open if not defined

    const value = capability[roleKey];
    return value !== undefined ? Boolean(value) : false;
  }
};

export function useSecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>(() => securityService.getSettingsSync());

  useEffect(() => {
    securityService.fetchSettings().then(setSettings);

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        setSettings(securityService.getSettingsSync());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateSettings = async (updates: Partial<SecuritySettings>) => {
    const res = await securityService.saveSettings(updates);
    setSettings(res);
    return res;
  };

  return { settings, updateSettings };
}

export function useRolePermission(role: string | undefined | null, capabilityId: string): boolean {
  const { settings } = useSecuritySettings();
  if (!role) return false;
  const normRole = role.toLowerCase().trim();
  if (normRole === 'developer' || normRole === 'dev' || normRole === 'superadmin') {
    return true;
  }

  let roleKey: string = normRole;
  if (normRole.includes('admin')) roleKey = 'admin';
  else if (normRole.includes('teach')) roleKey = 'teacher';
  else if (normRole.includes('parent')) roleKey = 'parent';
  else if (normRole.includes('student')) roleKey = 'student';
  else if (normRole.includes('driver')) roleKey = 'driver';
  else if (normRole.includes('supervis')) roleKey = 'supervisor';

  const matrix = settings.permissionsMatrix || DEFAULT_CAPABILITIES;
  const capability = matrix.find(c => c.id === capabilityId);
  if (!capability) return true;

  const val = capability[roleKey];
  return val !== undefined ? Boolean(val) : false;
}
