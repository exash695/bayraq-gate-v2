import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function setup() {
  try {
    console.log('Creating audit_logs table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        target_id VARCHAR(128),
        target_name VARCHAR(255),
        target_type VARCHAR(50),
        school_id VARCHAR(128),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
