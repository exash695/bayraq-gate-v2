import { db } from '../lib/firebase';
import { doc, deleteDoc, getDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';

export const staffService = {
  deleteTeacher: async (teacherId: string) => {
    const teacherRef = doc(db, 'teachers', teacherId);
    const snap = await getDoc(teacherRef);
    if (!snap.exists()) return;
    const teacherData = snap.data();
    const uid = teacherData.uid;

    const batch = writeBatch(db);
    batch.delete(teacherRef);

    // If teacher has a linked user account (by uid), delete it
    if (uid) {
      const usersQ = query(collection(db, 'users'), where('uid', '==', uid));
      const usersSnap = await getDocs(usersQ);
      usersSnap.forEach(udoc => batch.delete(udoc.ref));
    }
    
    await batch.commit();
  }
};
