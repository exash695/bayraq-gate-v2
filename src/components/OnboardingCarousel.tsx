import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Compass,
  Users,
  GraduationCap,
  Bus,
  Trophy
} from "lucide-react";
import { useBerqPoses, isVideoUrl } from "./BerqCharacterManager";

interface OnboardingStep {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  glowColor: string;
  bgColor: string;
  image: string;
  fallbackImage: string;
  icon: React.ReactNode;
  shortDesc: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "أهلاً بك في بوابة بيرق",
    badge: "بوابة بيرق",
    badgeColor: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    glowColor: "rgba(212, 175, 55, 0.25)",
    bgColor: "#020512",
    image: "/mascot/welcome.jpg",
    fallbackImage: "/mascot/welcome.jpg",
    icon: <Compass className="w-3 h-3 text-amber-400" />,
    shortDesc: "رفيقك الذكي طوال رحلتك التعليمية الممتعة والمليئة بالتحديات."
  },
  {
    id: "connect",
    title: "نربط أركان المدرسة معاً",
    badge: "مجتمع متكامل",
    badgeColor: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    glowColor: "rgba(6, 182, 212, 0.25)",
    bgColor: "#01071a",
    image: "/mascot/connect.jpg",
    fallbackImage: "/mascot/connect.jpg",
    icon: <Users className="w-3 h-3 text-cyan-400" />,
    shortDesc: "نجمع المعلمين والطلاب وأولياء الأمور في تطبيق واحد متكامل."
  },
  {
    id: "study",
    title: "تعلّم بأسلوب ذكي وشيق",
    badge: "التعليم الذكي",
    badgeColor: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    glowColor: "rgba(168, 85, 247, 0.25)",
    bgColor: "#050216",
    image: "/mascot/study.jpg",
    fallbackImage: "/mascot/study.jpg",
    icon: <GraduationCap className="w-3 h-3 text-purple-400" />,
    shortDesc: "شاهد البث المباشر وتصفح الملازم الذكية وحل الواجبات التفاعلية بنقرة واحدة."
  },
  {
    id: "transit",
    title: "رحلة مدرسية آمنة وموثوقة",
    badge: "رحلة آمنة",
    badgeColor: "text-orange-400 border-orange-500/20 bg-orange-500/5",
    glowColor: "rgba(249, 115, 22, 0.25)",
    bgColor: "#080201",
    image: "/mascot/transit.jpg",
    fallbackImage: "/mascot/transit.jpg",
    icon: <Bus className="w-3 h-3 text-orange-400" />,
    shortDesc: "تتبع خط سير الحافلة المدرسية لحظة بلحظة وتلقى تنبيهات ذكية ومباشرة."
  },
  {
    id: "achieve",
    title: "اصعد للقمة واجمع الأوسمة",
    badge: "قاعة الأبطال",
    badgeColor: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
    glowColor: "rgba(234, 179, 8, 0.25)",
    bgColor: "#070501",
    image: "/mascot/achieve.jpg",
    fallbackImage: "/mascot/achieve.jpg",
    icon: <Trophy className="w-3 h-3 text-yellow-400" />,
    shortDesc: "أكمل دروسك وحقق الإنجازات واضمن اسمك في لوحة شرف المتفوقين."
  },
  {
    id: "launch",
    title: "انطلق نحو مستقبلك الواعد",
    badge: "ابدأ المغامرة",
    badgeColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    glowColor: "rgba(34, 197, 94, 0.25)",
    bgColor: "#010502",
    image: "/mascot/launch.jpg",
    fallbackImage: "/mascot/launch.jpg",
    icon: <Sparkles className="w-3 h-3 text-emerald-400" />,
    shortDesc: "افتح بوابة المعرفة والتميز الآن. رحلة تعليمية استثنائية بانتظارك!"
  }
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const poses = useBerqPoses();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isMuted] = useState(true); // Default to muted, clean ambient experience

  const activeStep = ONBOARDING_STEPS[currentStep];
  const customKey = `welcome_card_${activeStep.id}`;
  const resolvedSrc = poses[customKey] || poses[activeStep.id] || activeStep.image;
  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    const custom = poses[`welcome_card_${activeStep.id}`] || poses[activeStep.id];
    setImgSrc(custom || activeStep.image);
  }, [currentStep, poses]);

  // Synthesizer chime audio for interaction feedback
  const playChime = (type: "next" | "welcome" | "finish" | "tap" = "next") => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      let freqs = [523.25, 659.25, 783.99, 1046.50]; // Ascent chord
      if (type === "welcome") {
        freqs = [392.00, 523.25, 659.25, 783.99, 1046.50];
      } else if (type === "finish") {
        freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      } else if (type === "tap") {
        freqs = [659.25, 880.00];
      }

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.8);
      });
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      playChime("next");
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      playChime("next");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    playChime("finish");
    onComplete();
  };

  return (
    <div 
      className="fixed inset-0 z-[9000] flex flex-col justify-between overflow-hidden select-none font-sans transition-all duration-1000"
      style={{ backgroundColor: activeStep.bgColor }}
      dir="rtl"
    >
      {/* 1. IMMERSIVE SPACE STARS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={`shimmer-star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: `0 0 8px ${activeStep.glowColor}, 0 0 16px ${activeStep.glowColor}`,
            }}
          />
        ))}
      </div>

      {/* 2. MINIMALIST SKIP BUTTON (Requirement 9 & 15) */}
      <AnimatePresence>
        {currentStep < ONBOARDING_STEPS.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleComplete}
            className="absolute top-6 left-6 z-50 text-xs font-bold text-white/40 hover:text-amber-400 bg-transparent border-0 outline-none p-0 cursor-pointer transition-all drop-shadow-md"
          >
            تخطي
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3. FULL-BLEED EDGE-TO-EDGE CINEMATIC HERO (Requirement 1, 2, 3, 4, 5, 8) */}
      <div className="relative w-full h-[50vh] z-10 overflow-hidden">
        {/* Step-specific glowing ambient sphere */}
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full filter blur-[100px] opacity-25 pointer-events-none transition-all duration-1000"
          style={{
            backgroundColor: activeStep.glowColor,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Sliding & Dissolving Hero Images */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`mascot-${currentStep}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              {/* Crisp central character artwork or video - Full-Bleed / Edge-to-Edge */}
              {imgSrc && isVideoUrl(imgSrc) ? (
                <video
                  src={imgSrc}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  playsInline
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <motion.img
                  src={imgSrc}
                  alt={activeStep.title}
                  onError={() => {
                    if (imgSrc !== activeStep.fallbackImage) {
                      setImgSrc(activeStep.fallbackImage);
                    }
                  }}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Soft, deep cinematic bottom gradient mask (Requirement 6) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-32 z-20 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `linear-gradient(to top, ${activeStep.bgColor} 0%, ${activeStep.bgColor}dd 40%, ${activeStep.bgColor}22 80%, transparent 100%)`
          }}
        />
      </div>

      {/* 4. STORY CONTENT & TEXT PANEL (Requirement 7, 10, 11, 13, 14, 15) */}
      <div className="relative w-full max-w-md mx-auto flex flex-col justify-between px-6 pb-8 pt-2 z-30 flex-1">
        {/* Texts & Indicators closely grouped */}
        <div className="w-full flex flex-col items-center text-center space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full flex flex-col items-center space-y-2"
            >
              {/* Floating Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide transition-all duration-1000 ${activeStep.badgeColor}`}>
                {activeStep.icon}
                <span>{activeStep.badge}</span>
              </span>

              {/* Cinematic Title (Requirement 10) */}
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
                {activeStep.title}
              </h1>

              {/* Concise description (Requirement 10) */}
              <p className="text-white/70 text-xs sm:text-sm font-medium leading-relaxed max-w-[320px] drop-shadow-sm">
                {activeStep.shortDesc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Tiny, minimal Page Indicators placed close to the text (Requirement 14) */}
          <div className="flex justify-center gap-1.5 pt-1">
            {ONBOARDING_STEPS.map((_, idx) => {
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={`indicator-${idx}`}
                  onClick={() => {
                    setDirection(idx > currentStep ? 1 : -1);
                    playChime("next");
                    setCurrentStep(idx);
                  }}
                  className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent 
                      ? "w-4 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                      : "w-1 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`الخطوة ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Action Button & Navigation Row (Requirement 12, 13) */}
        <div className="w-full space-y-3">
          <button
            onClick={handleNext}
            className="w-full h-11 rounded-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wide transition-all duration-300 transform active:scale-98 cursor-pointer text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-amber-300/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-1/3 h-full bg-white/10 skew-x-[30deg] -translate-x-[150%] group-hover:translate-x-[350%] transition-transform duration-1000 ease-out" />
            
            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                <span className="text-xs font-bold">ابدأ رحلتك ⚡</span>
                <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              </>
            ) : (
              <>
                <span className="text-xs font-bold">التالي</span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-950" />
              </>
            )}
          </button>

          {/* Previous step indicator and controls */}
          <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-white/30">
            {currentStep > 0 ? (
              <button
                onClick={handlePrev}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" />
                <span>السابق</span>
              </button>
            ) : (
              <div />
            )}

            <span className="font-mono tracking-widest bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-white/40">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
