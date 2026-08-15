export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface RoleInfo {
  id: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  color: string;
}

export const ROLES: RoleInfo[] = [
  {
    id: 'student',
    title: 'الطالب',
    subtitle: 'متابعة الواجبات، الدروس، والنتائج',
    badge: 'نشط',
    iconName: 'GraduationCap',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'teacher',
    title: 'الأستاذ',
    subtitle: 'إدارة الفصول، رصد الدرجات، والتحضير',
    badge: 'معلم متميز',
    iconName: 'BookOpen',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'parent',
    title: 'ولي الأمر',
    subtitle: 'متابعة مستوى الأبناء وحضورهم',
    badge: 'ولي أمر',
    iconName: 'Users',
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'admin',
    title: 'مدير المدرسة / الإدارة',
    subtitle: 'الرقابة الشاملة، التقارير، وإدارة الكادر',
    badge: 'مدير النظام',
    iconName: 'ShieldAlert',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  }
];
