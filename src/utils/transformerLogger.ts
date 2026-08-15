export interface TransformerLog {
  timestamp: string;
  stage: string;
  message: string;
  memory?: string;
  isError?: boolean;
  pageInfo?: string;
  timeSpentMs?: number;
  stackTrace?: string;
}

export const getTransformerLogs = (): TransformerLog[] => {
  return (window as any).__transformerLogs || [];
};

export const clearTransformerLogs = () => {
  (window as any).__transformerLogs = [];
};

const limitLogs = () => {
  if (!(window as any).__transformerLogs) return;
  const logs = (window as any).__transformerLogs;
  if (logs.length > 500) {
    (window as any).__transformerLogs = logs.slice(logs.length - 500);
  }
};

export const logTransformerAction = (
  stage: string,
  message: string,
  pageInfo?: string,
  timeSpentMs?: number,
  errorObj?: any
) => {
  if (!(window as any).__transformerLogs) {
    (window as any).__transformerLogs = [];
  }

  let memoryStr = "N/A";
  if ((performance as any).memory) {
    memoryStr = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024)) + " MB";
  }

  let stackTrace = undefined;
  if (errorObj) {
    stackTrace = errorObj.stack || String(errorObj);
  }

  const log: TransformerLog = {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date().getMilliseconds(),
    stage,
    message,
    memory: memoryStr,
    pageInfo,
    timeSpentMs,
    stackTrace,
    isError: !!errorObj
  };

  (window as any).__transformerLogs.push(log);
  limitLogs();

  // Also dispatch a custom event so UI can update immediately
  window.dispatchEvent(new CustomEvent('transformer-log-updated'));
};

if (typeof window !== 'undefined') {
  (window as any).logTransformerAction = logTransformerAction;
}

export const logTransformerErrorToChat = (reason: string, errorObj?: any) => {
    logTransformerAction('Transformer Error', `Error details recorded inside the active page:\n${reason}`, undefined, undefined, errorObj);
};
