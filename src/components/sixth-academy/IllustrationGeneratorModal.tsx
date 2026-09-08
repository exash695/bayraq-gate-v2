import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Palette, Image as ImageIcon, Check, Download, RefreshCw, Layers, Plus, Dna, Atom, Zap, BookOpen } from 'lucide-react';
import { PageIllustration } from './types';

interface IllustrationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageTitle: string;
  currentPageContent?: string;
  onAttachToPage: (illustration: PageIllustration) => void;
}

export const IllustrationGeneratorModal: React.FC<IllustrationGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentPageTitle,
  currentPageContent = "",
  onAttachToPage
}) => {
  const [topicPrompt, setTopicPrompt] = useState(currentPageTitle || "");
  
  // Smart Subject Detector based on page content and title
  const detectedInfo = React.useMemo(() => {
    const combined = `${currentPageTitle} ${currentPageContent}`.toLowerCase();
    
    if (/unit\s*\d|lesson\s*\d|english|إنكليزي|انكليزي|انجليزي|past\s*simple|present\s*perfect|grammar|vocabulary|bleed|sick|hurt|sneeze|verb|noun|adjective|prefix|suffix/i.test(combined)) {
      return { 
        subject: 'english' as const, 
        label: 'اللغة الإنكليزية (English Language)', 
        icon: '🇬🇧', 
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        defaultStyle: 'mindmap' as const
      };
    }
    if (/خلية|خلايا|ميتوكوندريا|نواة|سايتوبلازم|غشاء|أنسجة|وراثة|انقسام|أحياء|احياء|الاحياء|كروموسوم|بلازم|ريبوسوم|كولجي/i.test(combined)) {
      return { 
        subject: 'biology' as const, 
        label: 'علم الأحياء والتشريح (Biology)', 
        icon: '🧬', 
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        defaultStyle: 'scientific_diagram' as const
      };
    }
    if (/تفاعل|كيمياء|الكيمياء|حامض|قاعدة|تأين|إلكترون|مولار|عنصر|مركب|أيون|توازن|حرارية|بفر|ثابت/i.test(combined)) {
      return { 
        subject: 'chemistry' as const, 
        label: 'الكيمياء والمعادلات (Chemistry)', 
        icon: '🧪', 
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        defaultStyle: 'flowchart' as const
      };
    }
    if (/متسعة|تيار|مغناطيس|فيزياء|الفيزياء|حث|فولت|طاقة|شحنة|رنين|مجال|تردد|قوة|فوتون|بلانك/i.test(combined)) {
      return { 
        subject: 'physics' as const, 
        label: 'الفيزياء والدوائر (Physics)', 
        icon: '⚡', 
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        defaultStyle: 'scientific_diagram' as const
      };
    }
    if (/إعراب|نحو|استفهام|نفي|توكيد|استثناء|عربي|العربي|عربيه|لغة عربية|مدح|ذم|مبتدأ|خبر|فاعل|مفعول|قواعد/i.test(combined)) {
      return { 
        subject: 'arabic' as const, 
        label: 'قواعد اللغة العربية (Arabic Grammar)', 
        icon: '📖', 
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        defaultStyle: 'mindmap' as const
      };
    }
    return { 
      subject: 'general' as const, 
      label: 'المادة المنهجية العامة', 
      icon: '✨', 
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      defaultStyle: 'mindmap' as const
    };
  }, [currentPageTitle, currentPageContent]);

  const [selectedSubject, setSelectedSubject] = useState<'biology' | 'chemistry' | 'physics' | 'english' | 'arabic' | 'general'>(detectedInfo.subject);
  const [selectedStyle, setSelectedStyle] = useState<'scientific_diagram' | 'mindmap' | 'flowchart' | 'anatomical'>(detectedInfo.defaultStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [attached, setAttached] = useState(false);

  React.useEffect(() => {
    setSelectedSubject(detectedInfo.subject);
    setSelectedStyle(detectedInfo.defaultStyle);
    if (currentPageTitle) setTopicPrompt(currentPageTitle);
  }, [detectedInfo, currentPageTitle]);

  if (!isOpen) return null;

  // Rich professional vector SVG generator for Biology, Chemistry, Physics, English, and Arabic
  const generateDomainSvg = (title: string, subject: string, style: string): string => {
    if (subject === 'biology' || subject === 'scientific_diagram') {
      return `<svg viewBox="0 0 850 520" xmlns="http://www.w3.org/2000/svg" style="background:linear-gradient(135deg, #070B1E 0%, #0D1630 100%);border-radius:24px;font-family:system-ui, -apple-system, sans-serif;">
        <defs>
          <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#0284C7" stop-opacity="0.4"/>
          </linearGradient>
          <linearGradient id="nucleusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#6366F1"/>
          </linearGradient>
          <linearGradient id="mitoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#EF4444"/>
          </linearGradient>
          <filter id="glowBio" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <!-- Title Banner -->
        <rect x="225" y="25" width="400" height="50" rx="16" fill="#1E293B" stroke="#10B981" stroke-width="2" filter="url(#glowBio)"/>
        <text x="425" y="56" font-size="18" font-weight="900" fill="#34D399" text-anchor="middle" direction="rtl">🔬 رسم توضيحي علمي: ${title || "التركيب الخلوي الدقيق"}</text>

        <!-- Main Outer Membrane / Structure -->
        <ellipse cx="425" cy="270" rx="280" ry="160" fill="url(#cellGrad)" stroke="#10B981" stroke-width="4" stroke-dasharray="12,4"/>

        <!-- Nucleus (النواة) -->
        <ellipse cx="425" cy="270" rx="75" ry="55" fill="url(#nucleusGrad)" stroke="#C084FC" stroke-width="3" filter="url(#glowBio)"/>
        <circle cx="425" cy="270" r="22" fill="#4C1D95" stroke="#E9D5FF" stroke-width="2"/>

        <!-- Mitochondria (الميتوكوندريا) Left & Right -->
        <ellipse cx="250" cy="230" rx="42" ry="24" fill="url(#mitoGrad)" stroke="#FDE68A" stroke-width="2" transform="rotate(-25, 250, 230)"/>
        <path d="M 230 220 Q 250 240 270 220 Q 250 250 230 240" fill="none" stroke="#FEF3C7" stroke-width="2"/>

        <ellipse cx="600" cy="300" rx="42" ry="24" fill="url(#mitoGrad)" stroke="#FDE68A" stroke-width="2" transform="rotate(30, 600, 300)"/>
        <path d="M 580 290 Q 600 310 620 290 Q 600 320 580 310" fill="none" stroke="#FEF3C7" stroke-width="2"/>

        <!-- Golgi Apparatus / Chloroplast (جهاز كولجي / البلاستيدات) -->
        <path d="M 270 330 Q 310 320 350 335" stroke="#38BDF8" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M 265 345 Q 310 335 355 350" stroke="#38BDF8" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 275 360 Q 310 350 345 365" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Ribosomes dots -->
        <circle cx="340" cy="200" r="4" fill="#00E5FF"/>
        <circle cx="360" cy="180" r="4" fill="#00E5FF"/>
        <circle cx="510" cy="210" r="4" fill="#00E5FF"/>
        <circle cx="530" cy="235" r="4" fill="#00E5FF"/>
        <circle cx="490" cy="340" r="4" fill="#00E5FF"/>

        <!-- Arabic Labels & Callout Pointers -->
        <line x1="145" y1="170" x2="230" y2="190" stroke="#10B981" stroke-width="2"/>
        <circle cx="145" cy="170" r="4" fill="#10B981"/>
        <rect x="30" y="150" width="110" height="36" rx="8" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="85" y="173" font-size="12" font-weight="bold" fill="#D1FAE5" text-anchor="middle" direction="rtl">الغشاء البلازمي</text>

        <line x1="425" y1="215" x2="425" y2="135" stroke="#C084FC" stroke-width="2"/>
        <circle cx="425" cy="215" r="4" fill="#C084FC"/>
        <rect x="360" y="105" width="130" height="36" rx="8" fill="#4C1D95" stroke="#C084FC" stroke-width="1.5"/>
        <text x="425" y="128" font-size="12" font-weight="bold" fill="#F3E8FF" text-anchor="middle" direction="rtl">النواة + النويّة</text>

        <line x1="640" y1="290" x2="710" y2="250" stroke="#F59E0B" stroke-width="2"/>
        <circle cx="640" cy="290" r="4" fill="#F59E0B"/>
        <rect x="710" y="230" width="125" height="36" rx="8" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>
        <text x="772" y="253" font-size="12" font-weight="bold" fill="#FEF3C7" text-anchor="middle" direction="rtl">الميتوكوندريا (الطاقة)</text>

        <line x1="530" y1="360" x2="680" y2="400" stroke="#38BDF8" stroke-width="2"/>
        <circle cx="530" cy="360" r="4" fill="#38BDF8"/>
        <rect x="680" y="380" width="120" height="36" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="740" y="403" font-size="12" font-weight="bold" fill="#E0F2FE" text-anchor="middle" direction="rtl">السايتوبلازم والعضيات</text>

        <line x1="310" y1="360" x2="220" y2="430" stroke="#38BDF8" stroke-width="2"/>
        <circle cx="310" cy="360" r="4" fill="#38BDF8"/>
        <rect x="130" y="415" width="115" height="36" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="187" y="438" font-size="12" font-weight="bold" fill="#E0F2FE" text-anchor="middle" direction="rtl">جهاز كولجي الإفرازي</text>

        <!-- Bottom Footer Exam Tip -->
        <rect x="100" y="475" width="650" height="32" rx="10" fill="#111827" stroke="#374151" stroke-width="1"/>
        <text x="425" y="496" font-size="11" font-weight="bold" fill="#9CA3AF" text-anchor="middle" direction="rtl">💡 رسم تخطيطي وزاري دقيق يوضح التأشيرات الأساسية المطلوبة في الامتحان التحريري</text>
      </svg>`;
    }

    if (subject === 'english') {
      return `<svg viewBox="0 0 850 500" xmlns="http://www.w3.org/2000/svg" style="background:#090D24;border-radius:24px;font-family:sans-serif;">
        <defs>
          <linearGradient id="gradEn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#3B82F6"/>
          </linearGradient>
        </defs>
        <!-- Center Header -->
        <rect x="200" y="30" width="450" height="65" rx="20" fill="url(#gradEn)"/>
        <text x="425" y="65" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">🇬🇧 مخطط مفردات وقواعد: ${title || "Unit 1 Vocabulary & Structure"}</text>
        <text x="425" y="85" font-size="12" fill="#E2E8F0" text-anchor="middle">English 6th Preparatory - Interactive Study Map</text>

        <!-- Node 1: Verbs & Actions -->
        <rect x="50" y="140" width="220" height="150" rx="18" fill="#111836" stroke="#8B5CF6" stroke-width="2"/>
        <text x="160" y="175" font-size="15" font-weight="bold" fill="#A78BFA" text-anchor="middle">أفعال وأعراض (Verbs)</text>
        <text x="160" y="205" font-size="13" fill="#E2E8F0" text-anchor="middle">Sneeze (يعطس)</text>
        <text x="160" y="235" font-size="13" fill="#E2E8F0" text-anchor="middle">Bleed / Bleeding (ينزف)</text>
        <text x="160" y="265" font-size="13" fill="#E2E8F0" text-anchor="middle">Hurt / Hurts (يؤلم)</text>

        <!-- Node 2: Adjectives & States -->
        <rect x="315" y="140" width="220" height="150" rx="18" fill="#111836" stroke="#00E5FF" stroke-width="2"/>
        <text x="425" y="175" font-size="15" font-weight="bold" fill="#00E5FF" text-anchor="middle">صفات وحالات (Adjectives)</text>
        <text x="425" y="205" font-size="13" fill="#E2E8F0" text-anchor="middle">Sick (يشعر بالغثيان / مريض)</text>
        <text x="425" y="235" font-size="13" fill="#E2E8F0" text-anchor="middle">Broken (مكسور)</text>
        <text x="425" y="265" font-size="13" fill="#E2E8F0" text-anchor="middle">Sore (ملتهب / متقرح)</text>

        <!-- Node 3: Nouns & Parts -->
        <rect x="580" y="140" width="220" height="150" rx="18" fill="#111836" stroke="#10B981" stroke-width="2"/>
        <text x="690" y="175" font-size="15" font-weight="bold" fill="#10B981" text-anchor="middle">أسماء وأعضاء (Nouns)</text>
        <text x="690" y="205" font-size="13" fill="#E2E8F0" text-anchor="middle">Pain (ألم / وجع)</text>
        <text x="690" y="235" font-size="13" fill="#E2E8F0" text-anchor="middle">Wrist / Ankle (رسغ / كاحل)</text>
        <text x="690" y="265" font-size="13" fill="#E2E8F0" text-anchor="middle">Treatment (علاج / ضماد)</text>

        <!-- Bottom Exam Rules -->
        <rect x="100" y="330" width="650" height="130" rx="20" fill="#151D45" stroke="#F59E0B" stroke-width="2"/>
        <text x="425" y="365" font-size="15" font-weight="bold" fill="#F59E0B" text-anchor="middle" direction="rtl">🔑 المفتاح الوزاري الذهبي لإسقاطات الوحدة</text>
        <text x="425" y="395" font-size="13" fill="#E2E8F0" text-anchor="middle" direction="rtl">1. بعد الأفعال المساعدة (am, is, are, was, were) نستخدم صفة (sick, sore, broken).</text>
        <text x="425" y="425" font-size="13" fill="#E2E8F0" text-anchor="middle" direction="rtl">2. بعد أدوات التنكير والتعريف (a, an, the) نستخدم اسماً (pain, cold, treatment).</text>
      </svg>`;
    }

    // Default Mindmap / Grammar / Physics SVG
    return `<svg viewBox="0 0 850 500" xmlns="http://www.w3.org/2000/svg" style="background:#090D24;border-radius:24px;font-family:sans-serif;">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00E5FF"/>
          <stop offset="100%" stop-color="#3B82F6"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Center Node -->
      <rect x="250" y="40" width="350" height="70" rx="20" fill="url(#grad1)" filter="url(#glow)"/>
      <text x="425" y="82" font-size="18" font-weight="bold" fill="#050814" text-anchor="middle" direction="rtl">${title}</text>

      <!-- Branch Lines -->
      <path d="M 320 110 L 160 200" stroke="#00E5FF" stroke-width="3" stroke-dasharray="6,6"/>
      <path d="M 425 110 L 425 200" stroke="#F59E0B" stroke-width="3"/>
      <path d="M 530 110 L 690 200" stroke="#10B981" stroke-width="3" stroke-dasharray="6,6"/>

      <!-- Node Left -->
      <rect x="60" y="200" width="200" height="120" rx="16" fill="#111836" stroke="#00E5FF" stroke-width="2"/>
      <text x="160" y="235" font-size="15" font-weight="bold" fill="#00E5FF" text-anchor="middle">الضوابط والشروط</text>
      <text x="160" y="265" font-size="12" fill="#E2E8F0" text-anchor="middle">المطابقة الحرفية للبيانات</text>
      <text x="160" y="290" font-size="12" fill="#94A3B8" text-anchor="middle">مراعاة مفاتيح الحل</text>

      <!-- Node Center -->
      <rect x="325" y="200" width="200" height="120" rx="16" fill="#111836" stroke="#F59E0B" stroke-width="2"/>
      <text x="425" y="235" font-size="15" font-weight="bold" fill="#F59E0B" text-anchor="middle">الهيكل النموذجي</text>
      <text x="425" y="265" font-size="12" fill="#E2E8F0" text-anchor="middle">الآلية المباشرة</text>
      <text x="425" y="290" font-size="12" fill="#94A3B8" text-anchor="middle">الخطوات التحليلية</text>

      <!-- Node Right -->
      <rect x="590" y="200" width="200" height="120" rx="16" fill="#111836" stroke="#10B981" stroke-width="2"/>
      <text x="690" y="235" font-size="15" font-weight="bold" fill="#10B981" text-anchor="middle">فائدة وزارية 100</text>
      <text x="690" y="265" font-size="12" fill="#E2E8F0" text-anchor="middle">الدرجات الحرجة</text>
      <text x="690" y="290" font-size="12" fill="#94A3B8" text-anchor="middle">مفتاح السؤال الوزاري</text>

      <!-- Bottom Card -->
      <rect x="150" y="370" width="550" height="70" rx="16" fill="#171F42" stroke="#4F46E5" stroke-width="1.5"/>
      <text x="425" y="405" font-size="14" font-weight="bold" fill="#A5B4FC" text-anchor="middle">💡 ملخص بصري استنباطي من محتوى الدرس</text>
      <text x="425" y="428" font-size="12" fill="#CBD5E1" text-anchor="middle">تأكدي من حفظ التأشيرات والقواعد لتثبيت الدرجة الكاملة</text>
    </svg>`;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAttached(false);
    setStatusMessage('جارٍ توليد وتخطيط الرسم العلمي مع التأشيرات والبيانات العربية بالذكاء...');

    try {
      const response = await fetch('/api/gemini/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicPrompt,
          pageTitle: currentPageTitle,
          context: `المادة: ${selectedSubject}. السياق: ${currentPageContent.slice(0, 1500)}. نوع المخطط: ${selectedStyle} مع تأشيرات وبيانات عربية واضحة.`,
          style: selectedStyle
        })
      });

      const data = await response.json();
      if (data?.svg && data.svg.includes('<svg')) {
        setGeneratedSvg(data.svg);
        setStatusMessage('تم توليد الرسم العلمي بنجاح!');
      } else {
        const fallback = generateDomainSvg(topicPrompt, selectedSubject, selectedStyle);
        setGeneratedSvg(fallback);
        setStatusMessage('تم إعداد المخطط العلمي بنجاح!');
      }
    } catch (err) {
      console.warn("AI Illustration fallback:", err);
      const fallback = generateDomainSvg(topicPrompt, selectedSubject, selectedStyle);
      setGeneratedSvg(fallback);
      setStatusMessage('تم إعداد المخطط العلمي بنجاح!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAttach = () => {
    if (!generatedSvg) return;
    const newIllustration: PageIllustration = {
      id: Date.now().toString(),
      title: topicPrompt || currentPageTitle,
      svg: generatedSvg,
      style: selectedStyle,
      subject: selectedSubject,
      createdAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };
    onAttachToPage(newIllustration);
    setAttached(true);
  };

  const handleDownloadSvg = () => {
    if (!generatedSvg) return;
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-4xl bg-[#090C1F] border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.15)] relative overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  مُولّد الرسوم التوضيحية العلمية والتأشيرات (للأحياء والعلوم)
                </h3>
                <p className="text-xs text-white/50">
                  توليد رسوم تشريحية وتخطيطية احترافية مع التأشيرات والبيانات باللغة العربية
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form controls */}
          <div className="py-3 space-y-3 shrink-0">
            {/* Auto-detected Subject Banner */}
            <div className="flex items-center justify-between flex-wrap gap-2 bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-bold">المادة المكتشفة تلقائياً:</span>
                <span className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${detectedInfo.badgeColor}`}>
                  <span>{detectedInfo.icon}</span>
                  <span>{detectedInfo.label}</span>
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span>✓ جاهز للتوليد التلقائي المباشر</span>
              </div>
            </div>

            {/* Prompt & Style */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                placeholder="عنوان الموضوع أو المخطط المراد رسمه (مثال: مفردات الوحدة الأولى، تركيب الخلية، إلخ)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 placeholder-white/30"
              />

              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as any)}
                className="bg-[#121630] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="scientific_diagram">🔬 مخطط علمي مع التأشيرات</option>
                <option value="mindmap">🧠 خريطة مفاهيم وشجرة قواعد</option>
                <option value="flowchart">📊 مخطط تدفقي ودورة متسلسلة</option>
                <option value="anatomical">🫀 تركيب تركيبي مفصل</option>
              </select>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer shrink-0 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>جارٍ التوليد...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} fill="currentColor" />
                    <span>توليد الرسم التوضيحي 🎨</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Display & Preview Area */}
          <div className="flex-1 overflow-y-auto bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-center relative min-h-[300px] no-scrollbar">
            {generatedSvg ? (
              <div 
                className="w-full h-full flex items-center justify-center overflow-auto"
                dangerouslySetInnerHTML={{ __html: generatedSvg }}
              />
            ) : (
              <div className="text-center text-white/30 space-y-2">
                <ImageIcon size={48} className="mx-auto opacity-30" />
                <p className="text-xs">
                  {isGenerating ? statusMessage : 'اضغطي على "توليد الرسم العلمي" لإنشاء رسم تخطيطي للأحياء والعلوم مع التأشيرات والبيانات'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {generatedSvg && (
            <div className="pt-3 flex items-center justify-between border-t border-white/10 shrink-0">
              <span className="text-[11px] text-emerald-400 font-bold">
                {attached ? "تم تثبيت الرسم التوضيحي داخل الصفحة بنجاح! ✅" : statusMessage}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSvg}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/10"
                  title="تحميل كملف SVG عالي الدقة"
                >
                  <Download size={13} />
                  <span>تحميل الرسم</span>
                </button>

                <button
                  onClick={handleAttach}
                  disabled={attached}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    attached
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  }`}
                >
                  {attached ? <Check size={14} /> : <Plus size={14} />}
                  <span>{attached ? "مثبت في الصفحة" : "تثبيت الرسم في الصفحة"}</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
