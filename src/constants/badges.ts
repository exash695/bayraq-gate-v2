import { Badge } from '../types';

export const BADGES: Badge[] = [
  {
    id: 'first-note',
    title: 'المدون الأول',
    description: 'قمت بكتابة أول ملاحظة لك في المنصة',
    icon: 'PenLine',
    category: 'general',
    color: 'emerald'
  },
  {
    id: 'challenge-perfect',
    title: 'قناص الستين',
    description: 'أجبت على جميع الأسئلة بشكل صحيح في تحدي الـ 60 ثانية',
    icon: 'Target',
    category: 'challenge',
    color: 'rose'
  },
  {
    id: 'page-master-5',
    title: 'الطالب المجتهد',
    description: 'أتممت دراسة 5 صفحات بنجاح',
    icon: 'BookOpen',
    category: 'general',
    color: 'blue'
  },
  {
    id: 'unit-1-conqueror',
    title: 'فاتح الوحدة الأولى',
    description: 'أكملت جميع صفحات الوحدة الأولى',
    icon: 'Trophy',
    category: 'unit',
    color: 'gold'
  },
  {
    id: 'unit-2-conqueror',
    title: 'فاتح الوحدة الثانية',
    description: 'أكملت جميع صفحات الوحدة الثانية',
    icon: 'Trophy',
    category: 'unit',
    color: 'gold'
  },
  {
    id: 'unit-3-conqueror',
    title: 'فاتح الوحدة الثالثة',
    description: 'أكملت جميع صفحات الوحدة الثالثة',
    icon: 'Trophy',
    category: 'unit',
    color: 'gold'
  },
  // Specialized Badges for Unit 1 (as an example, can be replicated for others)
  {
    id: 'unit-1-sniper',
    title: 'وسام القناص',
    description: 'حل القطع الاستيعابية للوحدة الأولى بدون أخطاء',
    icon: 'Crosshair',
    category: 'unit',
    color: 'rose'
  },
  {
    id: 'unit-1-dictionary',
    title: 'القاموس المتحرك',
    description: 'إكمال جميع تمارين الإسقاطات والمرادفات بنجاح كامل',
    icon: 'BookOpen',
    category: 'unit',
    color: 'emerald'
  },
  {
    id: 'unit-1-memory',
    title: 'الذاكرة الحديدية',
    description: 'إتقان الإنشاء وأسئلة الأدب الخاصة بالوحدة الأولى',
    icon: 'Lock',
    category: 'unit',
    color: 'gold'
  },
  {
    id: 'unit-1-persistent',
    title: 'وسام المثابر',
    description: 'قضاء أكثر من 30 دقيقة متواصلة في دراسة المسار الشامل',
    icon: 'Hourglass',
    category: 'unit',
    color: 'blue'
  },
  {
    id: 'unit-1-diamond',
    title: 'الوسام الماسي للوحدة',
    description: 'الختم النهائي: لقد هكّرت الوحدة الأولى بالكامل',
    icon: 'Gem',
    category: 'unit',
    color: 'gold'
  },
  {
    id: 'unit-1-ministerial-master',
    title: 'خبير الوزاريات',
    description: 'تصفح جميع الأسئلة الوزارية في الوحدة الأولى',
    icon: 'ScrollText',
    category: 'unit',
    color: 'purple'
  }
];
