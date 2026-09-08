import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_outbox (
      id varchar(128) PRIMARY KEY NOT NULL,
      school_id varchar(128),
      title text,
      message text,
      type varchar(50),
      target_role varchar(50),
      count integer DEFAULT 0,
      ref_ids jsonb,
      broadcast_id varchar(128),
      timestamp timestamp DEFAULT now(),
      created_at timestamp DEFAULT now()
    );
  `;
  console.log("Table created!");
  process.exit(0);
}

main().catch(console.error);
