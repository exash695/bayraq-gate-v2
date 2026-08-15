import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const BroadcastTabTest = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.warn("BroadcastTabTest error:", error));

    return () => unsubscribe();
  }, []);

  const handleDelete = async (brId: string) => {
    try {
      await deleteDoc(doc(db, 'broadcasts', brId));
      alert('✅ تم الحذف بنجاح');
    } catch (e) {
      console.error(e);
      alert('❌ تعذر حذف التبليغ: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <h2 className="text-xl font-bold mb-4">تبويب الإذاعة (إصلاح جذري)</h2>
      {history.map((br) => (
        <div key={br.id} className="p-4 mb-2 bg-gray-800 rounded-lg flex justify-between items-center">
          <p>{br.message}</p>
          <button
            onClick={() => handleDelete(br.id)}
            style={{ zIndex: 9999, position: 'relative' }}
            className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
