import * as FirebaseMock from "../lib/firebase"; const { db, auth, storage, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, terminate, clearIndexedDbPersistence } = FirebaseMock;
import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Users, Shield, Bus, Sparkles, CheckCircle2 } from "lucide-react";

interface RoleSelectionModalProps {
  onSelectRole: (role: "student" | "teacher" | "parent" | "admin-boys" | "admin-girls" | "driver") => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ onSelectRole }) => {
  const [selected, setSelected] = useState<"student" | "teacher" | "parent" | "admin-boys" | "admin-girls" | "driver">("student");

  const roles = [
    {
      id: "student" as const,
      title: "طالب / تلميذ",
      subtitle: "متابعة الدروس، النقاط، الواجبات، والتحديات",
      icon: <GraduationCap className="w-6 h-6 text-amber-400" />,
      gradient: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/40 hover:border-amber-500",
      glow: "shadow-[0_0_25px_rgba(251,191,36,0.25)]",
      badge: "الخيار الأكثر شعبية ⚡"
    },
    {
      id: "teacher" as const,
      title: "معلم / أستاذ",
      subtitle: "إدارة الفصول، رصد الدرجات ومتابعة الطلاب",
      icon: <Users className="w-6 h-6 text-purple-400" />,
      gradient: "from-purple-500/20 to-indigo-500/10",
      border: "border-purple-500/40 hover:border-purple-500",
      glow: "shadow-[0_0_25px_rgba(168,85,247,0.25)]",
      badge: "لوحة تحكم المعلم 👨‍🏫"
    },
    {
      id: "parent" as const,
      title: "ولي أمر",
      subtitle: "متابعة مستوى الأبناء وحضورهم الدراسي",
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      gradient: "from-cyan-500/20 to-blue-500/10",
      border: "border-cyan-500/40 hover:border-cyan-500",
      glow: "shadow-[0_0_25px_rgba(6,182,212,0.25)]",
      badge: "متابعة عائلية 👨‍👩‍👦"
    },
    {
      id: "admin-boys" as const,
      title: "إداري (بنين) / مدير مدرسة",
      subtitle: "الإحصاءات، الإعلانات، والتحكم الشامل",
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/40 hover:border-emerald-500",
      glow: "shadow-[0_0_25px_rgba(34,197,94,0.25)]",
      badge: "صلاحيات إدارية 🏛️"
    },
    {
      id: "admin-girls" as const,
      title: "إدارية (بنات) / مديرة مدرسة",
      subtitle: "الإحصاءات، الإعلانات، والتحكم الشامل",
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      gradient: "from-pink-500/20 to-rose-500/10",
      border: "border-pink-500/40 hover:border-pink-500",
      glow: "shadow-[0_0_25px_rgba(244,114,182,0.25)]",
      badge: "صلاحيات إدارية 🏛️"
    },
    {
      id: "driver" as const,
      title: "سائق حافلة",
      subtitle: "إدارة الرحلات المدرسية وحالة الركاب",
      icon: <Bus className="w-6 h-6 text-orange-400" />,
      gradient: "from-orange-500/25 to-red-500/10",
      border: "border-orange-500/40 hover:border-orange-500",
      glow: "shadow-[0_0_25px_rgba(249,115,22,0.25)]",
      badge: "تتبع الرحلة 🚐"
    }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#02050F]/95 backdrop-blur-xl overflow-y-auto" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-amber-950/30 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-xl bg-[#0A0F1D]/90 border border-white/10 rounded-[2.5p] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl my-auto"
        style={{ borderRadius: "2rem" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            <Sparkles size={14} className="animate-spin" />
            <span>تخصيص التجربة حسب دورك في المنصة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            من أنت في بوابة بيرق؟ 🦅
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-2 font-medium max-w-md mx-auto">
            اختر دورك الآن لنقوم بتخصيص الواجهة الرئيسية والخدمات المناسبة لمهامك بدقة:
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
          {roles.map((role) => {
            const isSelected = selected === role.id;
            return (
              <motion.button
                key={role.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(role.id)}
                className={`relative p-4 rounded-2xl text-right transition-all border flex flex-col justify-between gap-3 cursor-pointer overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-br ${role.gradient} ${role.border} ${role.glow} ring-2 ring-amber-400/50`
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 text-white/70"
                }`}
              >
                <div className="absolute top-3 left-3">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20" />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-md`}>
                    {role.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-400/90 block mb-0.5">{role.badge}</span>
                    <h3 className="text-base font-black text-white">{role.title}</h3>
                  </div>
                </div>

                <p className="text-[11px] text-white/50 font-medium leading-snug">
                  {role.subtitle}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => onSelectRole(selected)}
          className="w-full h-13 rounded-2xl flex items-center justify-center gap-2 font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-amber-300/30 transition-all cursor-pointer group"
        >
          <span>تأكيد وانطلاق إلى المنصة ⚡</span>
          <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};
