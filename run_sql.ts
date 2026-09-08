import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const content = fs.readFileSync("src/db/migrations/0004_shallow_morlun.sql", "utf-8");
  const statements = content.split("--> statement-breakpoint");
  for (const stmt of statements) {
    if (stmt.trim().length > 0) {
      try {
        await sql.unsafe(stmt.trim());
        console.log("Executed:", stmt.trim().substring(0, 50));
      } catch (e) {
        console.log("Skipping (probably already exists):", e.message);
      }
    }
  }
  await sql.end();
  process.exit(0);
}
main();
