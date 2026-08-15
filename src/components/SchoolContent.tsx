import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Calculator, 
  Zap, 
  User, 
  Star, 
  PlayCircle, 
  BookOpen, 
  Beaker, 
  Dna, 
  MessageCircle,
  ArrowRight
} from 'lucide-react';

interface Teacher {
  name: string;
  title: string;
}

interface Material {
  name: string;
  id: string;
  icon: React.ElementType;
  teachers: Teacher[];
}

interface SchoolContentProps {
  schoolName: string;
  onBack: () => void;
}

export const SchoolContent: React.FC<SchoolContentProps> = ({ schoolName, onBack }) => {
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);

  const materials: Material[] = [
    {
      name: "التربية الاسلامية",
      id: "islamic",
      icon: BookOpen,
      teachers: [
        { name: "أ. خليل المنصوري", title: "خبير العلوم الإسلامية" },
        { name: "أ. محمد الحسيني", title: "مدرس المبدعين" },
      ]
    },
    {
      name: "اللغة الإنجليزية",
      id: "english",
      icon: Languages,
      teachers: [
        { name: "أ. سجاد الخفاجي", title: "ماجستير طرق تدريس" },
        { name: "أ. أحمد العراقي", title: "خبير المنهج الوزاري" },
      ]
    },
    {
      name: "اللغة العربية",
      id: "arabic",
      icon: MessageCircle,
      teachers: [
        { name: "أ. عقيل الزبيدي", title: "أديب وقواعد اللغة" },
        { name: "أ. ماهر الخزرجي", title: "منارة البلاغة" },
      ]
    },
    {
      name: "الرياضيات",
      id: "math",
      icon: Calculator,
      teachers: [
        { name: "أ. حيدر وليد", title: "مؤسس عمالقة الرياضيات" },
        { name: "أ. قصي هاشم", title: "خبير الهندسة والتفاضل" },
      ]
    },
    {
      name: "الكيمياء",
      id: "chemistry",
      icon: Beaker,
      teachers: [
        { name: "أ. مهند السوداني", title: "كيميائي المحطة السادسة" },
        { name: "أ. هاشم الغرباوي", title: "محلل المادة والطاقة" },
      ]
    },
    {
      name: "الفيزياء",
      id: "physics",
      icon: Zap,
      teachers: [
        { name: "أ. مؤيد سليم", title: "فيزيائي الطاقة الكونية" },
        { name: "أ. علي حسين", title: "تبسيط المفاهيم المعقدة" },
      ]
    },
    {
      name: "الاحياء",
      id: "biology",
      icon: Dna,
      teachers: [
        { name: "أ. ماجد الطائي", title: "باحث الخلية والوراثة" },
        { name: "أ. سالم الهاشمي", title: "دليل الكائنات الحية" },
      ]
    },
  ];

  const currentMaterial = materials[selectedMaterialIndex];

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col md:flex-row overflow-hidden font-sans" dir="rtl">
      {/* 1. Professional Sidebar - Side List of Subjects */}
      <div className="w-full md:w-56 bg-[#0D47A1] md:rounded-l-[40px] flex flex-col items-center py-6 md:py-10 shrink-0 z-20 shadow-2xl overflow-y-auto no-scrollbar">
        {/* Header with Back Button */}
        <div className="w-full px-6 flex items-center justify-between mb-10">
          <button 
            onClick={onBack} 
            className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all hover:scale-110"
          >
            <ArrowRight size={20} />
          </button>
          <Star size={24} fill="#FFD600" className="text-[#FFD600] animate-pulse" />
        </div>

        {/* Vertical List of Subjects */}
        <div className="w-full space-y-2 px-3">
          {materials.map((m, index) => {
            const isSelected = selectedMaterialIndex === index;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMaterialIndex(index)}
                className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 outline-none
                  ${isSelected ? 'bg-white shadow-xl translate-x-3' : 'hover:bg-white/10'}
                `}
              >
                <div className={`shrink-0 transition-colors duration-300 ${isSelected ? 'text-[#0D47A1]' : 'text-white/40 group-hover:text-white'}`}>
                  <Icon size={24} />
                </div>
                <span className={`text-[14px] font-bold whitespace-nowrap transition-colors duration-300
                  ${isSelected ? 'text-[#0D47A1]' : 'text-white/60 group-hover:text-white'}
                `}>
                  {m.name}
                </span>
                
                {isSelected && (
                  <motion.div 
                    layoutId="activeSideBar"
                    className="absolute right-0 w-2 h-8 bg-[#FFD600] rounded-l-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Content Display Area */}
      <div className="flex-1 flex flex-col pt-10 md:pt-20 relative px-6 md:px-12">
        {/* Majestic Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-0 w-80 h-80 bg-[#0D47A1]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-0 w-96 h-96 bg-[#FFD600]/5 rounded-full blur-[120px]" />
        </div>

        <div className="mb-12 relative z-10">
          <motion.div 
            key={currentMaterial.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-2"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              أساتذة <span className="text-[#FFD600]">{currentMaterial.name}</span>
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-[#FFD600] to-transparent rounded-full" />
          </motion.div>
        </div>
        
        {/* Upper Area: Teacher Majestic Nodes */}
        <div className="flex gap-10 overflow-x-auto pb-12 no-scrollbar scroll-smooth relative z-10 pr-2">
          <AnimatePresence mode='wait'>
            {currentMaterial.teachers.length > 0 ? (
              currentMaterial.teachers.map((teacher, index) => (
                <motion.div
                  key={`${teacher.name}-${teacher.title}`}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -50 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.1 
                  }}
                  whileHover={{ y: -10, rotate: 1 }}
                  className="flex-shrink-0 w-56 h-72 md:w-64 md:h-80 rounded-[40px] relative overflow-hidden group cursor-pointer"
                >
                  {/* Majestic Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D47A1] to-[#101935] shadow-2xl" />
                  <div className="absolute inset-0 border-2 border-[#FFD600]/30 rounded-[40px] group-hover:border-[#FFD600] transition-colors duration-500" />
                  
                  {/* Ornament */}
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#FFD600]/20 rounded-full blur-2xl group-hover:bg-[#FFD600]/40 transition-all" />

                  <div className="relative h-full flex flex-col items-center justify-center p-6 gap-4">
                    {/* Circle Avatar with Golden Ring */}
                    <div className="relative">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#050A18] flex items-center justify-center border-4 border-[#FFD600] shadow-[0_0_25px_rgba(255,214,0,0.3)] overflow-hidden transition-all group-hover:scale-105">
                        <User size={50} className="text-[#FFD600]" />
                      </div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-2 border border-dashed border-[#FFD600]/40 rounded-full pointer-events-none"
                      />
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-white font-black text-lg md:text-xl leading-tight uppercase tracking-wide">{teacher.name}</h3>
                      <p className="text-[#FFD600] font-medium text-xs md:text-sm tracking-widest uppercase opacity-80">{teacher.title}</p>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="mt-2 flex items-center gap-2 bg-[#FFD600] text-black px-4 py-2 rounded-xl font-bold text-xs group-hover:bg-white transition-colors"
                    >
                      <PlayCircle size={18} />
                      دخول المحاضرات
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
                <div className="flex items-center justify-center w-full py-20 text-white/20 italic text-xl">
                  لا يتوفر أساتذة متاحين حالياً لهذه المادة
                </div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Lower Content Area - Grounded with Indigo */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 bg-[#101935] mt-6 rounded-tr-[60px] p-10 flex items-center justify-center border-t border-r border-white/5 relative overflow-hidden"
        >
          {/* Decorative shapes */}
          <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#FFD600]/20" />
          <div className="absolute bottom-10 left-10 w-20 h-20 border border-white/5 rounded-full" />
          
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 group">
              <Star className="text-white/20 group-hover:text-[#FFD600] transition-colors" size={40} />
            </div>
            <h4 className="text-white text-2xl font-black">غرفة العلم والمعرفة</h4>
            <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
              اختر أستاذك المفضل للبدء في رحلة التعلم. هنا ستجد المحاضرات، الملازم، والاختبارات الذكية التي صممت خصيصاً لتفوقك.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
