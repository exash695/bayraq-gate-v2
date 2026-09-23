import {createRoot} from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';
import { errorMonitoringService } from './services/errorMonitoringService';

import { getApiBaseUrl } from './lib/serverConfig';

// Automatic Mobile / Native App API URL routing
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch.bind(window);
    const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const baseUrl = getApiBaseUrl();
      if (baseUrl && typeof input === 'string' && input.startsWith('/api/')) {
        input = baseUrl + input;
      }
      return originalFetch(input, init);
    };

    try {
      window.fetch = customFetch;
    } catch {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    }
  } catch (err) {
    // Non-blocking in strict browser environments
  }
}

// Initialize global error monitoring
errorMonitoringService.init();

// Lazily load PDF worker in background so it doesn't block initial hydration
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      import('./lib/pdfWorker').catch(() => {});
    });
  } else {
    setTimeout(() => {
      import('./lib/pdfWorker').catch(() => {});
    }, 1500);
  }
}

// Global polyfills for date/timestamp compatibility across Firebase and PostgreSQL APIs
if (typeof (String.prototype as any).toMillis !== 'function') {
  Object.defineProperty(String.prototype, 'toMillis', {
    value: function () {
      const ms = new Date(this as string).getTime();
      return isNaN(ms) ? (Number(this) || 0) : ms;
    },
    writable: true,
    configurable: true
  });
}
if (typeof (Date.prototype as any).toMillis !== 'function') {
  Object.defineProperty(Date.prototype, 'toMillis', {
    value: function () {
      return this.getTime();
    },
    writable: true,
    configurable: true
  });
}
if (typeof (Number.prototype as any).toMillis !== 'function') {
  Object.defineProperty(Number.prototype, 'toMillis', {
    value: function () {
      return Number(this);
    },
    writable: true,
    configurable: true
  });
}

function safeStringify(a: any): string {
  if (typeof a === 'string') return a;
  if (!a) return String(a);
  if (a instanceof Error) return a.message || String(a);
  if (typeof a === 'object') {
    if (a instanceof Node || (typeof Event !== 'undefined' && a instanceof Event)) {
      return '[DOM/Event Object]';
    }
    try {
      const seen = new WeakSet();
      return JSON.stringify(a, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value) || value instanceof Node || (typeof Event !== 'undefined' && value instanceof Event)) {
            return '[Circular/DOM]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch {
      return String(a);
    }
  }
  return String(a);
}

/*
// Intercept and silence uncritical CSS color parsing warnings from html2canvas (e.g. oklab/oklch)
const originalWarn = console.warn;
console.warn = function (...args: any[]) {
  try {
     const errorString = args.map(safeStringify).join(' ');
     if (
         errorString.includes('unsupported color function') || 
         errorString.includes('oklab') || 
         errorString.includes('oklch') ||
         errorString.includes('resource-exhausted') ||
         errorString.includes('Quota') ||
         errorString.includes('maximum backoff') ||
         errorString.includes('Firestore') ||
         errorString.includes('@firebase') ||
         errorString.includes('UnknownErrorException') ||
         errorString.includes('Failed to fetch') ||
         errorString.includes('without reason') ||
         errorString.includes('aborted') ||
         errorString.includes('AbortError') ||
         errorString.includes('cancel') ||
         errorString.includes('no supported sources') ||
         errorString.includes('autoplay')
     ) {
         return;
     }
  } catch(e) {}
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = function (...args: any[]) {
  try {
     const errorString = args.map(safeStringify).join(' ');
     if (
         errorString.includes('unsupported color function') || 
         errorString.includes('oklab') || 
         errorString.includes('oklch') ||
         errorString.includes('resource-exhausted') ||
         errorString.includes('Quota') ||
         errorString.includes('maximum backoff') ||
         errorString.includes('Firestore') ||
         errorString.includes('@firebase') ||
         errorString.includes('UnknownErrorException') ||
         errorString.includes('Failed to fetch') ||
         errorString.includes('without reason') ||
         errorString.includes('aborted') ||
         errorString.includes('AbortError') ||
         errorString.includes('cancel') ||
         errorString.includes('no supported sources') ||
         errorString.includes('autoplay')
     ) {
         return;
     }
  } catch(e) {}
  originalError.apply(console, args);
};

const originalLog = console.log;
console.log = function (...args: any[]) {
  try {
     const errorString = args.map(safeStringify).join(' ');
     if (
         errorString.includes('resource-exhausted') ||
         errorString.includes('Quota') ||
         errorString.includes('maximum backoff') ||
         errorString.includes('@firebase/firestore') ||
         errorString.includes('UnknownErrorException') ||
         errorString.includes('Failed to fetch') ||
         errorString.includes('no supported sources')
     ) {
         return;
     }
  } catch(e) {}
  originalLog.apply(console, args);
};
*/

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
} catch (mountErr) {
  console.error("Critical mounting error:", mountErr);
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const error = event.reason;
      const errMsg = error?.message || String(error || '');
      const isAbortOrNetwork = 
        error?.name === 'AbortError' || 
        errMsg.includes('aborted') || 
        errMsg.includes('abort') || 
        errMsg.includes('cancel') || 
        errMsg.includes('إلغاء') || 
        errMsg.includes('المعالجة') || 
        errMsg.includes('without reason') ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('Load failed') ||
        errMsg.includes('websocket') ||
        errMsg.includes('Quota');
      if (isAbortOrNetwork) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (e) {}
  });

  window.addEventListener('error', (event) => {
    try {
      const error = event.error;
      const errMsg = error?.message || event.message || '';
      const isAbortOrNetwork = 
        error?.name === 'AbortError' || 
        errMsg.includes('aborted') || 
        errMsg.includes('abort') || 
        errMsg.includes('cancel') || 
        errMsg.includes('إلغاء') || 
        errMsg.includes('المعالجة') || 
        errMsg.includes('without reason') ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('Load failed') ||
        errMsg.includes('websocket') ||
        errMsg.includes('ResizeObserver') ||
        errMsg.includes('Quota');
      if (isAbortOrNetwork) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (e) {}
  });
}

