import { collection, onSnapshot } from '../lib/firebase';
import { db } from '../lib/firebase';
import { safeStorage } from '../lib/storage';

export const normalizeFuzzyArabic = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/(مدرسة|ثانوية|متوسطة|ابتدائية|اعدادية|كلية|الأهلية|الاهلية|للبنين|للبنات|المختلطة)/g, '')
    .replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '')
    .trim()
    .toLowerCase();
};

const subCache = new Map<string, { docs: any[]; fingerprint: string }>();

export const getCachedSubscriptionData = (collectionName: string, safeSchoolId: string): any[] => {
  const cacheKey = `${collectionName}_${safeSchoolId || 'all'}`;
  if (subCache.has(cacheKey)) {
    return subCache.get(cacheKey)!.docs;
  }
  try {
    const stored = safeStorage.getItem(`s6_sub_${cacheKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      subCache.set(cacheKey, { docs: parsed, fingerprint: String(parsed.length) });
      return parsed;
    }
  } catch {}
  return [];
};

export const subscribeMultiQuery = (
  collectionName: string,
  safeSchoolId: string,
  cleanSchoolName: string,
  setData: (data: any[]) => void,
  onUpdate?: () => void,
  enforceSchoolConstraint: boolean = true
) => {
  const cacheKey = `${collectionName}_${safeSchoolId || 'all'}`;

  // 1. Synchronously emit cached data immediately (0ms blank/loading state)
  const cached = getCachedSubscriptionData(collectionName, safeSchoolId);
  if (cached && cached.length > 0) {
    setData(cached);
  }

  const q = collection(db, collectionName);
  
  return onSnapshot(q, 
    (snapshot) => {
      let docs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      if (enforceSchoolConstraint) {
        const filterSchoolId = String(safeSchoolId || '').trim().toLowerCase();
        const filterSchoolName = String(cleanSchoolName || '').trim();
        const normalizedFilter = normalizeFuzzyArabic(filterSchoolName);
        
        if (filterSchoolId && filterSchoolId !== 'all' && filterSchoolId !== 'unassigned') {
          docs = docs.filter(doc => {
            const docSchoolId = String(doc.schoolId || doc.school_id || '').trim().toLowerCase();
            const docSchoolName = String(doc.schoolName || doc.school || doc.academyName || '').trim();
            const normalizedDoc = normalizeFuzzyArabic(docSchoolName);
            
            // 1. Direct schoolId match (Highest priority)
            if (docSchoolId && filterSchoolId && docSchoolId === filterSchoolId) return true;
            
            // 2. Exact raw school name match (High priority)
            if (filterSchoolName && docSchoolName && filterSchoolName.trim() === docSchoolName.trim()) {
              return true;
            }

            // 3. Exact normalized Arabic school name match
            if (normalizedFilter && normalizedDoc && normalizedDoc === normalizedFilter) {
              return true;
            }

            // 4. Cross-containment in schoolId (Only if IDs are significant)
            if (docSchoolId && filterSchoolId && docSchoolId.length > 4 && filterSchoolId.length > 4) {
                if (docSchoolId.includes(filterSchoolId) || filterSchoolId.includes(docSchoolId)) {
                    return true;
                }
            }
            
            // 5. Fallback for legacy docs without schoolId (more restrictive)
            if (!docSchoolId && normalizedFilter && normalizedFilter.length > 8) {
              if (normalizedDoc.includes(normalizedFilter) || normalizedFilter.includes(normalizedDoc)) {
                return true;
              }
            }
            
            return false;
          });
        }
      }

      // Fingerprint to avoid unnecessary re-renders when data hasn't changed
      // Simple length/first/last check fails when internal properties update.
      let updateHash = '';
      if (docs.length < 500) {
        updateHash = JSON.stringify(docs);
      } else {
        updateHash = docs.map(d => `${d.id}:${d.updatedAt || ''}:${d.isBanned || ''}:${d.canPost || ''}:${d.canComment || ''}`).join(',');
      }
      const fingerprint = `${docs.length}_${updateHash}`;
      const existing = subCache.get(cacheKey);

      if (!existing || existing.fingerprint !== fingerprint || existing.docs.length !== docs.length) {
        subCache.set(cacheKey, { docs, fingerprint });
        try {
          if (docs.length < 500) {
            safeStorage.setItem(`s6_sub_${cacheKey}`, JSON.stringify(docs));
          }
        } catch {}
        setData(docs);
        if (onUpdate) onUpdate();
      }
    }, 
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    }
  );
};

