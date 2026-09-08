import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function setup() {
  try {
    console.log('Updating support_tickets table...');
    
    // Check and create/update support_tickets
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id VARCHAR(128) PRIMARY KEY,
        school_id VARCHAR(128),
        user_id VARCHAR(128),
        student_name TEXT,
        grade VARCHAR(50),
        issue_type TEXT,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_group BOOLEAN DEFAULT FALSE,
        admin_reply TEXT,
        role VARCHAR(50),
        broadcast_id VARCHAR(128),
        sender_type VARCHAR(50),
        read_by_admin BOOLEAN DEFAULT FALSE,
        read_by_student BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;

    // Add missing columns if table already existed with old schema
    // Subject/Description were the old ones, let's keep them as null or just add the new ones
    // We use "IF NOT EXISTS" column additions if postgres supported it directly, but we'll do it manually if needed.
    // For AI Studio environment, usually we can just recreate or alter.
    
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets';
    `;
    
    const existingColumns = columns.map(c => c.column_name);
    
    if (!existingColumns.includes('student_name')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN student_name TEXT;`;
    }
    if (!existingColumns.includes('grade')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN grade VARCHAR(50);`;
    }
    if (!existingColumns.includes('issue_type')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN issue_type TEXT;`;
    }
    if (!existingColumns.includes('message')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN message TEXT;`;
    }
    if (!existingColumns.includes('is_group')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN is_group BOOLEAN DEFAULT FALSE;`;
    }
    if (!existingColumns.includes('admin_reply')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN admin_reply TEXT;`;
    }
    if (!existingColumns.includes('role')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN role VARCHAR(50);`;
    }
    if (!existingColumns.includes('broadcast_id')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN broadcast_id VARCHAR(128);`;
    }
    if (!existingColumns.includes('sender_type')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN sender_type VARCHAR(50);`;
    }
    if (!existingColumns.includes('read_by_admin')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN read_by_admin BOOLEAN DEFAULT FALSE;`;
    }
    if (!existingColumns.includes('read_by_student')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN read_by_student BOOLEAN DEFAULT FALSE;`;
    }
    if (!existingColumns.includes('timestamp')) {
      await sql`ALTER TABLE support_tickets ADD COLUMN timestamp TIMESTAMP DEFAULT NOW();`;
    }

    console.log('Update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
