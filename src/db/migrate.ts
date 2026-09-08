import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  console.log("Starting migration...");
  // Need to bypass ssl strict if needed
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "src/db/migrations" });
  
  console.log("Migration completed.");
  await sql.end();
  process.exit(0);
}
main().catch(err => {
  console.error("Migration failed", err);
  process.exit(1);
});
