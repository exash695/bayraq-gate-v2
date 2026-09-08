import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS salaries (
        id VARCHAR(128) PRIMARY KEY,
        staff_id VARCHAR(128),
        staff_name TEXT,
        month VARCHAR(20),
        base_salary INTEGER DEFAULT 0,
        rewards INTEGER DEFAULT 0,
        deductions INTEGER DEFAULT 0,
        net_salary INTEGER DEFAULT 0,
        is_paid BOOLEAN DEFAULT FALSE,
        payment_date TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✅ Salaries table created successfully");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
