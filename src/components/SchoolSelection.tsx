import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  ChevronLeft, 
  Search, 
  SlidersHorizontal, 
  Bell, 
  Home, 
  BookOpen, 
  Trophy, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  KeyRound, 
  Sparkles, 
  School as SchoolIconLucide, 
  GraduationCap, 
  Compass, 
  Star, 
  Landmark, 
  Activity,
  ArrowRight,
  Tv,
  Check,
  Lock,
  Clock
} from 'lucide-react';

import { safeStorage } from '../lib/storage';
import { SCHOOLS_DATA, getSchoolBairaqImageUrl, getOfficialSchoolLogoUrl } from '../lib/constants';
import { useCachedMedia } from '../hooks/useCachedMedia';
import { getCachedMediaUrl, getOptimizedImageUrl } from '../utils/imageCacher';
import { useAppLogo } from './BerqCharacterManager';
import { schoolService, SchoolRecord } from '../services/schoolService';

interface SchoolSelectionProps {
  onSelectSchool: (schoolId: string) => void;
  onBack: () => void;
  language: 'ar' | 'en';
  user?: any;
  userProfile?: any;
  onNavigateHome?: () => void;
  onNavigateHallOfFame?: () => void;
  onOpenNotifications?: () => void;
  notifications?: any[];
}

interface SchoolThemeConfig {
  bgGradient: string;
  borderColor: string;
  glowShadow: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  tagColor: string;
  city: string;
  students: number;
  buses: number;
  category: 'secondary' | 'primary' | 'institute' | 'elite';
  slogan: string;
  desc: string;
  icon: React.ComponentType<any>;
}

const SCHOOL_THEMES: Record<string, SchoolThemeConfig> = {
  school1: {
    bgGradient: 'from-[#0B1E4A] via-[#061230] to-[#030919]',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.16)',
    accentColor: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#93C5FD',
    tagColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
    city: 'الديوانية - حي المعلمين',
    students: 856,
    buses: 14,
    category: 'secondary',
    slogan: 'صرح متميز لتمكين الطلبة وإعدادهم للتفوق الدراسي الباهر',
    desc: 'ميدان تعليمي متكامل مجهز بأحدث الصفوف الذكية والتفاعلية لمواكبة تطلعات فرسان التميز الأبطال لكافة المراحل.',
    icon: GraduationCap,
  },
  school2: {
    bgGradient: 'from-[#063B2C] via-[#032219] to-[#01110C]',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.16)',
    accentColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#6EE7B7',
    tagColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
    city: 'الديوانية - شارع المصرف',
    students: 712,
    buses: 10,
    category: 'secondary',
    slogan: 'رعاية تامة للموهبة وبناء الفكر القيادي المتميز',
    desc: 'نظام أكاديمي صارم وبوتقة فكرية رائدة تهدف إلى تمكين الطالب من ناصية المنهج الدراسي واجتياز الامتحانات بامتياز.',
    icon: Sparkles,
  },
  school3: {
    bgGradient: 'from-[#3B1261] via-[#220938] to-[#0E0318]',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(168, 85, 247, 0.16)',
    accentColor: '#A855F7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeText: '#D8B4FE',
    tagColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
    city: 'الديوانية - حي السلام',
    students: 634,
    buses: 12,
    category: 'secondary',
    slogan: 'منارة المعرفة الساطعة ورائد التعليم العصري الحديث',
    desc: 'نجمع بين أصالة المحتوى وجودة الإلقاء لنقدم تجربة تعلم استثنائية تنمي الشغف والقدرات العقلية الفائقة.',
    icon: Compass,
  },
  school4: {
    bgGradient: 'from-[#4D2409] via-[#2D1404] to-[#140801]',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.16)',
    accentColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#FCD34D',
    tagColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
    city: 'الديوانية - حي العسكري',
    students: 543,
    buses: 8,
    category: 'secondary',
    slogan: 'الريادة والتميز لفتيات المستقبل وبطلات التفوق',
    desc: 'بيئة تعليمية آمنة ومحفزة للفتيات، توفر تدريساً نوعياً يضمن تحقيق الدرجات الكاملة في المواد الدراسية.',
    icon: Star,
  },
  school5: {
    bgGradient: 'from-[#0E3E4E] via-[#07242E] to-[#021015]',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(6, 182, 212, 0.16)',
    accentColor: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeText: '#67E8F9',
    tagColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    city: 'الديوانية - حي الحسين',
    students: 498,
    buses: 16,
    category: 'primary',
    slogan: 'التميز الأكاديمي الحقيقي والنهج التربوي الرصين',
    desc: 'مدارس رائدة تكرس طاقاتها لدعم الكفاءات الطلابية وتذليل الصعاب من خلال خطط دراسية متوازنة.',
    icon: SchoolIconLucide,
  },
  school6: {
    bgGradient: 'from-[#4A0A1D] via-[#2A0510] to-[#120106]',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(244, 63, 94, 0.16)',
    accentColor: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FDA4AF',
    tagColor: 'border-rose-500/30 text-rose-300 bg-rose-500/10',
    city: 'الديوانية - شارع الصحة',
    students: 420,
    buses: 6,
    category: 'primary',
    slogan: 'تأسيس قويم وتوجيه سليم لبناء أجيال الغد المشرق',
    desc: 'تأسيس علمي متين يبدأ من المراحل الأساسية ويهتم ببناء العقل المبدع والشخصية الواثقة.',
    icon: Users,
  },
  school7: {
    bgGradient: 'from-[#231E6E] via-[#141142] to-[#08061F]',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    glowShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.16)',
    accentColor: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeText: '#A5B4FC',
    tagColor: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
    city: 'الديوانية - حي العباس',
    students: 580,
    buses: 15,
    category: 'elite',
    slogan: 'منارة العلم والأدب السامقة في سماء العراق',
    desc: 'منظومة الجواهري التعليمية تحرص على الدمج التام بين التفوق العلمي والمبادئ الأخلاقية لبناء فرسان متميزين.',
    icon: Landmark,
  },
  school8: {
    bgGradient: 'from-[#062c21] via-[#031c15] to-[#010e0a]',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    glowShadow: '0 4px 25px -2px rgba(16, 185, 129, 0.25)',
    accentColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
    badgeText: '#6EE7B7',
    tagColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/15',
    city: 'الديوانية - غماس',
    students: 480,
    buses: 8,
    category: 'institute',
    slogan: 'تعليم نوعي وتطوير مستمر للأجيال',
    desc: 'معهد إبداعنا للتعليم المطور يقدم بيئة تعليمية متقدمة تركز على بناء القدرات وتطوير المهارات العلمية بأحدث الوسائل.',
    icon: GraduationCap,
  },
  general: {
    bgGradient: 'from-[#381E02] via-[#200F01] to-[#0A0400]',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    glowShadow: '0 4px 25px -2px rgba(245, 158, 11, 0.25)',
    accentColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    badgeText: '#FCD34D',
    tagColor: 'border-amber-500/40 text-amber-300 bg-amber-500/15',
    city: 'العراق - دورات نخبة الأساتذة',
    students: 1450,
    buses: 0,
    category: 'institute',
    slogan: 'منصة الدورات الألكترونية لنخبة الأساتذة',
    desc: 'الملتقى الرقمي الأكاديمي لدورات نخبة الأساتذة، الملازم التفاعلية، تحديات الـ 60 ثانية وبنك الأفكار الذكية.',
    icon: GraduationCap,
  },
  academy: {
    bgGradient: 'from-[#381E02] via-[#200F01] to-[#0A0400]',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    glowShadow: '0 4px 25px -2px rgba(245, 158, 11, 0.25)',
    accentColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    badgeText: '#FCD34D',
    tagColor: 'border-amber-500/40 text-amber-300 bg-amber-500/15',
    city: 'العراق - دورات نخبة الأساتذة',
    students: 1450,
    buses: 0,
    category: 'institute',
    slogan: 'منصة الدورات الألكترونية لنخبة الأساتذة',
    desc: 'الملتقى الرقمي الأكاديمي لدورات نخبة الأساتذة، الملازم التفاعلية، تحديات الـ 60 ثانية وبنك الأفكار الذكية.',
    icon: GraduationCap,
  },
};

const DEFAULT_THEME: SchoolThemeConfig = {
  bgGradient: 'from-[#0B1E4A] via-[#061230] to-[#030919]',
  borderColor: 'rgba(59, 130, 246, 0.3)',
  glowShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.16)',
  accentColor: '#3B82F6',
  badgeBg: 'rgba(59, 130, 246, 0.15)',
  badgeText: '#93C5FD',
  tagColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  city: 'الديوانية - غماس',
  students: 450,
  buses: 8,
  category: 'secondary',
  slogan: 'صرح بيرق التعليمي المتكامل لكافة المراحل والطلبة الأبطال',
  desc: 'نوفر منصة تعليمية وتواصلية متقدمة لتغطية كافة متطلبات النجاح الأكاديمي.',
  icon: SchoolIconLucide,
};

const SchoolCardCoverImage: React.FC<{
  schoolId: string;
  imageUrl: string;
  altText: string;
}> = ({ schoolId, imageUrl, altText }) => {
  const { url: cachedUrl } = useCachedMedia(imageUrl, 800);
  const [imgSrc, setImgSrc] = useState<string>(cachedUrl || imageUrl);
  const [fallbackCount, setFallbackCount] = useState<number>(0);

  useEffect(() => {
    setImgSrc(cachedUrl || imageUrl);
    setFallbackCount(0);
  }, [cachedUrl, imageUrl]);

  return (
    <img 
      src={imgSrc} 
      alt={altText}
      className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
      loading="eager"
      decoding="async"
      onError={() => {
        const num = schoolId.replace(/\D/g, '') || '1';
        if (fallbackCount === 0) {
          setFallbackCount(1);
          setImgSrc(`/schools/cover${num}.jpg`);
        } else if (fallbackCount === 1) {
          setFallbackCount(2);
          setImgSrc('/schools/cover1.jpg');
        } else {
          setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        }
      }}
    />
  );
};

const SchoolLogoBadge: React.FC<{
  schoolId: string;
  schoolName: string;
  customLogoUrl?: string;
  themeColor: string;
}> = ({ schoolId, schoolName, customLogoUrl, themeColor }) => {
  const logoUrl = getOfficialSchoolLogoUrl(schoolId, schoolName, customLogoUrl);
  const { url: cachedUrl } = useCachedMedia(logoUrl, 300);
  const [imgSrc, setImgSrc] = useState<string>(cachedUrl || logoUrl);
  const [fallbackCount, setFallbackCount] = useState<number>(0);

  useEffect(() => {
    setImgSrc(cachedUrl || logoUrl);
    setFallbackCount(0);
  }, [cachedUrl, logoUrl]);

  return (
    <div 
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/40 p-0 flex items-center justify-center shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
      style={{
        boxShadow: `0 0 14px ${themeColor}40`,
        borderColor: themeColor
      }}
    >
      <img 
        src={imgSrc} 
        alt={schoolName}
        className="w-full h-full object-cover rounded-full"
        loading="lazy"
        onError={() => {
          const num = schoolId.replace(/\D/g, '') || '1';
          if (fallbackCount === 0) {
            setFallbackCount(1);
            setImgSrc(`/school-logos/logo${num}.jpg`);
          } else if (fallbackCount === 1) {
            setFallbackCount(2);
            setImgSrc('/logo.png');
          } else {
            setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
          }
        }}
      />
    </div>
  );
};

export const SchoolSelection: React.FC<SchoolSelectionProps> = ({ 
  onSelectSchool, 
  onBack, 
  language,
  user,
  userProfile,
  onNavigateHome,
  onNavigateHallOfFame,
  onOpenNotifications,
  notifications = []
}) => {
  const appLogo = useAppLogo();
  const [apiSchools, setApiSchools] = useState<SchoolRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [sheetSchoolId, setSheetSchoolId] = useState<string | null>(null);
  const [sheetCode, setSheetCode] = useState<string>('');
  const [sheetError, setSheetError] = useState<string>('');
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [blockedSchoolNotice, setBlockedSchoolNotice] = useState<{
    name: string;
    type: 'suspended' | 'coming_soon';
    message: string;
  } | null>(null);

  // Fetch active and suspended schools directly from PostgreSQL internal API
  useEffect(() => {
    let isMounted = true;
    
    const loadSchools = async () => {
      try {
        const list = await schoolService.fetchSchools();
        if (isMounted) {
          setApiSchools(list);
        }
      } catch (err) {
        console.warn('Error loading schools from PostgreSQL:', err);
      }
    };

    loadSchools();

    // Auto-refresh periodically to keep state fresh without Firestore costs
    const interval = setInterval(loadSchools, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Helper to normalize Arabic school names for duplicate detection
  const normalizeSchoolName = (name?: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\s\-_]/g, '')
      .trim();
  };

  const isAcademySchool = (school: any) => {
    if (!school) return false;
    if (school.id === 'school8') return false;
    const norm = normalizeSchoolName(school.name);
    if (norm.includes('ابداعنا') || norm.includes('ابداع')) return false;
    return (
      school.id === 'general' ||
      school.id === 'academy' ||
      norm.includes('اكاديميه') ||
      norm.includes('اكاديمية') ||
      norm.includes('بيرقالرقميه') ||
      norm.includes('بيرقالرقمية')
    );
  };

  const isSchoolSuspended = (school: any) => {
    if (!school) return false;
    return (
      school.status === 'suspended' ||
      school.status === 'inactive' ||
      school.status === 'disabled' ||
      school.status === 'frozen' ||
      school.isSuspended === true
    );
  };

  // Merge predefined static list with real-time PostgreSQL updates with strict deduplication
  const allSchools = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    let deletedSchoolIds: string[] = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const savedDeleted = localStorage.getItem("s6_deleted_system_schools");
        if (savedDeleted) {
          deletedSchoolIds = JSON.parse(savedDeleted);
        }
      }
    } catch (e) {}

    const merged = SCHOOLS_DATA
      .filter(sysSchool => !deletedSchoolIds.includes(sysSchool.id))
      .map(sysSchool => {
        const sysNorm = normalizeSchoolName(sysSchool.name);
        const fs = apiSchools.find(f => f.id === sysSchool.id || normalizeSchoolName(f.name) === sysNorm);
        const loc = fs?.location || fs?.city || fs?.governorate || (sysSchool as any).location || (sysSchool as any).city || 'الديوانية - غماس';
        const st = fs?.status || (sysSchool as any).status || 'active';
        
        const item = {
          ...sysSchool,
          name: fs?.name || sysSchool.name,
          type: fs?.type || sysSchool.type,
          city: loc,
          location: loc,
          status: st,
          isSuspended: (fs as any)?.isSuspended || st === 'suspended',
          students: fs?.students || 350,
          schoolBairaqImageUrl: fs?.coverUrl || fs?.schoolBairaqImageUrl || sysSchool.schoolBairaqImageUrl,
          schoolLogoUrl: fs?.logoUrl || fs?.schoolLogoUrl || sysSchool.schoolLogoUrl,
        };

        seenIds.add(item.id);
        seenNames.add(normalizeSchoolName(item.name));
        return item;
      });

    apiSchools.forEach((fs) => {
      if (deletedSchoolIds.includes(fs.id) || fs.id === 'school_awail_ghamas' || fs.name === 'مدرسة جديدة') {
        return;
      }
      const fsNorm = normalizeSchoolName(fs.name);
      if (!seenIds.has(fs.id) && !seenNames.has(fsNorm)) {
        seenIds.add(fs.id);
        seenNames.add(fsNorm);
        merged.push({
          ...fs,
          type: fs.type || 'ميدان تعليمي',
          city: fs.location || fs.city || fs.governorate || 'الديوانية - غماس',
          location: fs.location || fs.city || fs.governorate || 'الديوانية - غماس',
          status: fs.status || 'active',
          isSuspended: (fs as any)?.isSuspended || fs.status === 'suspended',
          students: fs.students || fs.studentsCount || 350,
          schoolBairaqImageUrl: fs.coverUrl || fs.schoolBairaqImageUrl || getSchoolBairaqImageUrl(fs.id, fs.name),
          schoolLogoUrl: fs.logoUrl || fs.schoolLogoUrl || getOfficialSchoolLogoUrl(fs.id, fs.name),
        });
      }
    });
    return merged;
  }, [apiSchools]);

  // Background precache school cards
  useEffect(() => {
    allSchools.forEach((school) => {
      const url = school.schoolBairaqImageUrl || getSchoolBairaqImageUrl(school.id, school.name);
      if (url) {
        const optimizedUrl = getOptimizedImageUrl(url, 800);
        getCachedMediaUrl(optimizedUrl).catch(() => {});
      }
    });
  }, [allSchools]);

  // Filter categories
  const categories = [
    { id: 'all', label: 'جميع المدارس' },
    { id: 'secondary', label: 'ثانويات' },
    { id: 'primary', label: 'ابتدائيات' },
    { id: 'institute', label: 'الأكاديمية والمعاهد' },
  ];

  // Filtered Schools list based on search and category
  const filteredSchools = useMemo(() => {
    return allSchools.filter((school) => {
      const theme = SCHOOL_THEMES[school.id] || DEFAULT_THEME;
      const schoolCity = school.city || theme.city;

      // Filter by category
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'secondary' && !school.name.includes('ثانوية') && theme.category !== 'secondary') {
          return false;
        }
        if (selectedCategory === 'primary' && !school.name.includes('ابتدائية') && theme.category !== 'primary') {
          return false;
        }
        if (selectedCategory === 'institute' && !school.name.includes('معهد') && !school.name.includes('أكاديمية') && !school.name.includes('اكاديمية') && theme.category !== 'institute') {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const queryClean = searchQuery.toLowerCase().trim();
        const matchesName = school.name.toLowerCase().includes(queryClean);
        const matchesCity = schoolCity.toLowerCase().includes(queryClean);
        const matchesType = (school.type || '').toLowerCase().includes(queryClean);
        return matchesName || matchesCity || matchesType;
      }

      return true;
    });
  }, [allSchools, searchQuery, selectedCategory]);

  const handleSchoolClick = (schoolId: string) => {
    safeStorage.setItem('s6_preferred_school', schoolId);
    safeStorage.setItem('s6_selectedSchoolId', schoolId);
    onSelectSchool(schoolId);
  };

  const handleCardClick = (school: any) => {
    if (isSchoolSuspended(school)) {
      setBlockedSchoolNotice({
        name: school.name,
        type: 'suspended',
        message: `تم تعطيل وتجميد (${school.name}) حالياً من قبل إدارة المطور. تم إيقاف الدخول وكافة الخدمات مؤقتاً.`
      });
      return;
    }
    if (isAcademySchool(school)) {
      setBlockedSchoolNotice({
        name: school.name,
        type: 'coming_soon',
        message: 'أكاديمية بيرق الرقمية - قريباً | يجري حالياً تجهيز المنصة الإلكترونية لنخبة الأساتذة والدورات التفاعلية المباشرة.'
      });
      return;
    }
    handleSchoolClick(school.id);
  };

  const handleSheetSubmit = () => {
    const cleanCode = sheetCode.trim().toUpperCase();
    if (!cleanCode) {
      setSheetError('يرجى إدخال كود العبور الخاص بك أولاً');
      return;
    }
    
    if (sheetSchoolId) {
      safeStorage.setItem(`s6_savedCode_${sheetSchoolId}`, cleanCode);
      safeStorage.setItem('s6_preferred_school', sheetSchoolId);
      safeStorage.setItem('s6_selectedSchoolId', sheetSchoolId);
      onSelectSchool(sheetSchoolId);
      setSheetSchoolId(null);
      setSheetCode('');
      setSheetError('');
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#030712] text-white flex flex-col relative select-none font-sans overflow-x-hidden"
      dir="rtl"
      id="mayadeen-page"
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      {/* 1. Header (رأس الصفحة) */}
      <header className="sticky top-0 z-40 w-full bg-[#030712]/85 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Right side: Title & Subtitle + Bairaq Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#091124] border border-amber-400/40 p-0 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(255,214,0,0.18)] shrink-0"
              id="bairaq-header-logo"
            >
              <img 
                src={appLogo} 
                alt="بوابة بيرق" 
                className="w-full h-full object-cover scale-125 transform-gpu"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }} 
              />
            </div>
            
            <div className="flex flex-col text-right">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                الميادين
              </h1>
              <p className="text-[11px] sm:text-xs text-white/50 font-medium leading-none mt-0.5">
                جميع مدارس بوابة بيرق
              </p>
            </div>
          </div>

          {/* Left side: Notifications Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  setShowNotificationModal(true);
                }
              }}
              className="relative w-10 h-10 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 border border-white/10 flex items-center justify-center transition-all text-white/80 hover:text-white"
              id="btn-notifications-toggle"
              aria-label="الإشعارات"
            >
              <Bell size={18} />
              {/* Notification indicator dot */}
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-[#FFD600] shadow-[0_0_8px_#FFD600]" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28 relative z-10 flex flex-col">
        
        {/* 2. Search & Filter Bar (البحث والتصفية) */}
        <section className="w-full mb-4 space-y-3" id="mayadeen-search-filter">
          <div className="flex items-center gap-2.5 w-full">
            
            {/* Search Input Box */}
            <div className="relative flex-1">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex items-center">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مدرسة..."
                className="w-full h-11 pr-11 pl-9 bg-[#0A0F1D]/90 border border-white/10 hover:border-white/20 focus:border-indigo-500/60 rounded-2xl text-xs sm:text-sm text-white placeholder:text-white/40 outline-none transition-all shadow-inner backdrop-blur-md"
                id="input-school-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="مسح البحث"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`h-11 px-4 rounded-2xl border transition-all flex items-center gap-2 text-xs sm:text-sm font-bold active:scale-95 shadow-sm shrink-0 backdrop-blur-md ${
                isFilterDrawerOpen || selectedCategory !== 'all'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-[#0A0F1D]/90 border-white/10 hover:bg-white/5 text-white/80 hover:text-white'
              }`}
              id="btn-filter-toggle"
            >
              <SlidersHorizontal size={16} />
              <span>تصفية</span>
              {selectedCategory !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </button>

          </div>

          {/* Quick Filter Chips (Collapsible or permanently accessible) */}
          <AnimatePresence>
            {(isFilterDrawerOpen || selectedCategory !== 'all') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-1"
              >
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`h-8 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)] font-black'
                            : 'bg-[#0A0F1D]/80 border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 whitespace-nowrap underline underline-offset-4"
                    >
                      إلغاء التصفية
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. School Cards List (بطاقات المدارس) */}
        <section className="w-full space-y-2.5 sm:space-y-3" id="mayadeen-school-cards-list">
          {filteredSchools.length === 0 ? (
            <div className="w-full py-16 px-4 text-center rounded-3xl bg-[#0A0F1D]/50 border border-white/5 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-white/80">لم يتم العثور على أي مدرسة مطابقة</h3>
              <p className="text-xs text-white/40 max-w-xs">
                تأكد من كتابة اسم المدرسة بشكل صحيح أو قم بإلغاء التصفية لعرض جميع المدارس.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
              >
                عرض كافة المدارس
              </button>
            </div>
          ) : (
            filteredSchools.map((school, index) => {
              const theme = SCHOOL_THEMES[school.id] || DEFAULT_THEME;
              const coverUrl = school.schoolBairaqImageUrl || getSchoolBairaqImageUrl(school.id, school.name);
              const schoolCity = school.location || school.city || theme.city;
              const isSuspended = isSchoolSuspended(school);
              const isAcademy = isAcademySchool(school);

              return (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  onClick={() => handleCardClick(school)}
                  className={`group relative w-full min-h-[102px] sm:min-h-[108px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 transform-gpu hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-l ${
                    isSuspended 
                      ? 'from-[#1a0f18] via-[#0f0c18] to-[#0a0712] border-rose-500/40 opacity-90' 
                      : theme.bgGradient
                  }`}
                  style={{
                    borderColor: isSuspended ? '#f43f5e66' : theme.borderColor,
                    boxShadow: isSuspended ? '0 0 15px rgba(244,63,94,0.15)' : theme.glowShadow
                  }}
                  id={`school-card-${school.id}`}
                >
                  {/* Subtle Neon Inner Glow Highlight on Hover */}
                  <div 
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 border"
                    style={{ borderColor: isSuspended ? '#f43f5e99' : `${theme.accentColor}80` }}
                  />

                  {/* Left Side: School Cover Image */}
                  <div className={`absolute top-0 bottom-0 left-0 w-[38%] sm:w-[42%] md:w-[45%] overflow-hidden pointer-events-none flex items-center justify-center ${isSuspended ? 'grayscale-[50%] opacity-60' : ''}`}>
                    <SchoolCardCoverImage
                      schoolId={school.id}
                      imageUrl={coverUrl}
                      altText={school.name}
                    />
                  </div>

                  {/* Right Side: School Content Information (RTL Layout) */}
                  <div className="relative z-10 w-full h-full p-3 sm:p-3.5 md:p-4 flex flex-col justify-between max-w-[70%] sm:max-w-[65%]">
                    
                    {/* Top Row: School Logo (Right) + Full School Name & Location & Badges */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      
                      {/* 1. School Official Logo in Circular Glowing Frame */}
                      <div className="pt-0.5 shrink-0">
                        <SchoolLogoBadge
                          schoolId={school.id}
                          schoolName={school.name}
                          customLogoUrl={school.schoolLogoUrl}
                          themeColor={isSuspended ? '#f43f5e' : theme.accentColor}
                        />
                      </div>

                      {/* Text details column: Full School Name, Status Badge & Location */}
                      <div className="flex flex-col justify-center text-right space-y-1 min-w-0 flex-1">
                        
                        {/* Status Badges: Frozen / Coming Soon */}
                        {isSuspended && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] sm:text-[10px] font-black w-fit">
                            <Lock size={10} className="text-rose-400 shrink-0" />
                            <span className="whitespace-nowrap">معطلة أو مجمدة من قبل المطور</span>
                          </div>
                        )}

                        {!isSuspended && isAcademy && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] sm:text-[10px] font-black w-fit">
                            <Sparkles size={10} className="text-amber-400 shrink-0 animate-pulse" />
                            <span className="whitespace-nowrap">قريباً • إطلاق مرتقب</span>
                          </div>
                        )}

                        {/* 2. School Name */}
                        <h2 className={`text-xs sm:text-[13px] md:text-sm font-black leading-snug tracking-tight break-words transition-colors ${
                          isSuspended ? 'text-white/80 group-hover:text-rose-300' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {school.name}
                        </h2>

                        {/* 3. Location / District */}
                        <div className="flex items-start gap-1 text-[#00E5FF]/90 sm:text-[#00E5FF] text-[10px] sm:text-[11px] font-semibold leading-tight pt-0.5">
                          <MapPin size={12} className="text-[#00E5FF] shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(0,229,255,0.4)]" />
                          <span className="break-words leading-tight">{schoolCity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Action Button */}
                    <div className="flex items-center justify-start pr-0 sm:pr-0.5 pt-1.5">
                      {isSuspended ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(school);
                          }}
                          className="h-6 sm:h-6.5 px-3 rounded-full bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 border border-rose-500/40 text-rose-300 font-black text-[10px] sm:text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm group/btn"
                          id={`btn-enter-school-${school.id}`}
                        >
                          <Lock size={11} className="text-rose-400" />
                          <span>معطلة من قبل المطور</span>
                        </button>
                      ) : isAcademy ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(school);
                          }}
                          className="h-6 sm:h-6.5 px-3.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 font-black text-[10px] sm:text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm group/btn"
                          id={`btn-enter-school-${school.id}`}
                        >
                          <Clock size={11} className="text-amber-400 animate-pulse" />
                          <span>قريباً</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(school);
                          }}
                          className="h-6 sm:h-6.5 px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.18] active:scale-95 border border-white/15 hover:border-white/30 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 backdrop-blur-md transition-all shadow-sm group/btn"
                          id={`btn-enter-school-${school.id}`}
                        >
                          <span>دخول المدرسة</span>
                          <ChevronLeft size={12} className="text-white/70 transition-transform group-hover/btn:-translate-x-0.5" />
                        </button>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })
          )}
        </section>

      </main>

      {/* 4. Bottom Navigation Bar (الشريط السفلي المتناسق) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none flex justify-center"
        id="mayadeen-bottom-nav"
      >
        <div className="w-full max-w-[320px] pointer-events-auto bg-[#0A0F1D]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-3 py-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-h-[64px]">
          
          {/* Nav: الرئيسية (Home - Right in RTL) */}
          <button
            onClick={() => {
              if (onNavigateHome) {
                onNavigateHome();
              } else {
                onBack();
              }
            }}
            className="flex-1 flex flex-col justify-center items-center h-full text-white/40 hover:text-white/80 transition-all duration-300 group"
            id="nav-home-btn"
          >
            <Home size={20} className="mb-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          {/* Nav: الميادين (Mayadeen / Center - ACTIVE) */}
          <div className="flex-none px-2 relative -top-3">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-[54px] h-[54px] rounded-full flex flex-col items-center justify-center transition-all duration-300 outline outline-[4px] outline-[#030712] bg-gradient-to-br from-[#00E5FF]/25 to-[#007b8a]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.35)] scale-105"
              id="nav-mayadeen-active-btn"
              title="الميادين"
            >
              <BookOpen size={22} className="drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
            </button>
          </div>

          {/* Nav: الفرسان (Hall of Fame - Left in RTL) */}
          <button
            onClick={() => {
              if (onNavigateHallOfFame) {
                onNavigateHallOfFame();
              }
            }}
            className="flex-1 flex flex-col justify-center items-center h-full text-white/40 hover:text-white/80 transition-all duration-300 group"
            id="nav-knights-btn"
          >
            <Trophy size={20} className="mb-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold">الفرسان</span>
          </button>

        </div>
      </nav>

      {/* Notifications Drawer / Modal (If onOpenNotifications not provided) */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0A0F1D] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#FFD600] flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <h3 className="text-base font-black text-white">إشعارات الميادين الموحدة</h3>
                </div>
                <button 
                  onClick={() => setShowNotificationModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 py-2 max-h-60 overflow-y-auto">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#00E5FF]">✨ مرحباً بك في بوابة بيرق</span>
                    <span className="text-[10px] text-white/40">الآن</span>
                  </div>
                  <p className="text-xs text-white/70">
                    تم تحديث وتفعيل كافة الميادين التعليمية بنظام البث الذكي والربط السحابي الموحد.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400">🛡️ نظام حماية الفرسان</span>
                    <span className="text-[10px] text-white/40">اليوم</span>
                  </div>
                  <p className="text-xs text-white/70">
                    يمكنك الدخول المباشر لمدرستك وحفظ كود العبور الخاص بك تلقائياً.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-black transition-all"
              >
                إغلاق الإشعارات
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blocked / Suspended / Coming Soon School Modal */}
      <AnimatePresence>
        {blockedSchoolNotice && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 select-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBlockedSchoolNotice(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 space-y-4 border text-center ${
                blockedSchoolNotice.type === 'suspended'
                  ? 'bg-[#130d1b] border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)]'
                  : 'bg-[#0f1424] border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
              }`}
            >
              <div className="flex justify-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                  blockedSchoolNotice.type === 'suspended'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  {blockedSchoolNotice.type === 'suspended' ? (
                    <Lock size={28} />
                  ) : (
                    <Clock size={28} className="animate-pulse" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">
                  {blockedSchoolNotice.name}
                </h3>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  blockedSchoolNotice.type === 'suspended'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }">
                  {blockedSchoolNotice.type === 'suspended' ? '🚫 معطلة أو مجمدة من قبل المطور' : '✨ قريباً • إطلاق مرتقب'}
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed px-2">
                {blockedSchoolNotice.message}
              </p>

              <button
                onClick={() => setBlockedSchoolNotice(null)}
                className={`w-full h-11 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-md ${
                  blockedSchoolNotice.type === 'suspended'
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black'
                }`}
              >
                فهمت ذلك
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Passcode Bottom Sheet (If needed for direct code input) */}
      <AnimatePresence>
        {sheetSchoolId && (() => {
          const s = allSchools.find(item => item.id === sheetSchoolId);
          if (!s) return null;
          const details = SCHOOL_THEMES[sheetSchoolId] || DEFAULT_THEME;

          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center select-none" dir="rtl">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSheetSchoolId(null);
                  setSheetCode('');
                  setSheetError('');
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-full max-w-lg bg-[#080d1e]/98 border-t border-white/10 rounded-t-[28px] shadow-[0_-15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col overflow-hidden max-h-[85vh] z-10"
              >
                <div className="w-full h-10 flex items-center justify-between px-5 shrink-0 relative border-b border-white/5">
                  <div className="w-10 h-1 bg-white/15 rounded-full absolute left-1/2 -translate-x-1/2 top-3 pointer-events-none" />
                  <span className="text-[9px] font-black text-white/30 tracking-wider uppercase">تفعيل الميدان التعليمي</span>
                  
                  <button 
                    onClick={() => {
                      setSheetSchoolId(null);
                      setSheetCode('');
                      setSheetError('');
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white/60 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-right">
                  <div className="flex items-start gap-3">
                    <SchoolLogoBadge
                      schoolId={s.id}
                      schoolName={s.name}
                      customLogoUrl={s.schoolLogoUrl}
                      themeColor={details.accentColor}
                    />
                    
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black uppercase tracking-wider text-white/30 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                        {s.type || 'ميدان تعليمي'}
                      </span>
                      <h2 className="text-lg font-black text-white leading-tight">
                        {s.name}
                      </h2>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black text-[#FFD600] leading-snug mb-1">
                      {details.slogan}
                    </p>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      {details.desc}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#00E5FF] tracking-wider uppercase flex items-center gap-1">
                        <KeyRound size={11} />
                        كود تفعيل العبور الفوري
                      </span>
                      <span className="text-[9px] text-white/30 font-bold">مثال: STU-XXXX</span>
                    </div>

                    <div className="relative">
                      <input 
                        type="text"
                        value={sheetCode}
                        onChange={(e) => {
                          setSheetCode(e.target.value.toUpperCase());
                          setSheetError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSheetSubmit();
                          }
                        }}
                        placeholder="أدخل كود العبور الخاص بك هنا"
                        className="w-full h-11 bg-[#10172e] border border-white/10 focus:border-[#FFD600] rounded-xl text-center text-white placeholder:text-white/20 text-sm font-bold tracking-widest outline-none transition-all shadow-inner"
                      />
                      {sheetError && (
                        <p className="text-rose-500 text-[10px] mt-1.5 font-bold flex items-center gap-1 justify-start">
                          <ShieldAlert size={10} />
                          {sheetError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSheetSubmit}
                      className="w-full h-11 bg-gradient-to-r from-[#FFD600] to-[#FF8F00] text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-98 transition-all"
                    >
                      <span>تأكيد وتفعيل الدخول ⚡</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
