import { sql } from './src/db/index.js';
async function main() {
  try {
    await sql`ALTER TABLE "school_files" ADD COLUMN IF NOT EXISTS "section" varchar(100)`;
    console.log("Success!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
