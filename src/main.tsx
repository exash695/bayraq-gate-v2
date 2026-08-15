import {createRoot} from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';

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

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
);

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const error = event.reason;
      const errMsg = error?.message || String(error || '');
      const isAbort = 
        error?.name === 'AbortError' || 
        errMsg.includes('aborted') || 
        errMsg.includes('abort') || 
        errMsg.includes('cancel') || 
        errMsg.includes('إلغاء') || 
        errMsg.includes('المعالجة') || 
        errMsg.includes('without reason');
      if (isAbort) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (e) {}
  });

  window.addEventListener('error', (event) => {
    try {
      const error = event.error;
      const errMsg = error?.message || event.message || '';
      const isAbort = 
        error?.name === 'AbortError' || 
        errMsg.includes('aborted') || 
        errMsg.includes('abort') || 
        errMsg.includes('cancel') || 
        errMsg.includes('إلغاء') || 
        errMsg.includes('المعالجة') || 
        errMsg.includes('without reason');
      if (isAbort) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (e) {}
  });
}

