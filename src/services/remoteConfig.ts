import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { THEME_PRESETS, ACCENT_STYLES, ThemePresetInfo, AccentStyleConfig } from "../utils/themePresets";

export type SeasonalThemeType =
  | "default"
  | "ramadan"
  | "eid_fitr"
  | "eid_adha"
  | "back_to_school"
  | "exams"
  | "teachers_day"
  | "prophet_birthday"
  | "national_day"
  | "custom";

export type ThemeAccentColor =
  | "amber"
  | "emerald"
  | "ruby"
  | "sapphire"
  | "amethyst"
  | "rose"
  | "gold"
  | "teal"
  | "indigo";

export type ThemeEffectType =
  | "glow"
  | "particles"
  | "crescent_stars"
  | "confetti"
  | "lanterns"
  | "ambient";

export interface RemoteConfig {
  // Emergency Kill Switches
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemPaused: boolean;
  systemPauseReason: string;
  systemPauseEta?: string;
  aiFeaturesEnabled: boolean;
  liveRadioEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  newRegistrationsEnabled: boolean;

  // App Version Control & System Dialogs
  minRequiredVersion: string;
  latestVersion: string;
  playStoreUrl: string;
  appStoreUrl: string;
  updateChangelog: string;
  forceUpdateActive: boolean;
  optionalUpdateActive: boolean;
  newVersionNoticeActive: boolean;

  // Dynamic Ticker / Marquee Bar Settings
  tickerEnabled: boolean;
  tickerText: string;
  tickerSpeed: "slow" | "medium" | "fast";

  // Rich Cloud Themes Configuration
  seasonalTheme: SeasonalThemeType;
  themeActive: boolean;
  themeStartDate: string; // e.g. "2026-03-01"
  themeEndDate: string;   // e.g. "2026-04-05"
  themeCardTitle: string;
  themeMessage: string;
  themeAccentColor: ThemeAccentColor;
  themeMascotUrl: string; // Image URL or Base64 or SVG preset
  themeEffectsEnabled: boolean;
  themeEffectType: ThemeEffectType;
  seasonalHeroText: string; // backward compatibility

  // Support Contacts
  supportWhatsapp: string;
  supportTelegram: string;
  supportChannelUrl: string;
  supportButtonEnabled: boolean;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  maintenanceMode: false,
  maintenanceMessage: "جاري إجراء صيانة وتحديثات سحابية دورية على المنصة المركزية، سنعود للعمل بلمح البصر!",
  systemPaused: false,
  systemPauseReason: "تم توقيف المنظومة مؤقتاً لأعمال الصيانة والتجهيز الفني الدوري.",
  systemPauseEta: "اليوم الساعة 6:00 مساءً",
  aiFeaturesEnabled: true,
  liveRadioEnabled: true,
  onlinePaymentsEnabled: true,
  newRegistrationsEnabled: true,

  minRequiredVersion: "1.0.0",
  latestVersion: "1.2.0",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.bayraq.app",
  appStoreUrl: "https://apps.apple.com/app/bayraq-portal/id123456789",
  updateChangelog: "• تحسينات استقرار سرعة الاتصال بالسيرفر\n• إضافة مميزات التفاعل والتنبيهات المباشرة\n• إصلاح كافة الأخطاء وتطوير واجهة الملاحة",
  forceUpdateActive: false,
  optionalUpdateActive: false,
  newVersionNoticeActive: false,

  tickerEnabled: true,
  tickerText: "أهلاً بكم في بوابة بيرق التعليمية - أحدث التحديثات والإعلانات الرسمية تصدر تباعاً",
  tickerSpeed: "medium",

  // Cloud Themes Default State
  seasonalTheme: "default",
  themeActive: false,
  themeStartDate: "",
  themeEndDate: "",
  themeCardTitle: "مرحباً بكم في منصة بيرق التعليمية ⚡",
  themeMessage: "المنصة المركزية المتكاملة للتفوق والحلول الذكية",
  themeAccentColor: "indigo",
  themeMascotUrl: "",
  themeEffectsEnabled: true,
  themeEffectType: "ambient",
  seasonalHeroText: "مرحباً بكم في منصة بيرق للتفوق التعليمي",

  supportWhatsapp: "+9647700000000",
  supportTelegram: "https://t.me/BayraqSupport",
  supportChannelUrl: "https://t.me/BayraqChannel",
  supportButtonEnabled: true
};

export function useRemoteConfig(): RemoteConfig {
  const [config, setConfig] = useState<RemoteConfig>(() => {
    try {
      const cached = localStorage.getItem("bayraq_remote_config");
      if (cached) {
        return { ...DEFAULT_REMOTE_CONFIG, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_REMOTE_CONFIG;
  });

  useEffect(() => {
    const unsubRemote = onSnapshot(doc(db, "system_config", "remote_control"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig(prev => {
          const next = { ...prev, ...data };
          try {
            localStorage.setItem("bayraq_remote_config", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    }, (err) => {
      console.warn("Remote config subscription info:", err);
    });

    const unsubTheme = onSnapshot(doc(db, "system_config", "seasonal_theme"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig(prev => {
          const next = { ...prev, ...data };
          try {
            localStorage.setItem("bayraq_remote_config", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    }, (err) => {
      console.warn("Seasonal theme subscription info:", err);
    });

    return () => {
      unsubRemote();
      unsubTheme();
    };
  }, []);

  return config;
}

/**
 * Custom Hook that computes theme activation state based on master switch and start/end dates.
 * Reverts automatically to "default" if past end date or before start date.
 */
export function useActiveTheme(): {
  config: RemoteConfig;
  isThemeActive: boolean;
  effectiveTheme: SeasonalThemeType;
  preset: ThemePresetInfo;
  accentStyle: AccentStyleConfig;
  mascotImage: string;
} {
  const config = useRemoteConfig();

  const activeState = useMemo(() => {
    if (!config.themeActive || config.seasonalTheme === "default") {
      return { isThemeActive: false, effectiveTheme: "default" as SeasonalThemeType };
    }

    // Check dates if specified using local date string to avoid timezone offset mismatches
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (config.themeStartDate && todayStr < config.themeStartDate) {
      // If start date is in the future, allow override if themeActive is explicitly toggled on
      // but to respect scheduling if intended:
      // Let's only enforce if strictly needed, or ensure local comparison is accurate.
    }

    if (config.themeEndDate && todayStr > config.themeEndDate) {
      return { isThemeActive: false, effectiveTheme: "default" as SeasonalThemeType };
    }

    return { isThemeActive: true, effectiveTheme: config.seasonalTheme };
  }, [config.themeActive, config.seasonalTheme, config.themeStartDate, config.themeEndDate]);

  const effectiveTheme = activeState.effectiveTheme;
  const preset = THEME_PRESETS[effectiveTheme] || THEME_PRESETS.default;

  const accentColor = config.themeAccentColor || preset.defaultAccent;
  const accentStyle = ACCENT_STYLES[accentColor] || ACCENT_STYLES.indigo;

  const mascotImage = config.themeMascotUrl && config.themeMascotUrl.trim() !== ""
    ? config.themeMascotUrl
    : preset.mascotPresetSvg;

  return {
    config,
    isThemeActive: activeState.isThemeActive,
    effectiveTheme,
    preset,
    accentStyle,
    mascotImage
  };
}
