// Centralized Backend URL resolver for Web & Native (Capacitor/Android/iOS)
const STORAGE_KEY = 'bairaq_custom_api_base_url';

// Default production URL
export const DEFAULT_PRODUCTION_API_URL = 'https://bairaq-iq.com';

/**
 * Returns the currently active backend API base URL
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. User/Admin custom configured server URL in localStorage
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && typeof custom === 'string' && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {}

  // 2. Environment variable if provided at build time
  if (import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
  }

  // 3. Web environments check (Cloud Run / AI Studio dev & pre preview)
  const host = (window.location.hostname || '').toLowerCase();
  const isCloudRun = host.endsWith('.run.app') || host.endsWith('.aistudio.google.com') || host.includes('bairaq-iq.com');

  // If we are strictly running in full-stack web hosting (same origin), relative URL is fine
  if (isCloudRun && window.location.protocol.startsWith('http') && host !== 'localhost' && host !== '127.0.0.1') {
    return '';
  }

  // 4. In all Mobile / Native Capacitor / WebView / Local builds, always target production backend!
  return DEFAULT_PRODUCTION_API_URL;
}

/**
 * Sets a custom backend API URL (useful for testing or switching servers)
 */
export function setApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!url) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    }
  } catch (e) {}
}

/**
 * Check if running inside native Capacitor
 */
export function isNativeMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'file:' || 
    Boolean((window as any).Capacitor?.isNativePlatform?.())
  );
}
