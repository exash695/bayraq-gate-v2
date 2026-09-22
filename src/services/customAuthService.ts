export interface CustomUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  name?: string | null;
  role?: string;
  schoolId?: string;
  photoURL?: string | null;
  avatar?: string | null;
  grade?: string | null;
  stage?: string | null;
  studentCode?: string | null;
}

export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('bairaq_device_uuid');
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem('bairaq_device_uuid', deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'DEV-FALLBACK-BROWSER';
  }
}

class CustomAuthService {
  private tokenKey = 'bairaq_jwt_token';
  private currentUser: CustomUser | null = null;
  private listeners: ((user: CustomUser | null) => void)[] = [];

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-device-id': getOrCreateDeviceId()
          }
        });
        const data = await res.json();
        if (data.success) {
          this.currentUser = data.user;
          this.notifyListeners();
          return;
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      }
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  public onAuthStateChanged(callback: (user: CustomUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  public async loginWithEmail(email: string, password: string): Promise<CustomUser> {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ email, password, deviceId })
    });
    const data = await res.json();
    if (!data.success) {
      if (data.message === 'SCHOOL_SUSPENDED' || data.isSchoolSuspended) {
        const err = new Error(data.error || data.message || 'تم تعطيل وتجميد حساب وخدمات هذه المدرسة من قبل إدارة المنظومة (المطور)');
        (err as any).isSchoolSuspended = true;
        (err as any).schoolName = data.schoolName;
        throw err;
      }
      if (data.message === 'ACCOUNT_BANNED' || data.isBanned) {
        const err = new Error(data.error || 'تم حظر هذا الحساب أو الجهاز من قبل إدارة الأمان');
        (err as any).isBanned = true;
        throw err;
      }
      throw new Error(data.error || data.message || 'بيانات الدخول غير صحيحة');
    }
    
    localStorage.setItem(this.tokenKey, data.token);
    this.currentUser = data.user;
    this.notifyListeners();
    return data.user;
  }

  public async loginWithCode(code: string, expectedSchoolId?: string): Promise<CustomUser> {
    const deviceId = getOrCreateDeviceId();
    const cleanCode = code.trim().toUpperCase();
    
    // Check locally stored / synced codes if available as extra resilience
    let localCodeDoc: any = null;
    try {
      const cached = localStorage.getItem('bairaq_cached_activation_codes');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          localCodeDoc = list.find((c: any) => 
            String(c.code).trim().toUpperCase() === cleanCode ||
            String(c.parentCode || '').trim().toUpperCase() === cleanCode ||
            String(c.studentCode || '').trim().toUpperCase() === cleanCode
          );
        }
      }
    } catch (e) {}

    const res = await fetch('/api/auth/login-code', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ 
        code: cleanCode, 
        schoolId: expectedSchoolId?.trim(), 
        deviceId,
        ...(localCodeDoc ? { firestoreCodeDoc: localCodeDoc } : {})
      })
    });
    const data = await res.json();
    if (!data.success) {
      if (data.message === 'SCHOOL_SUSPENDED' || data.isSchoolSuspended) {
        const err = new Error(data.error || data.message || 'تم تعطيل وتجميد حساب وخدمات هذه المدرسة من قبل إدارة المنظومة (المطور)');
        (err as any).isSchoolSuspended = true;
        (err as any).schoolName = data.schoolName;
        throw err;
      }
      if (data.message === 'ACCOUNT_BANNED' || data.isBanned) {
        const err = new Error(data.error || 'تم حظر هذا الحساب أو الجهاز من قبل إدارة المنظومة');
        (err as any).isBanned = true;
        throw err;
      }
      throw new Error(data.error || data.message || 'كود الدخول غير صحيح');
    }
    
    localStorage.setItem(this.tokenKey, data.token);
    this.currentUser = data.user;
    this.notifyListeners();
    return data.user;
  }

  public async registerWithEmail(email: string, password: string, name: string, role: string, schoolId: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, schoolId })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    // Auto login after register
    return this.loginWithEmail(email, password);
  }

  public async loginWithGoogle(email?: string, name?: string): Promise<CustomUser> {
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'فشل تسجيل الدخول عبر Google');
    }
    localStorage.setItem(this.tokenKey, data.token);
    this.currentUser = data.user;
    this.notifyListeners();
    return data.user;
  }

  public async logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser = null;
    this.notifyListeners();
  }

  public getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  public getCurrentUser() {
    return this.currentUser;
  }
}

export const customAuth = new CustomAuthService();
