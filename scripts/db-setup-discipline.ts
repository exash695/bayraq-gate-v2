import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function setup() {
  try {
    console.log('Creating discipline tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id VARCHAR(128) PRIMARY KEY,
        student_id VARCHAR(128) NOT NULL,
        school_id VARCHAR(128) NOT NULL,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL,
        period VARCHAR(50),
        reason TEXT,
        recorded_by TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS behavior_logs (
        id VARCHAR(128) PRIMARY KEY,
        student_id VARCHAR(128) NOT NULL,
        school_id VARCHAR(128) NOT NULL,
        type VARCHAR(50) NOT NULL,
        points INTEGER NOT NULL,
        action TEXT,
        note TEXT,
        recorded_by TEXT,
        date VARCHAR(20) NOT NULL,
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
