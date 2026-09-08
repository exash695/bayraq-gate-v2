
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR(128) PRIMARY KEY,
        school_id VARCHAR(128),
        user_id VARCHAR(128) NOT NULL,
        user_name TEXT,
        content TEXT NOT NULL,
        media_url TEXT,
        type VARCHAR(50) DEFAULT 'student',
        grade VARCHAR(50),
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        reports_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS community_comments (
        id VARCHAR(128) PRIMARY KEY,
        post_id VARCHAR(128) REFERENCES community_posts(id),
        user_id VARCHAR(128) NOT NULL,
        user_name TEXT,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✅ Tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
