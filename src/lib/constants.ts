// Educational institution constants for ghammas area


export interface SchoolItem {
  id: string;
  name: string;
  type: string;
  schoolBairaqImageUrl: string; // صورة بيرق الخاصة بالمدرسة (لقسم الميادين)
  schoolLogoUrl: string;       // شعار المدرسة الرسمي (للوصل الرقمي)
}

export const SCHOOLS_DATA: SchoolItem[] = [
  { 
    id: 'school1', 
    name: 'ثانوية اوائل غماس الاهلية', 
    type: 'التميز في التعليم الأساسي',
    schoolBairaqImageUrl: '/schools/cover1.jpg',
    schoolLogoUrl: '/school-logos/logo1.jpg'
  },
  { 
    id: 'school2', 
    name: 'ثانوية النخبة العلمية للبنين', 
    type: 'رعاية الموهبة والإبداع',
    schoolBairaqImageUrl: '/schools/cover2.jpg',
    schoolLogoUrl: '/school-logos/logo2.jpg'
  },
  { 
    id: 'school3', 
    name: 'ثانوية نون والقلم الاهلية', 
    type: 'صرح تربوي متميز',
    schoolBairaqImageUrl: '/schools/cover3.jpg',
    schoolLogoUrl: '/school-logos/logo3.jpg'
  },
  { 
    id: 'school4', 
    name: 'ثانوية النبأ العظيم الاهلية للبنات', 
    type: 'جيل واعد ومبدع',
    schoolBairaqImageUrl: '/schools/cover4.jpg',
    schoolLogoUrl: '/school-logos/logo4.jpg'
  },
  { 
    id: 'school5', 
    name: 'مدارس ابن عقيل الأهلية', 
    type: 'التميز الأكاديمي',
    schoolBairaqImageUrl: '/schools/cover5.jpg',
    schoolLogoUrl: '/school-logos/logo5.jpg'
  },
  { 
    id: 'school6', 
    name: 'مدرسة اليمامة الابتدائية', 
    type: 'جيل واعد ومبدع',
    schoolBairaqImageUrl: '/schools/cover6.jpg',
    schoolLogoUrl: '/school-logos/logo6.jpg'
  },
  { 
    id: 'school7', 
    name: 'مدارس الجواهري الاهلية', 
    type: 'منارة العلم والأدب',
    schoolBairaqImageUrl: '/schools/cover7.jpg',
    schoolLogoUrl: '/school-logos/logo7.jpg'
  },
  { 
    id: 'school8', 
    name: 'معهد ابداعنا للتعليم المطور', 
    type: 'تعليم نوعي وتطوير مستمر',
    schoolBairaqImageUrl: '/schools/cover8.jpg',
    schoolLogoUrl: '/school-logos/logo8.jpg'
  },
  { 
    id: 'general', 
    name: 'أكاديمية بيرق الرقمية', 
    type: 'منصة الدورات الألكترونية لنخبة الأساتذة',
    schoolBairaqImageUrl: '/uploads/school_general_cover_1790088445960.png',
    schoolLogoUrl: '/logo.png'
  },
];

/**
 * 1) صورة بيرق المخصصة للمدرسة (بطاقات قسم الميادين)
 */
export function getSchoolBairaqImageUrl(schoolId?: string, schoolName?: string): string {
  let relativePath = '/schools/cover1.jpg';
  if (schoolId) {
    const cleanId = String(schoolId).trim();
    if (cleanId === 'general') return '/schools/cover_general.jpg';
    const num = cleanId.replace(/\D/g, '');
    if (num && parseInt(num) >= 1 && parseInt(num) <= 8) {
      relativePath = `/schools/cover${num}.jpg`;
      return relativePath;
    }
  }
  if (schoolName) {
    const name = String(schoolName).trim();
    if (name.includes('غماس') || name.includes('أوائل') || name.includes('اوائل') || name.includes('غطاس')) relativePath = '/schools/cover1.jpg';
    else if (name.includes('النخبة')) relativePath = '/schools/cover2.jpg';
    else if (name.includes('نون')) relativePath = '/schools/cover3.jpg';
    else if (name.includes('النبأ') || name.includes('بنات')) relativePath = '/schools/cover4.jpg';
    else if (name.includes('عقيل')) relativePath = '/schools/cover5.jpg';
    else if (name.includes('اليمامة')) relativePath = '/schools/cover6.jpg';
    else if (name.includes('الجواهري')) relativePath = '/schools/cover7.jpg';
    else if (name.includes('إبداعنا') || name.includes('ابداعنا')) relativePath = '/schools/cover8.jpg';
    else if (name.includes('بيرق') || name.includes('أكاديمية') || name.includes('اكاديمية')) relativePath = '/schools/cover_general.jpg';
  }
  return relativePath;
}

/**
 * 2) شعار المدرسة الرسمي (للوصل الرقمي والختم الرسمي)
 */
export function getOfficialSchoolLogoUrl(schoolId?: string, schoolName?: string, customLogoUrl?: string): string {
  if (customLogoUrl && typeof customLogoUrl === 'string' && customLogoUrl.trim() !== '') {
    return customLogoUrl.trim();
  }
  let relativePath = '/school-logos/logo1.jpg';
  if (schoolId) {
    const cleanId = String(schoolId).trim();
    if (cleanId === 'general') return '/school-logos/logo_general.jpg';
    const num = cleanId.replace(/\D/g, '');
    if (num && parseInt(num) >= 1 && parseInt(num) <= 8) {
      relativePath = `/school-logos/logo${num}.jpg`;
      return relativePath;
    }
  }
  if (schoolName) {
    const name = String(schoolName).trim();
    if (name.includes('غماس') || name.includes('أوائل') || name.includes('اوائل') || name.includes('غطاس')) relativePath = '/school-logos/logo1.jpg';
    else if (name.includes('النخبة')) relativePath = '/school-logos/logo2.jpg';
    else if (name.includes('نون')) relativePath = '/school-logos/logo3.jpg';
    else if (name.includes('النبأ') || name.includes('بنات')) relativePath = '/school-logos/logo4.jpg';
    else if (name.includes('عقيل')) relativePath = '/school-logos/logo5.jpg';
    else if (name.includes('اليمامة')) relativePath = '/school-logos/logo6.jpg';
    else if (name.includes('الجواهري')) relativePath = '/school-logos/logo7.jpg';
    else if (name.includes('إبداعنا') || name.includes('ابداعنا')) relativePath = '/school-logos/logo8.jpg';
    else if (name.includes('بيرق') || name.includes('أكاديمية') || name.includes('اكاديمية')) relativePath = '/school-logos/logo_general.jpg';
  }
  return relativePath;
}

/**
 * 3) اسم المدرسة الرسمي بالكامل (للختم والوصل الرقمي)
 */
export function getOfficialSchoolName(schoolId?: string, schoolName?: string): string {
  if (schoolName && schoolName.trim() !== '' && schoolName.trim() !== 'المؤسسة التعليمية' && schoolName.trim() !== 'undefined' && schoolName.trim() !== 'null' && schoolName.trim() !== 'general') {
    return schoolName.trim();
  }

  if (schoolId) {
    const cleanId = schoolId.trim();
    const baseId = cleanId.replace(/-(boys|girls)$/i, '');
    const found = SCHOOLS_DATA.find(s => s.id === cleanId || s.id === baseId);
    if (found) return found.name;

    const lower = cleanId.toLowerCase();
    if (lower.includes('يمامة') || lower.includes('اليمامة') || lower.includes('yamama') || baseId === 'school6') return 'مدرسة اليمامة الابتدائية';
    if (lower.includes('نخبة') || lower.includes('النخبة') || baseId === 'school2') return 'ثانوية النخبة العلمية للبنين';
    if (lower.includes('نون') || baseId === 'school3') return 'ثانوية نون والقلم الاهلية';
    if (lower.includes('نبأ') || lower.includes('النبأ') || baseId === 'school4') return 'ثانوية النبأ العظيم الاهلية للبنات';
    if (lower.includes('عقيل') || baseId === 'school5') return 'مدارس ابن عقيل الأهلية';
    if (lower.includes('جواهري') || lower.includes('الجواهري') || baseId === 'school7') return 'مدارس الجواهري الاهلية';
    if (lower.includes('ابداعنا') || lower.includes('إبداعنا') || baseId === 'school8') return 'معهد ابداعنا للتعليم المطور';
    if (lower.includes('غماس') || lower.includes('أوائل') || lower.includes('اوائل') || baseId === 'school1') return 'ثانوية اوائل غماس الاهلية';

    if (cleanId.startsWith('مدرسة ') || cleanId.startsWith('ثانوية ') || cleanId.startsWith('معهد ') || cleanId.startsWith('مدارس ')) {
      return baseId;
    }
  }

  if (schoolName) {
    const name = schoolName.trim();
    if (name.includes('اليمامة') || name.includes('يمامة')) return 'مدرسة اليمامة الابتدائية';
    if (name.includes('النخبة')) return 'ثانوية النخبة العلمية للبنين';
    if (name.includes('نون')) return 'ثانوية نون والقلم الاهلية';
    if (name.includes('النبأ')) return 'ثانوية النبأ العظيم الاهلية للبنات';
    if (name.includes('عقيل')) return 'مدارس ابن عقيل الأهلية';
    if (name.includes('الجواهري')) return 'مدارس الجواهري الاهلية';
    if (name.includes('إبداعنا') || name.includes('ابداعنا')) return 'معهد ابداعنا للتعليم المطور';
    if (name.includes('غماس') || name.includes('أوائل') || name.includes('اوائل')) return 'ثانوية اوائل غماس الاهلية';
    if (name.includes('أكاديمية') || name.includes('اكاديمية') || name.includes('الرقمية') || name.includes('بيرق')) return 'أكاديمية بيرق الرقمية';
    return name;
  }

  return 'المؤسسة التعليمية';
}

