const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const res = await sql`SELECT id, status, description FROM payment_requests ORDER BY created_at DESC LIMIT 5`;
  console.log(res);
}
run();
