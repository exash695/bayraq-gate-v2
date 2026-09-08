import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag, Settings, Shield, Plus, Edit2, CheckCircle2, ChevronRight, PieChart, Users, Star } from 'lucide-react';

export function AdminSovereigntyManager({ language, selectedSchoolId }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'tournaments' | 'flags' | 'settings'>('tournaments');

  const tabs = [
    { id: 'tournaments', label: language === "ar" ? "دوري المدارس والبطولات" : "Tournaments & Leagues", icon: Trophy },
    { id: 'flags', label: language === "ar" ? "مصنع الرايات والشارات" : "Flags & Badges Factory", icon: Flag },
    { id: 'settings', label: language === "ar" ? "ميزان النقاط والإعدادات" : "Points Balance & Settings", icon: Settings },
  ] as const;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col lg:flex-row gap-4" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Sidebar for Admin Sovereignty */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="bg-[#0A0F1D] border border-amber-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <Shield className="text-amber-400" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-sm">{language === "ar" ? "إدارة السيادة" : "Sovereignty Admin"}</h2>
              <p className="text-white/50 text-[10px]">{language === "ar" ? "مركز القيادة والتحكم" : "Command Center"}</p>
            </div>
          </div>
          
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-bold shrink-0 lg:w-full ${language === "ar" ? "text-right" : "text-left"} ${
                    isActive 
                      ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-[#0A0F1D] to-indigo-900/20 border border-white/5 rounded-2xl p-4 flex-1">
          <h3 className="text-xs font-black text-white/50 mb-3 uppercase tracking-wider">{language === "ar" ? "رادار السيادة" : "Sovereignty Radar"}</h3>
          <div className="space-y-3">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/50">{language === "ar" ? "المدرسة الأنشط" : "Most Active School"}</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1"><Star size={10} /> إعدادية الكرار</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/50">{language === "ar" ? "البطولات الجارية" : "Live Tournaments"}</p>
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1"><Trophy size={10} /> 3 بطولات</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/50">{language === "ar" ? "إجمالي الرايات الممنوحة" : "Total Flags Granted"}</p>
              <p className="text-xs font-bold text-blue-400 flex items-center gap-1"><Flag size={10} /> 450 راية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 bg-[#0A0F1D] border border-white/5 rounded-2xl p-4 md:p-6 overflow-hidden relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeSubTab === 'tournaments' && <AdminTournamentsPanel language={language} />}
            {activeSubTab === 'flags' && <AdminFlagsPanel language={language} />}
            {activeSubTab === 'settings' && <AdminSettingsPanel language={language} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AdminTournamentsPanel({ language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-white">{language === "ar" ? "إدارة البطولات" : "Tournaments Management"}</h3>
          <p className="text-xs text-white/50">{language === "ar" ? "إطلاق بطولات مدرسية أو دوري بين المدارس" : "Launch school or inter-school leagues"}</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all">
          <Plus size={14} />
          {language === "ar" ? "بطولة جديدة" : "New Tournament"}
        </button>
      </div>
      
      {/* Mock List */}
      <div className="space-y-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center"><Trophy size={18} /></div>
            <div>
              <p className="text-sm font-bold text-white">{language === "ar" ? "كأس الرياضيات الكبرى" : "Great Math Cup"}</p>
              <p className="text-[10px] text-white/50">{language === "ar" ? "دوري مدارس • 45 مدرسة مشاركة" : "Schools League • 45 participating"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">{language === "ar" ? "جارية الآن" : "Live"}</span>
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 transition-colors"><Edit2 size={14} /></button>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center"><Trophy size={18} /></div>
            <div>
              <p className="text-sm font-bold text-white">{language === "ar" ? "تحدي القراءة السريع" : "Speed Reading Challenge"}</p>
              <p className="text-[10px] text-white/50">{language === "ar" ? "بطولة داخلية • 12 صف مشارك" : "Internal • 12 classes"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-white/10 text-white/50 text-[10px] font-bold">{language === "ar" ? "منتهية" : "Ended"}</span>
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 transition-colors"><Edit2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminFlagsPanel({ language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-white">{language === "ar" ? "مصنع الرايات" : "Flag Factory"}</h3>
          <p className="text-xs text-white/50">{language === "ar" ? "تصميم وابتكار رايات جديدة للطلاب" : "Design and invent new flags"}</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/50">
          <Plus size={14} />
          {language === "ar" ? "تصميم راية" : "Design Flag"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
              <Flag size={20} className="text-white" />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">{language === "ar" ? "راية العلوم" : "Science Flag"}</p>
            <p className="text-[9px] text-white/50">{language === "ar" ? "ممنوحة 120 مرة" : "Granted 120 times"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettingsPanel({ language }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-white">{language === "ar" ? "ميزان النقاط" : "Points Balance"}</h3>
        <p className="text-xs text-white/50">{language === "ar" ? "تحديد وزن النقاط لضمان عدالة المنافسة" : "Set points weight to ensure fairness"}</p>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-white">{language === "ar" ? "الفوز بتحدي صفي" : "Winning Class Battle"}</p>
            <p className="text-[10px] text-white/50">{language === "ar" ? "نقاط أساسية" : "Base points"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" defaultValue={50} className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm font-bold" />
            <span className="text-amber-400"><Star size={14} /></span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-white">{language === "ar" ? "الفوز ببطولة مدرسة" : "Winning School Tournament"}</p>
            <p className="text-[10px] text-white/50">{language === "ar" ? "نقاط متقدمة" : "Advanced points"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" defaultValue={500} className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm font-bold" />
            <span className="text-amber-400"><Star size={14} /></span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-white">{language === "ar" ? "الفوز بدوري المدارس" : "Winning Schools League"}</p>
            <p className="text-[10px] text-white/50">{language === "ar" ? "نقاط السيادة القصوى" : "Max sovereignty points"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" defaultValue={2000} className="w-20 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white text-sm font-bold" />
            <span className="text-amber-400"><Star size={14} /></span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/50">
          <CheckCircle2 size={14} />
          {language === "ar" ? "حفظ الميزان" : "Save Balance"}
        </button>
      </div>
    </div>
  );
}
