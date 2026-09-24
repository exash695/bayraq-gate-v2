export interface SavedAccessCodeItem {
  code: string;
  role?: string;
  schoolId?: string;
  schoolName?: string;
  studentName?: string;
  lastUsed: number;
}

const STORAGE_KEY = 'bairaq_saved_access_codes';

export function detectRoleFromCode(code: string): { id: string; label: string; icon: string } {
  const clean = (code || '').trim().toUpperCase();
  if (clean.startsWith('ADM-') || clean === '112233') {
    return { id: 'admin', label: 'بوابة الإدارة', icon: '👑' };
  }
  if (clean.startsWith('TCH-')) {
    return { id: 'teacher', label: 'بوابة الأستاذ', icon: '👨‍🏫' };
  }
  if (clean.startsWith('PAR-') || clean.startsWith('PCODE-')) {
    return { id: 'parent', label: 'بوابة الوالدين', icon: '🛡️' };
  }
  if (clean.startsWith('DRI-') || clean.startsWith('DRV-') || /^\d{6}$/.test(clean)) {
    return { id: 'driver', label: 'بوابة السائق', icon: '🚌' };
  }
  return { id: 'student', label: 'بوابة الطالب', icon: '🎓' };
}

export function getSavedAccessCodes(schoolIdOrName?: string): SavedAccessCodeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: SavedAccessCodeItem[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    // Sort by most recently used
    const sorted = [...list].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

    if (schoolIdOrName) {
      const cleanFilter = schoolIdOrName.trim().toLowerCase();
      // Prioritize matching school, but keep others accessible
      return sorted.sort((a, b) => {
        const matchA = (a.schoolId?.toLowerCase() === cleanFilter || a.schoolName?.toLowerCase().includes(cleanFilter)) ? 1 : 0;
        const matchB = (b.schoolId?.toLowerCase() === cleanFilter || b.schoolName?.toLowerCase().includes(cleanFilter)) ? 1 : 0;
        return matchB - matchA;
      });
    }

    return sorted;
  } catch (e) {
    return [];
  }
}

export function saveAccessCode(item: {
  code: string;
  role?: string;
  schoolId?: string;
  schoolName?: string;
  studentName?: string;
}): void {
  try {
    const cleanCode = (item.code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) return;

    const existing = getSavedAccessCodes();
    const roleInfo = detectRoleFromCode(cleanCode);

    const filtered = existing.filter((c) => c.code.toUpperCase() !== cleanCode);
    const newItem: SavedAccessCodeItem = {
      code: cleanCode,
      role: item.role || roleInfo.id,
      schoolId: item.schoolId,
      schoolName: item.schoolName,
      studentName: item.studentName,
      lastUsed: Date.now()
    };

    const updated = [newItem, ...filtered].slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save access code:', e);
  }
}

export function removeSavedAccessCode(codeToRemove: string): SavedAccessCodeItem[] {
  try {
    const clean = codeToRemove.trim().toUpperCase();
    const existing = getSavedAccessCodes();
    const updated = existing.filter((c) => c.code.toUpperCase() !== clean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}
