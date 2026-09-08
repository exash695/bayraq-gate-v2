import { db, sql as sqlRaw } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN title text;`);
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN size varchar(50);`);
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN downloads integer DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN tag varchar(100);`);
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN subject varchar(100);`);
    await db.execute(sql`ALTER TABLE school_files ADD COLUMN grade varchar(50);`);
    
    await db.execute(sql`ALTER TABLE recorded_lessons ADD COLUMN subject varchar(100);`);
    await db.execute(sql`ALTER TABLE recorded_lessons ADD COLUMN duration varchar(50);`);
    await db.execute(sql`ALTER TABLE recorded_lessons ADD COLUMN date varchar(50);`);
    await db.execute(sql`ALTER TABLE recorded_lessons ADD COLUMN description text;`);
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
}
run();
