import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const videoBuffer = fs.readFileSync('public/mascot/sliced_bairaq_sheet3_captain_bairaq_guardian.mp4');
  const base64 = 'data:video/mp4;base64,' + videoBuffer.toString('base64');

  const chunkSize = 800000;
  const chunkCount = Math.ceil(base64.length / chunkSize);
  const chunks = [];
  for (let i = 0; i < chunkCount; i++) {
    chunks.push(base64.substring(i * chunkSize, (i + 1) * chunkSize));
  }

  console.log('New video size:', videoBuffer.length, 'bytes');
  console.log('Base64 length:', base64.length, 'Chunks:', chunkCount);

  for (let i = 0; i < chunkCount; i++) {
    for (const key of ['captain_bairaq_guardian', 'mayadeen_tab_bairaq', 'pose_dual_arena']) {
      await setDoc(doc(db, 'bairaq_pose_chunks', `${key}_${i}`), { data: chunks[i] });
    }
  }

  await setDoc(doc(db, 'system_settings', 'bairaq_poses'), {
    captain_bairaq_guardian: `CHUNKED:${chunkCount}`,
    mayadeen_tab_bairaq: `CHUNKED:${chunkCount}`,
    pose_dual_arena: `CHUNKED:${chunkCount}`
  }, { merge: true });

  console.log('Successfully updated Firestore with new re-encoded video chunks!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error updating Firestore:', err);
  process.exit(1);
});
