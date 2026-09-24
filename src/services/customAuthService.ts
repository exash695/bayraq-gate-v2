import { getApiBaseUrl } from '../lib/serverConfig';

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

function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base ? `${base}${cleanPath}` : cleanPath;
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
        const res = await fetch(resolveApiUrl('/api/auth/me'), {
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
    let res: Response;
    try {
      res = await fetch(resolveApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-device-id': deviceId
        },
        body: JSON.stringify({ email, password, deviceId })
      });
    } catch (networkErr: any) {
      console.error('[customAuth] loginWithEmail network error:', networkErr);
      const detail = networkErr?.message || String(networkErr || '');
      throw new Error(`تعذر الاتصال بالخادم الرئيسي (${detail || 'Network Request Blocked'}). يرجى التحقق من اتصال الإنترنت.`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error(`استجابة غير صالحة من السيرفر (${res.status}). يرجى التأكد من تشغيل الخادم.`);
    }

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

    const res = await fetch(resolveApiUrl('/api/auth/login-code'), {
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
    let res: Response;
    try {
      res = await fetch(resolveApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, schoolId })
      });
    } catch (networkErr: any) {
      console.error('[customAuth] registerWithEmail network error:', networkErr);
      throw new Error('تعذر الاتصال بالخادم لإنشاء الحساب. يرجى التحقق من اتصال الإنترنت أو حالة السيرفر.');
    }

    let data: any;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error(`استجابة غير صالحة من السيرفر (${res.status}). يرجى التحقق من تشغيل الخادم.`);
    }

    if (!data.success) {
      throw new Error(data.message || data.error || 'فشل إنشاء الحساب الجديد');
    }
    // Auto login after register
    return this.loginWithEmail(email, password);
  }

  public async loginWithGoogle(email?: string, name?: string, photoURL?: string): Promise<CustomUser> {
    let res: Response;
    try {
      res = await fetch(resolveApiUrl('/api/auth/google-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, photoURL })
      });
    } catch (networkErr: any) {
      throw new Error('تعذر الاتصال بالسيرفر لتسجيل الدخول عبر Google.');
    }

    let data: any;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`استجابة غير صالحة (${res.status})`);
    }

    if (!data.success) {
      throw new Error(data.message || 'فشل تسجيل الدخول عبر Google');
    }
    localStorage.setItem(this.tokenKey, data.token);
    this.currentUser = data.user;
    this.notifyListeners();
    return data.user;
  }

  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    let res: Response;
    try {
      res = await fetch(resolveApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
    } catch (networkErr: any) {
      console.error('[customAuth] forgotPassword network error:', networkErr);
      throw new Error('تعذر الاتصال بالخادم لإرسال رابط الاستعادة. يرجى التحقق من الاتصال بالإنترنت.');
    }

    let data: any;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`استجابة غير صالحة من الخادم (${res.status})`);
    }

    if (!data.success) {
      throw new Error(data.message || 'حدث خطأ أثناء إرسال رابط استعادة كلمة المرور');
    }
    return data;
  }

  public async requestWhatsappOtp(identifier: string): Promise<{
    success: boolean;
    message: string;
    phoneMasked?: string;
    identifier?: string;
    whatsappLink?: string;
    supportWhatsapp?: string;
    gatewaySent?: boolean;
    expiresInSeconds?: number;
  }> {
    const res = await fetch(resolveApiUrl('/api/auth/whatsapp/request-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'حدث خطأ أثناء طلب رمز التحقق عبر واتساب');
    }
    return data;
  }

  public async verifyWhatsappOtp(identifier: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(resolveApiUrl('/api/auth/whatsapp/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), otp: otp.trim(), newPassword })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'حدث خطأ أثناء حفظ كلمة المرور الجديدة');
    }
    return data;
  }

  public async resetPassword(email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(resolveApiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), token, newPassword })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    }
    return data;
  }

  public async logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser = null;
    this.notifyListeners();
  }

  public async deleteAccount(userId?: string): Promise<{ success: boolean; message: string }> {
    const user = this.currentUser;
    const targetId = userId || user?.uid || user?.id;
    const token = this.getToken();
    
    let res: Response | null = null;
    try {
      res = await fetch(resolveApiUrl('/api/auth/delete-account'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          userId: targetId,
          email: user?.email,
          code: user?.studentCode,
          schoolId: user?.schoolId
        })
      });
    } catch (networkErr: any) {
      console.warn('Network error on /api/auth/delete-account:', networkErr);
    }

    if (!res || !res.ok) {
      if (targetId) {
        try {
          await fetch(resolveApiUrl(`/api/users/${targetId}`), { method: 'DELETE' });
        } catch (e) {}
      }
    }

    await this.logout();
    return { success: true, message: 'تم حذف الحساب بنجاح' };
  }

  public getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  public getCurrentUser() {
    return this.currentUser;
  }
}

export const customAuth = new CustomAuthService();
