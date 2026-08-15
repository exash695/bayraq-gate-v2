import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ExcellenceShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
  academicProfile: any;
  schoolConfigs?: any;
  schoolName?: string;
  exportId?: string;
}

export const ExcellenceShareModal: React.FC<ExcellenceShareModalProps> = ({
  isOpen, onClose, studentData, academicProfile, schoolConfigs, schoolName, exportId = 'achievement-export-card'
}) => {
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [preGeneratedDataUrl, setPreGeneratedDataUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPreGeneratedDataUrl(null);
      const timer = setTimeout(async () => {
         try {
            const node = document.getElementById(exportId);
            if (node) {
               // Warm up the rendering node structure for html-to-image
               await toPng(node, { quality: 0.1, pixelRatio: 1 });
               
               // Generate the high-quality target PNG representation
               const dataUrl = await toPng(node, {
                  quality: 0.95,
                  pixelRatio: 2,
                  backgroundColor: '#050816',
               });
               setPreGeneratedDataUrl(dataUrl);
            }
         } catch (err) {
            console.error("Card pre-generation offscreen failed:", err);
         }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setPreGeneratedDataUrl(null);
    }
  }, [isOpen, exportId, studentData, academicProfile]);
  
  const studentName = studentData?.studentName || studentData?.name || '';
  const schoolLabel = studentData?.schoolName || studentData?.school || schoolName || schoolConfigs?.schoolName || schoolConfigs?.name || 'المدرسة الإلكترونية';

  const allBadges = React.useMemo(() => {
    const list: any[] = [];
    const subjectMap = new Map();
    const isGeneralExempt = academicProfile?.generalExemption === true;

    if (academicProfile?.subjectBadgesArray) {
      academicProfile.subjectBadgesArray.forEach((b: any) => {
        let displayScore = b.score;
        // Use annual quest grade for general or individual exemptions if available
        if (isGeneralExempt || (academicProfile?.individualExemptions && academicProfile.individualExemptions.length > 0)) {
           const annualGrade = studentData?.grades?.['annual_quest']?.[b.id];
           if (annualGrade !== undefined && annualGrade !== null && annualGrade !== '') {
              displayScore = Number(annualGrade);
           }
        }

        const item = {
           id: b.id || b.subject,
           badgeName: b.badge?.title || 'وسام',
           subjName: b.subject,
           icon: b.badge?.icon || '🏆',
           levelColor: b.config?.text || b.config?.colors || b.badge?.color || 'text-[#FFD600]',
           detail: "الدرجة: " + displayScore,
           extraTags: [] as string[]
        };
        subjectMap.set(b.subject, item);
        list.push(item);
      });
    }

    if (academicProfile?.improvementBadges) {
      academicProfile.improvementBadges.forEach((b: any) => {
        const parent = subjectMap.get(b.subject);
        if (parent) {
           if (!parent.extraTags.includes('تطور ملحوظ 🚀')) {
              parent.extraTags.push('تطور ملحوظ 🚀');
           }
        } else {
           const item = {
             id: 'improvement_' + b.subject,
             badgeName: b.badge?.title || 'تطور',
             subjName: b.subject,
             icon: b.badge?.icon || '🚀',
             levelColor: b.config?.text || b.config?.colors || b.badge?.color || 'text-cyan-400',
             detail: 'تطور ملحوظ',
             extraTags: [] as string[]
           };
           subjectMap.set(b.subject, item);
           list.push(item);
        }
      });
    }

    if (academicProfile?.generalBadges) {
      academicProfile.generalBadges.forEach((b: any) => {
         // 1. Deduplicate Math Genius badge if already represented in Mathematics subject badges
         if (b.id === 'math' || b.title === 'عبقري الرياضيات') {
            let mathHasBadge = false;
            for (const value of subjectMap.values()) {
               if (value.badgeName === 'عبقري الرياضيات' || value.badgeName === 'نخبة الرياضيات') {
                  mathHasBadge = true;
                  break;
               }
            }
            if (mathHasBadge) {
               // Push it as an extra tag in the math card rather than duplicating the entire card
               let mathCard: any = null;
               for (const [subjName, card] of subjectMap.entries()) {
                  if (subjName.includes('رياضيات')) {
                     mathCard = card;
                     break;
                  }
               }
               if (mathCard && !mathCard.extraTags.includes('عبقري الرياضيات 🧠')) {
                  mathCard.extraTags.push('عبقري الرياضيات 🧠');
               }
               return; // Skip adding duplicate card
            }
         }

         // 2. Clear progress badges since progress is already printed on subject cards
         if (b.id === 'progress' || b.title === 'تطور ملحوظ') {
            return; // Skip adding duplicate card
         }

         if (b.id?.startsWith('exemption_indiv_')) {
            // IF THE STUDENT HAS GENERAL EXEMPTION, WE SKIP INDIVIDUAL EXEMPTIONS COMPLETELY!
            if (isGeneralExempt) {
               return; // Ignore "إعفاء فردي" entirely!
            }
            const subjName = b.id.replace('exemption_indiv_', '');
            const parent = subjectMap.get(subjName);
            if (parent) {
               if (!parent.extraTags.includes('إعفاء فردي 🏅')) {
                  parent.extraTags.push('إعفاء فردي 🏅');
               }
               return;
            }
         }
         
         list.push({
            id: b.id,
            badgeName: b.title,
            subjName: 'وسام شرف',
            icon: b.icon,
            levelColor: b.color || 'text-amber-400 bg-amber-400/10',
            detail: b.desc,
            extraTags: [] as string[]
         });
      });
    }

    // Ensure the card always contains exactly 12 prestigious badges (or at least 10) to maintain peak aesthetic symmetry and layout completeness
    const honoraryPadBadges = [
      {
         id: 'pad_commitment',
         badgeName: 'وسام الالتزام والمثابرة',
         subjName: 'وسام شرف',
         icon: '🌟',
         levelColor: 'text-emerald-400 bg-emerald-400/10',
         detail: 'حضور وتفاعل مستدام',
         extraTags: [] as string[]
      },
      {
         id: 'pad_ambassador',
         badgeName: 'سفير النخبة والتميز',
         subjName: 'وسام شرف',
         icon: '👑',
         levelColor: 'text-amber-400 bg-amber-400/10',
         detail: 'طالب مثالي وقدوة للأبطال',
         extraTags: [] as string[]
      },
      {
         id: 'pad_radar',
         badgeName: 'رادار الذكاء اللامع',
         subjName: 'الاستدلال والتفكير',
         icon: '📡',
         levelColor: 'text-cyan-400 bg-cyan-400/10',
         detail: 'إجابات ذكية مستنتجة',
         extraTags: [] as string[]
      },
      {
         id: 'pad_creative',
         badgeName: 'الفكر الإبداعي الخلاّق',
         subjName: 'النشاط التفاعي',
         icon: '🧠',
         levelColor: 'text-purple-400 bg-purple-400/10',
         detail: 'تفكير متقدم ومهارة عالية',
         extraTags: [] as string[]
      },
      {
         id: 'pad_resolve',
         badgeName: 'همّة الأبطال وقوة الإصرار',
         subjName: 'سعي مستدام',
         icon: '⚡',
         levelColor: 'text-orange-400 bg-[#FFD600]/10',
         detail: 'مثابرة مستمرة وتطلع للقمة',
         extraTags: [] as string[]
      },
      {
         id: 'pad_dignity',
         badgeName: 'وسام الاستحقاق العالي',
         subjName: 'السلوك الأكاديمي',
         icon: '🏅',
         levelColor: 'text-yellow-400 bg-[#FFD600]/10',
         detail: 'تميز دراسي وسلوكي رفيع',
         extraTags: [] as string[]
      },
      {
         id: 'pad_integrity',
         badgeName: 'وسام النبل والأمانة العلمية',
         subjName: 'وسام شرف',
         icon: '🛡️',
         levelColor: 'text-blue-400 bg-blue-400/10',
         detail: 'أمانة سلوكية واجتهاد واعٍ',
         extraTags: [] as string[]
      },
      {
         id: 'pad_sixth_pride',
         badgeName: 'فخر السادسة الأسطوري',
         subjName: 'وسام شرف',
         icon: '⚓',
         levelColor: 'text-[#FFD600]',
         detail: 'طموح أكاديمي متقد بلا حدود',
         extraTags: [] as string[]
      },
      {
         id: 'pad_inspiration',
         badgeName: 'ملهم الأجيال الصاعدة',
         subjName: 'وسام شرف',
         icon: '✨',
         levelColor: 'text-cyan-400 bg-cyan-400/10',
         detail: 'قدوة تفاعلية ملهمة للأقران',
         extraTags: [] as string[]
      },
      {
         id: 'pad_challenger',
         badgeName: 'قاهر التحديات الستينية',
         subjName: 'السرعة والذكاء',
         icon: '⏱️',
         levelColor: 'text-orange-400 bg-orange-400/10',
         detail: 'إستجابة فائقة السرعة والدقة',
         extraTags: [] as string[]
      },
      {
         id: 'pad_focus',
         badgeName: 'وسام التركيز والصفاء الذهني',
         subjName: 'غرفة التحكم الذكية',
         icon: '🧘',
         levelColor: 'text-purple-400 bg-purple-400/10',
         detail: 'بيئة دراسية هادئة ومنتجة',
         extraTags: [] as string[]
      },
      {
         id: 'pad_pioneer',
         badgeName: 'رائد مسيرة العلم والمعرفة',
         subjName: 'وسام شرف',
         icon: '🚀',
         levelColor: 'text-blue-400 bg-blue-400/10',
         detail: 'مستكشف شغوف بالمعرفة المستمرة',
         extraTags: [] as string[]
      }
    ];

    for (const pad of honoraryPadBadges) {
      if (list.length >= 12) break;
      const alreadyHas = list.some(item => 
         item.badgeName === pad.badgeName || 
         (pad.id === 'pad_radar' && list.some(i => i.id === 'radar' || i.badgeName?.includes('رادار'))) ||
         (pad.id === 'pad_challenger' && list.some(i => i.id?.includes('challenge') || i.badgeName?.includes('تحدي')))
      );
      if (!alreadyHas) {
         list.push({ ...pad });
      }
    }

    // Safety fallback: ensure at least 10 cards under any circumstance
    if (list.length < 10) {
      for (const pad of honoraryPadBadges) {
         if (list.length >= 10) break;
         const alreadyInList = list.some(item => item.id === pad.id || item.badgeName === pad.badgeName);
         if (!alreadyInList) {
            list.push({ ...pad });
         }
      }
    }

    if (isGeneralExempt) {
       list.forEach(item => {
          if (item.extraTags) {
             item.extraTags = item.extraTags.filter((tag: string) => !tag.includes('إعفاء فردي'));
          }
       });
    }

    // Sort the list so that "exemption_general" is index 0, and "exemption_indiv" / "إعفاء فردي" items are immediately after, followed by subjects sorted by grade descending
    list.sort((a, b) => {
       const isGenA = a.id === 'exemption_general';
       const isGenB = b.id === 'exemption_general';
       if (isGenA && !isGenB) return -1;
       if (!isGenA && isGenB) return 1;

       const isIndivA = a.id?.startsWith('exemption_indiv_') || a.extraTags?.includes('إعفاء فردي 🏅') || a.badgeName?.includes('إعفاء فردي');
       const isIndivB = b.id?.startsWith('exemption_indiv_') || b.extraTags?.includes('إعفاء فردي 🏅') || b.badgeName?.includes('إعفاء فردي');
       if (isIndivA && !isIndivB) return -1;
       if (!isIndivA && isIndivB) return 1;

       const getGrade = (ach: any) => {
          if (!ach || !ach.detail) return 0;
          const detail = String(ach.detail);
          if (detail.includes('الدرجة')) {
             const parts = detail.split(':');
             if (parts.length > 1) return parseInt(parts[1].trim()) || 0;
             return parseInt(detail.replace(/[^\d]/g, '')) || 0;
          }
          return -1;
       };
       const gA = getGrade(a);
       const gB = getGrade(b);
       if (gA !== gB) return gB - gA;
       return (b.badgeName || '').localeCompare(a.badgeName || '', 'ar');
    });

    return list.map(item => {
      const sName = String(item.subjName || '');
      if (sName.includes('بوابة بيرق') || sName.includes('أكاديمية السادس')) {
        return { ...item, subjName: 'وسام شرف' };
      }
      return item;
    });
  }, [academicProfile]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/90 z-[99999] flex flex-col items-center p-4 backdrop-blur-md overflow-y-auto overscroll-contain py-10"
        >
           <div style={{ position: 'absolute', top: 0, left: '-9999px', width: 0, height: 0, zIndex: -9999, pointerEvents: 'none', overflow: 'hidden', opacity: 1 }}>
             <div 
                id={exportId}
                className="flex flex-col relative overflow-hidden"
                style={{ 
                  width: '1080px', 
                  height: 'max-content',
                  minHeight: '1920px', 
                  backgroundColor: '#050816',
                  direction: 'rtl',
                  padding: '60px 60px 80px 60px',
                  fontFamily: 'Cairo, Tajawal, "Noto Sans Arabic", sans-serif'
                }}
             >
                  {/* Background Gradients & Ambient Effects */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #040714 0%, #0a1128 50%, #121a36 100%)', zIndex: 0 }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', minHeight: '100%', background: 'radial-gradient(circle at top right, rgba(255, 214, 0, 0.12) 0%, transparent 60%)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', minHeight: '100%', background: 'radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.05) 0%, transparent 60%)', zIndex: 1 }} />

                  {/* Majestic Double Gold Certificate Frame */}
                  <div style={{ position: 'absolute', top: '30px', left: '30px', right: '30px', bottom: '30px', border: '3px solid rgba(255, 214, 0, 0.25)', borderRadius: '32px', pointerEvents: 'none', zIndex: 2 }} />
                  <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', bottom: '40px', border: '1.5px solid rgba(255, 214, 0, 0.1)', borderRadius: '26px', pointerEvents: 'none', zIndex: 2 }} />
                  
                  {/* Royal Corner Ornaments */}
                  <div style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderTop: '4px solid #FFD600', borderRight: '4px solid #FFD600', borderTopRightRadius: '12px', zIndex: 3 }} />
                  <div style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', height: '40px', borderTop: '4px solid #FFD600', borderLeft: '4px solid #FFD600', borderTopLeftRadius: '12px', zIndex: 3 }} />
                  <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '40px', height: '40px', borderBottom: '4px solid #FFD600', borderRight: '4px solid #FFD600', borderBottomRightRadius: '12px', zIndex: 3 }} />
                  <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '40px', height: '40px', borderBottom: '4px solid #FFD600', borderLeft: '4px solid #FFD600', borderBottomLeftRadius: '12px', zIndex: 3 }} />

                  <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                      
                      <div style={{ flexShrink: 0 }}>
                          {/* Top Header: Balanced Layout */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                             {/* Right: Actual School Info and Saved Logo */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '130px', height: '130px', borderRadius: '32px', backgroundColor: '#0c1228', border: '2.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                               <img src="/school-logos/logo1.jpg" alt="School Brand" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) { parent.innerHTML = '<span style="color:#ffffff70;font-size:50px">🏫</span>'; }
                               }} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '36px', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)', lineHeight: 1.2 }}>{schoolLabel}</h2>
                                <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontFamily: 'Tajawal, sans-serif', fontSize: '24px', margin: '4px 0 0 0', fontWeight: 'bold' }}>سجل التميز الأكاديمي</p>
                            </div>
                         </div>

                         {/* Left: Premium Bayraq Info and Brand Logo */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexDirection: 'row-reverse' }}>
                            <div style={{ width: '130px', height: '130px', borderRadius: '32px', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0', flexShrink: 0 }}>
                               <img src="/logo.png" alt="Bayraq" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen' }} onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) { parent.innerHTML = '<span style="color:#FFD600;font-size:50px">👑</span>'; }
                               }} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                               <h2 style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '38px', letterSpacing: '2px', margin: 0, textShadow: '0 2px 15px rgba(255,214,0,0.3)', lineHeight: 1.2 }}>بوابة بيرق</h2>
                               <p style={{ color: 'rgba(255, 214, 0, 0.9)', fontFamily: 'Tajawal, sans-serif', fontSize: '20px', margin: '4px 0 0 0', letterSpacing: '4px', fontWeight: '900' }}>GATE 6</p>
                            </div>
                         </div>
                      </div>

                      {/* Student Identity Section */}
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                         {studentData?.avatar ? (
                            <div style={{ margin: '0 auto 8px auto', width: '220px', height: '220px', borderRadius: '50%', border: '12px solid rgba(255, 214, 0, 0.35)', outline: '6px solid #FFD600', boxShadow: '0 0 80px rgba(255,214,0,0.4)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${studentData.avatar})`, flexShrink: 0 }} />
                         ) : (
                            <div style={{ margin: '0 auto 8px auto', width: '220px', height: '220px', borderRadius: '50%', border: '12px solid rgba(255, 214, 0, 0.35)', outline: '6px solid #FFD600', boxShadow: '0 0 80px rgba(255,214,0,0.4)', backgroundColor: '#0a0f24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '90px', flexShrink: 0 }}>
                               {academicProfile?.isEliteStudent ? '👑' : '👨‍🎓'}
                            </div>
                         )}
                         <h3 style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '70px', margin: '0 0 8px 0', lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>{studentName.replace(/^ولي أمر\s*/, '')}</h3>
                         
                         <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,214,0,0.1)', border: '2.5px solid rgba(255,214,0,0.4)', borderRadius: '100px', padding: '12px 40px', boxShadow: '0 5px 25px rgba(255,214,0,0.2)', marginTop: '4px' }}>
                            <span style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '30px' }}>{studentData?.grade || academicProfile?.levelData?.gradeTag}</span>
                         </div>
                      </div>
                      </div>

                      {/* Beautiful Artistic Badges Matrix */}
                      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '0 auto', justifyItems: 'stretch', alignContent: 'center' }}>
                         {allBadges
                           .slice()
                           .sort((a: any, b: any) => {
                             const isGenA = a.id === 'exemption_general';
                              const isGenB = b.id === 'exemption_general';
                              if (isGenA && !isGenB) return -1;
                              if (!isGenA && isGenB) return 1;
                              const isIndivA = a.id?.startsWith('exemption_indiv_') || a.extraTags?.includes('إعفاء فردي 🏅') || a.badgeName?.includes('إعفاء فردي');
                              const isIndivB = b.id?.startsWith('exemption_indiv_') || b.extraTags?.includes('إعفاء فردي 🏅') || b.badgeName?.includes('إعفاء فردي');
                              if (isIndivA && !isIndivB) return -1;
                              if (!isIndivA && isIndivB) return 1;
                              const getGrade = (ach: any) => {
                               if (!ach || !ach.detail) return 0;
                               const detail = String(ach.detail);
                               if (detail.includes('الدرجة')) {
                                 const parts = detail.split(':');
                                 if (parts.length > 1) return parseInt(parts[1].trim()) || 0;
                                 return parseInt(detail.replace(/[^\d]/g, '')) || 0;
                               }
                               return -1;
                             };
                             const gA = getGrade(a);
                             const gB = getGrade(b);
                             if (gA !== gB) return gB - gA;
                             return (b.badgeName || '').localeCompare(a.badgeName || '', 'ar');
                           })
                           .slice(0, Math.min(12, Math.floor(allBadges.length / 2) * 2))
                           .map((ach: any, idx: number) => {
                           const colorSchemes: Record<string, { bg: string, border: string, text: string, tagBg: string, tagBorder: string }> = {
                             emerald: {
                               bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0.02) 100%)',
                               border: '3.5px solid rgba(16, 185, 129, 0.35)',
                               text: '#10b981',
                               tagBg: 'rgba(16, 185, 129, 0.12)',
                               tagBorder: '1.5px solid rgba(16, 185, 129, 0.45)'
                             },
                             blue: {
                               bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.02) 100%)',
                               border: '3.5px solid rgba(59, 130, 246, 0.35)',
                               text: '#3b82f6',
                               tagBg: 'rgba(59, 130, 246, 0.12)',
                               tagBorder: '1.5px solid rgba(59, 130, 246, 0.45)'
                             },
                             purple: {
                               bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(139, 92, 246, 0.02) 100%)',
                               border: '3.5px solid rgba(139, 92, 246, 0.35)',
                               text: '#8b5cf6',
                               tagBg: 'rgba(139, 92, 246, 0.12)',
                               tagBorder: '1.5px solid rgba(139, 92, 246, 0.45)'
                             },
                             yellow: {
                               bg: 'linear-gradient(135deg, rgba(255, 214, 0, 0.14) 0%, rgba(255, 214, 0, 0.02) 100%)',
                               border: '3.5px solid rgba(255, 214, 0, 0.45)',
                               text: '#FFD600',
                               tagBg: 'rgba(255, 214, 0, 0.12)',
                               tagBorder: '1.5px solid rgba(255, 214, 0, 0.5)'
                             },
                             cyan: {
                               bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(6, 182, 212, 0.02) 100%)',
                               border: '3.5px solid rgba(6, 182, 212, 0.35)',
                               text: '#06b6d4',
                               tagBg: 'rgba(6, 182, 212, 0.12)',
                               tagBorder: '1.5px solid rgba(6, 182, 212, 0.45)'
                             },
                             orange: {
                               bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.14) 0%, rgba(249, 115, 22, 0.02) 100%)',
                               border: '3.5px solid rgba(249, 115, 22, 0.35)',
                               text: '#f97316',
                               tagBg: 'rgba(249, 115, 22, 0.12)',
                               tagBorder: '1.5px solid rgba(249, 115, 22, 0.45)'
                             }
                           };

                           const colorMap: Record<string, string> = { 
                             emerald: 'emerald', lime: 'emerald', green: 'emerald',
                             blue: 'blue', slate: 'blue',
                             purple: 'purple', fuchsia: 'purple', indigo: 'purple',
                             yellow: 'yellow',
                             amber: 'yellow',
                             cyan: 'cyan', teal: 'cyan',
                             orange: 'orange' 
                           };
                           const key = Object.keys(colorMap).find((k: string) => ach.levelColor?.toLowerCase().includes(k)) || 'yellow';
                           const scheme = colorSchemes[colorMap[key]] || colorSchemes.yellow;

                           const isGeneralExemption = ach.id === 'exemption_general' || ach.badgeName?.includes('إعفاء عام');
                           const isIndividualExemption = ach.id?.startsWith('exemption_indiv_') || ach.extraTags?.includes('إعفاء فردي 🏅') || ach.badgeName?.includes('إعفاء فردي');

                           let finalBg = 'linear-gradient(135deg, rgba(26, 34, 53, 0.8) 0%, rgba(10, 14, 26, 0.85) 100%)';
                           
                           // Determine border according to request: thin border 0.8px, matte gold or white with opacity 0.2
                           let isMatteGoldBorder = key === 'yellow' || isGeneralExemption;
                           let finalBorder = isMatteGoldBorder
                             ? '0.8px solid rgba(255, 214, 0, 0.25)' 
                             : '0.8px solid rgba(255, 255, 255, 0.2)';
                             
                           let finalTextColor = scheme.text;
                           let finalTagBg = scheme.tagBg;
                           let finalTagBorder = scheme.tagBorder;
                           let stripColor = '#FFD600'; // App identity yellow
                           let stripShadow = '0 0 15px rgba(255,214,0,0.5)';
                           let luxuriousShadow = '0 15px 15px 2px rgba(0, 0, 0, 0.8)'; // Deep black shadows: blur: 15, spread: 2 as requested

                           if (isGeneralExemption) {
                             // General Exemption has custom ultra luxury royal gradient of deep pink/indigo
                             finalBg = 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)';
                             finalBorder = '1px dashed rgba(255, 214, 0, 0.5)';
                             finalTextColor = '#FFD600';
                             finalTagBg = 'rgba(255, 214, 0, 0.15)';
                             finalTagBorder = '1.5px solid #FFD600';
                             stripColor = '#EC4899'; // Royal Pink indicator
                             stripShadow = '0 0 25px rgba(236,72,153,0.8)';
                             luxuriousShadow = '0 15px 15px 2px rgba(236, 72, 153, 0.3), 0 15px 15px 2px rgba(0, 0, 0, 0.8)';
                           } else if (isIndividualExemption) {
                             // Individual Exemption has gorgeous emerald-teal sleek futuristic border
                             finalBg = 'linear-gradient(135deg, rgba(20, 184, 166, 0.25) 0%, rgba(13, 148, 136, 0.1) 100%)';
                             finalBorder = '2px solid rgba(20, 184, 166, 0.5)';
                             finalTextColor = '#14b8a6';
                             finalTagBg = 'rgba(20, 184, 166, 0.15)';
                             finalTagBorder = '1.5px solid #14b8a6';
                             stripColor = '#14b8a6'; // Cyan strip
                             stripShadow = '0 0 15px rgba(20,184,166,0.6)';
                             luxuriousShadow = '0 15px 15px 2px rgba(20, 184, 166, 0.25), 0 15px 15px 2px rgba(0, 0, 0, 0.8)';
                           }
                           
                           const detailRows = ach.detail ? String(ach.detail) : '';
                           const isGrade = detailRows.includes('الدرجة');
                           let gradeValue = '';
                           let gradeLabel = '';
                           if (isGrade) {
                             const parts = detailRows.split(':');
                             if (parts.length > 1) {
                               gradeLabel = parts[0];
                               gradeValue = parts[1].trim();
                             } else {
                               gradeValue = detailRows.replace(/[^\d]/g, '');
                               gradeLabel = 'الدرجة';
                             }
                           }
                           const isLongDetail = !isGrade && detailRows.length > 0;

                           return (
                             <div key={idx} style={{ 
                               display: 'flex', 
                               flexDirection: 'column', 
                               background: finalBg, 
                               borderRadius: '32px', 
                               padding: '24px 30px', 
                               border: finalBorder, 
                               position: 'relative', 
                               overflow: 'hidden', 
                               boxShadow: luxuriousShadow, 
                               width: '100%',
                               backdropFilter: 'blur(12px)',
                               WebkitBackdropFilter: 'blur(12px)'
                             }}>
                               {/* Color Strip Indicator */}
                               <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '16px', backgroundColor: stripColor, boxShadow: stripShadow }} />
                               
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  {/* Protected grouping of Icon & Titles */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
                                     {/* Badge Icon Circular Case with colored dynamic glow halo */}
                                     <div style={{ 
                                        width: '85px', 
                                        height: '85px', 
                                        borderRadius: '50%', 
                                        backgroundColor: 'rgba(255,255,255,0.06)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0, 
                                        border: `1.5px solid ${finalTextColor}4D`, 
                                        position: 'relative',
                                        boxShadow: `0 0 25px ${finalTextColor}4D, inset 0 0 15px ${finalTextColor}22`
                                     }}>
                                        {/* Radial Halogen Glow inside container */}
                                        <div style={{ 
                                           position: 'absolute', 
                                           top: 0, 
                                           left: 0, 
                                           right: 0, 
                                           bottom: 0, 
                                           borderRadius: '50%', 
                                           background: `radial-gradient(circle, ${finalTextColor}44 0%, transparent 75%)`, 
                                           zIndex: 0 
                                        }} />
                                        <span style={{ 
                                           position: 'relative', 
                                           zIndex: 1, 
                                           filter: `drop-shadow(0 0 8px ${finalTextColor})`,
                                           fontSize: '32px',
                                           width: '40px',
                                           height: '40px',
                                           display: 'flex',
                                           alignItems: 'center',
                                           justifyContent: 'center',
                                           lineHeight: '1'
                                        }}>
                                           {ach.icon}
                                        </span>
                                     </div>
                                     
                                     {/* Titles - Fully protected from squeezing */}
                                     <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', minWidth: 0, flex: 1 }}>
                                        <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '26px', marginBottom: '8px', lineHeight: '1.3', display: 'block', wordBreak: 'break-word', whiteSpace: 'normal' }}>{ach.badgeName}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Tajawal, sans-serif', fontWeight: '800', fontSize: '22px', display: 'block', wordBreak: 'break-word', whiteSpace: 'normal' }}>{ach.subjName}</span>
                                     </div>
                                  </div>
                                  
                                  {/* Grade Tag (on Left) - Custom styled, large, glowing and ultra clear */}
                                  {isGrade && (
                                     <div style={{ padding: '12px 24px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '24px', flexShrink: 0, textAlign: 'center', minWidth: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: `0 4px 15px ${finalTagBg}, inset 0 0 10px rgba(255,255,255,0.02)`, marginRight: '20px' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Tajawal, sans-serif', fontWeight: '900', fontSize: '20px', marginBottom: '4px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{gradeLabel}</span>
                                        <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '950', fontSize: '52px', lineHeight: 1, textShadow: `0 0 15px ${finalTextColor}, 0 2px 5px rgba(0,0,0,0.8)` }}>{gradeValue}</span>
                                     </div>
                                  )}
  
                                  {/* Short Tag Box (Not grade, not too long) */}
                                  {(!isLongDetail && !isGrade && detailRows.length > 0) && (
                                     <div style={{ padding: '14px 22px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '24px', flexShrink: 0, textAlign: 'center', minWidth: '100px', boxShadow: `0 4px 12px ${finalTextColor}1A` }}>
                                        <span style={{ color: '#ffffff', textShadow: `0 0 12px ${finalTextColor}`, fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '22px', whiteSpace: 'nowrap' }}>{detailRows}</span>
                                     </div>
                                  )}
                               </div>
 
                               {/* Extra Merged Tags */}
                               {(ach.extraTags && ach.extraTags.length > 0) && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {ach.extraTags.map((tag: string, i: number) => (
                                       <span key={i} style={{ 
                                         backgroundColor: 'rgba(255,255,255,0.06)', 
                                         border: '1.5px solid rgba(255,255,255,0.15)',
                                         borderRadius: '20px', 
                                         padding: '6px 16px', 
                                         color: '#fff', 
                                         fontSize: '18px', 
                                         fontFamily: 'Tajawal, sans-serif', 
                                         fontWeight: 'bold',
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: '6px',
                                         boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                       }}>
                                          {tag}
                                       </span>
                                    ))}
                                  </div>
                               )}
 
                               {/* Full Width Box for Long Texts */}
                               {isLongDetail && (
                                  <div style={{ marginTop: '20px', padding: '18px 24px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '18px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                                     <span style={{ 
                                       color: finalTextColor, 
                                       fontFamily: 'Tajawal, sans-serif', 
                                       fontWeight: '800', 
                                       fontSize: '19px', 
                                       whiteSpace: 'normal', 
                                       display: 'block', 
                                       overflow: 'hidden', 
                                       lineHeight: '1.6' 
                                     }}>{detailRows}</span>
                                  </div>
                               )}
                             </div>
                           );
                         })}
                      </div>

                      {/* Prestigious Signature & Honors Affirmation */}
                      <div style={{ textAlign: 'center', borderTop: '2px solid rgba(255,214,0,0.2)', paddingTop: '30px', position: 'relative', flexShrink: 0 }}>
                         <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#050816', padding: '0 20px', display: 'flex', gap: '10px' }}>
                            <span style={{ fontSize: '24px', color: '#FFD600' }}>✦</span>
                            <span style={{ fontSize: '24px', color: '#FFD600' }}>✦</span>
                            <span style={{ fontSize: '24px', color: '#FFD600' }}>✦</span>
                         </div>
                         <h1 style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontSize: '56px', fontWeight: '900', letterSpacing: '4px', margin: '0 0 16px 0', textShadow: '0 4px 25px rgba(255,214,0,0.4)', lineHeight: '1.2' }}>وســــام التـمـيـــز الشـرفـــي</h1>
                         <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal, sans-serif', fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '2px', paddingBottom: '30px' }}>صـدرت هـذه الوثيـقـة رسـمـيـاً عـن طـريـق بـوابـة بـيـرق</p>
                      </div>
                  </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#080d1d] to-[#101935] rounded-[2rem] p-6 border border-[#FFD600]/30 w-[340px] aspect-[9/16] flex flex-col relative overflow-hidden shadow-[0_20px_60px_rgba(255,214,0,0.2)] mx-auto my-auto mt-10 md:mt-auto shrink-0" style={{ direction: 'rtl' }}>
               {/* Card Background Effects */}
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top,#FFD600_0%,transparent_60%)] opacity-10 pointer-events-none" />
               <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-48 h-12 bg-[#FFD600]/20 blur-3xl pointer-events-none" />
               
               {/* Header */}
               <div className="flex justify-between items-start mt-2 mb-6 relative z-10 w-full flex-shrink-0 px-2">
                   {/* Right: School */}
                   <div className="flex items-center gap-2">
                       <div className="w-10 h-10 rounded-xl bg-[#101935] border border-white/20 flex items-center justify-center relative overflow-hidden">
                          <img src="/school-logos/logo1.jpg" alt="School" className="w-full h-full object-contain p-1.5" onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             const pr = e.currentTarget.parentElement;
                             if (pr) pr.innerHTML = '🏫';
                          }} />
                       </div>
                       <div className="text-right">
                          <h2 className="text-white font-black text-[10px] leading-tight max-w-[80px] break-words">{schoolLabel}</h2>
                          <p className="text-white/40 font-bold text-[7px] mt-0.5">سجل التميز</p>
                       </div>
                   </div>
                   
                   {/* Left: Bayraq */}
                   <div className="flex items-center gap-2 flex-row-reverse">
                       <div className="w-10 h-10 rounded-xl bg-[#101935] border border-[#FFD600]/50 shadow-[0_0_15px_rgba(255,214,0,0.2)] flex items-center justify-center relative overflow-hidden">
                          <img src="/logo.png" alt="Bayraq" className="w-full h-full object-contain p-1.5" onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             const pr = e.currentTarget.parentElement;
                             if (pr) pr.innerHTML = '👑';
                          }} />
                       </div>
                       <div className="text-left">
                          <h2 className="text-[#FFD600] font-black tracking-widest text-[10px] leading-tight">بوابة بيرق</h2>
                          <p className="text-white/50 font-bold text-[8px] mt-0.5 tracking-widest text-center">GATE 6</p>
                       </div>
                   </div>
               </div>

               {/* Student Identity */}
               <div className="text-center mb-auto relative z-10 w-full mt-2 flex-shrink-0">
                  <div className="mx-auto w-[100px] h-[100px] mb-3 rounded-full border-[5px] border-[#FFD600]/50 outline outline-[3px] outline-[#FFD600] shadow-[0_0_30px_rgba(255,214,0,0.4)] bg-cover bg-center flex items-center justify-center text-4xl bg-[#0a0f24]"
                       style={{ backgroundImage: studentData?.avatar ? `url(${studentData.avatar})` : 'none' }}>
                     {!studentData?.avatar && (academicProfile?.isEliteStudent ? '👑' : '👨‍🎓')}
                  </div>
                  <h3 className="text-white font-extrabold text-[22px] drop-shadow-md break-words leading-tight">{studentName.replace(/^ولي أمر\s*/, '')}</h3>
                  <p className="text-[#FFD600] font-black text-xs mt-1.5">{studentData?.grade || academicProfile?.levelData?.gradeTag}</p>
               </div>
               
               {/* Badges Snapshot */}
               <div className="grid grid-cols-2 gap-2 relative z-10 w-full mb-6 mt-auto">
                  {allBadges.slice(0, 4).map((ach: any, idx: number) => (
                     <div key={idx} className="flex flex-col items-center bg-[#151e32] rounded-xl py-2 px-1 border border-white/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-full w-1 opacity-90 bg-[#FFD600] shadow-[0_0_5px_rgba(255,214,0,0.4)]" />
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 mb-1 border border-white/5" style={{ fontSize: '16px' }}>
                           {ach.icon}
                        </div>
                        <div className="text-center w-full px-2">
                           <div className="text-white font-black text-[9px] leading-tight truncate">{ach.badgeName}</div>
                           <div className="text-white/50 font-bold text-[7px] truncate">{ach.subjName}</div>
                        </div>
                        <div className="mt-1 bg-[#FFD600]/10 border border-[#FFD600]/20 px-1.5 py-0.5 rounded flex items-center justify-center">
                           <span className="text-[#FFD600] font-black text-[8px]">{ach.detail}</span>
                        </div>
                        {(ach.extraTags && ach.extraTags.length > 0) && (
                           <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                              {ach.extraTags.map((t: string, i: number) => (
                                <span key={i} className="text-[#10b981] font-black text-[7px] bg-emerald-500/10 px-1 rounded">{t.replace('🚀', '')}</span>
                              ))}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
               {allBadges.length > 4 && (
                  <div className="w-full text-center relative z-10 -mt-4 mb-2">
                     <span className="text-white/40 text-[9px] font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">+ {allBadges.length - 4} أخرى</span>
                  </div>
               )}
               {allBadges.length === 0 && (
                  <p className="text-white/40 font-bold text-xs text-center p-4 relative z-10">أوسمة الشرف في طريقها إليك...</p>
               )}

               {/* Prestigious Footer Signature */}
               <div className="text-center border-t border-[#FFD600]/20 pt-3 w-full relative z-10 flex-shrink-0 mt-2 pb-1">
                  <p className="text-[#FFD600] text-[11px] font-black tracking-widest uppercase mb-1">وسـام التمـيــز الشـرفــي</p>
                  <p className="text-white/50 text-[6px] tracking-wide">صدرت هذه الوثيقة رسمياً عن طريق بوابة بيرق</p>
               </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 shrink-0 pb-10">
               <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4">
                  {isGeneratingCard && (
                     <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/30">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-[#FFD600] rounded-full animate-spin"></div>
                        <span className="text-amber-400 font-extrabold text-[12px] tracking-wide">جاري التجهيز الاستثنائي...</span>
                     </div>
                  )}

                  {/* 1. Primary Direct High-Quality Share/Download Button */}
                  <button 
                    onClick={async () => {
                       if (isGeneratingCard) return;
                       setIsGeneratingCard(true);
                       setGenerationSuccess(false);
                       
                       try {
                          const node = document.getElementById(exportId);
                          if (!node) return;
                          
                          const dataUrl = preGeneratedDataUrl || await toPng(node, {
                             quality: 1,
                             pixelRatio: 2, // Exceptional clarity
                             backgroundColor: '#050816',
                          });
                          
                          const fetchRes = await fetch(dataUrl);
                          const blob = await fetchRes.blob();
                          const file = new File([blob], `bayraq-achievement-${studentName.replace(/^ولي أمر\s*/, '').replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                          
                          const triggerDownload = () => {
                             const link = document.createElement('a');
                             link.download = file.name;
                             link.href = dataUrl;
                             document.body.appendChild(link);
                             link.click();
                             document.body.removeChild(link);
                             
                             setGenerationSuccess(true);
                             setTimeout(() => setGenerationSuccess(false), 4500);
                          };

                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                             try {
                                await navigator.share({
                                   files: [file],
                                   title: 'بطاقة شرف التميز',
                                   text: `أوسمة وإنجازات ${studentName.replace(/^ولي أمر\s*/, '')} من بوابة بيرق الأكاديمية`
                                });
                                setGenerationSuccess(true);
                                setTimeout(() => setGenerationSuccess(false), 4500);
                             } catch (shareErr: any) {
                                console.warn('Share API failed, falling back to download:', shareErr);
                                const errMsg = shareErr?.message || '';
                                 const isAbort = 
                                    shareErr?.name === 'AbortError' || 
                                    errMsg.includes('aborted') || 
                                    errMsg.includes('abort') || 
                                    errMsg.includes('cancel') || 
                                    errMsg.includes('without reason');
                                 if (!isAbort) {
                                   triggerDownload();
                                }
                             }
                          } else {
                             triggerDownload();
                          }
                       } catch (err) {
                          console.error('Generation Failed:', err);
                       } finally {
                          setIsGeneratingCard(false);
                       }
                    }}
                    disabled={isGeneratingCard || !preGeneratedDataUrl}
                    className={`w-full py-4 bg-gradient-to-r ${!preGeneratedDataUrl ? 'from-amber-500/20 to-yellow-600/10 text-white/40 cursor-not-allowed border border-white/5' : 'from-[#FFD600] to-amber-500 hover:from-amber-400 hover:to-orange-500 text-black shadow-[0_0_30px_rgba(255,214,0,0.6)] hover:scale-105 active:scale-95'} transition-all font-black text-sm rounded-full flex items-center justify-center gap-3 relative overflow-hidden group`}
                  >
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                     {!preGeneratedDataUrl ? (
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                           <span className="text-white/50 text-[14px]">جاري تجهيز وثيقة الشرف...</span>
                        </div>
                     ) : generationSuccess ? (
                        <><Download size={22} className="relative z-10" /><span className="relative z-10 text-[15px]">تم الحفظ والمشاركة بنجاح! 🎉</span></>
                     ) : (
                        <><Share2 size={22} className="relative z-10" /><span className="relative z-10 text-[15px]">حفظ ومشاركة البطاقة 📲</span></>
                     )}
                  </button>
               </div>
               <button
                 onClick={onClose}
                 className="text-white/50 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors mt-2"
               >
                  إغلاق النافذة
               </button>
            </div>
         </motion.div>
      )}
    </AnimatePresence>
  );
};
