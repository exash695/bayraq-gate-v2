import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Create the connection string from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in the environment variables');
}

// Configure high-performance Connection Pooling for PostgreSQL
const maxConnections = process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 25;
const idleTimeout = process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 30;
const connectTimeout = process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10) : 10;

// Disable prefetch as it is not supported for "Transaction" pool mode (often used in serverless/neon)
const client = postgres(connectionString, {
  prepare: false,
  max: maxConnections, // Maximum number of concurrent connections in pool
  idle_timeout: idleTimeout, // Idle connection timeout in seconds
  connect_timeout: connectTimeout, // Connect timeout in seconds
  max_lifetime: 60 * 30, // 30 minutes connection rotation to prevent stale connections
});

export const sql = client;
export const db = drizzle(client, { schema });
