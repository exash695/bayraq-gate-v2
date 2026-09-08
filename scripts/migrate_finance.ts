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
  console.log("🚀 Starting Financial data migration...");
  
  const sql = postgres(process.env.DATABASE_URL as string);
  const db = drizzle(sql, { schema });

  try {
    // 1. Migrate Student Transactions
    console.log("Fetching student transactions...");
    const txSnap = await getDocs(collection(firestore, "student_transactions"));
    const txData = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (txData.length > 0) {
      console.log(`Syncing ${txData.length} transactions...`);
      for (const t of (txData as any)) {
        await db.insert(schema.student_transactions).values({
          id: t.id,
          studentId: t.studentId || null,
          schoolId: t.schoolId || null,
          amount: t.amount || 0,
          note: t.note || '',
          method: t.method || 'cash',
          adminName: t.adminName || 'Admin',
        }).onConflictDoUpdate({
          target: schema.student_transactions.id,
          set: { amount: t.amount }
        });
      }
      console.log("✅ Transactions synced.");
    }

    // 2. Migrate Payment Requests
    console.log("Fetching payment requests...");
    const reqSnap = await getDocs(collection(firestore, "payment_requests"));
    const reqData = reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (reqData.length > 0) {
      console.log(`Syncing ${reqData.length} requests...`);
      for (const r of (reqData as any)) {
        await db.insert(schema.payment_requests).values({
          id: r.id,
          schoolId: r.schoolId || null,
          requesterId: r.studentId || r.requesterId || null,
          amount: r.amount || 0,
          description: r.description || r.transactionNote || '',
          status: r.status || 'pending',
        }).onConflictDoUpdate({
          target: schema.payment_requests.id,
          set: { status: r.status }
        });
      }
      console.log("✅ Payment requests synced.");
    }

    // 3. Migrate Salaries
    console.log("Fetching salaries...");
    const salSnap = await getDocs(collection(firestore, "salaries"));
    const salData = salSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (salData.length > 0) {
      console.log(`Syncing ${salData.length} salaries...`);
      for (const s of (salData as any)) {
        await db.insert(schema.salaries).values({
          id: s.id,
          staffId: s.staffId || null,
          staffName: s.staffName || '',
          month: s.month || '',
          baseSalary: s.baseSalary || 0,
          rewards: s.rewards || 0,
          deductions: s.deductions || 0,
          netSalary: s.netSalary || 0,
          isPaid: s.isPaid || false,
          paymentDate: s.paymentDate ? new Date(s.paymentDate) : null,
        }).onConflictDoUpdate({
          target: schema.salaries.id,
          set: { netSalary: s.netSalary }
        });
      }
      console.log("✅ Salaries synced.");
    }

    console.log("🎉 Financial Migration finished successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

migrate();
