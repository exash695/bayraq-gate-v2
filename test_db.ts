import { sql as drizzleSql } from 'drizzle-orm';
import { db } from './src/db';

(async () => {
  try {
    const res = await db.execute(drizzleSql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND is_nullable = 'NO' AND column_default IS NULL;
    `);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
