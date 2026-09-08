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
          headers: { 'Authorization': `Bearer ${token}` }
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

  public async loginWithEmail(email: string, password: string):Promise<CustomUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Invalid credentials');
    }
    
    localStorage.setItem(this.tokenKey, data.token);
    this.currentUser = data.user;
    this.notifyListeners();
    return data.user;
  }

  public async loginWithCode(code: string, expectedSchoolId?: string): Promise<CustomUser> {
    const res = await fetch('/api/auth/login-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), schoolId: expectedSchoolId?.trim() })
    });
    const data = await res.json();
    if (!data.success) {
      if (data.message === 'ACCOUNT_BANNED' || data.isBanned) {
        const err = new Error('ACCOUNT_BANNED');
        (err as any).isBanned = true;
        throw err;
      }
      throw new Error(data.message || 'كود الدخول غير صحيح');
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
