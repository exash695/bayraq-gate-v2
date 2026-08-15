export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
};
