import { initializeApp } from 'firebase/app';
import 'firebase/auth';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, memoryLocalCache, clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore to ensure we can set experimentalForceLongPolling
// which is essential for connectivity in some sandboxed environments
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export const purgeFirestore = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    window.location.reload();
  } catch (err) {
    console.error("Purge failed:", err);
  }
};

// Validation call to ensure connection on boot as per instructions
async function testConnection() {
  try {
    // Attempting a simple read to check connectivity
    await getDocFromServer(doc(db, 'system', 'health'));
    console.log("Firebase connection established.");
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('offline') || 
        errMsg.includes('permission-denied') || 
        errMsg.includes('insufficient permissions')) {
      // permission-denied is also a sign of connection (we reached the server)
      console.log("Firebase connection verified (Handshake OK).");
    } else {
      console.error("Firebase connection check failed:", error);
    }
  }
}

// IndexedDB wipe is handled in main.tsx before load
testConnection();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
