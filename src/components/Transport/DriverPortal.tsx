import React, { useState } from 'react';
import { DriverDashboard } from './DriverDashboard';
import { DriverHomeSection } from './DriverHomeSection';
import { motion, AnimatePresence } from 'motion/react';
import { Bus, Map, Users, DollarSign, ShieldAlert, ArrowRight } from 'lucide-react';

interface DriverPortalProps {
  loggedInDriver: any;
  selectedSchoolId: string | null;
  onBack: () => void;
  userProfile?: any;
  institutionName?: string;
  onOpenNotifications?: () => void;
}

export function DriverPortal({
  loggedInDriver,
  selectedSchoolId,
  onBack,
  userProfile,
  institutionName,
  onOpenNotifications,
}: DriverPortalProps) {
  const [activeTab, setActiveTab] = useState<'route' | 'manifest' | 'finance' | 'alerts'>('route');

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0D1A] overflow-hidden flex flex-col" dir="rtl">
      {/* Absolute Back Button Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={onBack}
          className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white transition-colors rounded-2xl shadow-lg"
          title="العودة للرئيسية"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 h-full overflow-y-auto pb-24">
        {/* We use CSS display to keep DriverHomeSection mounted so it doesn't lose state (like route simulation) */}
        <div style={{ display: activeTab === 'route' ? 'block' : 'none' }}>
          <DriverHomeSection
            driverObj={loggedInDriver}
            userProfile={userProfile}
            schoolId={loggedInDriver?.schoolId || selectedSchoolId || "s1"}
            institutionName={institutionName}
            onOpenNotifications={onOpenNotifications}
            onNavigateToFullPanel={() => setActiveTab('manifest')} // Legacy prop, repurposed
          />
        </div>

        {activeTab !== 'route' && (
          <div className="pt-16 px-2 md:px-4">
            <DriverDashboard
              driverId={loggedInDriver?.id || "d1"}
              routeId={loggedInDriver?.routeId || "1"}
              driverObj={loggedInDriver}
              schoolId={loggedInDriver?.schoolId || selectedSchoolId || "s1"}
              onBack={() => setActiveTab('route')}
              forcedTab={activeTab}
            />
          </div>
        )}
      </div>

      {/* The Unified Bottom Glass Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="max-w-md mx-auto bg-[#11162A]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              activeTab === 'route' ? 'bg-amber-500/10 text-amber-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] font-black">الرحلة</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              activeTab === 'manifest' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-black">الركاب</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              activeTab === 'finance' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-black">المالية</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              activeTab === 'alerts' ? 'bg-rose-500/10 text-rose-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-black">تنبيهات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
