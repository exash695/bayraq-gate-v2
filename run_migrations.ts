import { sql } from './src/db/index';

async function migrate() {
    try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_post boolean DEFAULT true;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_comment boolean DEFAULT true;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id varchar(255);`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamp;`;

        await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;`;
        await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS can_post boolean DEFAULT true;`;
        await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS can_comment boolean DEFAULT true;`;
        await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS device_id varchar(255);`;
        await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_login timestamp;`;

        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS can_post boolean DEFAULT true;`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS can_comment boolean DEFAULT true;`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS device_id varchar(255);`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login timestamp;`;
        console.log('Migrations executed successfully!');
    } catch (e) {
        console.error('Error executing migrations', e);
    } finally {
        process.exit(0);
    }
}

migrate();
