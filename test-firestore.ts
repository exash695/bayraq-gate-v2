import "dotenv/config";
import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
async function run() {
  const d1 = await getDoc(doc(db, 'system_settings', 'bairaq_poses'));
  console.log("system_settings/bairaq_poses:", d1.data());
}
run().catch(console.error);
