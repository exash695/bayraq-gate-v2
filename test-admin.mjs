import admin from "firebase-admin";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

admin.initializeApp({
  projectId: config.projectId,
  credential: admin.credential.applicationDefault()
});

async function run() {
  try {
    // In newer admin sdk, databaseId can be passed, or we can use admin.firestore(app, databaseId)
    // Actually the v11+ syntax is getFirestore(app, databaseId) from firebase-admin/firestore
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore(admin.app(), config.firestoreDatabaseId);
    const snapshot = await db.collection('test').limit(1).get();
    console.log("Success:", snapshot.size);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
