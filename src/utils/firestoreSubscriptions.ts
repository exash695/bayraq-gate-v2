import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import React from 'react';

export const subscribeMultiQuery = (
  collectionName: string,
  safeSchoolId: string,
  cleanSchoolName: string,
  setData: (data: any[]) => void,
  onUpdate?: () => void,
  enforceSchoolConstraint: boolean = true
) => {
  console.log(`[FirestoreSub] Subscribing to: ${collectionName}, enforceSchoolConstraint=${enforceSchoolConstraint}`);
  
  const q = collection(db, collectionName);
  
  return onSnapshot(q, 
    (snapshot) => {
      let docs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      if (enforceSchoolConstraint) {
        const normalizeFuzzy = (str: string) => {
          if (!str) return '';
          return str
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/[ىي]/g, 'ي')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
        };

        const filterSchoolId = String(safeSchoolId || '').trim().toLowerCase();
        const filterSchoolName = String(cleanSchoolName || '').trim();
        const normalizedFilter = normalizeFuzzy(filterSchoolName);
        
        if (filterSchoolId && filterSchoolId !== 'all' && filterSchoolId !== 'unassigned') {
          docs = docs.filter(doc => {
            const docSchoolId = String(doc.schoolId || doc.school_id || '').trim().toLowerCase();
            const docSchoolName = String(doc.schoolName || doc.school || doc.academyName || '').trim();
            const normalizedDoc = normalizeFuzzy(docSchoolName);
            
            // Match if either schoolId matches or schoolName merges fuzzily
            if (docSchoolId === filterSchoolId) return true;
            if (normalizedFilter && normalizedDoc === normalizedFilter) return true;
            
            // Fallback for docs without schoolId to fuzzy school name check
            if (!docSchoolId && normalizedFilter && (normalizedDoc.includes(normalizedFilter) || normalizedFilter.includes(normalizedDoc))) {
              return true;
            }
            
            return false;
          });
        }
      }
      
      console.log(`[FirestoreSub] ${collectionName} loaded ${docs.length} documents for school=${safeSchoolId}`);
      setData(docs);
      if (onUpdate) onUpdate();
    }, 
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    }
  );
};
