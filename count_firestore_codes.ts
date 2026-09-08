
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function countCodes() {
  const snap = await getDocs(collection(db, 'activation_codes'));
  console.log(`Firestore Activation Codes: ${snap.size}`);
  process.exit(0);
}

countCodes().catch(err => {
  console.error(err);
  process.exit(1);
});
