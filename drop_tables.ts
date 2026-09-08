import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`DROP TABLE IF EXISTS students CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS schools CASCADE;`);
  console.log("Tables dropped");
  process.exit(0);
}
main();
