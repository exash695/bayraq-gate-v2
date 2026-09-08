const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

async function run() {
  const res = await pool.query("SELECT * FROM support_tickets ORDER BY timestamp DESC LIMIT 5");
  console.log(res.rows);
  process.exit(0);
}
run();
