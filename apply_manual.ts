import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}
const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log('Running manual migration...');
  await sql`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`;
  console.log('Done!');
  process.exit(0);
}
run().catch(err => {
  console.error(err);
  process.exit(1);
});
