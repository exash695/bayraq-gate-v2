import jsPDF from 'jspdf';

export const isArchivedList = (l: any): boolean => {
  if (!l) return false;
  if (typeof l === 'string') {
    const s = l.trim();
    return (
      s.includes('أرشيف') ||
      s.includes('ارشيف') ||
      s.includes('[أرشيف') ||
      s.includes('[ارشيف') ||
      s.toLowerCase().includes('archive')
    );
  }
  return Boolean(
    l.isArchive || 
    l.isArchived || 
    l.archived ||
    l.status === 'archived' ||
    (typeof l.name === 'string' && (
      l.name.includes('أرشيف') ||
      l.name.includes('ارشيف') ||
      l.name.includes('[أرشيف') ||
      l.name.includes('[ارشيف') ||
      l.name.toLowerCase().includes('archive')
    )) || 
    (typeof l.title === 'string' && (
      l.title.includes('أرشيف') ||
      l.title.includes('ارشيف') ||
      l.title.includes('[أرشيف') ||
      l.title.includes('[ارشيف') ||
      l.title.toLowerCase().includes('archive')
    )) || 
    (typeof l.grade === 'string' && (
      l.grade.includes('أرشيف') ||
      l.grade.includes('ارشيف') ||
      l.grade.includes('[أرشيف') ||
      l.grade.includes('[ارشيف') ||
      l.grade.toLowerCase().includes('archive')
    )) || 
    l.archiveYear
  );
};

export const SUBJECT_KEYWORDS: [string, string][] = [
  ['اسلام', 'ISL'],
  ['قرآن', 'QUR'],
  ['عرب', 'ARB'],
  ['انجليز', 'ENG'],
  ['انجليزي', 'ENG'],
  ['english', 'ENG'],
  ['رياضيات', 'MAT'],
  ['math', 'MAT'],
  ['كيمياء', 'CHE'],
  ['فيزياء', 'PHY'],
  ['احياء', 'BIO'],
  ['علوم', 'SCI'],
  ['science', 'SCI'],
  ['تاريخ', 'HIS'],
  ['جغراف', 'GEO'],
  ['اقتصاد', 'ECO'],
  ['اجتماع', 'SOC'],
  ['فني', 'ART'],
  ['رياض', 'SPO'],
  ['حاسوب', 'COM'],
  ['computer', 'COM'],
  ['فرنس', 'FRE'],
];

export const getSanitizedSubCode = (subject: string) => {
  const clean = subject
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/(?:^|\s)ال/g, ' ')
    .replace(/\s+/g, '');
  
  for (const [keyword, code] of SUBJECT_KEYWORDS) {
    if (clean.includes(keyword)) return code;
  }
  
  const hasArabic = /[\u0600-\u06FF]/.test(subject);
  if (!hasArabic && subject.length >= 2) {
    return subject.substring(0, 3).toUpperCase();
  }
  
  // Use first 3 letters of subject if no keyword match
  return subject.substring(0, 3).toUpperCase();
};

export const normalizeGradeName = (grade: string): string => {
  if (!grade) return '';
  const g = String(grade).trim();
  const upper = g.toUpperCase();
  
  // Direct prefix checks
  if (upper === 'P1' || upper === '1P' || upper === 'PRI1') return 'أول ابتدائي';
  if (upper === 'P2' || upper === '2P' || upper === 'PRI2') return 'ثاني ابتدائي';
  if (upper === 'P3' || upper === '3P' || upper === 'PRI3') return 'ثالث ابتدائي';
  if (upper === 'P4' || upper === '4P' || upper === 'PRI4') return 'رابع ابتدائي';
  if (upper === 'P5' || upper === '5P' || upper === 'PRI5') return 'خامس ابتدائي';
  if (upper === 'P6' || upper === '6P' || upper === 'PRI6') return 'سادس ابتدائي';
  
  if (upper === 'M1' || upper === '1M' || upper === 'INT1') return 'أول متوسط';
  if (upper === 'M2' || upper === '2M' || upper === 'INT2') return 'ثاني متوسط';
  if (upper === 'M3' || upper === '3M' || upper === 'INT3') return 'ثالث متوسط';
  
  if (upper === 'S4S' || upper === 'S4' || upper === '4S') return 'رابع علمي';
  if (upper === 'S4A' || upper === '4A') return 'رابع أدبي';
  if (upper === 'S5S' || upper === 'S5' || upper === '5S') return 'خامس علمي';
  if (upper === 'S5A' || upper === '5A') return 'خامس أدبي';
  if (upper === 'S6S' || upper === 'S6' || upper === '6S' || upper === 'SCI') return 'سادس علمي';
  if (upper === 'S6A' || upper === '6A' || upper === 'LIT') return 'سادس أدبي';

  const norm = normalizeArabicText(g);
  
  // Primary (أول - سادس ابتدائي)
  if (norm.includes('اولابتدائي') || norm.includes('1ابتدائي') || norm === 'صفاول' || norm === 'الصفالاول' || norm === 'الاول' || norm === 'اول') {
    if (!norm.includes('متوسط')) return 'أول ابتدائي';
  }
  if (norm.includes('ثانيابتدائي') || norm.includes('2ابتدائي') || norm === 'صفثاني' || norm === 'الصفالثاني' || norm === 'الثاني' || norm === 'ثاني') {
    if (!norm.includes('متوسط')) return 'ثاني ابتدائي';
  }
  if (norm.includes('ثالثابتدائي') || norm.includes('3ابتدائي') || norm === 'صفثالث' || norm === 'الصفالثالث' || norm === 'الثالث' || norm === 'ثالث') {
    if (!norm.includes('متوسط')) return 'ثالث ابتدائي';
  }
  if (norm.includes('رابعابتدائي') || norm.includes('4ابتدائي') || (norm.includes('رابع') && norm.includes('ابتدائي'))) return 'رابع ابتدائي';
  if (norm.includes('خامسابتدائي') || norm.includes('5ابتدائي') || (norm.includes('خامس') && norm.includes('ابتدائي'))) return 'خامس ابتدائي';
  if (norm.includes('سادسابتدائي') || norm.includes('6ابتدائي') || (norm.includes('سادس') && norm.includes('ابتدائي'))) return 'سادس ابتدائي';
  
  // Intermediate (أول - ثالث متوسط)
  if (norm.includes('اولمتوسط') || norm.includes('1متوسط') || (norm.includes('اول') && norm.includes('متوسط'))) return 'أول متوسط';
  if (norm.includes('ثانيمتوسط') || norm.includes('2متوسط') || (norm.includes('ثاني') && norm.includes('متوسط'))) return 'ثاني متوسط';
  if (norm.includes('ثالثمتوسط') || norm.includes('3متوسط') || (norm.includes('ثالث') && norm.includes('متوسط'))) return 'ثالث متوسط';
  
  // Secondary Scientific & Literary
  if (norm.includes('رابععلمي') || (norm.includes('رابع') && norm.includes('علمي'))) return 'رابع علمي';
  if (norm.includes('رابعادبي') || (norm.includes('رابع') && norm.includes('ادبي'))) return 'رابع أدبي';
  if (norm.includes('خامسعلمي') || (norm.includes('خامس') && norm.includes('علمي'))) return 'خامس علمي';
  if (norm.includes('خامسادبي') || (norm.includes('خامس') && norm.includes('ادبي'))) return 'خامس أدبي';
  if (norm.includes('سادسعلمي') || norm.includes('سادساحيائي') || norm.includes('سادستطبيقي') || (norm.includes('سادس') && norm.includes('علمي'))) return 'سادس علمي';
  if (norm.includes('سادسادبي') || (norm.includes('سادس') && norm.includes('ادبي'))) return 'سادس أدبي';
  
  if (norm.includes('ابتدائي') || norm.includes('ابتدائيه')) {
    if (norm.includes('1') || norm.includes('اول')) return 'أول ابتدائي';
    if (norm.includes('2') || norm.includes('ثاني')) return 'ثاني ابتدائي';
    if (norm.includes('3') || norm.includes('ثالث')) return 'ثالث ابتدائي';
    if (norm.includes('4') || norm.includes('رابع')) return 'رابع ابتدائي';
    if (norm.includes('5') || norm.includes('خامس')) return 'خامس ابتدائي';
    if (norm.includes('6') || norm.includes('سادس')) return 'سادس ابتدائي';
  }

  return grade;
};

export const normalizeArabicText = (text: string) => {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/(?:^|\s)ال/g, ' ')
    .replace(/\s+/g, '');
};

export const getGradeFromPrefix = (prefix: string): string => {
  if (!prefix) return '';
  const p = String(prefix).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  switch (p) {
    case 'P1': 
    case '1P':
      return 'أول ابتدائي';
    case 'P2': 
    case '2P':
      return 'ثاني ابتدائي';
    case 'P3': 
    case '3P':
      return 'ثالث ابتدائي';
    case 'P4': 
    case '4P':
      return 'رابع ابتدائي';
    case 'P5': 
    case '5P':
      return 'خامس ابتدائي';
    case 'P6': 
    case '6P':
      return 'سادس ابتدائي';
    case 'M1': 
    case '1M':
      return 'أول متوسط';
    case 'M2': 
    case '2M':
      return 'ثاني متوسط';
    case 'M3': 
    case '3M':
      return 'ثالث متوسط';
    case 'S4S': 
    case 'S4':
    case '4S':
      return 'رابع علمي';
    case 'S4A': 
    case '4A':
      return 'رابع أدبي';
    case 'S5S': 
    case 'S5':
    case '5S':
      return 'خامس علمي';
    case 'S5A': 
    case '5A':
      return 'خامس أدبي';
    case 'S6S': 
    case 'S6':
    case '6S':
    case 'SCI':
      return 'سادس علمي';
    case 'S6A': 
    case '6A':
    case 'LIT':
      return 'سادس أدبي';
    default: return '';
  }
};

export const getPrefixForGrade = (grade: string): string => {
  if (!grade) return 'STU';
  const g = String(grade).trim();
  const upper = g.toUpperCase();

  // Already standard code prefix
  if (/^P[1-6]$/.test(upper)) return upper;
  if (/^M[1-3]$/.test(upper)) return upper;
  if (/^S[4-6][SA]?$/.test(upper)) return upper;

  // English/numeric shorthand like 1M, 2M, 3M, M1, M2, M3, 1P...
  if (/^3\s*M$/i.test(g) || /^M\s*3$/i.test(g) || /^3\s*م$/i.test(g) || /^م\s*3$/i.test(g)) return 'M3';
  if (/^2\s*M$/i.test(g) || /^M\s*2$/i.test(g) || /^2\s*م$/i.test(g) || /^م\s*2$/i.test(g)) return 'M2';
  if (/^1\s*M$/i.test(g) || /^M\s*1$/i.test(g) || /^1\s*م$/i.test(g) || /^م\s*1$/i.test(g)) return 'M1';

  if (/^1\s*P$/i.test(g) || /^P\s*1$/i.test(g)) return 'P1';
  if (/^2\s*P$/i.test(g) || /^P\s*2$/i.test(g)) return 'P2';
  if (/^3\s*P$/i.test(g) || /^P\s*3$/i.test(g)) return 'P3';
  if (/^4\s*P$/i.test(g) || /^P\s*4$/i.test(g)) return 'P4';
  if (/^5\s*P$/i.test(g) || /^P\s*5$/i.test(g)) return 'P5';
  if (/^6\s*P$/i.test(g) || /^P\s*6$/i.test(g)) return 'P6';

  const s = g
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .toLowerCase();

  // Primary (P1-P6)
  if (s.includes('ابتدائ') || s.includes('ابتدائي')) {
    if (s.includes('اول') || s.includes('1')) return 'P1';
    if (s.includes('ثاني') || s.includes('2')) return 'P2';
    if (s.includes('ثالث') || s.includes('3')) return 'P3';
    if (s.includes('رابع') || s.includes('4')) return 'P4';
    if (s.includes('خامس') || s.includes('5')) return 'P5';
    if (s.includes('سادس') || s.includes('6')) return 'P6';
  }

  // Intermediate (M1-M3)
  if (s.includes('متوسط') || s.includes('اعدادي') || s.includes('مرحله متوسطه')) {
    if (s.includes('اول') || s.includes('1')) return 'M1';
    if (s.includes('ثاني') || s.includes('2')) return 'M2';
    if (s.includes('ثالث') || s.includes('3')) return 'M3';
  }

  // Secondary / Preparatory (S4-S6)
  if (s.includes('علمي') || s.includes('احيائي') || s.includes('تطبيقي')) {
    if (s.includes('رابع') || s.includes('4')) return 'S4S';
    if (s.includes('خامس') || s.includes('5')) return 'S5S';
    if (s.includes('سادس') || s.includes('6')) return 'S6S';
    return 'S6S';
  }
  if (s.includes('ادبي')) {
    if (s.includes('رابع') || s.includes('4')) return 'S4A';
    if (s.includes('خامس') || s.includes('5')) return 'S5A';
    if (s.includes('سادس') || s.includes('6')) return 'S6A';
    return 'S6A';
  }
  if (s.includes('ثانوي')) {
    if (s.includes('رابع') || s.includes('4')) return 'S4S';
    if (s.includes('خامس') || s.includes('5')) return 'S5S';
    if (s.includes('سادس') || s.includes('6')) return 'S6S';
  }

  // Normalized Arabic check
  const norm = normalizeArabicText(g);
  if (norm.includes('اولابتدائي') || norm === 'صفاول' || norm === 'الصفالاول' || norm === 'الاول' || norm === 'اول') return 'P1';
  if (norm.includes('ثانيابتدائي') || norm === 'صفثاني' || norm === 'الصفالثاني' || norm === 'الثاني' || norm === 'ثاني') return 'P2';
  if (norm.includes('ثالثابتدائي') || norm === 'صفثالث' || norm === 'الصفالثالث' || norm === 'الثالث' || norm === 'ثالث') return 'P3';
  if (norm.includes('رابعابتدائي') || (norm.includes('رابع') && norm.includes('ابتدائي'))) return 'P4';
  if (norm.includes('خامسابتدائي') || (norm.includes('خامس') && norm.includes('ابتدائي'))) return 'P5';
  if (norm.includes('سادسابتدائي') || (norm.includes('سادس') && norm.includes('ابتدائي'))) return 'P6';

  if (norm.includes('اولمتوسط')) return 'M1';
  if (norm.includes('ثانيمتوسط')) return 'M2';
  if (norm.includes('ثالثمتوسط')) return 'M3';

  if (norm.includes('رابععلمي')) return 'S4S';
  if (norm.includes('رابعادبي')) return 'S4A';
  if (norm.includes('خامسعلمي')) return 'S5S';
  if (norm.includes('خامسادبي')) return 'S5A';
  if (norm.includes('سادسعلمي')) return 'S6S';
  if (norm.includes('سادسادبي')) return 'S6A';

  return 'STU';
};

export const healStudentCodePrefix = (studentCode: string, grade: string): string => {
  if (!studentCode) return studentCode;
  const targetPrefix = getPrefixForGrade(grade);
  if (targetPrefix === 'STU') return studentCode.toUpperCase();
  
  const parts = studentCode.split('-');
  if (parts.length >= 3) {
    return `${targetPrefix}-${parts[1].toUpperCase()}-${parts.slice(2).join('-')}`;
  } else if (parts.length === 2) {
    return `${targetPrefix}-${parts[0].toUpperCase()}-${parts[1]}`;
  }
  return studentCode.toUpperCase();
};

export const getSubjectCode = (subject: string): string => {
  if (!subject) return 'GEN';
  const s = subject.trim();
  if (s.includes('دين') || s.includes('إسلامية')) return 'ISL';
  if (s.includes('عربي')) return 'ARB';
  if (s.includes('انجليزي') || s.includes('إنكليزي')) return 'ENG';
  if (s.includes('رياضيات')) return 'MAT';
  if (s.includes('فيزياء')) return 'PHY';
  if (s.includes('كيمياء')) return 'CHM';
  if (s.includes('أحياء') || s.includes('احياء')) return 'BIO';
  if (s.includes('تاريخ')) return 'HIS';
  if (s.includes('جغرافية')) return 'GEO';
  if (s.includes('اجتماعيات')) return 'SOC';
  if (s.includes('حاسوب')) return 'CMP';
  if (s.includes('علوم')) return 'SCI';
  if (s.includes('فنية')) return 'ART';
  if (s.includes('رياضة')) return 'SPO';
  if (s.includes('فرنسي')) return 'FRE';
  return 'GEN';
};

export const getStageFromGrade = (grade: string) => {
  if (!grade) return '';
  const g = grade.trim();
  if (g.includes('ابتدائي')) return 'primary';
  if (g.includes('متوسط')) return 'intermediate';
  if (g.includes('علمي') || g.includes('أدبي') || g.includes('إعدادي') || g.includes('اعدادي')) return 'preparatory';
  return '';
};

export const normalizeGradeCanonical = (raw: string): string => {
  if (!raw) return '';
  const s = raw
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/^(الصف|صف)\s+/g, '')
    .trim();

  // Primary
  if (s.includes('ابتدائي')) {
    if (s.includes('اول')) return 'الأول ابتدائي';
    if (s.includes('ثاني')) return 'الثاني ابتدائي';
    if (s.includes('ثالث')) return 'الثالث ابتدائي';
    if (s.includes('رابع')) return 'الرابع ابتدائي';
    if (s.includes('خامس')) return 'الخامس ابتدائي';
    if (s.includes('سادس')) return 'السادس ابتدائي';
    return 'المرحلة الابتدائية';
  }

  // Intermediate
  if (s.includes('متوسط')) {
    if (s.includes('اول')) return 'الأول متوسط';
    if (s.includes('ثاني')) return 'الثاني متوسط';
    if (s.includes('ثالث')) return 'الثالث متوسط';
    return 'المرحلة المتوسطة';
  }

  // Preparatory
  if (s.includes('علمي') || s.includes('احيائي') || s.includes('تطبيقي')) {
    if (s.includes('رابع')) return 'الرابع علمي';
    if (s.includes('خامس')) return 'الخامس علمي';
    if (s.includes('سادس')) return 'السادس علمي';
    return 'الفرع العلمي';
  }
  if (s.includes('ادبي')) {
    if (s.includes('رابع')) return 'الرابع أدبي';
    if (s.includes('خامس')) return 'الخامس أدبي';
    if (s.includes('سادس')) return 'السادس أدبي';
    return 'الفرع الأدبي';
  }
  if (s.includes('اعدادي') || s.includes('ثانوي')) {
    if (s.includes('رابع')) return 'الرابع إعدادي';
    if (s.includes('خامس')) return 'الخامس إعدادي';
    if (s.includes('سادس')) return 'السادس إعدادي';
  }

  // Strip section suffixes like " أ", " ب", " ج", " - شعبة أ"
  return raw.replace(/(\s+[-–—/]\s*|\s+)(شعبة\s*)?[أ-يA-Za-z0-9]$/, '').trim();
};

export const getGradePriority = (grade: string): number => {
  if (grade.includes('ابتدائي')) {
    if (grade.includes('أول')) return 10;
    if (grade.includes('ثاني')) return 11;
    if (grade.includes('ثالث')) return 12;
    if (grade.includes('رابع')) return 13;
    if (grade.includes('خامس')) return 14;
    if (grade.includes('سادس')) return 15;
    return 1;
  }
  if (grade.includes('متوسط')) {
    if (grade.includes('أول')) return 20;
    if (grade.includes('ثاني')) return 21;
    if (grade.includes('ثالث')) return 22;
    return 2;
  }
  if (grade.includes('إعدادي') || grade.includes('علمي') || grade.includes('أدبي')) {
    if (grade.includes('رابع')) return 30;
    if (grade.includes('خامس')) return 31;
    if (grade.includes('سادس')) return 32;
    return 3;
  }
  return 99;
};

export const generateStudentCodes = (
  bulkStudents: any[], 
  adminBranch: 'boys' | 'girls', 
  tuitionFee: number, 
  discountRates: Record<string, number>,
  schoolName: string,
  installmentPlan: any[],
  tuitionFeesByGrade?: Record<string, number>
) => {
  return bulkStudents.map(s => {
    const branchSuffix = s.gender === 'female' ? 'G' : s.gender === 'male' ? 'B' : (adminBranch === 'girls' ? 'G' : 'B');
    const prefix = getPrefixForGrade(s.grade);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    const studentCode = `${prefix}-${branchSuffix}-${randomNum}`;
    const parentCode = `PAR-${branchSuffix}-${randomNum}`;
    
    const baseGradeTuition = (tuitionFeesByGrade && s.grade && tuitionFeesByGrade[s.grade] !== undefined) ? Number(tuitionFeesByGrade[s.grade]) : tuitionFee;
    
    let discountRate = 0;
    let totalAmount = baseGradeTuition;
    let discountAmount = 0;

    if (s.discountType === 'SPECIAL') {
      if (s.discountAmount !== undefined && s.discountAmount !== null && Number(s.discountAmount) > 0) {
        discountAmount = Number(s.discountAmount);
        totalAmount = (s.totalAmount !== undefined && s.totalAmount !== null && Number(s.totalAmount) >= 0 && Number(s.totalAmount) < baseGradeTuition)
          ? Number(s.totalAmount)
          : Math.max(0, baseGradeTuition - discountAmount);
        discountRate = baseGradeTuition > 0 ? ((discountAmount / baseGradeTuition) * 100) : 0;
      } else if (s.totalAmount !== undefined && s.totalAmount !== null && s.totalAmount !== '' && Number(s.totalAmount) >= 0 && Number(s.totalAmount) < baseGradeTuition) {
        totalAmount = Number(s.totalAmount);
        discountAmount = Math.max(0, baseGradeTuition - totalAmount);
        discountRate = baseGradeTuition > 0 ? ((discountAmount / baseGradeTuition) * 100) : 0;
      } else if (s.discountRate !== undefined && s.discountRate !== null && Number(s.discountRate) > 0) {
        discountRate = Number(s.discountRate);
        discountAmount = Math.round((baseGradeTuition * discountRate) / 100);
        totalAmount = Math.max(0, baseGradeTuition - discountAmount);
      } else if (s.totalAmount !== undefined && s.totalAmount !== null && s.totalAmount !== '') {
        totalAmount = Number(s.totalAmount);
        discountAmount = Math.max(0, baseGradeTuition - totalAmount);
        discountRate = baseGradeTuition > 0 ? ((discountAmount / baseGradeTuition) * 100) : 0;
      }
    } else {
      discountRate = s.discountType ? (discountRates[s.discountType] || 0) : 0;
      discountAmount = Math.round((baseGradeTuition * discountRate) / 100);
      totalAmount = Math.max(0, baseGradeTuition - discountAmount);
    }
    
    const discountFactor = baseGradeTuition > 0 ? (totalAmount / baseGradeTuition) : ((100 - discountRate) / 100);
    const installmentSum = (installmentPlan || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    const gradeProportion = installmentSum > 0 ? (baseGradeTuition / installmentSum) : 1;
    const combinedFactor = gradeProportion * discountFactor;

    // Scale installments based on student's discount and grade proportion
    const installments = (installmentPlan || []).map((inst, idx) => ({
      ...inst,
      id: inst.id || crypto.randomUUID(),
      amount: Math.round((Number(inst.amount) || 0) * combinedFactor),
      paid: false
    }));

    const finalGrade = normalizeGradeName(s.grade) || s.grade;

    return {
      ...s,
      id: s.id || crypto.randomUUID(),
      student: studentCode,
      code: studentCode,
      parent: parentCode,
      parentCode: parentCode,
      grade: finalGrade,
      discountType: s.discountType || 'NONE',
      discountAmount,
      totalAmount,
      discountRate,
      school: s.school || schoolName,
      finance: {
        installments,
        totalTuition: totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        lastUpdated: new Date().toISOString()
      }
    };
  });
};

export const exportStudentsToCSV = (generatedCodes: any[]) => {
  const headers = ['اسم الطالب', 'كود الطالب', 'كود ولي الأمر', 'الخصم', 'مبلغ الاشتراك'];
  const rows = generatedCodes.map(code => [
    `"${code.name}"`,
    `"${code.student}"`,
    `"${code.parent}"`,
    `"${code.discountAmount} د.ع"`,
    `"${code.totalAmount} د.ع"`
  ]);
  const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Students_Codes_${new Date().getTime()}.csv`;
  link.click();
};

export const printStudentCards = (generatedCodes: any[], schoolName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const rowsHtml = generatedCodes.map(code => `
    <div style="border: 2px solid #333; padding: 15px; margin: 10px; border-radius: 10px; display: inline-block; width: 250px; direction: rtl; font-family: sans-serif; vertical-align: top;">
      <div style="font-weight: bold; border-bottom: 2px solid #FFD600; margin-bottom: 10px; padding-bottom: 5px; color: #101935; display: flex; justify-content: space-between; align-items: center;">
        <span>بطاقة الطالب الذكية</span>
        <span style="font-size: 10px; color: #666;">بوابة بيرق</span>
      </div>
      <div style="margin-bottom: 5px;"><strong>المدرسة:</strong> ${schoolName}</div>
      <div style="margin-bottom: 5px;"><strong>الصف:</strong> ${code.grade}</div>
      <div style="margin-bottom: 5px;"><strong>الاسم:</strong> ${code.name}</div>
      <div style="margin-bottom: 5px;"><strong>كود الطالب:</strong> <span style="color: #d32f2f; font-weight: bold;">${code.student}</span></div>
      <div style="margin-bottom: 5px;"><strong>كود ولي الأمر:</strong> <span style="color: #1976d2; font-weight: bold;">${code.parent}</span></div>
      <div style="font-size: 10px; color: #666; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 5px;">يرجى الاحتفاظ بهذه الأكواد للدخول للمنصة</div>
    </div>
  `).join('');
  printWindow.document.write(`<html><head><title>Print Codes</title></head><body>${rowsHtml}</body></html>`);
  printWindow.document.close();
  printWindow.print();
};

export const generateSingleStudentPDF = (student: any) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54] // Standard ID card size
  });

  // Card Design
  doc.setFillColor(13, 71, 161); // Blue
  doc.rect(0, 0, 85.6, 54, 'F');
  
  doc.setTextColor(255, 214, 0); // Gold
  doc.setFontSize(10);
  doc.text('بوابة بيرق', 42.8, 8, { align: 'center' });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`الاسم: ${student.name}`, 5, 20);
  doc.text(`الكود: ${student.student || student.code}`, 5, 28);
  doc.text(`المرحلة: ${student.grade}`, 5, 36);

  // QR Code Placeholder
  doc.setDrawColor(255, 255, 255);
  doc.rect(60, 20, 20, 20);
  doc.setFontSize(6);
  doc.text('QR', 70, 31, { align: 'center' });

  doc.save(`ID_${student.student || student.code}.pdf`);
};

export const getSubjectsForGrade = (grade: string, removedIds: string[] = [], customMapping: any = null) => {
  if (customMapping) {
    const cleanGrade = normalizeGradeName(grade) || grade;
    const stage = getStageFromGrade(cleanGrade || grade);
    let base: any[] = [];
    
    // Check if there's a specific mapping for this exact grade first (normalized)
    const normalizedGrade = normalizeArabicText(cleanGrade);
    const rawNormalized = normalizeArabicText(grade);
    const mappingKey = Object.keys(customMapping).find(k => {
      const normK = normalizeArabicText(k);
      return normK === normalizedGrade || normK === rawNormalized || 
             (normK && normalizedGrade && (normK.includes(normalizedGrade) || normalizedGrade.includes(normK))) ||
             (normK && rawNormalized && (normK.includes(rawNormalized) || rawNormalized.includes(normK)));
    });

    if (mappingKey && Array.isArray(customMapping[mappingKey])) {
      base = customMapping[mappingKey];
    } else if (stage && customMapping[stage] && Array.isArray(customMapping[stage])) {
      // Fallback to stage-level mapping
      base = customMapping[stage];
    } else {
      // Compatibility with older structure or direct stage names as keys
      if (cleanGrade.includes('ابتدائي') || grade.includes('ابتدائي')) base = customMapping.primary;
      else if (cleanGrade.includes('متوسط') || grade.includes('متوسط')) base = customMapping.intermediate;
      else if (cleanGrade.includes('علمي') || grade.includes('علمي')) base = customMapping.scientific;
      else if (cleanGrade.includes('أدبي') || grade.includes('أدبي')) base = customMapping.literary;
      else base = customMapping.scientific;
    }
    
    if (Array.isArray(base) && base.length > 0) {
      return base.filter((s: any) => {
        if (!s) return false;
        const sId = typeof s === 'string' ? s : (s.id || s.name || s.title || '');
        return !removedIds.includes(sId);
      });
    }
  }

  // Subjects based on Iraqi curriculum standards - EXACT ORDER REQUESTED
  const islamic = { id: 'islamic', name: 'التربية الإسلامية' };
  const arabic = { id: 'arabic', name: 'اللغة العربية' };
  const english = { id: 'english', name: 'اللغة الانجليزية' };
  const math = { id: 'math', name: 'الرياضيات' };
  const computer = { id: 'computer', name: 'الحاسوب' };
  const french = { id: 'french', name: 'اللغة الفرنسية' };

  const primary = [
    islamic, 
    arabic, 
    english, 
    math,
    { id: 'science', name: 'العلوم' },
    { id: 'social', name: 'الاجتماعيات' },
    { id: 'art', name: 'التربية الفنية' },
    { id: 'sports', name: 'الرياضة' }
  ];

  const intermediate = [
    islamic, 
    arabic, 
    { id: 'english_intermediate', name: 'اللغة الانجليزية' }, // Unique ID if needed, but same name
    math,
    { id: 'chemistry', name: 'الكيمياء' },
    { id: 'physics', name: 'الفيزياء' },
    { id: 'biology', name: 'الأحياء' }
  ];

  const secondaryScientific = [
    islamic, 
    arabic, 
    english, 
    math,
    { id: 'chemistry_sci', name: 'كيمياء' },
    { id: 'physics_sci', name: 'فيزياء' },
    { id: 'biology_sci', name: 'احياء' },
    computer, 
    french
  ];

  const secondaryLiterary = [
    islamic, 
    arabic, 
    english, 
    math,
    { id: 'geography', name: 'الجغرافية' },
    { id: 'history', name: 'التاريخ' },
    { id: 'economics', name: 'الاقتصاد' },
    computer, 
    french
  ];

  let baseSubjects = [];
  if (grade.includes('ابتدائي')) {
    baseSubjects = primary;
  } else if (grade.includes('متوسط')) {
    baseSubjects = intermediate;
  } else if (grade.includes('علمي')) {
    baseSubjects = secondaryScientific;
  } else if (grade.includes('أدبي')) {
    baseSubjects = secondaryLiterary;
  } else {
    baseSubjects = secondaryScientific;
  }
  
  // Filter out removed subjects
  return baseSubjects.filter(s => !removedIds.includes(s.id));
};

export const calculateStudentFinancials = (stu: any, tuitionFee: number, discountRates: Record<string, number>) => {
  if (!stu) {
      return { 
        requiredAmount: tuitionFee, 
        paidAmount: 0, 
        remainingAmount: tuitionFee, 
        isPaidInFull: false, 
        discountAmount: 0, 
        discountRate: 0,
        isInstallmentsAtGross: false,
        discountFactor: 1
      };
  }
  // Default standard discount rates dictionary
  const defaultDiscountRates: Record<string, number> = {
    SIBLINGS: 15,
    EARLY_REGISTRATION: 10,
    ORPHAN: 50,
    STAFF: 50,
    EXCELLENCE: 10,
    FULL_EXEMPTION: 100
  };

  const effectiveDiscountRates = {
    ...defaultDiscountRates,
    ...discountRates
  };

  // High-precision discount detection: 
  // 1. Check for manual rate override (discountRate)
  // 2. Check for category-based rate (discountType)
  // 3. Check for specific status indicators
  let discountRate = Number(stu.discountRate ?? (stu.discountType ? (effectiveDiscountRates[stu.discountType] || 0) : 0));
  
  // Status-based overrides
  if (stu.status === 'إعفاء تام' || stu.discountType === 'FULL_EXEMPTION' || stu.discountRate === 100) {
    discountRate = 100;
  }

  // Support both top-level and nested structure
  const installments = stu.finance?.installments || stu.installments || [];
  const installmentsTotal = installments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);

  // Base tuition determination (Gross price before discount)
  let fee = Number(tuitionFee) || 0;
  if (fee === 0) {
    if (installmentsTotal > 0) {
      fee = installmentsTotal;
    } else if (stu.totalAmount && Number(stu.totalAmount) > 0) {
      if (discountRate > 0 && discountRate < 100) {
        fee = Math.round(Number(stu.totalAmount) / ((100 - discountRate) / 100));
      } else {
        fee = Number(stu.totalAmount);
      }
    } else if (stu.finance?.totalTuition && Number(stu.finance.totalTuition) > 0) {
      fee = Number(stu.finance.totalTuition);
    }
  }

  const discountFactor = (100 - discountRate) / 100;
  const discountAmount = Math.round((fee * discountRate) / 100);
  const expectedTotal = fee - discountAmount;

  // Determine if installments are likely at gross price (pre-discount)
  const isInstallmentsAtGross = discountRate > 0 && discountRate < 100 && (Math.abs(installmentsTotal - fee) <= 1000 || installmentsTotal > expectedTotal);

  // Final Required Amount Logic:
  // 1. If full exemption or 100% discount, required is 0
  // 2. If student has discountRate > 0, requiredAmount is strictly expectedTotal
  // 3. If explicit totalAmount is set and no discount or already matching, prioritize it
  // 4. Otherwise use installmentsTotal if present, else expectedTotal
  let requiredAmount = expectedTotal;
  if (stu.status === 'إعفاء تام' || discountRate === 100) {
    requiredAmount = 0;
  } else if (discountRate > 0) {
    requiredAmount = expectedTotal;
  } else if (stu.totalAmount !== undefined && Number(stu.totalAmount) > 0) {
    requiredAmount = Number(stu.totalAmount);
  } else if (installmentsTotal > 0) {
    requiredAmount = installmentsTotal;
  }
      
  const paidFromInstallments = installments.reduce((sum: number, inst: any) => {
    const instStatus = (inst.status || '').toLowerCase().trim();
    const isPaid = inst.paid === true || 
                   ['paid', 'completed', 'verified', 'approved', 'verified_payment', 'success', 'مكتمل'].includes(instStatus) ||
                   instStatus.includes('مكتمل');
    
    if (isPaid) {
      const amt = Number(inst.amount) || 0;
      // If the individual installment amount hasn't been discounted in DB
      // but it should be, we count only the discounted part towards paid amount.
      const effectiveAmount = isInstallmentsAtGross ? Math.round(amt * discountFactor) : amt;
      return sum + effectiveAmount;
    }
    return sum;
  }, 0);

  const storedPaidAmount = Number(stu.finance?.paidAmount ?? stu.paidAmount ?? 0);
  // We trust installments more if they exist, but take whichever is higher to be safe against partial syncs
  const paidAmount = installments.length > 0 ? paidFromInstallments : Math.max(storedPaidAmount, paidFromInstallments);
  
  const remainingAmount = Math.max(0, requiredAmount - paidAmount);
  const isPaidInFull = (requiredAmount > 0 && remainingAmount <= 5) || (stu.status === 'إعفاء تام') || (discountRate === 100);

  return { 
    requiredAmount, 
    paidAmount, 
    remainingAmount, 
    isPaidInFull, 
    discountAmount, 
    discountRate,
    isInstallmentsAtGross,
    discountFactor
  };
};

export const OUTSTANDING_BADGES = [
  { id: 'honor', title: 'وسام التفوق', desc: 'للمتفوقين الحاصلين على معدلات كاملة دراسياً', color: 'from-amber-400 to-yellow-600 text-amber-100', icon: '🏆' },
  { id: 'honor_term1', title: 'بطل الفصل 1', desc: 'لتصدر درجات الفصل الأول', color: 'from-[#FFD600] to-amber-600 text-black', icon: '🥇' },
  { id: 'honor_mid', title: 'نجم الشهر', desc: 'للطالب الأكثر نشاطاً دراسياً في الشهر', color: 'from-fuchsia-500 to-purple-600 text-fuchsia-100', icon: '🌟' },
  { id: 'honor_exemption', title: 'بطاقة إعفاء', desc: 'كرم الإعفاء من الامتحانات أو الواجبات نظراً لتميزه', color: 'from-emerald-400 to-teal-600 text-teal-100', icon: '🏅' },
  { id: 'discipline', title: 'وسام الانضباط', desc: 'للالتزام التام بقوانين الصف والمظهر المتميز', color: 'from-red-500 to-orange-600 text-orange-100', icon: '🔥' },
  { id: 'math', title: 'عبقري اللغة الإنجليزية', desc: 'للأداء الاستثنائي المتكامل في اختبارات القواعد، الإنشاءات، وتطبيقات الترجمة', color: 'from-blue-500 to-indigo-600 text-blue-100', icon: '🧠' },
  { id: 'star', title: 'نجم الأسبوع', desc: 'للطالب الأكثر نشاطاً وتفاعلاً بالأسبوع', color: 'from-[#FFD600] to-amber-600 text-black', icon: '⭐' },
  { id: 'attendance', title: 'حضور مثالي', desc: 'لم يسجل غياباً أو تأخيراً أبداً', color: 'from-teal-400 to-emerald-600 text-emerald-100', icon: '✨' },
  { id: 'progress', title: 'تطور ملحوظ', desc: 'لطالب حقق قفزة نوعية في مستواه الدراسي', color: 'from-cyan-400 to-blue-600 text-cyan-100', icon: '🎯' },
  { id: 'elite', title: 'نخبة الصف', desc: 'للمستوى القيادي المتميز والقدوة', color: 'from-purple-500 to-pink-600 text-purple-100', icon: '👑' }
];

export const getLevelData = (points: number) => {
  const level = Math.floor(points / 20) + 1;
  const xpInCurrentLevel = points % 20;
  const xpNeededForNext = 20;
  const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;
  
  let label = "مجتهد برونزي 🥉";
  let borderClass = "border-slate-500/30 text-slate-300 bg-slate-400/5 shadow-[0_0_15px_rgba(148,163,184,0.1)]";
  let glowColor = "rgba(148,163,184,0.3)";
  let gradeTag = "ساعٍ للقمة";
  
  if (level >= 8) {
    label = "نخبة الأبطال الماسي 💎";
    borderClass = "border-[#FFD600] text-[#FFD600] bg-[#FFD600]/10 shadow-[0_0_25px_rgba(255,214,0,0.25)]";
    glowColor = "rgba(255,214,0,0.4)";
    gradeTag = "أسطوري المتفوقين";
  } else if (level >= 5) {
    label = "بطل خارق ذهبي 🥇";
    borderClass = "border-amber-400 text-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
    glowColor = "rgba(245,158,11,0.35)";
    gradeTag = "متميز فائق";
  } else if (level >= 3) {
    label = "متميز فضي 🥈";
    borderClass = "border-blue-400/50 text-blue-300 bg-blue-500/5 shadow-[0_0_15px_rgba(96,165,250,0.15)]";
    glowColor = "rgba(96,165,250,0.3)";
    gradeTag = "نشيط مبدع";
  }
  
  return { level, progressPercent, label, borderClass, glowColor, gradeTag, xpInCurrentLevel, xpNeededForNext };
};

export const SUBJECT_BADGES_CONFIG: Record<string, any> = {
  'رياضيات': {
    colors: 'from-blue-700 to-amber-500', bg: 'bg-blue-900/40', text: 'text-blue-500',
    badges: [
      { score: 95, title: 'نخبة الرياضيات', icon: '🏆', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'عبقري الرياضيات', icon: '🧠', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'سيد المعادلات', icon: '📐', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'مشروع عبقري', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تطور عالي في الرياضيات' }
  },
  'عربي': {
    colors: 'from-rose-800 to-amber-200/50', bg: 'bg-rose-900/40', text: 'text-rose-500',
    badges: [
      { score: 95, title: 'نخبة اللغة العربية', icon: '🏅', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'فارس اللغة', icon: '📖', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'قلم متميز', icon: '✍️', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'مشروع أديب', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'قفزة نوعية في لغة الضاد' }
  },
  'انكليزي': {
    colors: 'from-purple-700 to-blue-500', bg: 'bg-purple-900/40', text: 'text-purple-500',
    badges: [
      { score: 95, title: 'Elite English', icon: '🏅', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'Master Speaker', icon: '🎯', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'English Star', icon: '🌍', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'Rising Star', icon: '⭐', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'Amazing Progress!' }
  },
  'علوم': {
    colors: 'from-emerald-600 to-teal-400', bg: 'bg-emerald-900/40', text: 'text-emerald-500',
    badges: [
      { score: 95, title: 'نخبة العلوم', icon: '🏆', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'العقل العلمي', icon: '🧪', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'الباحث الصغير', icon: '🔬', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'عالم المستقبل', icon: '🌱', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'اكتشافات علمية مبهرة' }
  },
  'فيزياء': {
    colors: 'from-indigo-600 to-cyan-400', bg: 'bg-indigo-900/40', text: 'text-indigo-400',
    badges: [
      { score: 95, title: 'نخبة الفيزياء', icon: '⚡', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'آينشتاين الصف', icon: '🌀', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'عقل ديناميكي', icon: '🔋', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'فيزيائي واعد', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تطور فيزيائي ملحوظ' }
  },
  'كيمياء': {
    colors: 'from-fuchsia-600 to-pink-400', bg: 'bg-fuchsia-900/40', text: 'text-fuchsia-400',
    badges: [
      { score: 95, title: 'نخبة الكيمياء', icon: '🧪', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'خبير التفاعلات', icon: '⚗️', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'عقل كيميائي', icon: '🔬', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'كيميائي مبتدئ', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تفاعل نتيجته النجاح' }
  },
  'احياء': {
    colors: 'from-teal-600 to-emerald-400', bg: 'bg-teal-900/40', text: 'text-teal-400',
    badges: [
      { score: 95, title: 'نخبة الأحياء', icon: '🧬', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'طبيب المستقبل', icon: '🩺', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'عالم أحياء', icon: '🌿', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'طبيب مبتدئ', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تطور حيوي مبهر' }
  },
  'اسلامية': {
    colors: 'from-emerald-700 to-lime-500', bg: 'bg-emerald-900/40', text: 'text-emerald-500',
    badges: [
      { score: 95, title: 'نخبة الإسلامية', icon: '🕋', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'أخلاق وسلوك', icon: '🕌', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'طالب ملتزم', icon: '📿', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'مشروع مؤمن', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تقدم روحي وعلمي' }
  },
  'default': {
    colors: 'from-slate-700 to-slate-500', bg: 'bg-slate-900/40', text: 'text-slate-400',
    badges: [
      { score: 95, title: 'نخبة ', icon: '🏆', level: 'elite', color: 'border-amber-400 text-amber-400', effect: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
      { score: 90, title: 'ممتاز في ', icon: '🌟', level: 'gold', color: 'border-yellow-400 text-yellow-400', effect: '' },
      { score: 80, title: 'جيد جداً في ', icon: '👍', level: 'silver', color: 'border-slate-300 text-slate-300', effect: '' },
      { score: 50, title: 'جيد في ', icon: '📘', level: 'bronze', color: 'border-orange-400 text-orange-400', effect: '' }
    ],
    improvement: { title: 'تطور ملحوظ', icon: '🚀', desc: 'تقدم واضح في المادة' }
  }
};

export const computeAcademicIdentity = (student: any, list: any, subjectMapping: any) => {
   const studentSubjects = getSubjectsForGrade(student.grade || list?.name || '', list?.removedSubjects || [], subjectMapping);
   
   let totalBadges = 0;
   let highestScore = 0;
   let strongestSubjectMap = { name: '---', score: 0 };
   let improvementBadges: any[] = [];
   let subjectBadgesArray: any[] = [];
   let needsImprovementArray: any[] = [];
   let subjectAverages: { name: string, id: string, avg: number }[] = [];
   let individualExemptions: string[] = [];
   let generalExemption = false;
   let topLevelBadgesCount = 0; // for 👑 طالب النخبة
   let sumScores = 0;
   let countScores = 0;
   let hasPerfectScore = false;
   let isMathGenius = false;

   studentSubjects.forEach(subj => {
       let scores: number[] = [];
       let periodsWithScores: any[] = [];
       const allPossiblePeriods = ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'];
       allPossiblePeriods.forEach(p => {
          const sStr = student.grades?.[p]?.[subj.id];
          const s = Number(sStr);
          if (sStr !== undefined && sStr !== null && sStr !== '' && !isNaN(s)) {
             scores.push(s);
             periodsWithScores.push({ period: p, score: s });
             sumScores += s;
             countScores++;
          }
       });

       if (scores.length > 0) {
           const subjSum = scores.reduce((a, b) => a + b, 0);
            let subjAvg = Math.ceil(subjSum / scores.length);
            const aqVal = student.grades?.['annual_quest']?.[subj.id];
            const fgVal = student.grades?.['final_grade']?.[subj.id];
            const hasAnnualGrade = (aqVal !== undefined && aqVal !== null && aqVal !== '' && !isNaN(Number(aqVal))) ||
                                   (fgVal !== undefined && fgVal !== null && fgVal !== '' && !isNaN(Number(fgVal)));

            let annualScore: number | null = null;
            if (aqVal !== undefined && aqVal !== null && aqVal !== '' && !isNaN(Number(aqVal))) {
                annualScore = Number(aqVal);
                subjAvg = annualScore;
            } else if (fgVal !== undefined && fgVal !== null && fgVal !== '' && !isNaN(Number(fgVal))) {
                annualScore = Number(fgVal);
                subjAvg = annualScore;
            }

           subjectAverages.push({ name: subj.name, id: subj.id, avg: subjAvg });
           
           // Exemption is STRICTLY calculated ONLY after Annual Quest (السعي السنوي) is determined
           if (hasAnnualGrade && annualScore !== null) {
               if (annualScore >= 90) {
                   individualExemptions.push(subj.name);
               }
           }

           const latestObj = periodsWithScores[periodsWithScores.length - 1];
           const maxScore = Math.max(...scores);
           
           if (maxScore > highestScore) highestScore = maxScore;
           if (latestObj.score > strongestSubjectMap.score) {
               strongestSubjectMap = { name: subj.name, score: latestObj.score };
           }

           if (maxScore >= 100) hasPerfectScore = true;
           if ((subj.name.includes('رياضيات') || subj.name.includes('انكليزي') || subj.name.includes('إنجليزي') || subj.name.includes('English') || subj.name.includes('انجليزي')) && maxScore >= 98) isMathGenius = true;

           let subjKey = Object.keys(SUBJECT_BADGES_CONFIG).find(k => subj.name.includes(k) && k !== 'default') || 'default';
           const config = SUBJECT_BADGES_CONFIG[subjKey];

           const badgeDef = config.badges.find((b: any) => latestObj.score >= b.score);
           if (badgeDef && latestObj.score >= 50) {
               let badgeTitle = badgeDef.title;
               if (subjKey === 'default') {
                   badgeTitle += subj.name;
               }
               let measureWord = 'درجة';
               if (latestObj.period === 'midterm' || latestObj.period === 'final') measureWord = 'معدل';

               subjectBadgesArray.push({
                   id: subj.id,
                   subject: subj.name,
                   score: latestObj.score,
                   period: latestObj.period,
                   measureWord,
                   badge: { ...badgeDef, title: badgeTitle },
                   config
               });
               totalBadges++;
               if (badgeDef.level === 'elite' || badgeDef.level === 'gold') {
                  topLevelBadgesCount++;
               }
           } else if (latestObj.score < 50) {
               needsImprovementArray.push({
                  subject: subj.name,
                  score: latestObj.score
               });
           }

           if (scores.length >= 2) {
              const firstScore = scores[0];
              const lastScore = scores[scores.length - 1];
              const diff = lastScore - firstScore;
              if (diff >= 15 && lastScore >= 50) {
                  improvementBadges.push({
                     id: subj.id,
                     subject: subj.name,
                     diff,
                     badge: config.improvement,
                     config,
                     score: lastScore
                  });
                  totalBadges++;
              }
           }
       }
   });

   const allSubjectsHaveAnnualQuest = studentSubjects.length > 0 && studentSubjects.every(subj => {
       const aqVal = student.grades?.['annual_quest']?.[subj.id];
       const fgVal = student.grades?.['final_grade']?.[subj.id];
       return (aqVal !== undefined && aqVal !== null && aqVal !== '' && !isNaN(Number(aqVal))) ||
              (fgVal !== undefined && fgVal !== null && fgVal !== '' && !isNaN(Number(fgVal)));
   });

   const totalAvg = subjectAverages.length > 0 ? Math.ceil(subjectAverages.reduce((a,b) => a + b.avg, 0) / subjectAverages.length) : 0;
   const minSubjAvg = subjectAverages.length > 0 ? Math.min(...subjectAverages.map(s => s.avg)) : 0;

   if (allSubjectsHaveAnnualQuest && totalAvg >= 85 && minSubjAvg >= 75) {
       generalExemption = true;
   }

   const avgScore = countScores > 0 ? sumScores / countScores : 0;
   let generalBadges: any[] = [];
   
   if (generalExemption) {
       generalBadges.push({
           id: 'exemption_general',
           title: 'إعفاء عام 👑',
           icon: '👑',
           color: 'text-amber-500 bg-amber-500/10',
           desc: 'المعدل العام 85% فما فوق ولا تقل أي مادة عن 75%'
       });
   }

   individualExemptions.forEach(subjName => {
       generalBadges.push({
           id: `exemption_indiv_${subjName}`,
           title: `إعفاء فردي - ${subjName}`,
           icon: '🏅',
           color: 'text-teal-400 bg-teal-400/10',
           desc: 'الدرجة تجاوزت الـ 90% وفق ضوابط الإعفاء'
       });
   });

   if (avgScore >= 98 || hasPerfectScore) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'honor'));
   } else if (avgScore >= 95) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'honor_term1'));
   } else if (avgScore >= 90) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'honor_mid'));
   }

   if (isMathGenius) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'math'));
   }

   if (improvementBadges.length >= 2) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'progress'));
   }

   if (topLevelBadgesCount >= 5) {
       generalBadges.push(OUTSTANDING_BADGES.find(b => b.id === 'elite'));
   }

   // Optional manual badges built-in or custom 
   if (student.outstandingBadges && Array.isArray(student.outstandingBadges)) {
       student.outstandingBadges.forEach((bId: string) => {
           if (bId === 'honor_exemption' && !generalExemption && individualExemptions.length === 0) {
               return; // Exemption badge is strictly withheld until annual quest is calculated
           }
           const bDetails = OUTSTANDING_BADGES.find(b => b.id === bId);
           if (bDetails && !generalBadges.find((gb: any) => gb?.id === bId)) {
               generalBadges.push(bDetails);
           }
       });
   }

   if (student.generalBadges && Array.isArray(student.generalBadges)) {
       generalBadges.push(...student.generalBadges);
   }

   const allCalculatedBadges = generalBadges.filter(b => b !== undefined);

   // Badges points
   totalBadges += allCalculatedBadges.length;

   return { 
     totalBadges, 
     strongestSubjectMap, 
     highestScore, 
     subjectBadgesArray, 
     needsImprovementArray, 
     improvementBadges,
     generalBadges: allCalculatedBadges,
     generalExemption,
     individualExemptions,
     isEliteStudent: topLevelBadgesCount >= 5,
     levelData: getLevelData(totalBadges * 5) // Assign dynamic XP equivalent
   };
};

export const computeExcellencePoints = (student: any, list: any, subjectMapping: any, period: string = 'all') => {
   const studentSubjects = getSubjectsForGrade(student.grade || list?.name || '', list?.removedSubjects || [], subjectMapping || null);
   
   let sum = 0, count = 0;
   let badgesBonus = 0;
   let improvementBonus = 0;
   let goldBadges = 0, silverBadges = 0, bronzeBadges = 0;
   let badgesEarnedInPeriod = 0;
   let basePoints = 0;

   if (period === 'all') {
       const prof = computeAcademicIdentity(student, list, subjectMapping);
       let allSum = 0, allCount = 0;
       if (student.grades) {
           ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'].forEach(p => {
              Object.values(student.grades[p] || {}).forEach((v: any) => {
                 const n = Number(v);
                 if (!isNaN(n)) { allSum += n; allCount++; }
              });
           });
       }
       basePoints = allCount > 0 ? parseFloat((allSum / allCount).toFixed(2)) : 0;

       if (prof) {
           prof.subjectBadgesArray?.forEach((b: any) => {
                if (b.config?.level === 'elite' || b.config?.level === 'gold' || b.badge?.level === 'elite' || b.badge?.level === 'gold') {
                    goldBadges++; badgesBonus += 10;
                } else if (b.config?.level === 'silver' || b.badge?.level === 'silver') {
                    silverBadges++; badgesBonus += 6;
                } else {
                    bronzeBadges++; badgesBonus += 3;
                }
           });
           prof.improvementBadges?.forEach((b: any) => {
                improvementBonus += 5;
           });
           if (prof.individualExemptions?.length > 0) badgesBonus += prof.individualExemptions.length * 10;
           if (prof.generalExemption) badgesBonus += 50;
           badgesEarnedInPeriod = prof.totalBadges || 0;
       }
   } else {
       const pGrades = student.grades?.[period] || {};
       
       studentSubjects.forEach(subj => {
           const sStr = pGrades[subj.id];
           const s = Number(sStr);
           if (sStr !== undefined && sStr !== null && sStr !== '' && !isNaN(s)) {
               sum += s;
               count++;
               
               let subjKey = Object.keys(SUBJECT_BADGES_CONFIG).find(k => subj.name.includes(k) && k !== 'default') || 'default';
               const config = SUBJECT_BADGES_CONFIG[subjKey];
               if (config && config.badges) {
                   const badgeDef = config.badges.find((b: any) => s >= b.score);
                   if (badgeDef && s >= 50) {
                      badgesEarnedInPeriod++;
                      if (badgeDef.level === 'elite' || badgeDef.level === 'gold') {
                          goldBadges++; badgesBonus += 10;
                      } else if (badgeDef.level === 'silver') {
                          silverBadges++; badgesBonus += 6;
                      } else {
                          bronzeBadges++; badgesBonus += 3;
                      }
                   }
               }
           }
       });
       basePoints = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
   }

   let continuityBonus = 0;
   let elitePeriods = 0;
   const allPeriods = ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'];
   allPeriods.forEach(p => {
       let pSum = 0, pCount = 0;
       const pGr = student.grades?.[p];
       if (pGr) {
           Object.values(pGr).forEach((v: any) => {
               const s = Number(v);
               if (!isNaN(s)) { pSum += s; pCount++; }
           });
           if (pCount > 0 && pSum / pCount >= 90) {
               elitePeriods++;
           }
       }
   });
   
   if (elitePeriods >= 3) continuityBonus = 15;
   else if (elitePeriods >= 2) continuityBonus = 10;

   const totalPoints = basePoints + badgesBonus + improvementBonus + continuityBonus + Number(student.pointsBonus || 0);
   
   let dynamicTitle = 'بطل التميز 🏅';
   if (basePoints >= 90) dynamicTitle = 'ملك التفوق 👑'; // This might be overridden in context with maxBase
   if (continuityBonus === 15 && elitePeriods >= 3) dynamicTitle = 'أسطورة التميز ⚓';
   if (improvementBonus > 0) dynamicTitle = 'نجم التطور 🚀';
   if (badgesEarnedInPeriod >= 3) dynamicTitle = 'جامع الأوسمة 🎖️';

   return {
       basePoints,
       badgesBonus,
       improvementBonus,
       continuityBonus,
       totalPoints,
       badgesEarnedInPeriod,
       goldBadges,
       silverBadges,
       bronzeBadges,
       elitePeriods,
       dynamicTitle
   };
};
