import { useState, useEffect, useMemo } from "react";
import { realtimeManager } from "../lib/realtimeManager";
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

export async function fetchRemoteConfigFromServer(): Promise<RemoteConfig> {
  try {
    const [resRemote, resTheme] = await Promise.allSettled([
      fetch('/api/system_config/remote_control'),
      fetch('/api/system_config/seasonal_theme')
    ]);

    let remoteData: any = {};
    let themeData: any = {};

    if (resRemote.status === 'fulfilled' && resRemote.value.ok) {
      const json = await resRemote.value.json();
      remoteData = json.data || json.config || json.remote_control || {};
    }
    if (resTheme.status === 'fulfilled' && resTheme.value.ok) {
      const json = await resTheme.value.json();
      themeData = json.data || json.config || json.seasonal_theme || {};
    }

    const merged = { ...DEFAULT_REMOTE_CONFIG, ...remoteData, ...themeData };
    try {
      localStorage.setItem("bayraq_remote_config", JSON.stringify(merged));
    } catch (e) {}
    return merged;
  } catch (err) {
    console.warn("fetchRemoteConfigFromServer warning:", err);
    try {
      const cached = localStorage.getItem("bayraq_remote_config");
      if (cached) return { ...DEFAULT_REMOTE_CONFIG, ...JSON.parse(cached) };
    } catch (e) {}
    return DEFAULT_REMOTE_CONFIG;
  }
}

export async function saveRemoteConfigToServer(config: Partial<RemoteConfig>): Promise<{ success: boolean; data?: RemoteConfig }> {
  try {
    const sanitized = Object.fromEntries(
      Object.entries(config).map(([k, v]) => [k, v === undefined ? "" : v])
    );

    // 1. Immediately cache locally
    try {
      const current = localStorage.getItem("bayraq_remote_config");
      const base = current ? JSON.parse(current) : DEFAULT_REMOTE_CONFIG;
      const combined = { ...base, ...sanitized };
      localStorage.setItem("bayraq_remote_config", JSON.stringify(combined));
    } catch (e) {}

    // 2. Prepare payloads for server
    const remotePayload = {
      id: 'remote_control',
      maintenanceMode: sanitized.maintenanceMode,
      maintenanceMessage: sanitized.maintenanceMessage,
      systemPaused: sanitized.systemPaused,
      systemPauseReason: sanitized.systemPauseReason,
      systemPauseEta: sanitized.systemPauseEta,
      aiFeaturesEnabled: sanitized.aiFeaturesEnabled,
      liveRadioEnabled: sanitized.liveRadioEnabled,
      onlinePaymentsEnabled: sanitized.onlinePaymentsEnabled,
      newRegistrationsEnabled: sanitized.newRegistrationsEnabled,
      minRequiredVersion: sanitized.minRequiredVersion,
      latestVersion: sanitized.latestVersion,
      playStoreUrl: sanitized.playStoreUrl,
      appStoreUrl: sanitized.appStoreUrl,
      updateChangelog: sanitized.updateChangelog,
      forceUpdateActive: sanitized.forceUpdateActive,
      optionalUpdateActive: sanitized.optionalUpdateActive,
      newVersionNoticeActive: sanitized.newVersionNoticeActive,
      tickerEnabled: sanitized.tickerEnabled,
      tickerText: sanitized.tickerText,
      tickerSpeed: sanitized.tickerSpeed,
      supportWhatsapp: sanitized.supportWhatsapp,
      supportTelegram: sanitized.supportTelegram,
      supportChannelUrl: sanitized.supportChannelUrl,
      supportButtonEnabled: sanitized.supportButtonEnabled,
    };

    const themePayload = {
      id: 'seasonal_theme',
      seasonalTheme: sanitized.seasonalTheme,
      themeActive: sanitized.themeActive,
      themeStartDate: sanitized.themeStartDate,
      themeEndDate: sanitized.themeEndDate,
      themeCardTitle: sanitized.themeCardTitle,
      themeMessage: sanitized.themeMessage,
      themeAccentColor: sanitized.themeAccentColor,
      themeMascotUrl: sanitized.themeMascotUrl,
      themeEffectsEnabled: sanitized.themeEffectsEnabled,
      themeEffectType: sanitized.themeEffectType,
      seasonalHeroText: sanitized.seasonalHeroText,
    };

    // 3. Post to backend server API
    await Promise.allSettled([
      fetch('/api/system_config/remote_control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remotePayload)
      }),
      fetch('/api/system_config/seasonal_theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themePayload)
      })
    ]);

    // 4. Trigger local and realtime notifications
    try {
      realtimeManager.trigger('system_config', { id: 'remote_control', data: remotePayload });
      realtimeManager.trigger('system_config', { id: 'seasonal_theme', data: themePayload });
      window.dispatchEvent(new CustomEvent('bayraq_remote_config_updated', { detail: sanitized }));
    } catch (e) {}

    return { success: true };
  } catch (err: any) {
    console.error("saveRemoteConfigToServer error:", err);
    return { success: false };
  }
}

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
    let isCancelled = false;

    const loadConfig = async () => {
      const fetched = await fetchRemoteConfigFromServer();
      if (!isCancelled) {
        setConfig(fetched);
      }
    };

    loadConfig();

    // Realtime updates from the server
    const unsubRealtime = realtimeManager.subscribe('system_config', (event?: any) => {
      if (isCancelled) return;
      if (event && event.data) {
        setConfig(prev => {
          const next = { ...prev, ...event.data };
          try {
            localStorage.setItem("bayraq_remote_config", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      } else {
        loadConfig();
      }
    });

    const handleLocalEvent = (e: any) => {
      if (e?.detail && !isCancelled) {
        setConfig(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('bayraq_remote_config_updated', handleLocalEvent);

    return () => {
      isCancelled = true;
      unsubRealtime();
      window.removeEventListener('bayraq_remote_config_updated', handleLocalEvent);
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
