import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function setup() {
  try {
    console.log('Setting up idea_bank and council_polls tables...');
    
    // Check and create idea_bank
    await sql`
      CREATE TABLE IF NOT EXISTS idea_bank (
        id VARCHAR(128) PRIMARY KEY,
        school_id VARCHAR(128),
        user_id VARCHAR(128),
        sender_name VARCHAR(255),
        title TEXT NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        admin_reply TEXT,
        target_grade VARCHAR(50),
        read_by_parent BOOLEAN DEFAULT FALSE,
        votes INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;

    // Check and create council_polls
    await sql`
      CREATE TABLE IF NOT EXISTS council_polls (
        id VARCHAR(128) PRIMARY KEY,
        school_id VARCHAR(128),
        title TEXT NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'admin',
        author_id VARCHAR(128),
        author_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        admin_reply TEXT,
        votes JSONB DEFAULT '{}',
        comments JSONB DEFAULT '[]',
        target_grade VARCHAR(50),
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
