import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download, Sparkles, CheckCircle2 } from 'lucide-react';
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

function quickDataURLtoBlob(dataurl: string): Blob {
  try {
    const parts = dataurl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([], { type: 'image/png' });
  }
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
      // High-resolution pre-generation in background for instantaneous share/download
      const timer = setTimeout(async () => {
         try {
            const node = document.getElementById(exportId);
            if (node) {
               const dataUrl = await toPng(node, {
                  quality: 1.0,
                  pixelRatio: 2.0, // Ultra-Crisp 2K/4K HD output
                  backgroundColor: '#040714',
                  cacheBust: false,
               });
               setPreGeneratedDataUrl(dataUrl);
            }
         } catch (err) {
            console.warn("Card background prep note (will generate on click):", err);
         }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setPreGeneratedDataUrl(null);
      setIsGeneratingCard(false);
      setGenerationSuccess(false);
    }
  }, [isOpen, exportId, studentData, academicProfile]);
  
  const studentName = studentData?.studentName || studentData?.name || '';
  const cleanStudentName = studentName.replace(/^ولي أمر\s*/, '').trim() || 'طالب متميز';
  const schoolLabel = studentData?.schoolName || studentData?.school || schoolName || schoolConfigs?.schoolName || schoolConfigs?.name || 'المدرسة الإلكترونية';
  const gradeLabel = studentData?.grade || academicProfile?.levelData?.gradeTag || studentData?.academicLevel || 'المرحلة الأكاديمية';
  const studentCode = studentData?.code || studentData?.student || studentData?.id || '2026';
  const certSerial = `BYR-${String(studentCode).slice(-6).toUpperCase() || '6X'}-2026`;

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

    // Ensure the card always contains exactly 12 prestigious badges to maintain peak aesthetic symmetry and layout completeness
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
         detail: 'صدارة قاعة الأبطال',
         extraTags: [] as string[]
      },
      {
         id: 'pad_radar',
         badgeName: 'فارس الذكاء الاصطناعي',
         subjName: 'رادار الذكاء',
         icon: '📡',
         levelColor: 'text-cyan-400 bg-cyan-400/10',
         detail: 'إتقان الأسئلة الاستنتاجية',
         extraTags: [] as string[]
      },
      {
         id: 'pad_challenger',
         badgeName: 'بطل تحدي الـ 60 ثانية',
         subjName: 'تحدي السرعة',
         icon: '⚡',
         levelColor: 'text-yellow-400 bg-yellow-400/10',
         detail: 'سرعة ودقة قياسية',
         extraTags: [] as string[]
      },
      {
         id: 'pad_academic_shield',
         badgeName: 'الدرع الأكاديمي الفخري',
         subjName: 'وسام شرف',
         icon: '🛡️',
         levelColor: 'text-blue-400 bg-blue-400/10',
         detail: 'استحقاق علمي رفيع',
         extraTags: [] as string[]
      },
      {
         id: 'pad_pioneer',
         badgeName: 'وسام الريادة والابتكار',
         subjName: 'وسام شرف',
         icon: '🚀',
         levelColor: 'text-purple-400 bg-purple-400/10',
         detail: 'إبداع مستمر بالمنظومة',
         extraTags: [] as string[]
      }
    ];

    for (const pad of honoraryPadBadges) {
      if (list.length >= 12) break;
      const alreadyHas = list.some(item => 
         item.id === pad.id || 
         item.badgeName === pad.badgeName || 
         (pad.id === 'pad_radar' && list.some(i => i.id === 'radar' || i.badgeName?.includes('رادار'))) ||
         (pad.id === 'pad_challenger' && list.some(i => i.id?.includes('challenge') || i.badgeName?.includes('تحدي')))
      );
      if (!alreadyHas) {
         list.push({ ...pad });
      }
    }

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

    // Sort the list: "exemption_general" is index 0, followed by "exemption_indiv", followed by subjects sorted by grade descending
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
  }, [academicProfile, studentData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/90 z-[99999] flex flex-col items-center p-4 backdrop-blur-md overflow-y-auto overscroll-contain py-8"
        >
           {/* ========================================================================= */}
           {/* HIDDEN OFF-SCREEN ULTRA-HD HIGH RESOLUTION EXPORT CANVASES (1080x1920 @ 2x) */}
           {/* ========================================================================= */}
           <div style={{ position: 'absolute', top: 0, left: '-9999px', width: 0, height: 0, zIndex: -9999, pointerEvents: 'none', overflow: 'hidden', opacity: 1 }}>
             <div 
                id={exportId}
                className="flex flex-col relative overflow-hidden"
                style={{ 
                  width: '1080px', 
                  minHeight: '1920px',
                  height: 'max-content',
                  backgroundColor: '#040714',
                  direction: 'rtl',
                  padding: '50px 50px 70px 50px',
                  boxSizing: 'border-box',
                  fontFamily: 'Cairo, Tajawal, "Noto Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'geometricPrecision'
                }}
             >
                  {/* Background Gradients, Nebula & Golden Ambient Rays */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(150deg, #02050e 0%, #060e24 25%, #0b1739 50%, #060d22 75%, #02040a 100%)', zIndex: 0 }} />
                  <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(255, 214, 0, 0.18) 0%, rgba(255, 214, 0, 0.05) 45%, transparent 70%)', zIndex: 1, filter: 'blur(30px)' }} />
                  <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '650px', height: '650px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.05) 45%, transparent 70%)', zIndex: 1, filter: 'blur(30px)' }} />
                  <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', width: '900px', height: '900px', background: 'radial-gradient(circle, rgba(13, 71, 161, 0.12) 0%, transparent 65%)', zIndex: 1, pointerEvents: 'none' }} />

                  {/* Geometric Guilloche Background Watermark Pattern */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(#FFD600 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', zIndex: 1, pointerEvents: 'none' }} />

                  {/* Majestic Multi-Layer Royal Gold Certificate Frame */}
                  <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', bottom: '24px', border: '4px solid #FFD600', borderRadius: '36px', pointerEvents: 'none', zIndex: 2, boxShadow: '0 0 35px rgba(255, 214, 0, 0.35), inset 0 0 35px rgba(255, 214, 0, 0.15)' }} />
                  <div style={{ position: 'absolute', top: '34px', left: '34px', right: '34px', bottom: '34px', border: '2px dashed rgba(255, 214, 0, 0.45)', borderRadius: '28px', pointerEvents: 'none', zIndex: 2 }} />
                  <div style={{ position: 'absolute', top: '42px', left: '42px', right: '42px', bottom: '42px', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '22px', pointerEvents: 'none', zIndex: 2 }} />
                  
                  {/* Royal 3D Metallic Golden Corner Ornaments & Rosettes */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '55px', height: '55px', borderTop: '6px solid #FFD600', borderRight: '6px solid #FFD600', borderTopRightRadius: '18px', zIndex: 4, filter: 'drop-shadow(0 0 10px rgba(255,214,0,0.8))' }} />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', width: '55px', height: '55px', borderTop: '6px solid #FFD600', borderLeft: '6px solid #FFD600', borderTopLeftRadius: '18px', zIndex: 4, filter: 'drop-shadow(0 0 10px rgba(255,214,0,0.8))' }} />
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '55px', height: '55px', borderBottom: '6px solid #FFD600', borderRight: '6px solid #FFD600', borderBottomRightRadius: '18px', zIndex: 4, filter: 'drop-shadow(0 0 10px rgba(255,214,0,0.8))' }} />
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '55px', height: '55px', borderBottom: '6px solid #FFD600', borderLeft: '6px solid #FFD600', borderBottomLeftRadius: '18px', zIndex: 4, filter: 'drop-shadow(0 0 10px rgba(255,214,0,0.8))' }} />

                  {/* Corner Star Studs */}
                  <div style={{ position: 'absolute', top: '22px', right: '22px', color: '#FFD600', fontSize: '18px', zIndex: 5, lineHeight: 1 }}>✦</div>
                  <div style={{ position: 'absolute', top: '22px', left: '22px', color: '#FFD600', fontSize: '18px', zIndex: 5, lineHeight: 1 }}>✦</div>
                  <div style={{ position: 'absolute', bottom: '22px', right: '22px', color: '#FFD600', fontSize: '18px', zIndex: 5, lineHeight: 1 }}>✦</div>
                  <div style={{ position: 'absolute', bottom: '22px', left: '22px', color: '#FFD600', fontSize: '18px', zIndex: 5, lineHeight: 1 }}>✦</div>

                  {/* Inner Content Container */}
                  <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '28px' }}>
                      
                      {/* SECTION 1: HEADER & IDENTITY */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Top Header: Balanced Layout */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1.5px solid rgba(255, 214, 0, 0.25)' }}>
                             
                             {/* Right: Actual School Info and Saved Logo */}
                             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '115px', height: '115px', borderRadius: '28px', backgroundColor: '#091128', border: '3px solid rgba(255,214,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 15px rgba(255,214,0,0.2)', flexShrink: 0 }}>
                                   <img 
                                      src="/school-logos/logo1.jpg" 
                                      alt="School Brand" 
                                      crossOrigin="anonymous"
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                      onError={(e) => {
                                         (e.target as HTMLImageElement).style.display = 'none';
                                         const parent = (e.target as HTMLImageElement).parentElement;
                                         if (parent) { parent.innerHTML = '<span style="color:#ffffff90;font-size:48px">🏫</span>'; }
                                      }} 
                                   />
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <h2 style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '34px', margin: 0, textShadow: '0 3px 12px rgba(0,0,0,0.9)', lineHeight: 1.2, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{schoolLabel !== 'المدرسة الإلكترونية' ? schoolLabel : (schoolName || 'بوابة بيرق التعليمية')}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                       <span style={{ color: '#FFD600', fontSize: '18px' }}>★</span>
                                       <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'Tajawal, sans-serif', fontSize: '22px', margin: 0, fontWeight: '800' }}>سجل التميز والشرف الأكاديمي</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '12px' }}>
                                       <div style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.2) 0%, rgba(255,214,0,0.05) 100%)', border: '1.5px solid #FFD600', borderRadius: '50px', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(255,214,0,0.2)' }}>
                                          <span style={{ color: '#FFD600', fontSize: '16px' }}>👑</span>
                                          <span style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}>وثيقة رسمية معتمدة</span>
                                       </div>
                                       <div style={{ color: 'rgba(255,214,0,0.9)', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', fontWeight: 'bold', marginTop: '6px', letterSpacing: '3px' }}>★ ★ ★ ★ ★</div>
                                    </div>
                                </div>
                             </div>

                             {/* Center: Empty Space Now */}
                             <div style={{ display: 'flex', flex: 1 }}></div>

                             {/* Left: Premium Bayraq Info and Brand Logo */}
                             <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexDirection: 'row-reverse' }}>
                                <div style={{ width: '115px', height: '115px', borderRadius: '28px', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0', flexShrink: 0 }}>
                                   <img 
                                      src="/logo.png" 
                                      alt="Bayraq" 
                                      crossOrigin="anonymous"
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 15px rgba(255,214,0,0.5))' }} 
                                      onError={(e) => {
                                         (e.target as HTMLImageElement).style.display = 'none';
                                         const parent = (e.target as HTMLImageElement).parentElement;
                                         if (parent) { parent.innerHTML = '<span style="color:#FFD600;font-size:52px">👑</span>'; }
                                      }} 
                                   />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                   <h2 style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '36px', letterSpacing: '2px', margin: 0, textShadow: '0 3px 20px rgba(255,214,0,0.4)', lineHeight: 1.2 }}>بوابة بيرق</h2>
                                   <p style={{ color: 'rgba(255, 214, 0, 0.95)', fontFamily: 'Tajawal, sans-serif', fontSize: '20px', margin: '3px 0 0 0', letterSpacing: '4px', fontWeight: '900' }}>GATE 6 • PRO</p>
                                </div>
                             </div>
                          </div>

                          {/* Student Identity Spotlight Section */}
                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                             
                             {/* Avatar Halo */}
                             <div style={{ position: 'relative', width: '210px', height: '210px', marginBottom: '12px', flexShrink: 0 }}>
                                <div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 214, 0, 0.35) 0%, transparent 70%)', filter: 'blur(10px)' }} />
                                {studentData?.avatar ? (
                                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #FFD600', outline: '4px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 0 50px rgba(255,214,0,0.5), inset 0 0 20px rgba(0,0,0,0.5)', overflow: 'hidden', backgroundColor: '#0a0f24', position: 'relative', zIndex: 2 }}>
                                      <img src={studentData.avatar} alt={cleanStudentName} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   </div>
                                ) : (
                                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #FFD600', outline: '4px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 0 50px rgba(255,214,0,0.5), inset 0 0 20px rgba(0,0,0,0.5)', backgroundColor: '#0a0f24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '85px', position: 'relative', zIndex: 2 }}>
                                      {academicProfile?.isEliteStudent ? '👑' : '👨‍🎓'}
                                   </div>
                                )}
                                {/* Golden Crown Crest on Top of Avatar */}
                                <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FFD600', color: '#000', padding: '4px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '13px', zIndex: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <span>🏆</span>
                                   <span>فارس التميز</span>
                                </div>
                             </div>

                             {/* Student Name */}
                             <h3 style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '66px', margin: '0 0 8px 0', lineHeight: 1.15, textShadow: '0 4px 25px rgba(0,0,0,0.9), 0 0 20px rgba(255,214,0,0.3)', whiteSpace: 'nowrap' }}>
                                {cleanStudentName}
                             </h3>
                             
                             {/* Grade & Subtitle Capsule */}
                             <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '14px', backgroundColor: 'rgba(255,214,0,0.12)', border: '2.5px solid rgba(255,214,0,0.5)', borderRadius: '100px', padding: '10px 36px', boxShadow: '0 6px 25px rgba(255,214,0,0.25)', marginTop: '2px' }}>
                                <span style={{ color: '#FFD600', fontSize: '24px' }}>🎖️</span>
                                <span style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '28px' }}>{gradeLabel}</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>•</span>
                                <span style={{ color: '#ffffff', fontFamily: 'Tajawal, sans-serif', fontWeight: '800', fontSize: '22px' }}>حائز على وسام الشرف الأكاديمي</span>
                             </div>
                          </div>
                      </div>

                      {/* SECTION 2: BEAUTIFUL ARTISTIC BADGES MATRIX (HIGH DENSITY CRYSTAL CLEAR) */}
                      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', margin: '0 auto', justifyItems: 'stretch', alignContent: 'center', flex: 1 }}>
                         {allBadges
                           .slice(0, Math.min(12, Math.floor(allBadges.length / 2) * 2))
                           .map((ach: any, idx: number) => {
                           const colorSchemes: Record<string, { bg: string, border: string, text: string, tagBg: string, tagBorder: string }> = {
                             emerald: {
                               bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.3) 100%)',
                               border: '2.5px solid rgba(16, 185, 129, 0.45)',
                               text: '#10b981',
                               tagBg: 'rgba(16, 185, 129, 0.18)',
                               tagBorder: '1.5px solid rgba(16, 185, 129, 0.6)'
                             },
                             blue: {
                               bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(30, 58, 138, 0.3) 100%)',
                               border: '2.5px solid rgba(59, 130, 246, 0.45)',
                               text: '#3b82f6',
                               tagBg: 'rgba(59, 130, 246, 0.18)',
                               tagBorder: '1.5px solid rgba(59, 130, 246, 0.6)'
                             },
                             purple: {
                               bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(76, 29, 149, 0.3) 100%)',
                               border: '2.5px solid rgba(139, 92, 246, 0.45)',
                               text: '#a78bfa',
                               tagBg: 'rgba(139, 92, 246, 0.18)',
                               tagBorder: '1.5px solid rgba(139, 92, 246, 0.6)'
                             },
                             yellow: {
                               bg: 'linear-gradient(135deg, rgba(255, 214, 0, 0.16) 0%, rgba(120, 53, 15, 0.3) 100%)',
                               border: '2.5px solid rgba(255, 214, 0, 0.55)',
                               text: '#FFD600',
                               tagBg: 'rgba(255, 214, 0, 0.18)',
                               tagBorder: '1.5px solid rgba(255, 214, 0, 0.7)'
                             },
                             cyan: {
                               bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(21, 94, 117, 0.3) 100%)',
                               border: '2.5px solid rgba(6, 182, 212, 0.45)',
                               text: '#06b6d4',
                               tagBg: 'rgba(6, 182, 212, 0.18)',
                               tagBorder: '1.5px solid rgba(6, 182, 212, 0.6)'
                             },
                             orange: {
                               bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16) 0%, rgba(124, 45, 18, 0.3) 100%)',
                               border: '2.5px solid rgba(249, 115, 22, 0.45)',
                               text: '#f97316',
                               tagBg: 'rgba(249, 115, 22, 0.18)',
                               tagBorder: '1.5px solid rgba(249, 115, 22, 0.6)'
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

                           let finalBg = 'linear-gradient(135deg, rgba(16, 24, 48, 0.92) 0%, rgba(8, 12, 28, 0.95) 100%)';
                           let finalBorder = '1.8px solid rgba(255, 214, 0, 0.3)';
                           let finalTextColor = scheme.text;
                           let finalTagBg = scheme.tagBg;
                           let finalTagBorder = scheme.tagBorder;
                           let stripColor = '#FFD600';
                           let stripShadow = '0 0 18px rgba(255,214,0,0.6)';
                           let luxuriousShadow = '0 12px 25px rgba(0, 0, 0, 0.6)';

                           if (isGeneralExemption) {
                             finalBg = 'linear-gradient(135deg, rgba(236, 72, 153, 0.28) 0%, rgba(139, 92, 246, 0.35) 100%)';
                             finalBorder = '2.5px dashed #FFD600';
                             finalTextColor = '#FFD600';
                             finalTagBg = 'rgba(255, 214, 0, 0.2)';
                             finalTagBorder = '2px solid #FFD600';
                             stripColor = '#EC4899';
                             stripShadow = '0 0 25px rgba(236,72,153,0.9)';
                             luxuriousShadow = '0 15px 30px rgba(236, 72, 153, 0.35), 0 10px 20px rgba(0, 0, 0, 0.8)';
                           } else if (isIndividualExemption) {
                             finalBg = 'linear-gradient(135deg, rgba(20, 184, 166, 0.28) 0%, rgba(139, 92, 246, 0.2) 100%)';
                             finalBorder = '2.5px solid #14b8a6';
                             finalTextColor = '#14b8a6';
                             finalTagBg = 'rgba(20, 184, 166, 0.2)';
                             finalTagBorder = '2px solid #14b8a6';
                             stripColor = '#14b8a6';
                             stripShadow = '0 0 20px rgba(20,184,166,0.8)';
                             luxuriousShadow = '0 15px 30px rgba(20, 184, 166, 0.3), 0 10px 20px rgba(0, 0, 0, 0.8)';
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
                               borderRadius: '26px', 
                               padding: '20px 24px', 
                               border: finalBorder, 
                               position: 'relative', 
                               overflow: 'hidden', 
                               boxShadow: luxuriousShadow, 
                               width: '100%',
                               boxSizing: 'border-box'
                             }}>
                               {/* Color Strip Indicator */}
                               <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '12px', backgroundColor: stripColor, boxShadow: stripShadow }} />
                               
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  {/* Grouping of Icon & Titles */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                     {/* Badge Icon Circular Case */}
                                     <div style={{ 
                                        width: '76px', 
                                        height: '76px', 
                                        borderRadius: '50%', 
                                        backgroundColor: 'rgba(255,255,255,0.08)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0, 
                                        border: `2px solid ${finalTextColor}80`, 
                                        position: 'relative',
                                        boxShadow: `0 0 20px ${finalTextColor}4D, inset 0 0 12px ${finalTextColor}22`
                                     }}>
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
                                           filter: `drop-shadow(0 0 6px ${finalTextColor})`,
                                           fontSize: '32px',
                                           lineHeight: '1'
                                        }}>
                                           {ach.icon}
                                        </span>
                                     </div>
                                     
                                     {/* Titles */}
                                     <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', minWidth: 0, flex: 1 }}>
                                        <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '24px', marginBottom: '4px', lineHeight: '1.25', display: 'block', wordBreak: 'break-word' }}>{ach.badgeName}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Tajawal, sans-serif', fontWeight: '800', fontSize: '20px', display: 'block', wordBreak: 'break-word' }}>{ach.subjName}</span>
                                     </div>
                                  </div>
                                  
                                  {/* Grade Tag (on Left) */}
                                  {isGrade && (
                                     <div style={{ padding: '10px 20px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '20px', flexShrink: 0, textAlign: 'center', minWidth: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: `0 4px 15px ${finalTagBg}` }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontFamily: 'Tajawal, sans-serif', fontWeight: '900', fontSize: '18px', marginBottom: '2px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{gradeLabel}</span>
                                        <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontWeight: '950', fontSize: '46px', lineHeight: 1, textShadow: `0 0 15px ${finalTextColor}, 0 2px 6px rgba(0,0,0,0.9)` }}>{gradeValue}</span>
                                     </div>
                                  )}
  
                                  {/* Short Tag Box */}
                                  {(!isLongDetail && !isGrade && detailRows.length > 0) && (
                                     <div style={{ padding: '12px 18px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '20px', flexShrink: 0, textAlign: 'center', minWidth: '90px', boxShadow: `0 4px 12px ${finalTextColor}22` }}>
                                        <span style={{ color: '#ffffff', textShadow: `0 0 10px ${finalTextColor}`, fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '20px', whiteSpace: 'nowrap' }}>{detailRows}</span>
                                     </div>
                                  )}
                               </div>

                               {/* Extra Merged Tags */}
                               {(ach.extraTags && ach.extraTags.length > 0) && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                    {ach.extraTags.map((tag: string, i: number) => (
                                       <span key={i} style={{ 
                                         backgroundColor: 'rgba(255,255,255,0.08)', 
                                         border: '1.5px solid rgba(255,255,255,0.2)',
                                         borderRadius: '16px', 
                                         padding: '4px 14px', 
                                         color: '#fff', 
                                         fontSize: '16px', 
                                         fontFamily: 'Tajawal, sans-serif', 
                                         fontWeight: 'bold',
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: '6px',
                                         boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                                       }}>
                                          {tag}
                                       </span>
                                    ))}
                                  </div>
                               )}

                               {/* Full Width Box for Long Texts */}
                               {isLongDetail && (
                                  <div style={{ marginTop: '14px', padding: '12px 18px', backgroundColor: finalTagBg, border: finalTagBorder, borderRadius: '16px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                                     <span style={{ 
                                       color: finalTextColor, 
                                       fontFamily: 'Tajawal, sans-serif', 
                                       fontWeight: '800', 
                                       fontSize: '18px', 
                                       whiteSpace: 'normal', 
                                       display: 'block', 
                                       lineHeight: '1.5' 
                                     }}>{detailRows}</span>
                                  </div>
                               )}
                             </div>
                           );
                         })}
                      </div>

                      {/* SECTION 3: PRESTIGIOUS SIGNATURE, OFFICIAL SEALS & AFFIRMATION */}
                      <div style={{ textAlign: 'center', borderTop: '2px solid rgba(255,214,0,0.3)', paddingTop: '24px', position: 'relative', flexShrink: 0, marginTop: '8px' }}>
                         
                         {/* Centered Diamond Divider */}
                         <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#040714', padding: '0 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '20px', color: '#FFD600' }}>✦</span>
                            <span style={{ fontSize: '28px', color: '#FFD600' }}>★</span>
                            <span style={{ fontSize: '20px', color: '#FFD600' }}>✦</span>
                         </div>

                         {/* Title */}
                         <h1 style={{ color: '#FFD600', fontFamily: 'Cairo, sans-serif', fontSize: '50px', fontWeight: '900', letterSpacing: '3px', margin: '0 0 10px 0', textShadow: '0 4px 25px rgba(255,214,0,0.5)', lineHeight: '1.2' }}>
                            وســــام التـمـيـــز الشـرفـــي الأكـاديـمـي 🌟
                         </h1>
                         
                         {/* Official Endorsement & Verification Footer */}
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '16px 30px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1.5px solid rgba(255,214,0,0.2)' }}>
                            {/* Verification Code */}
                            <div style={{ textAlign: 'right' }}>
                               <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal, sans-serif', fontSize: '15px', display: 'block' }}>رمز التوثيق الأكاديمي المعتمد</span>
                               <span style={{ color: '#FFD600', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>{certSerial}</span>
                            </div>

                            {/* Center Stamp */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: 'rgba(255,214,0,0.1)', borderRadius: '50px', border: '1px solid rgba(255,214,0,0.3)' }}>
                               <span style={{ color: '#FFD600', fontSize: '16px' }}>🛡️</span>
                               <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontSize: '15px', fontWeight: 'bold' }}>معتمد رسمياً • العام الدراسي 2025 - 2026</span>
                            </div>

                            {/* Signature */}
                            <div style={{ textAlign: 'left' }}>
                               <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal, sans-serif', fontSize: '15px', display: 'block' }}>جهة الإصدار والاعتماد</span>
                               <span style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif', fontSize: '16px', fontWeight: '900' }}>إدارة بوابة بيرق الأكاديمية</span>
                            </div>
                         </div>
                      </div>
                  </div>
              </div>
           </div>

           {/* ========================================================================= */}
           {/* INTERACTIVE MODAL PREVIEW CARD (RESPONSIVE FOR ALL SCREEN SIZES)          */}
           {/* ========================================================================= */}
           <div className="bg-gradient-to-br from-[#060b1e] via-[#0b1636] to-[#040817] rounded-[2rem] p-5 sm:p-6 border-2 border-[#FFD600]/40 w-[330px] sm:w-[360px] aspect-[9/16] flex flex-col relative overflow-hidden shadow-[0_20px_60px_rgba(255,214,0,0.25)] mx-auto my-auto mt-4 md:mt-auto shrink-0" style={{ direction: 'rtl' }}>
              {/* Card Background Effects */}
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top,#FFD600_0%,transparent_60%)] opacity-15 pointer-events-none" />
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-48 h-12 bg-[#FFD600]/25 blur-3xl pointer-events-none" />
              
              {/* Corner Ornaments in Preview */}
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#FFD600] rounded-tr pointer-events-none" />
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#FFD600] rounded-tl pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#FFD600] rounded-br pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#FFD600] rounded-bl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start mt-1 mb-4 relative z-10 w-full flex-shrink-0 px-1 border-b border-[#FFD600]/20 pb-2">
                  {/* Right: School */}
                  <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#0d1738] border border-[#FFD600]/30 flex items-center justify-center relative overflow-hidden shadow-sm">
                         <img src="/school-logos/logo1.jpg" alt="School" className="w-full h-full object-contain p-1" onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const pr = e.currentTarget.parentElement;
                            if (pr) pr.innerHTML = '🏫';
                         }} />
                      </div>
                      <div className="text-right">
                         <h2 className="text-white font-black text-[10px] leading-tight max-w-[90px] truncate">{schoolLabel}</h2>
                         <p className="text-[#FFD600] font-bold text-[7.5px] mt-0.5">سجل التميز الأكاديمي</p>
                      </div>
                  </div>
                  
                  {/* Left: Bayraq */}
                  <div className="flex items-center gap-2 flex-row-reverse">
                      <div className="w-9 h-9 rounded-xl bg-[#0d1738] border border-[#FFD600]/50 shadow-[0_0_15px_rgba(255,214,0,0.3)] flex items-center justify-center relative overflow-hidden">
                         <img src="/logo.png" alt="Bayraq" className="w-full h-full object-contain p-1" onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const pr = e.currentTarget.parentElement;
                            if (pr) pr.innerHTML = '👑';
                         }} />
                      </div>
                      <div className="text-left">
                         <h2 className="text-[#FFD600] font-black tracking-widest text-[10px] leading-tight">بوابة بيرق</h2>
                         <p className="text-white/60 font-bold text-[7.5px] mt-0.5 tracking-widest text-center">GATE 6</p>
                      </div>
                  </div>
              </div>

              {/* Student Identity */}
              <div className="text-center mb-auto relative z-10 w-full mt-1 flex-shrink-0">
                 <div className="mx-auto w-[90px] h-[90px] mb-2 rounded-full border-[4px] border-[#FFD600] outline outline-[2px] outline-white/30 shadow-[0_0_25px_rgba(255,214,0,0.5)] bg-cover bg-center flex items-center justify-center text-4xl bg-[#0a0f24] relative"
                      style={{ backgroundImage: studentData?.avatar ? `url(${studentData.avatar})` : 'none' }}>
                    {!studentData?.avatar && (academicProfile?.isEliteStudent ? '👑' : '👨‍🎓')}
                    <div className="absolute -top-2.5 bg-[#FFD600] text-black font-black text-[7px] px-2 py-0.5 rounded-full shadow-md">
                       فارس التميز 🏆
                    </div>
                 </div>
                 <h3 className="text-white font-extrabold text-[20px] drop-shadow-md break-words leading-tight">{cleanStudentName}</h3>
                 <div className="inline-flex items-center gap-1.5 bg-[#FFD600]/10 border border-[#FFD600]/30 px-3 py-0.5 rounded-full mt-1">
                    <span className="text-[#FFD600] text-[9px] font-black">{gradeLabel}</span>
                 </div>
              </div>
              
              {/* Badges Snapshot */}
              <div className="grid grid-cols-2 gap-2 relative z-10 w-full mb-3 mt-auto">
                 {allBadges.slice(0, 4).map((ach: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center bg-[#0d1633] rounded-xl py-2 px-1 border border-[#FFD600]/25 shadow-md relative overflow-hidden">
                       <div className="absolute top-0 right-0 h-full w-1 opacity-90 bg-[#FFD600] shadow-[0_0_6px_rgba(255,214,0,0.6)]" />
                       <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 mb-1 border border-white/10" style={{ fontSize: '15px' }}>
                          {ach.icon}
                       </div>
                       <div className="text-center w-full px-1.5">
                          <div className="text-white font-black text-[9px] leading-tight truncate">{ach.badgeName}</div>
                          <div className="text-white/60 font-bold text-[7.5px] truncate">{ach.subjName}</div>
                       </div>
                       <div className="mt-1 bg-[#FFD600]/15 border border-[#FFD600]/30 px-2 py-0.5 rounded-full flex items-center justify-center">
                          <span className="text-[#FFD600] font-black text-[8px]">{ach.detail}</span>
                       </div>
                    </div>
                 ))}
              </div>
              {allBadges.length > 4 && (
                 <div className="w-full text-center relative z-10 -mt-2 mb-2">
                    <span className="text-white/70 text-[8.5px] font-bold bg-[#FFD600]/10 px-3 py-0.5 rounded-full border border-[#FFD600]/30">+ {allBadges.length - 4} أوسمة شرف أخرى في الوثيقة الكاملة</span>
                 </div>
              )}
              {allBadges.length === 0 && (
                 <p className="text-white/40 font-bold text-xs text-center p-4 relative z-10">أوسمة الشرف في طريقها إليك...</p>
              )}

              {/* Prestigious Footer Signature */}
              <div className="text-center border-t border-[#FFD600]/30 pt-2 w-full relative z-10 flex-shrink-0 mt-1 pb-1">
                 <p className="text-[#FFD600] text-[10px] font-black tracking-wider uppercase mb-0.5">وسـام التمـيــز الشـرفــي 🌟</p>
                 <p className="text-white/60 text-[7px] tracking-wide">وثيقة معتمدة رسمياً بدقة 4K فائقة الوضوح</p>
              </div>
           </div>

           {/* ACTION BUTTONS */}
           <div className="mt-5 flex flex-col items-center gap-3 shrink-0 pb-8">
              <div className="flex flex-col items-center gap-3 w-full max-w-sm px-4">
                 
                 {/* High-Definition 4K Generation Badge */}
                 <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>توليد تلقائي بجودة 4K فائقة الدقة (Ultra HD)</span>
                 </div>

                 {/* Primary Direct Ultra High-Quality Share/Download Button */}
                 <button 
                   onClick={async () => {
                      if (isGeneratingCard) return;
                      setIsGeneratingCard(true);
                      setGenerationSuccess(false);
                      
                      try {
                         const node = document.getElementById(exportId);
                         if (!node) {
                            throw new Error("Target card element not found");
                         }
                         
                         // Generate at Ultra HD 2x scale (2160x3840+ px)
                         const dataUrl = preGeneratedDataUrl || await toPng(node, {
                            quality: 1.0,
                            pixelRatio: 2.0, // Ultra HD Sharpness
                            backgroundColor: '#040714',
                            cacheBust: false,
                         });
                         
                         const blob = quickDataURLtoBlob(dataUrl);
                         const file = new File([blob], `bayraq-achievement-${cleanStudentName.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                         
                         const triggerDownload = () => {
                            const link = document.createElement('a');
                            link.download = file.name;
                            link.href = dataUrl;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            setGenerationSuccess(true);
                            setTimeout(() => setGenerationSuccess(false), 4000);
                         };

                         if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            try {
                               await navigator.share({
                                  files: [file],
                                  title: 'بطاقة شرف التميز الأكاديمي',
                                  text: `أوسمة وإنجازات ${cleanStudentName} من بوابة بيرق الأكاديمية 📜✨`
                               });
                               setGenerationSuccess(true);
                               setTimeout(() => setGenerationSuccess(false), 4000);
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
                   disabled={isGeneratingCard}
                   className={`w-full py-4 bg-gradient-to-r from-[#FFD600] via-amber-400 to-amber-500 hover:from-amber-300 hover:to-orange-500 text-black shadow-[0_0_35px_rgba(255,214,0,0.6)] hover:scale-105 active:scale-95 transition-all font-black text-sm rounded-full flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer`}
                 >
                    <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    {isGeneratingCard ? (
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span className="text-black font-black text-[15px]">جاري معالجة وتوليد البطاقة بدقة فائقة... ⏳</span>
                       </div>
                    ) : generationSuccess ? (
                       <><CheckCircle2 size={22} className="relative z-10 text-emerald-950" /><span className="relative z-10 text-[15px]">تم الحفظ والمشاركة بأعلى جودة! 🎉</span></>
                    ) : (
                       <><Share2 size={22} className="relative z-10" /><span className="relative z-10 text-[15px]">حفظ ومشاركة بطاقة الشرف بدقة 4K 📲</span></>
                    )}
                 </button>
              </div>

              <button
                onClick={onClose}
                className="text-white/60 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors mt-2"
              >
                 إغلاق النافذة
              </button>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
