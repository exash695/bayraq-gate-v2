import { db, sql as sqlRaw } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE recorded_lessons ADD COLUMN views integer DEFAULT 0;`);
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
}
run();
