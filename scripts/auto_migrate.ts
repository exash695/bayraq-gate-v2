
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const firebaseApp = initializeApp(config);
const firestore = getFirestore(firebaseApp);

async function migrate() {
  console.log("🚀 Starting automated data migration...");
  
  const sql = postgres(process.env.DATABASE_URL as string);
  const db = drizzle(sql, { schema });

  try {
    // Migrate Schools
    console.log("Fetching schools from Firestore...");
    const schoolSnap = await getDocs(collection(firestore, "schools"));
    const schoolsData = schoolSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (schoolsData.length > 0) {
      console.log(`Syncing ${schoolsData.length} schools...`);
      for (const s of schoolsData) {
        await db.insert(schema.schools).values({
          id: s.id,
          name: (s as any).name || 'Unknown',
          governorate: (s as any).governorate || '',
          activationCode: (s as any).activationCode || '',
          status: (s as any).status || 'active',
        }).onConflictDoUpdate({
          target: schema.schools.id,
          set: {
            name: (s as any).name || 'Unknown',
            governorate: (s as any).governorate || '',
            status: (s as any).status || 'active'
          }
        });
      }
      console.log("✅ Schools synced.");
    }

    // Migrate Activation Codes
    console.log("Fetching activation codes...");
    const codeSnap = await getDocs(collection(firestore, "activation_codes"));
    const codesData = codeSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    if (codesData.length > 0) {
      console.log(`Syncing ${codesData.length} codes...`);
      for (const c of codesData) {
        await db.insert(schema.activation_codes).values({
          id: c.id,
          code: (c as any).code,
          schoolId: (c as any).schoolId || null,
          used: (c as any).used || false,
          usedBy: (c as any).usedBy || null,
        }).onConflictDoUpdate({
          target: schema.activation_codes.id,
          set: {
            used: (c as any).used || false,
            usedBy: (c as any).usedBy || null
          }
        });
      }
      console.log("✅ Activation codes synced.");
    }

    console.log("🎉 Migration finished successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

migrate();
