import { customAuth } from '../services/customAuthService';

export interface RealtimeEvent {
  type: string;
  table: string;
  collection: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RECONNECTED';
  id?: string;
  schoolId?: string;
  timestamp: number;
  data?: any;
}

export type RealtimeCallback = (event: RealtimeEvent) => void;

class RealtimeManager {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private fallbackInterval: NodeJS.Timeout | null = null;
  private fallbackDelay: number = 3000;
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private authUnsub: (() => void) | null = null;

  constructor() {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Listen to Auth State changes
    this.authUnsub = customAuth.onAuthStateChanged((user) => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });

    // Handle browser online/offline events
    window.addEventListener('online', () => {
      console.log('[RealtimeManager] Network online. Connecting...');
      this.connect();
    });

    window.addEventListener('offline', () => {
      console.log('[RealtimeManager] Network offline.');
      this.disconnect();
    });

    // Auto-connect if already logged in
    const token = customAuth.getToken();
    if (token) {
      this.connect();
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = customAuth.getToken();
    if (!token) {
      return; // Wait until authenticated
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/realtime?token=${encodeURIComponent(token)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stopFallback();

        // Send explicit auth message just in case query param is stripped
        this.send({ type: 'auth', token });

        // Start ping heartbeat
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[RealtimeManager] Error parsing message:', e);
        }
      };

      this.ws.onclose = (event) => {
        this.handleDisconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[RealtimeManager] WebSocket connection warning:', err);
        // onclose will trigger next
      };
    } catch (e) {
      console.error('[RealtimeManager] Error establishing connection:', e);
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(msg: any) {
    if (!msg || !msg.type) return;

    if (msg.type === 'auth_success') {
      this.isAuthenticated = true;
      // Resubscribe all active subscriptions after successful auth
      this.resubscribeAll();

      // Dispatch RECONNECTED event to all listeners for recovery sync
      this.dispatch({
        type: 'event',
        table: 'all',
        collection: 'all',
        action: 'RECONNECTED',
        timestamp: Date.now()
      });
      return;
    }

    if (msg.type === 'auth_error') {
      this.isAuthenticated = false;
      return;
    }

    if (msg.type === 'pong') {
      return;
    }

    if (msg.type === 'db_event') {
      const event: RealtimeEvent = {
        type: msg.type,
        table: msg.table,
        collection: msg.collection,
        action: msg.action,
        id: msg.id,
        schoolId: msg.schoolId,
        data: msg.data,
        timestamp: msg.timestamp || Date.now()
      };
      this.dispatch(event);
    }
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.isAuthenticated = false;
    this.stopPing();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

    // If disconnected for more than 3 attempts, start conservative fallback
    if (this.reconnectAttempts >= 3) {
      this.startFallback();
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (customAuth.getToken()) {
        this.connect();
      }
    }, delay);
  }

  private startFallback() {
    if (this.fallbackInterval) return;

    const runFallback = () => {
      if (this.isConnected) {
        this.stopFallback();
        return;
      }

      // Trigger recovery update for active listeners
      this.dispatch({
        type: 'event',
        table: 'all',
        collection: 'all',
        action: 'RECONNECTED',
        timestamp: Date.now()
      });

      // Gradually increase fallback delay up to 30s
      this.fallbackDelay = Math.min(this.fallbackDelay * 1.5, 30000);
      this.fallbackInterval = setTimeout(runFallback, this.fallbackDelay);
    };

    this.fallbackDelay = 3000;
    this.fallbackInterval = setTimeout(runFallback, this.fallbackDelay);
  }

  private stopFallback() {
    if (this.fallbackInterval) {
      clearTimeout(this.fallbackInterval);
      this.fallbackInterval = null;
    }
    this.fallbackDelay = 3000;
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    this.stopFallback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('[RealtimeManager] Send error:', e);
      }
    }
  }

  private resubscribeAll() {
    for (const subKey of this.listeners.keys()) {
      const parts = subKey.split(':');
      const collection = parts[0];
      const docId = parts[1];
      this.send({
        type: 'subscribe',
        collection,
        docId
      });
    }
  }

  public subscribe(
    collection: string,
    docIdOrCallback?: string | RealtimeCallback,
    maybeCallback?: RealtimeCallback
  ): () => void {
    const docId = typeof docIdOrCallback === 'string' ? docIdOrCallback : undefined;
    const callback = typeof docIdOrCallback === 'function' ? docIdOrCallback : maybeCallback;

    if (!callback || !collection) {
      return () => {};
    }

    const normCol = collection.split('/')[0];
    const cleanCol = collection.includes('/') ? collection.replace(/\//g, '_') : collection;
    
    // Register under multiple representation keys so events never miss
    const subKeys = new Set<string>();
    if (docId) {
      subKeys.add(`${normCol}:${docId}`);
      subKeys.add(`${cleanCol}:${docId}`);
      subKeys.add(`${collection}:${docId}`);
    } else {
      subKeys.add(normCol);
      subKeys.add(cleanCol);
      subKeys.add(collection);
    }

    subKeys.forEach((key) => {
      if (!this.listeners.has(key)) {
        this.listeners.set(key, new Set());
      }
      this.listeners.get(key)!.add(callback);
    });

    // Inform server to subscribe to cleanCol and normCol
    if (this.isConnected && this.isAuthenticated) {
      this.send({
        type: 'subscribe',
        collection: cleanCol,
        docId
      });
      if (normCol !== cleanCol) {
        this.send({
          type: 'subscribe',
          collection: normCol,
          docId
        });
      }
    }

    // Make sure we're connected
    if (!this.isConnected) {
      this.connect();
    }

    // Return unsubscription function
    return () => {
      subKeys.forEach((key) => {
        const currentSet = this.listeners.get(key);
        if (currentSet) {
          currentSet.delete(callback);
          if (currentSet.size === 0) {
            this.listeners.delete(key);
          }
        }
      });
      if (this.isConnected && this.isAuthenticated) {
        this.send({
          type: 'unsubscribe',
          collection: cleanCol,
          docId
        });
      }
    };
  }

  public on(eventOrCollection: string, callback: RealtimeCallback | (() => void)): () => void {
    return this.subscribe(eventOrCollection, callback as RealtimeCallback);
  }


  public off(eventOrCollection: string, callback: RealtimeCallback | (() => void)) {
    const subKey = eventOrCollection.split('/')[0];
    const cleanKey = eventOrCollection.includes('/') ? eventOrCollection.replace(/\//g, '_') : eventOrCollection;
    
    [subKey, cleanKey, eventOrCollection].forEach((key) => {
      const currentSet = this.listeners.get(key);
      if (currentSet) {
        currentSet.delete(callback as any);
        if (currentSet.size === 0) {
          this.listeners.delete(key);
        }
      }
    });

    if (this.isConnected && this.isAuthenticated) {
      this.send({
        type: 'unsubscribe',
        collection: cleanKey
      });
    }
  }

  public trigger(eventOrCollection: string, data?: any) {
    if (!eventOrCollection) return;
    const normCol = eventOrCollection.split('/')[0];
    const action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RECONNECTED' =
      (data?.action as 'INSERT' | 'UPDATE' | 'DELETE' | 'RECONNECTED') || 'UPDATE';
    const id = data?.id || data?.broadcast?.id || (typeof data === 'string' ? data : undefined);

    const event: RealtimeEvent = {
      type: 'db_event',
      table: normCol,
      collection: normCol,
      action,
      id,
      schoolId: data?.schoolId || data?.broadcast?.schoolId,
      timestamp: data?.timestamp || Date.now(),
      data: data?.data ?? data,
      ...(typeof data === 'object' ? data : {})
    };

    this.dispatch(event);
  }

  public emit(eventOrCollection: string, data?: any) {
    this.trigger(eventOrCollection, data);
  }

  private dispatch(event: RealtimeEvent) {
    if (event.action === 'RECONNECTED' || event.collection === 'all') {
      // Notify all active listeners across all keys
      for (const set of this.listeners.values()) {
        for (const cb of set) {
          try {
            cb(event);
          } catch (e) {
            console.error('[RealtimeManager] Callback error:', e);
          }
        }
      }
      return;
    }

    const col = event.collection;
    const normCol = col.split('/')[0];
    const baseCol = col.split('_')[0];
    const slashCol = col.replace(/_/g, '/');

    const candidateKeys = new Set<string>();
    candidateKeys.add(col);
    candidateKeys.add(normCol);
    candidateKeys.add(baseCol);
    candidateKeys.add(slashCol);

    if (event.id) {
      candidateKeys.add(`${col}:${event.id}`);
      candidateKeys.add(`${normCol}:${event.id}`);
      candidateKeys.add(`${baseCol}:${event.id}`);
      candidateKeys.add(`${slashCol}:${event.id}`);
    }

    const callbacksToRun = new Set<RealtimeCallback>();
    candidateKeys.forEach((key) => {
      const set = this.listeners.get(key);
      if (set) {
        set.forEach((cb) => callbacksToRun.add(cb));
      }
    });

    callbacksToRun.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('[RealtimeManager] Callback error:', e);
      }
    });
  }
}

export const realtimeManager = new RealtimeManager();
