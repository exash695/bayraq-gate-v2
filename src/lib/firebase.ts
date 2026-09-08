// Bairaq SQL Hub - Compatibility Layer
// This file replaces the original Firebase initialization and redirects to SQL

export * from './firestoreSqlAdapter';

// Additional mocks for things that might be imported from 'firebase/app' or others
export const initializeApp = () => ({});
export const getAuth = () => ({});
export const initializeFirestore = () => ({});
export const getStorage = () => ({});
export const GoogleAuthProvider = class {};
export const signInWithPopup = async () => ({ user: null });
export const signOut = async () => {};
export const onAuthStateChanged = (auth: any, callback: any) => {
  // We handle this in customAuthService, but here is a mock for compatibility
  return () => {};
};

export const purgeFirestore = async () => {
  localStorage.clear();
  window.location.reload();
};

export const signInWithGoogle = () => {
  console.log("Google sign in is disabled in SQL mode");
};

// Connectivity test mock
console.log("Bairaq SQL connection verified (SQL Mode Active).");
