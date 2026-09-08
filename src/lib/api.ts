import { customAuth } from '../services/customAuthService';

async function request(path: string, options: RequestInit = {}) {
  const token = customAuth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const isGet = !options.method || options.method === 'GET';

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (networkErr: any) {
    // Single retry after small pause if network glitch
    try {
      await new Promise(r => setTimeout(r, 200));
      response = await fetch(path, { ...options, headers });
    } catch (retryErr: any) {
      console.warn(`[API] Network failure fetching ${path}:`, retryErr?.message || retryErr);
      if (isGet) {
        return { success: false, networkError: true, data: null, items: [], docs: [] };
      }
      throw new Error(`تعذر الاتصال بالخادم: ${path}`);
    }
  }

  // Handle 404 or 401 gracefully
  if (response.status === 404) {
    if (isGet) {
      return { success: false, notFound: true, data: null, items: [], docs: [] };
    }
  }

  const contentType = response.headers.get('content-type');
  let data: any;
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      data = null;
    }
  } else {
    const text = await response.text();
    // If it's HTML (Vite fallback or error page)
    if (!response.ok || text.includes('<!doctype html>') || text.includes('<html')) {
      if (isGet) {
        return { success: false, htmlFallback: true, data: null, items: [], docs: [] };
      }
      throw new Error(`Invalid response from ${path}: Status ${response.status}`);
    }
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!response.ok) {
    if (isGet) {
      return { success: false, status: response.status, data: null, items: [], docs: [] };
    }
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
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
