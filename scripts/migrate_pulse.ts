
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
  console.log("🚀 Starting Pulse data migration...");
  
  const sql = postgres(process.env.DATABASE_URL as string);
  const db = drizzle(sql, { schema });

  try {
    // 1. Migrate Community Posts
    console.log("Fetching community posts...");
    const postSnap = await getDocs(collection(firestore, "community_posts"));
    const postsData = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (postsData.length > 0) {
      console.log(`Syncing ${postsData.length} posts...`);
      for (const p of (postsData as any)) {
        await db.insert(schema.community_posts).values({
          id: p.id,
          schoolId: p.schoolId || null,
          userId: p.userId || 'unknown',
          userName: p.userName || 'Unknown',
          content: p.content || '',
          mediaUrl: p.mediaUrl || null,
          type: p.type || 'student',
          grade: p.grade || null,
          isPinned: p.isPinned || false,
          isLocked: p.isLocked || false,
          reportsCount: p.reportsCount || 0,
          likesCount: (p.likes?.length || 0),
          commentsCount: (p.comments || 0),
        }).onConflictDoUpdate({
          target: schema.community_posts.id,
          set: { content: p.content }
        });
      }
      console.log("✅ Community posts synced.");
    }

    // 2. Migrate Support Tickets
    console.log("Fetching support tickets...");
    const ticketSnap = await getDocs(collection(firestore, "support_tickets"));
    const ticketsData = ticketSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (ticketsData.length > 0) {
      console.log(`Syncing ${ticketsData.length} tickets...`);
      for (const t of (ticketsData as any)) {
        await db.insert(schema.support_tickets).values({
          id: t.id,
          schoolId: t.schoolId || null,
          userId: t.userId || 'unknown',
          studentName: t.studentName || t.userName || 'Unknown',
          grade: t.grade || '',
          issueType: t.issueType || t.subject || 'general',
          message: t.message || t.description || '',
          status: t.status || 'pending',
          isGroup: t.isGroup || false,
          adminReply: t.adminReply || null,
          role: t.role || 'student',
          broadcastId: t.broadcastId || null,
          senderType: t.senderType || 'student',
          readByAdmin: t.readByAdmin || false,
          readByStudent: t.readByStudent || false,
          timestamp: t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp ? new Date(t.timestamp) : new Date())
        }).onConflictDoUpdate({
          target: schema.support_tickets.id,
          set: { 
            status: t.status || 'pending',
            adminReply: t.adminReply || null,
            readByAdmin: t.readByAdmin || false,
            readByStudent: t.readByStudent || false
          }
        });
      }
      console.log("✅ Support tickets synced.");
    }

    // 3. Migrate Notifications (admin_outbox)
    console.log("Fetching admin outbox...");
    const notifSnap = await getDocs(collection(firestore, "admin_outbox"));
    const notifsData = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (notifsData.length > 0) {
      console.log(`Syncing ${notifsData.length} notifications...`);
      for (const n of (notifsData as any)) {
        await db.insert(schema.notifications).values({
          id: n.id,
          schoolId: n.schoolId || null,
          recipientId: n.recipientGrade || 'all',
          title: n.title || 'No Title',
          body: n.body || '',
          type: 'alert',
        }).onConflictDoUpdate({
          target: schema.notifications.id,
          set: { title: n.title || 'No Title' }
        });
      }
      console.log("✅ Notifications synced.");
    }

    console.log("🎉 Pulse Migration finished successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

migrate();
