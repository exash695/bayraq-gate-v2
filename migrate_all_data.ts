import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import postgres from "postgres";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));

if (getApps().length === 0) {
  initializeApp({
    projectId: config.projectId,
  });
}

const fdb = getFirestore(config.firestoreDatabaseId);
const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log("Starting migration from Firestore...");
    
    // 1. Sync Schools
    console.log("Syncing Schools...");
    const schoolsSnap = await fdb.collection("schools").get();
    for (const doc of schoolsSnap.docs) {
      const data = doc.data();
      await sql`
        INSERT INTO schools (id, name, governorate, status)
        VALUES (${doc.id}, ${data.name || 'Unnamed'}, ${data.governorate || ''}, ${data.status || 'active'})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, governorate = EXCLUDED.governorate
      `;
    }
    console.log(`Synced ${schoolsSnap.size} schools.`);

    // 2. Sync Activation Codes
    console.log("Syncing Activation Codes...");
    const codesSnap = await fdb.collection("activation_codes").get();
    for (const doc of codesSnap.docs) {
      const data = doc.data();
      await sql`
        INSERT INTO activation_codes (id, code, school_id, role, used)
        VALUES (${doc.id}, ${data.code}, ${data.schoolId || data.school_id}, ${data.role || 'student'}, ${!!data.used})
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, role = EXCLUDED.role
      `;
    }
    console.log(`Synced ${codesSnap.size} activation codes.`);

    // 3. Sync Students
    console.log("Syncing Students...");
    const studentsSnap = await fdb.collection("school_students").get(); // Firestore collection name might be different
    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      await sql`
        INSERT INTO students (id, name, code, parent_code, school_id, grade, section)
        VALUES (${doc.id}, ${data.name || data.fullName || 'Unnamed'}, ${data.code || ''}, ${data.parentCode || ''}, ${data.schoolId || ''}, ${data.grade || ''}, ${data.section || ''})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, parent_code = EXCLUDED.parent_code
      `;
    }
    console.log(`Synced ${studentsSnap.size} students.`);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

migrate();
