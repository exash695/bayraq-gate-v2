import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { max: 1 });

async function run() {
  await sql`ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "reply_to_ticket_id" varchar(128);`;
  console.log('Migration reply done!');
  process.exit(0);
}
run();
