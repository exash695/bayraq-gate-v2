import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = postgres(connectionString);

async function seed() {
  try {
    const schoolId = "school_awail_ghamas";
    
    console.log("Seeding school...");
    await sql`
      INSERT INTO schools (id, name, governorate, status)
      VALUES (${schoolId}, 'ثانوية اوائل غماس الاهلية', 'الديوانية - غماس', 'active')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
    
    console.log("Seeding activation code...");
    await sql`
      INSERT INTO activation_codes (id, code, school_id, role, used)
      VALUES ('ACT_MASTER_G', 'ADM-G-MASTER', ${schoolId}, 'admin', false)
      ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code
    `;
    
    console.log("Seeded successfully!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await sql.end();
  }
}

seed();
