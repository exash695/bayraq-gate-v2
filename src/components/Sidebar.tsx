import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BerqCharacter } from './BerqCharacterManager';
import { 
  BookOpen, 
  Settings, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Home,
  Users,
  Shield,
  LogOut,
  Terminal,
  Scale,
  UserX,
  Monitor,
  User,
  Radio,
  Trophy,
  Lightbulb,
  Lock,
  Bell
} from 'lucide-react';
import { UnitId, AppSection, UserProgress } from '../types';
import { translations } from '../lib/translations';
import { auth } from '../lib/firebase';
import { deleteUser } from '@/src/lib/firebase';
import { customAuth } from '../services/customAuthService';
import { safeStorage } from '../lib/storage';

interface SidebarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onSelectUnit: (unitId: UnitId) => void;
  unlockedUnits: UnitId[];
  language: 'ar' | 'en';
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  progress: UserProgress;
  notifications: any[];
  onOpenNotifications: () => void;
  userProfile?: any;
}

type MenuItemProps = {
  label: string;
  subLabel?: string;
  icon: any;
  colorClass: string;
  isActive: boolean;
  onClick: () => void;
  showArrow?: boolean;
  badgeCount?: number;
};

const getColors = (colorName: string) => {
  const map: Record<string, any> = {
    cyan: {
      activeBg: 'from-cyan-500/20', activeBorder: 'border-cyan-500/40', activeShadow: 'shadow-cyan-500/20', activeLine: 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]',
      iconActiveBg: 'bg-cyan-500/30', iconActiveBorder: 'border-cyan-500/60', iconActiveText: 'text-cyan-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    },
    purple: {
      activeBg: 'from-purple-500/20', activeBorder: 'border-purple-500/40', activeShadow: 'shadow-purple-500/20', activeLine: 'bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)]',
      iconActiveBg: 'bg-purple-500/30', iconActiveBorder: 'border-purple-500/60', iconActiveText: 'text-purple-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(192,132,252,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    },
    sky: {
      activeBg: 'from-sky-500/20', activeBorder: 'border-sky-500/40', activeShadow: 'shadow-sky-500/20', activeLine: 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]',
      iconActiveBg: 'bg-sky-500/30', iconActiveBorder: 'border-sky-500/60', iconActiveText: 'text-sky-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(56,189,248,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    },
    rose: {
      activeBg: 'from-rose-500/20', activeBorder: 'border-rose-500/40', activeShadow: 'shadow-rose-500/20', activeLine: 'bg-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.8)]',
      iconActiveBg: 'bg-rose-500/30', iconActiveBorder: 'border-rose-500/60', iconActiveText: 'text-rose-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(251,113,133,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    },
    amber: {
      activeBg: 'from-amber-500/20', activeBorder: 'border-amber-500/40', activeShadow: 'shadow-amber-500/20', activeLine: 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
      iconActiveBg: 'bg-amber-500/30', iconActiveBorder: 'border-amber-500/60', iconActiveText: 'text-amber-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    },
    gold: {
      activeBg: 'from-yellow-500/20', activeBorder: 'border-yellow-500/40', activeShadow: 'shadow-yellow-500/20', activeLine: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]',
      iconActiveBg: 'bg-yellow-500/30', iconActiveBorder: 'border-yellow-500/60', iconActiveText: 'text-yellow-300', iconActiveShadow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
      iconInactiveBg: 'bg-white/5', iconInactiveBorder: 'border-white/10', iconInactiveText: 'text-white/50',
    }
  };
  return map[colorName] || map.cyan;
};

const MenuItem = ({ label, subLabel, icon: Icon, colorClass, isActive, onClick, showArrow = true, badgeCount }: MenuItemProps) => {
  const c = getColors(colorClass);
  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all duration-300 overflow-hidden border backdrop-blur-md ${
        isActive 
          ? `bg-gradient-to-l ${c.activeBg} to-white/5 ${c.activeBorder} shadow-lg ${c.activeShadow}` 
          : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
      }`}
    >
      
      {/* Active Edge Line */}
      {isActive && (
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[4px] h-[70%] rounded-l-full ${c.activeLine}`}></div>
      )}
      
      <div className="flex items-center gap-3 relative z-10 overflow-hidden flex-1">
        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border transition-all duration-300 ${
          isActive
            ? `${c.iconActiveBg} ${c.iconActiveBorder} ${c.iconActiveText} ${c.iconActiveShadow}` 
            : `${c.iconInactiveBg} ${c.iconInactiveBorder} ${c.iconInactiveText} group-hover:scale-110`
        }`}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <div className="flex flex-col items-start overflow-hidden w-full text-right">
          <span className={`text-[14px] font-black transition-colors truncate ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
            {label}
          </span>
          {subLabel && (
            <span className="text-[9px] font-medium text-white/40 italic truncate w-full">
              {subLabel}
            </span>
          )}
        </div>
      </div>
      
      {badgeCount !== undefined && badgeCount > 0 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-lg"
        >
          {badgeCount > 9 ? '+9' : badgeCount}
        </motion.div>
      )}

      {showArrow && !badgeCount && (
        <ChevronLeft size={16} className={`relative z-10 transition-colors shrink-0 ${isActive ? 'text-white/90' : 'text-white/30 group-hover:text-white/50'}`} />
      )}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSelectSection, 
  language,
  isOpen,
  setIsOpen,
  progress,
  userProfile,
  onOpenNotifications,
  notifications
}) => {
  const t = translations[language];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Rank display
  const rankDisplay = {
    squire: t.squire,
    knight: t.knight,
    commander: t.commander,
    guardian: t.guardian
  };

  const handleLogout = async () => {
    try {
      safeStorage.setItem('s6_user_logged_out', 'true');
      await customAuth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("يرجى تسجيل الدخول مجدداً قبل حذف الحساب.");
    }
  };

  const isRtl = language === 'ar';
  const isDev = auth.currentUser?.email === "mntzralghanm527@gmail.com" || userProfile?.email === "mntzralghanm527@gmail.com";

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {(isOpen || showLogoutConfirm || showDeleteConfirm) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsOpen(false);
              setShowLogoutConfirm(false);
              setShowDeleteConfirm(false);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0c0c14]/90 backdrop-blur-xl border border-amber-500/20 rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_40px_rgba(251,191,36,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                <LogOut size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">{t.logoutConfirmTitle}</h3>
                <p className="text-white/60 text-sm">{t.logoutConfirmMessage}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleLogout}
                  className="py-3 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-xl font-bold hover:bg-amber-500/30 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                >
                  {t.yes}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  {t.no}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0c0c14]/90 backdrop-blur-xl border border-rose-500/20 rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_40px_rgba(225,29,72,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-500/20">
                <UserX size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">تأكيد حذف الحساب</h3>
                <p className="text-white/60 text-sm">هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ لا يمكن التراجع عن هذه الخطوة وسيتم مسح جميع بياناتك وإنجازاتك.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  className="py-3 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-xl font-bold hover:bg-rose-500/30 transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                >
                  نعم، احذف حسابي
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Handle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed top-[120px] ${isRtl ? 'right-3' : 'left-3'} z-50 p-2.5 bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-cyan-500/50 text-cyan-400 transition-all rounded-full shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95`}
          title="إظهار القائمة الجانبية"
        >
          {isRtl ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-[280px] bg-[#020510]/80 backdrop-blur-2xl z-[90] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} rounded-none overflow-hidden border-x border-white/5`}
      >
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />
        </div>

        {/* Outer Glow / Border for the sidebar itself */}
        <div className={`absolute top-0 bottom-0 ${isRtl ? 'left-0' : 'right-0'} w-[2px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.6)]`}></div>
        
        {/* Close Button Inside Sidebar */}
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-[130px] p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all z-[100] cursor-pointer shadow-xl`}
            title="طي القائمة الجانبية"
          >
            {isRtl ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
          </button>
        )}

        {/* Header Section */}
        <div className="relative flex flex-col items-center w-full z-10 shrink-0">
          {/* Berq Character - Visible and prominent */}
          <div className="relative w-full h-[180px] overflow-hidden bg-[#070D22] border-b border-white/5 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-[#020510] via-transparent to-transparent z-10 pointer-events-none"></div>
            <BerqCharacter
              pose="captain_bairaq_guardian"
              glowColor="gold"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          
          <div className="relative z-20 flex flex-col items-center w-full px-5 -mt-6 mb-2">
            <div className="flex items-center gap-3 w-full bg-[#0a0f1d]/90 p-2.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
              <div className="w-11 h-11 rounded-full border border-cyan-500/40 bg-[#070b19] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.2)] relative">
                <User className="w-6 h-6 text-cyan-400 absolute z-0" />
                {(userProfile?.photoURL || auth.currentUser?.photoURL) && (
                  <img 
                    src={userProfile?.photoURL || auth.currentUser?.photoURL} 
                    alt="User" 
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <h2 className="text-white font-bold text-[13px] truncate">{userProfile?.fullName || auth.currentUser?.displayName || (language === 'ar' ? 'فارس منصة بيرق' : 'Knight')}</h2>
                <div className="px-2 py-[2px] bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-[9px] font-bold w-fit">
                  {isDev ? "مطور النظام" : (userProfile?.rank ? rankDisplay[userProfile?.rank as keyof typeof rankDisplay] : t.squire)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Divider */}
        <div className="relative flex items-center justify-center mb-3 px-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
        </div>

          {/* Navigation Menus */}
          <div className="flex-1 overflow-y-auto px-5 space-y-3 custom-scrollbar relative z-10 pb-6 pt-2">
            <MenuItem 
              label={language === 'ar' ? 'الرئيسية' : 'Home'}
              icon={Home}
              colorClass="cyan"
              isActive={activeSection === 'hub'}
              onClick={() => { onSelectSection('hub'); setIsOpen(false); }}
            />

            {(userProfile?.role === 'student' || !userProfile?.role) && (
              <>
                <MenuItem 
                  label="📡 رادار الذكاء"
                  subLabel="استنتاج الأسئلة الذكية"
                  icon={Radio}
                  colorClass="cyan"
                  isActive={activeSection === 'radar'}
                  onClick={() => { onSelectSection('radar'); setIsOpen(false); }}
                />

                <MenuItem 
                  label={language === 'ar' ? 'هوية الفارس' : 'Knight Identity'}
                  icon={Shield}
                  colorClass="purple"
                  isActive={activeSection === 'profile'}
                  onClick={() => { onSelectSection('profile'); setIsOpen(false); }}
                />

                <MenuItem 
                  label={language === 'ar' ? 'منصة السيادة' : 'Sovereignty'}
                  icon={Crown}
                  colorClass="purple"
                  isActive={activeSection === 'sovereignty'}
                  onClick={() => { onSelectSection('sovereignty'); setIsOpen(false); }}
                />
              </>
            )}

            {/* غرفة التحكم - ظاهرة لكافة الأدوار (طالب، أستاذ، ولي أمر، إدارة، مطور) */}
            <MenuItem 
              label={language === 'ar' ? 'غرفة التحكم' : 'Control Room'}
              icon={Settings}
              colorClass="sky"
              isActive={activeSection === 'control'}
              onClick={() => { onSelectSection('control'); setIsOpen(false); }}
            />

            {isDev && (
              <MenuItem 
                label="لوحة المطور"
                icon={Monitor}
                colorClass="cyan"
                isActive={activeSection === 'dev-dashboard'}
                onClick={() => { onSelectSection('dev-dashboard'); setIsOpen(false); }}
              />
            )}

            {/* Bottom Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
            </div>

            <MenuItem 
              label="حذف الحساب"
              icon={UserX}
              colorClass="rose"
              isActive={false}
              onClick={() => setShowDeleteConfirm(true)}
            />

            <MenuItem 
              label="تسجيل الخروج"
              icon={LogOut}
              colorClass="amber"
              isActive={false}
              onClick={() => setShowLogoutConfirm(true)}
            />
          </div>

      </aside>
    </>
  );
};

