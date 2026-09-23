import { customAuth } from '../services/customAuthService';
import { getApiBaseUrl } from './serverConfig';

function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base ? `${base}${cleanPath}` : cleanPath;
}

async function request(path: string, options: RequestInit = {}) {
  const isGet = !options.method || options.method === 'GET';
  const maxRetries = isGet ? 4 : 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const token = customAuth.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    let response: Response;
    try {
      response = await fetch(resolveApiUrl(path), { ...options, headers });
    } catch (networkErr: any) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
        continue;
      }
      console.warn(`[API] Network failure fetching ${path}:`, networkErr?.message || networkErr);
      if (isGet) {
        return { success: false, networkError: true, data: null, items: [], docs: [] };
      }
      return { success: false, networkError: true, message: `تعذر الاتصال بالخادم: ${path}` };
    }

    // Handle 404 cleanly without throwing
    if (response.status === 404) {
      if (isGet) {
        return { success: false, notFound: true, data: null, items: [], docs: [] };
      }
      return { success: false, notFound: true, message: `العنصر غير موجود: ${path}` };
    }

    // Check if proxy returned 502/503/504
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Normal JSON response
    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        if (!response.ok) {
          if (isGet) {
            return { success: false, status: response.status, data: null, items: [], docs: [] };
          }
          return { success: false, status: response.status, message: data?.message || `Request failed with status ${response.status}` };
        }
        return data;
      } catch (parseErr) {
        // If JSON parsing failed unexpectedly, fall through to text check
      }
    }

    // If it's HTML (warmup page from NGINX or Vite fallback)
    const text = await response.text();
    const isHtml = contentType.includes('text/html') || text.includes('<!doctype html>') || text.includes('<html') || text.includes('Starting Server...');

    if (isHtml) {
      // Backend is starting up or Vite fallback was hit; retry if attempts left
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
      // Out of retries
      if (isGet) {
        return { success: false, htmlFallback: true, data: null, items: [], docs: [] };
      }
      return { success: false, htmlFallback: true, message: `الخادم قيد التهيئة (${path})` };
    }

    // Try parsing as JSON (e.g. text/plain containing JSON)
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        if (isGet) {
          return { success: false, status: response.status, data: null, items: [], docs: [] };
        }
        return { success: false, status: response.status, message: data?.message || `Request failed with status ${response.status}` };
      }
      return data;
    } catch {
      if (!response.ok) {
        if (isGet) {
          return { success: false, status: response.status, data: null, items: [], docs: [] };
        }
        return { success: false, status: response.status, message: text || `Request failed with status ${response.status}` };
      }
      return text;
    }
  }

  return { success: false, data: null, items: [], docs: [] };
}

export const api = {
  get: (path: string) => {
    const separator = path.includes('?') ? '&' : '?';
    return request(`${path}${separator}_t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
  },
  post: (path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
