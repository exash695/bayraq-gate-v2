import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import type { Sql } from 'postgres';
import { initDatabaseTriggers, startPgListener, DbEventPayload } from './realtimeDb';

export interface AuthenticatedUser {
  uid: string;
  role: string;
  schoolId?: string;
  name?: string;
  email?: string;
}

export interface ClientSubscription {
  collection: string;
  docId?: string;
  schoolId?: string;
}

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  user?: AuthenticatedUser;
  subscriptions: Set<string>; // serialized subscription keys: "collection" or "collection:docId"
  authTimer?: NodeJS.Timeout;
}

// Table to collection name mapping (bi-directional normalization)
const TABLE_COLLECTION_MAP: Record<string, string> = {
  'lounge_messages': 'lounge_messages',
  'notifications': 'notifications',
  'broadcasts': 'broadcasts',
  'school_announcements': 'school_announcements',
  'student_transactions': 'student_transactions',
  'payment_requests': 'payment_requests',
  'attendance_logs': 'attendance_logs',
  'behavior_logs': 'behavior_logs',
  'class_schedules': 'class_schedules',
  'academic_lists': 'academic_lists',
  'students': 'students',
  'teachers': 'teachers',
  'schools': 'schools',
  'support_tickets': 'support_tickets',
  'idea_bank': 'idea_bank',
  'council_polls': 'council_polls',
  'transport_routes': 'transport_routes',
  'transport_drivers': 'transport_drivers',
  'transport_students_status': 'transport_students_status',
  'transport_fees': 'transport_fees',
  'salaries': 'salaries',
  'community_posts': 'community_posts',
  'community_comments': 'community_comments',
  'community_stories': 'community_stories',
  'recorded_lessons': 'recorded_lessons',
  'school_files': 'school_files',
  'academy_pages': 'academy_pages',
  'video_comments': 'video_comments',
  'student_live_notes': 'student_live_notes',
  'question_bank': 'question_bank',
  'exam_papers': 'exam_papers',
  'firestore_docs': 'firestore_docs',
  'settings': 'settings',
  'system_settings': 'system_settings',
  'system_config': 'system_config',
  'school_configs': 'school_configs',
};

function getSubKey(collection: string, docId?: string): string {
  const normCol = collection.split('/')[0];
  return docId ? `${normCol}:${docId}` : normCol;
}

export class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private jwtSecret: string;
  private sql: Sql;
  private clients: Set<ExtendedWebSocket> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private unlistenPg: (() => Promise<void>) | null = null;

  constructor(sql: Sql, jwtSecret: string) {
    this.sql = sql;
    this.jwtSecret = jwtSecret;
  }

  public async initialize(httpServer: HttpServer): Promise<void> {
    console.log('[RealtimeServer] Initializing WebSocket Server...');

    // 1. Initialize PostgreSQL triggers
    await initDatabaseTriggers(this.sql);

    // 2. Attach WebSocket Server to HTTP server
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/api/realtime'
    });

    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      this.handleConnection(ws, req);
    });

    // 3. Setup PostgreSQL LISTEN
    this.unlistenPg = await startPgListener(this.sql, (event) => {
      this.broadcastEvent(event);
    });

    // 4. Ping/Pong Heartbeat every 30 seconds
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log('[RealtimeServer] Terminating inactive client socket');
          return ws.terminate();
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch (e) {
          ws.terminate();
        }
      });
    }, 30000);

    console.log('[RealtimeServer] WebSocket Server attached successfully on /api/realtime');
  }

  private handleConnection(ws: ExtendedWebSocket, req: any) {
    ws.isAlive = true;
    ws.subscriptions = new Set();
    this.clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Check if token passed in query parameter (e.g. ?token=...)
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) {
        this.authenticateSocket(ws, tokenParam);
      }
    } catch (e) {
      // Ignore URL parse error
    }

    // Give client 5 seconds to authenticate, otherwise assign guest role for public feeds
    ws.authTimer = setTimeout(() => {
      if (!ws.user) {
        ws.user = {
          uid: 'guest_' + Math.random().toString(36).substring(2, 9),
          role: 'guest',
          name: 'طالب / زائر'
        };
        try {
          ws.send(JSON.stringify({ type: 'auth_guest', message: 'Connected as guest observer' }));
        } catch (e) {}
      }
    }, 5000);

    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[RealtimeServer] Invalid message format received from client:', err);
      }
    });

    ws.on('close', () => {
      if (ws.authTimer) clearTimeout(ws.authTimer);
      this.clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[RealtimeServer] Client WebSocket error:', err.message);
      this.clients.delete(ws);
    });
  }

  private authenticateSocket(ws: ExtendedWebSocket, token: string): boolean {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      ws.user = {
        uid: decoded.uid,
        role: decoded.role || 'student',
        schoolId: decoded.schoolId,
        name: decoded.name || decoded.displayName,
        email: decoded.email
      };

      if (ws.authTimer) {
        clearTimeout(ws.authTimer);
        ws.authTimer = undefined;
      }

      ws.send(JSON.stringify({
        type: 'auth_success',
        user: {
          uid: ws.user.uid,
          role: ws.user.role,
          schoolId: ws.user.schoolId
        }
      }));

      return true;
    } catch (err: any) {
      console.warn('[RealtimeServer] JWT verification failed:', err.message);
      ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid or expired token' }));
      return false;
    }
  }

  private handleClientMessage(ws: ExtendedWebSocket, msg: any) {
    if (!msg || typeof msg !== 'object') return;

    // 1. Auth Message
    if (msg.type === 'auth') {
      if (msg.token) {
        this.authenticateSocket(ws, msg.token);
      }
      return;
    }

    // 2. Ping / Heartbeat from client
    if (msg.type === 'ping') {
      ws.isAlive = true;
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      return;
    }

    // Enforce Authentication for any data operation
    if (!ws.user) {
      ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized. Please authenticate first.' }));
      return;
    }

    // 3. Subscribe Message
    if (msg.type === 'subscribe') {
      const { collection, docId } = msg;
      if (!collection) return;

      // Authorization Check before subscribing
      if (!this.isAuthorizedToSubscribe(ws.user, collection, docId)) {
        ws.send(JSON.stringify({
          type: 'subscribe_error',
          collection,
          docId,
          message: 'Access forbidden for this collection'
        }));
        return;
      }

      const subKey = getSubKey(collection, docId);
      ws.subscriptions.add(subKey);
      ws.subscriptions.add(collection);
      if (docId) {
        ws.subscriptions.add(`${collection}:${docId}`);
      }
      if (collection.includes('/')) {
        const base = collection.split('/')[0];
        ws.subscriptions.add(base);
        if (docId) ws.subscriptions.add(`${base}:${docId}`);
      }
      if (collection.includes('_')) {
        const base = collection.split('_')[0];
        ws.subscriptions.add(base);
        if (docId) ws.subscriptions.add(`${base}:${docId}`);
      }

      ws.send(JSON.stringify({
        type: 'subscribed',
        collection,
        docId,
        subKey
      }));
      return;
    }

    // 4. Unsubscribe Message
    if (msg.type === 'unsubscribe') {
      const { collection, docId } = msg;
      if (!collection) return;

      const subKey = getSubKey(collection, docId);
      ws.subscriptions.delete(subKey);
      ws.subscriptions.delete(collection);
      if (docId) ws.subscriptions.delete(`${collection}:${docId}`);
      if (collection.includes('/')) {
        const base = collection.split('/')[0];
        ws.subscriptions.delete(base);
        if (docId) ws.subscriptions.delete(`${base}:${docId}`);
      }
      if (collection.includes('_')) {
        const base = collection.split('_')[0];
        ws.subscriptions.delete(base);
        if (docId) ws.subscriptions.delete(`${base}:${docId}`);
      }

      ws.send(JSON.stringify({
        type: 'unsubscribed',
        collection,
        docId
      }));
      return;
    }
  }

  /**
   * Strict Authorization Rules for Subscriptions
   */
  private isAuthorizedToSubscribe(user: AuthenticatedUser, collection: string, docId?: string): boolean {
    const role = (user.role || '').toLowerCase();
    const isSuperAdminOrDev = role === 'developer' || role === 'super_admin';
    if (isSuperAdminOrDev) return true;

    const normCol = collection.split('/')[0];

    // Public collections are accessible to all users (including guests)
    if (normCol === 'school_announcements' || normCol === 'broadcasts' || normCol === 'settings' || normCol === 'system_settings') {
      return true;
    }

    // Admin / Manager has full access to school's resources
    if (role === 'admin' || role === 'manager') {
      return true;
    }

    // Teacher access rules
    if (role === 'teacher') {
      // Teachers cannot access salaries of others or system-only private secrets
      if (normCol === 'salaries' && docId && !docId.startsWith(user.uid)) {
        return false;
      }
      return true;
    }

    // Student access rules
    if (role === 'student') {
      // Sensitive collections only accessible if targeted to this student
      if (normCol === 'salaries') return false;
      if (normCol === 'developer_logs' || normCol === 'audit_logs') return false;
      if (normCol === 'payment_requests' && docId && !docId.includes(user.uid)) {
        // Can only subscribe to own payment requests
        return false;
      }
      return true;
    }

    // Parent access rules
    if (role === 'parent') {
      if (normCol === 'salaries' || normCol === 'developer_logs') return false;
      return true;
    }

    // Driver access rules
    if (role === 'driver') {
      const allowedForDriver = [
        'transport_routes',
        'transport_drivers',
        'transport_students_status',
        'school_announcements',
        'notifications',
        'lounge_messages'
      ];
      return allowedForDriver.includes(normCol);
    }

    return true;
  }

  /**
   * Broadcast a PostgreSQL database event to authorized subscribed clients
   */
  private broadcastEvent(event: DbEventPayload) {
    if (!event || !event.table) return;

    const collection = TABLE_COLLECTION_MAP[event.table] || event.table;
    const colKey = collection;
    const docKey = `${collection}:${event.id}`;

    const outgoingMsg = JSON.stringify({
      type: 'db_event',
      table: event.table,
      collection,
      action: event.action,
      id: event.id,
      schoolId: event.school_id,
      timestamp: event.timestamp || Date.now()
    });

    this.clients.forEach((ws) => {
      if (!ws.user || ws.readyState !== WebSocket.OPEN) return;

      // Check if client has a matching subscription (either for collection or specific doc)
      const hasCollectionSub = 
        ws.subscriptions.has(colKey) || 
        ws.subscriptions.has(event.table) ||
        (event.table === 'school_announcements' && ws.subscriptions.has('broadcasts')) ||
        (event.table === 'broadcasts' && ws.subscriptions.has('school_announcements'));
      const hasDocSub = ws.subscriptions.has(docKey) || ws.subscriptions.has(`${event.table}:${event.id}`);

      if (!hasCollectionSub && !hasDocSub) {
        return;
      }

      // Check tenant/school authorization
      if (
        event.school_id &&
        event.school_id !== 'all' &&
        event.school_id !== 'global' &&
        event.school_id !== 'central' &&
        event.school_id !== 'general' &&
        event.school_id !== 'عام' &&
        ws.user.schoolId &&
        ws.user.schoolId !== 'general' &&
        ws.user.schoolId !== 'all'
      ) {
        const isSuperAdmin = ws.user.role === 'developer' || ws.user.role === 'super_admin' || ws.user.role === 'admin';
        const norm = (s: string) => (s === 'school_awail_ghamas' || s === 'ghamas_awail') ? 'school1' : s.toLowerCase().trim();
        if (!isSuperAdmin && norm(ws.user.schoolId) !== norm(event.school_id)) {
          return; // Skip client from a different school
        }
      }

      // Check recipient/user authorization for private events
      if (event.recipient_id && ws.user.role !== 'admin' && ws.user.role !== 'developer') {
        if (event.recipient_id !== ws.user.uid && event.recipient_id !== ws.user.role) {
          // If message or notification is targeted to someone else
          if (event.user_id !== ws.user.uid) {
            return;
          }
        }
      }

      // Check student-specific events
      if (event.student_id && ws.user.role === 'student') {
        if (event.student_id !== ws.user.uid) {
          return;
        }
      }

      try {
        ws.send(outgoingMsg);
      } catch (err) {
        console.error('[RealtimeServer] Error sending event to client:', err);
      }
    });
  }

  public broadcastManual(collection: string, docId?: string, action: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE', data?: any) {
    const outgoingMsg = JSON.stringify({
      type: 'db_event',
      table: collection,
      collection,
      action,
      id: docId,
      data,
      timestamp: Date.now()
    });

    const colKey = collection;
    const docKey = docId ? `${collection}:${docId}` : collection;
    const normCol = collection.split('/')[0].split('_')[0];
    const isPublicBroadcast = 
      collection === 'broadcasts' || 
      collection === 'school_announcements' ||
      collection.startsWith('live_sessions');

    this.clients.forEach((ws) => {
      if (!ws.user || ws.readyState !== WebSocket.OPEN) return;
      if (
        isPublicBroadcast ||
        ws.subscriptions.has(colKey) ||
        ws.subscriptions.has(docKey) ||
        ws.subscriptions.has(normCol) ||
        (docId && ws.subscriptions.has(`${normCol}:${docId}`)) ||
        ws.user.role === 'admin' ||
        ws.user.role === 'developer'
      ) {
        try {
          ws.send(outgoingMsg);
        } catch (err) {
          // ignore error
        }
      }
    });
  }

  public async close(): Promise<void> {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.unlistenPg) await this.unlistenPg();
    if (this.wss) {
      this.wss.close();
    }
  }
}
