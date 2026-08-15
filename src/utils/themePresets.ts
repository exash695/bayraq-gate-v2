import { SeasonalThemeType, ThemeAccentColor, ThemeEffectType } from "../services/remoteConfig";

export interface ThemePresetInfo {
  id: SeasonalThemeType;
  title: string;
  subtitle: string;
  defaultCardTitle: string;
  defaultMessage: string;
  defaultAccent: ThemeAccentColor;
  defaultEffect: ThemeEffectType;
  icon: string;
  secondaryIcon: string;
  decorations: string[];
  defaultMascotEmoji: string;
  defaultMascotLabel: string;
  mascotPresetSvg: string; // inline SVG avatar data
}

// Accent Color Styling Maps
export interface AccentStyleConfig {
  accentName: string;
  glowColor: string; // rgba or hex for shadows
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  cardGlow: string;
  particleColors: string[];
  gradientBg: string;
  buttonBg: string;
}

export const ACCENT_STYLES: Record<ThemeAccentColor, AccentStyleConfig> = {
  amber: {
    accentName: "ذهبي رمضاني (Amber Gold)",
    glowColor: "rgba(245, 158, 11, 0.35)",
    cardBorder: "border-amber-500/40 dark:border-amber-400/30",
    badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
    badgeText: "text-amber-300",
    textColor: "text-amber-200 dark:text-amber-300",
    cardGlow: "shadow-[0_4px_30px_rgba(245,158,11,0.2)]",
    particleColors: ["#f59e0b", "#fbbf24", "#fef3c7"],
    gradientBg: "from-amber-950/80 via-purple-950/90 to-indigo-950/80",
    buttonBg: "bg-amber-500 text-black hover:bg-amber-400"
  },
  emerald: {
    accentName: "زمردي العيد (Emerald Pearl)",
    glowColor: "rgba(16, 185, 129, 0.35)",
    cardBorder: "border-emerald-500/40 dark:border-emerald-400/30",
    badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    badgeText: "text-emerald-300",
    textColor: "text-emerald-200 dark:text-emerald-300",
    cardGlow: "shadow-[0_4px_30px_rgba(16,185,129,0.2)]",
    particleColors: ["#10b981", "#34d399", "#d1fae5"],
    gradientBg: "from-emerald-950/80 via-teal-950/90 to-amber-950/80",
    buttonBg: "bg-emerald-500 text-black hover:bg-emerald-400"
  },
  ruby: {
    accentName: "ياقوتي وطني (Ruby Crimson)",
    glowColor: "rgba(239, 68, 68, 0.35)",
    cardBorder: "border-red-500/40 dark:border-red-400/30",
    badgeBg: "bg-red-500/20 border-red-500/40 text-red-300",
    badgeText: "text-red-300",
    textColor: "text-red-200 dark:text-red-300",
    cardGlow: "shadow-[0_4px_30px_rgba(239,68,68,0.2)]",
    particleColors: ["#ef4444", "#f87171", "#fee2e2"],
    gradientBg: "from-red-950/80 via-zinc-950/90 to-emerald-950/80",
    buttonBg: "bg-red-500 text-white hover:bg-red-600"
  },
  sapphire: {
    accentName: "ملكي دراسي (Sapphire Blue)",
    glowColor: "rgba(59, 130, 246, 0.35)",
    cardBorder: "border-blue-500/40 dark:border-blue-400/30",
    badgeBg: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    badgeText: "text-blue-300",
    textColor: "text-blue-200 dark:text-blue-300",
    cardGlow: "shadow-[0_4px_30px_rgba(59,130,246,0.2)]",
    particleColors: ["#3b82f6", "#60a5fa", "#dbeafe"],
    gradientBg: "from-blue-950/80 via-slate-950/90 to-cyan-950/80",
    buttonBg: "bg-blue-500 text-white hover:bg-blue-600"
  },
  amethyst: {
    accentName: "أرجواني الامتحانات (Amethyst Violet)",
    glowColor: "rgba(168, 85, 247, 0.35)",
    cardBorder: "border-purple-500/40 dark:border-purple-400/30",
    badgeBg: "bg-purple-500/20 border-purple-500/40 text-purple-300",
    badgeText: "text-purple-300",
    textColor: "text-purple-200 dark:text-purple-300",
    cardGlow: "shadow-[0_4px_30px_rgba(168,85,247,0.2)]",
    particleColors: ["#a855f7", "#c084fc", "#f3e8ff"],
    gradientBg: "from-purple-950/80 via-indigo-950/90 to-fuchsia-950/80",
    buttonBg: "bg-purple-500 text-white hover:bg-purple-600"
  },
  rose: {
    accentName: "وردي المعلم (Rose Gold)",
    glowColor: "rgba(244, 63, 94, 0.35)",
    cardBorder: "border-rose-500/40 dark:border-rose-400/30",
    badgeBg: "bg-rose-500/20 border-rose-500/40 text-rose-300",
    badgeText: "text-rose-300",
    textColor: "text-rose-200 dark:text-rose-300",
    cardGlow: "shadow-[0_4px_30px_rgba(244,63,94,0.2)]",
    particleColors: ["#f43f5e", "#fb7185", "#ffe4e6"],
    gradientBg: "from-rose-950/80 via-pink-950/90 to-purple-950/80",
    buttonBg: "bg-rose-500 text-white hover:bg-rose-600"
  },
  gold: {
    accentName: "ذهبي مشع (Luminous Gold)",
    glowColor: "rgba(234, 179, 8, 0.35)",
    cardBorder: "border-yellow-500/40 dark:border-yellow-400/30",
    badgeBg: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    badgeText: "text-yellow-300",
    textColor: "text-yellow-200 dark:text-yellow-300",
    cardGlow: "shadow-[0_4px_30px_rgba(234,179,8,0.2)]",
    particleColors: ["#eab308", "#fde047", "#fef9c3"],
    gradientBg: "from-yellow-950/80 via-amber-950/90 to-stone-950/80",
    buttonBg: "bg-yellow-500 text-black hover:bg-yellow-400"
  },
  teal: {
    accentName: "تركوازي منعش (Teal Cyan)",
    glowColor: "rgba(20, 184, 166, 0.35)",
    cardBorder: "border-teal-500/40 dark:border-teal-400/30",
    badgeBg: "bg-teal-500/20 border-teal-500/40 text-teal-300",
    badgeText: "text-teal-300",
    textColor: "text-teal-200 dark:text-teal-300",
    cardGlow: "shadow-[0_4px_30px_rgba(20,184,166,0.2)]",
    particleColors: ["#14b8a6", "#2dd4bf", "#ccfbf1"],
    gradientBg: "from-teal-950/80 via-cyan-950/90 to-emerald-950/80",
    buttonBg: "bg-teal-500 text-black hover:bg-teal-400"
  },
  indigo: {
    accentName: "نيلي بيرق الأساسي (Bayraq Indigo)",
    glowColor: "rgba(99, 102, 241, 0.35)",
    cardBorder: "border-indigo-500/40 dark:border-indigo-400/30",
    badgeBg: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
    badgeText: "text-indigo-300",
    textColor: "text-indigo-200 dark:text-indigo-300",
    cardGlow: "shadow-[0_4px_30px_rgba(99,102,241,0.2)]",
    particleColors: ["#6366f1", "#818cf8", "#e0e7ff"],
    gradientBg: "from-indigo-950/80 via-slate-950/90 to-purple-950/80",
    buttonBg: "bg-indigo-500 text-white hover:bg-indigo-600"
  }
};

// Preset Berq Avatar SVG Generator (High Quality Clean Vector Avatars)
export function getBerqAvatarSvg(type: SeasonalThemeType): string {
  switch (type) {
    case "ramadan":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%231e1b4b" stroke="%23f59e0b" stroke-width="3"/><path d="M65 30 A 20 20 0 1 1 35 60 A 15 15 0 0 0 65 30 Z" fill="%23fbbf24"/><polygon points="35,35 37,42 44,42 38,46 40,53 35,48 30,53 32,46 26,42 33,42" fill="%23fef3c7"/><text x="50" y="80" text-anchor="middle" fill="%23fef3c7" font-size="11" font-weight="bold" font-family="sans-serif">بيرق 🌙</text></svg>`;
    case "eid_fitr":
    case "eid_adha":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%23064e3b" stroke="%2334d399" stroke-width="3"/><rect x="30" y="45" width="40" height="30" rx="6" fill="%2310b981"/><path d="M50 45 V 75 M 30 60 H 70" stroke="%23fbbf24" stroke-width="4"/><path d="M40 45 C 40 38, 50 38, 50 45 C 50 38, 60 38, 60 45 Z" fill="%23fbbf24"/><text x="50" y="28" text-anchor="middle" fill="%23d1fae5" font-size="11" font-weight="bold" font-family="sans-serif">بيرق 🎉</text></svg>`;
    case "national_day":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%23450a0a" stroke="%23f87171" stroke-width="3"/><path d="M30 30 H 70 V 70 H 30 Z" fill="%23ef4444"/><text x="50" y="55" text-anchor="middle" fill="%23ffffff" font-size="20">🦅</text><text x="50" y="85" text-anchor="middle" fill="%23fee2e2" font-size="10" font-weight="bold" font-family="sans-serif">بيرق 🇮🇶</text></svg>`;
    case "back_to_school":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%231e3a8a" stroke="%2360a5fa" stroke-width="3"/><path d="M25 45 L 50 30 L 75 45 L 50 60 Z" fill="%233b82f6"/><path d="M35 52 V 68 C 35 73, 65 73, 65 68 V 52" stroke="%2393c5fd" stroke-width="3" fill="none"/><text x="50" y="88" text-anchor="middle" fill="%23dbeafe" font-size="10" font-weight="bold" font-family="sans-serif">بيرق 📚</text></svg>`;
    case "exams":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%233b0764" stroke="%23c084fc" stroke-width="3"/><text x="50" y="58" text-anchor="middle" fill="%23f3e8ff" font-size="32">🎓</text><text x="50" y="85" text-anchor="middle" fill="%23f3e8ff" font-size="10" font-weight="bold" font-family="sans-serif">بيرق 💯</text></svg>`;
    case "teachers_day":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%234c0519" stroke="%23fb7185" stroke-width="3"/><text x="50" y="58" text-anchor="middle" fill="%23ffe4e6" font-size="32">💐</text><text x="50" y="85" text-anchor="middle" fill="%23ffe4e6" font-size="10" font-weight="bold" font-family="sans-serif">بيرق 👑</text></svg>`;
    case "prophet_birthday":
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%233f6212" stroke="%23fde047" stroke-width="3"/><text x="50" y="58" text-anchor="middle" fill="%23fef9c3" font-size="32">🕌</text><text x="50" y="85" text-anchor="middle" fill="%23fef9c3" font-size="10" font-weight="bold" font-family="sans-serif">بيرق 🕯️</text></svg>`;
    default:
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%23312e81" stroke="%23818cf8" stroke-width="3"/><text x="50" y="58" text-anchor="middle" fill="%23e0e7ff" font-size="32">🦅</text><text x="50" y="85" text-anchor="middle" fill="%23e0e7ff" font-size="10" font-weight="bold" font-family="sans-serif">بيرق ⚡</text></svg>`;
  }
}

export const THEME_PRESETS: Record<SeasonalThemeType, ThemePresetInfo> = {
  default: {
    id: "default",
    title: "السمة القياسية (الفضائي)",
    subtitle: "هوية بوابة بيرق الليلية القياسية مع التوهج النيلي",
    defaultCardTitle: "مرحباً بكم في منصة بيرق التعليمية ⚡",
    defaultMessage: "المنصة المركزية المتكاملة للتفوق والحلول الذكية",
    defaultAccent: "indigo",
    defaultEffect: "ambient",
    icon: "🦅",
    secondaryIcon: "⚡",
    decorations: ["⚡", "🚀", "🌟"],
    defaultMascotEmoji: "🦅",
    defaultMascotLabel: "شعار بيرق القياسي",
    mascotPresetSvg: getBerqAvatarSvg("default")
  },
  ramadan: {
    id: "ramadan",
    title: "شهر رمضان المبارك",
    subtitle: "زخارف ذهبية وهلال مضيء مع طابع روحاني وأجواء رمضانية",
    defaultCardTitle: "أجواء شهر رمضان المبارك 🌙",
    defaultMessage: "مبارك عليكم الشهر الفضيل - صياماً مقبولاً وتفوقاً باهراً في منصة بيرق التعليمية",
    defaultAccent: "amber",
    defaultEffect: "lanterns",
    icon: "🌙",
    secondaryIcon: "🕌",
    decorations: ["🌙", "✨", "📿", "⭐", "🕌"],
    defaultMascotEmoji: "🕌",
    defaultMascotLabel: "بيرق الرمضاني",
    mascotPresetSvg: getBerqAvatarSvg("ramadan")
  },
  eid_fitr: {
    id: "eid_fitr",
    title: "عيد الفطر السعيد",
    subtitle: "أجواء البهجة والهدايا والتبريكات المباركة",
    defaultCardTitle: "عيد فطر مبارك سعيد 🎉",
    defaultMessage: "تقبل الله طاعاتكم، وكل عام وأنتم بألف خير وأمانينا لكم بالتوفيق والنجاح الدائم",
    defaultAccent: "emerald",
    defaultEffect: "confetti",
    icon: "🎉",
    secondaryIcon: "🎁",
    decorations: ["🎉", "🎈", "🎁", "💫", "🎊"],
    defaultMascotEmoji: "🎁",
    defaultMascotLabel: "بيرق الهدايا",
    mascotPresetSvg: getBerqAvatarSvg("eid_fitr")
  },
  eid_adha: {
    id: "eid_adha",
    title: "عيد الأضحى المبارك",
    subtitle: "نفحات الحج المبارك والتبريكات الذهبية",
    defaultCardTitle: "عيد أضحى مبارك سعيد 🕌",
    defaultMessage: "أعاده الله عليكم بالخير واليمن والبركات - تهانينا العطرة لجميع طلبتنا وكوادرنا",
    defaultAccent: "gold",
    defaultEffect: "glow",
    icon: "🕌",
    secondaryIcon: "🌟",
    decorations: ["🕌", "🕯️", "🎁", "🌟", "✨"],
    defaultMascotEmoji: "🕌",
    defaultMascotLabel: "بيرق الأضحى المبارك",
    mascotPresetSvg: getBerqAvatarSvg("eid_adha")
  },
  back_to_school: {
    id: "back_to_school",
    title: "بداية العام الدراسي",
    subtitle: "طاقات إيجابية وحماس للعودة إلى مقاعد الدراسة",
    defaultCardTitle: "بداية عام دراسي حافل بالإنجاز 📚",
    defaultMessage: "مرحباً بفرسان العلم والتميز - انطلاقة جديدة مفعمة بالطاقة نحو القمة",
    defaultAccent: "sapphire",
    defaultEffect: "particles",
    icon: "📚",
    secondaryIcon: "🎓",
    decorations: ["📚", "✏️", "🎓", "🚀", "🌟"],
    defaultMascotEmoji: "🎓",
    defaultMascotLabel: "بيرق طالب العلم",
    mascotPresetSvg: getBerqAvatarSvg("back_to_school")
  },
  exams: {
    id: "exams",
    title: "موسم الامتحانات والتفوق",
    subtitle: "تركيز وتشجيع للطلبة في فترات الاختبارات والنتائج",
    defaultCardTitle: "موسم التفوق والامتحانات 🎓",
    defaultMessage: "همتكم عالية وعزيمتكم راسخة - دعواتنا لجميع طلبتنا بالنجاح والتفوق الباهر",
    defaultAccent: "amethyst",
    defaultEffect: "glow",
    icon: "🎓",
    secondaryIcon: "💯",
    decorations: ["🎓", "📝", "💯", "⚡", "📖"],
    defaultMascotEmoji: "💯",
    defaultMascotLabel: "بيرق خريج الفرسان",
    mascotPresetSvg: getBerqAvatarSvg("exams")
  },
  teachers_day: {
    id: "teachers_day",
    title: "يوم المعلم",
    subtitle: "احتفاء بصناع الأجيال وبناة المستقبل",
    defaultCardTitle: "يوم المعلم - تحية لإعمار العقول 💐",
    defaultMessage: "كل الشكر والتقدير لصنّاع الأجيال وبناة المستقبل في منصة بيرق التعليمية",
    defaultAccent: "rose",
    defaultEffect: "confetti",
    icon: "💐",
    secondaryIcon: "👑",
    decorations: ["💐", "🍎", "🌟", "👑", "📜"],
    defaultMascotEmoji: "👑",
    defaultMascotLabel: "بيرق الأستاذ القائد",
    mascotPresetSvg: getBerqAvatarSvg("teachers_day")
  },
  prophet_birthday: {
    id: "prophet_birthday",
    title: "المولد النبوي الشريف",
    subtitle: "أنوار وهداية ومناسبة دينية مباركة",
    defaultCardTitle: "ذكرى المولد النبوي الشريف 🕯️",
    defaultMessage: "أنوار وهداية - متباركين بذكرى مولد سيد الكائنات محمد صلى الله عليه وآله وسلم",
    defaultAccent: "gold",
    defaultEffect: "crescent_stars",
    icon: "🕯️",
    secondaryIcon: "🕌",
    decorations: ["🕌", "🕯️", "🌸", "✨", "📿"],
    defaultMascotEmoji: "🕯️",
    defaultMascotLabel: "بيرق النور والبركة",
    mascotPresetSvg: getBerqAvatarSvg("prophet_birthday")
  },
  national_day: {
    id: "national_day",
    title: "المناسبات والأعياد الوطنية",
    subtitle: "افتخار بالوطن وألوان واحتفالات مبهجة",
    defaultCardTitle: "المناسبة الوطنية المجيدة 🇮🇶",
    defaultMessage: "عز وفخر - تهانينا للوطن وشعبه الأبي ولجميع فرسان منصة بيرق التعليمية",
    defaultAccent: "ruby",
    defaultEffect: "confetti",
    icon: "🇮🇶",
    secondaryIcon: "🦅",
    decorations: ["🇮🇶", "🦅", "⭐", "🏛️", "👑"],
    defaultMascotEmoji: "🦅",
    defaultMascotLabel: "بيرق الوطن والشموخ",
    mascotPresetSvg: getBerqAvatarSvg("national_day")
  },
  custom: {
    id: "custom",
    title: "مناسبة مخصصة (Custom Event)",
    subtitle: "إنشاء مناسبة جديدة بالكامل مع تحديد جميع التفاصيل",
    defaultCardTitle: "مناسبة خاصة في منصة بيرق ✨",
    defaultMessage: "نحتفل معكم بهذه المناسبة المتميزة - نتمنى لكم أوقاتاً ممتعة ونجاحاً دائمين",
    defaultAccent: "teal",
    defaultEffect: "particles",
    icon: "✨",
    secondaryIcon: "🌟",
    decorations: ["✨", "🌟", "🎈", "🚀"],
    defaultMascotEmoji: "🌟",
    defaultMascotLabel: "شخصية بيرق المخصصة",
    mascotPresetSvg: getBerqAvatarSvg("custom")
  }
};
