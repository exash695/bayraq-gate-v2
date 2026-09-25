import React, { useState, useEffect } from 'react';
import { ROLES, UserRole } from './types';
import { StudentHome } from './components/StudentHome';
import { TeacherHome } from './components/TeacherHome';
import { ParentHome } from './components/ParentHome';
import { AdminHome } from './components/AdminHome';
import { Login } from './components/Login';
import { customAuth, User } from './services/customAuthService';
import { GraduationCap, BookOpen, Users, ShieldAlert, Bell, Search, User as UserIcon, Sparkles, School, Settings, X, Check, LogOut } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await customAuth.ensureAuthReady();
      const currentUser = customAuth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const savedRole = localStorage.getItem('school_active_role');
        setActiveRole((savedRole as UserRole) || currentUser.role);
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    localStorage.setItem('school_active_role', role);
  };

  const handleLogout = () => {
    customAuth.logout();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => setUser(customAuth.getCurrentUser())} />;
  }

  const renderRoleComponent = () => {
    switch (activeRole) {
      case 'student':
        return <StudentHome key="student" />;
      case 'teacher':
        return <TeacherHome key="teacher" />;
      case 'parent':
        return <ParentHome key="parent" />;
      case 'admin':
        return <AdminHome key="admin" />;
      default:
        return <AdminHome key="admin" />;
    }
  };

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5" />;
      default:
        return <School className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-['Cairo',sans-serif]" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <School className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                منصة المنظومة التعليمية
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">الذكية</span>
              </h1>
              <p className="text-xs text-slate-500">نظام إدارة مدرسية متكامل متعدد الأدوار</p>
            </div>
          </div>

          {/* Quick Search & Notifications & Settings */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 w-56 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="text" 
                placeholder="ابحث عن حصة، طالب..." 
                className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400"
              />
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="إعدادات واجهة الدور"
            >
              <Settings className="w-5 h-5 text-slate-600" />
              <span className="hidden sm:inline">إعدادات الدور</span>
            </button>

            <button className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 pr-3 border-r border-slate-200 group relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center text-slate-700 font-bold border-2 border-transparent group-hover:border-blue-500 transition-all">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-bold text-slate-900 line-clamp-1">
                  {user?.name || 'مستخدم'}
                </div>
                <div className="text-xs text-slate-500">{activeRole === 'admin' ? 'مدير النظام' : 'نشط الآن'}</div>
              </div>

              {/* Logout Tooltip/Dropdown */}
              <button 
                onClick={handleLogout}
                className="p-2 mr-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Role Switcher Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-xs py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>معاينة واجهة الرئيسية حسب الدور:</span>
              <span className="font-extrabold text-blue-700">
                {activeRole === 'student' && 'الطالب'}
                {activeRole === 'teacher' && 'الأستاذ'}
                {activeRole === 'parent' && 'ولي الأمر'}
                {activeRole === 'admin' && 'مدير المدرسة'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              {ROLES.map((role) => {
                const isActive = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md scale-102 ring-2 ring-blue-600 ring-offset-2' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {getRoleIcon(role.iconName)}
                    <span>{role.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderRoleComponent()}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                إعدادات واجهة المستخدم والأدوار
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              اختر واجهة الدور الافتراضية التي ترغب في عرضها وتجربتها في الصفحة الرئيسية للمنصة:
            </p>

            <div className="space-y-3">
              {ROLES.map((role) => {
                const isSelected = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      handleRoleChange(role.id);
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-right transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {getRoleIcon(role.iconName)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{role.title}</div>
                        <div className="text-xs text-slate-500">{role.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                تم وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 منصة المنظومة التعليمية الذكية. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-800 transition-colors">الدعم الفني</a>
            <a href="#" className="hover:text-slate-800 transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-slate-800 transition-colors">دليل الاستخدام</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
