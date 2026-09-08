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
    name: 'أكاديمية بيرق الرقمية', 
    type: 'منصة الدورات الألكترونية لنخبة الأساتذة',
    schoolBairaqImageUrl: '/schools/cover8.jpg',
    schoolLogoUrl: '/school-logos/logo8.jpg'
  },
];

/**
 * 1) صورة بيرق المخصصة للمدرسة (بطاقات قسم الميادين)
 */
export function getSchoolBairaqImageUrl(schoolId?: string, schoolName?: string): string {
  let relativePath = '/schools/cover1.jpg';
  if (schoolId) {
    const cleanId = String(schoolId).trim();
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
  }
  return relativePath;
}

/**
 * 3) اسم المدرسة الرسمي بالكامل (للختم والوصل الرقمي)
 */
export function getOfficialSchoolName(schoolId?: string, schoolName?: string): string {
  if (schoolName && schoolName.trim() !== '' && schoolName.trim() !== 'المؤسسة التعليمية') {
    return schoolName.trim();
  }

  if (schoolId) {
    const cleanId = schoolId.trim();
    const found = SCHOOLS_DATA.find(s => s.id === cleanId);
    if (found) return found.name;
  }

  if (schoolName) {
    const name = schoolName.trim();
    if (name.includes('غماس') || name.includes('أوائل') || name.includes('اوائل')) return 'ثانوية اوائل غماس الاهلية';
    if (name.includes('النخبة')) return 'ثانوية النخبة العلمية للبنين';
    if (name.includes('نون')) return 'ثانوية نون والقلم الاهلية';
    if (name.includes('النبأ')) return 'ثانوية النبأ العظيم الاهلية للبنات';
    if (name.includes('عقيل')) return 'مدارس ابن عقيل الأهلية';
    if (name.includes('اليمامة')) return 'مدرسة اليمامة الابتدائية';
    if (name.includes('الجواهري')) return 'مدارس الجواهري الاهلية';
    if (name.includes('أكاديمية') || name.includes('اكاديمية') || name.includes('الرقمية') || name.includes('إبداعنا') || name.includes('ابداعنا')) return 'أكاديمية بيرق الرقمية';
  }

  return 'ثانوية اوائل غماس الاهلية';
}

