const admin = require('firebase-admin');
admin.initializeApp();
async function run() {
  const db = admin.firestore();
  const doc = await db.collection('system_settings').doc('bairaq_poses').get();
  console.log("system_settings/bairaq_poses:", doc.data());
  const doc2 = await db.collection('system_config').doc('bairaq_poses').get();
  console.log("system_config/bairaq_poses:", doc2.data());
}
run().catch(console.error);
