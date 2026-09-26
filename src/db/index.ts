import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Create the connection string from env
const connectionString = process.env.DATABASE_URL;

function createMockDb(): any {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  const createChainable = (resolvedValue: any = []): any => {
    let proxy: any;
    const fn: any = (..._args: any[]) => proxy;
    fn.then = (resolve: any, reject?: any) => Promise.resolve(resolvedValue).then(resolve, reject);
    fn.catch = (reject: any) => Promise.resolve(resolvedValue).catch(reject);
    fn.finally = (cb: any) => Promise.resolve(resolvedValue).finally(cb);
    
    proxy = new Proxy(fn, {
      get(target, prop) {
        if (prop === 'then') return target.then;
        if (prop === 'catch') return target.catch;
        if (prop === 'finally') return target.finally;
        if (prop === Symbol.iterator || prop === Symbol.asyncIterator) return undefined;
        return (..._args: any[]) => proxy;
      },
      apply(target, thisArg, args) {
        return proxy;
      }
    });
    return proxy;
  };

  const rootProxy: any = new Proxy({}, {
    get(_, prop) {
      if (prop === 'query') {
        return new Proxy({}, {
          get: () => noOp
        });
      }
      return (...args: any[]) => createChainable([]);
    }
  });

  return rootProxy;
}

function createMockSql(): any {
  const mockSql: any = (...args: any[]) => Promise.resolve([]);
  mockSql.unsafe = (...args: any[]) => Promise.resolve([]);
  mockSql.listen = async () => async () => {};
  return mockSql;
}

let client: any;
let dbInstance: any;

export async function withDbRetry<T>(operation: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err?.cause?.message || err || '').toLowerCase();
      const isConnectionDrop = 
        msg.includes('econnreset') ||
        msg.includes('connection terminated') ||
        msg.includes('connection closed') ||
        msg.includes('connection reset') ||
        msg.includes('etimedout') ||
        msg.includes('econnrefused') ||
        msg.includes('broken pipe') ||
        err?.code === 'ECONNRESET' ||
        err?.cause?.code === 'ECONNRESET';

      if (isConnectionDrop && attempt < retries) {
        console.warn(`[Database Retry] Transient connection error (${msg}), retrying attempt ${attempt + 1}/${retries}...`);
        await new Promise(res => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

if (connectionString) {
  try {
    // High-concurrency tuned pool: default 50 connections instead of 15
    const maxConnections = process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 50;
    const idleTimeout = process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 30;
    const connectTimeout = process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10) : 10;

    client = postgres(connectionString, {
      prepare: false,
      max: maxConnections,
      idle_timeout: idleTimeout,
      connect_timeout: connectTimeout,
      max_lifetime: 60 * 30, // 30 minutes lifetime
      keep_alive: 10,
      onnotice: () => {}, // suppress server notices
    });
    dbInstance = drizzle(client, { schema });
  } catch (err) {
    console.warn('[AI Studio] Database connection error — falling back to mock:', err);
    client = createMockSql();
    dbInstance = createMockDb();
  }
} else {
  console.warn('[AI Studio] DATABASE_URL not configured — using mock database');
  client = createMockSql();
  dbInstance = createMockDb();
}

export const sql = client;
export const db = dbInstance;

