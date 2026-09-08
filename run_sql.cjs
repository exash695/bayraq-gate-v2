const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  await sql`
  CREATE TABLE IF NOT EXISTS "lounge_messages" (
    "id" varchar(128) PRIMARY KEY NOT NULL,
    "school_id" varchar(128),
    "user_id" varchar(128) NOT NULL,
    "user_name" text,
    "user_role" varchar(50),
    "recipient_id" varchar(128),
    "text" text NOT NULL,
    "image_url" text,
    "read" boolean DEFAULT false,
    "timestamp" timestamp DEFAULT now()
  );`;
  console.log("lounge_messages table created successfully!");
}

run().catch(console.error);
