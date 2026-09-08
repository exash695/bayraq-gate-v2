export type UnitId = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9;

export type AppSection = 
  | 'hub' 
  | 'mayadeen'
  | 'unit-detail' 
  | 'radar' 
  | 'bank' 
  | 'control' 
  | 'ai-bot'
  | 'profile-setup'
  | 'profile'
  | 'sovereignty'
  | 'battalion'
  | 'knowledge-den'
  | 'sixth-academy'
  | 'unit'
  | 'hall-of-fame'
  | 'idea-bank'
  | 'vault'
  | 'admin-hub'
  | 'school-content'
  | 'knights-club' | 'gate-6'
  | 'study-destinations'
  | 'support'
  | 'mascot-test'
  | 'privacy-policy'
  | 'dev-dashboard';

export type UnitSubSection = 
  | 'comprehensive' 
  | 'achievement-map' 
  | 'crossing-station' 
  | 'ministerial-vault'
  | 'radar-intelligence'
  | 'idea-bank'
  | 'locked-station'
  | 'control-room';

export interface Note {
  id: string;
  text: string;
  date: string;
}

export type ThemeColor = 'blue' | 'purple' | 'gold' | 'emerald' | 'rose';

export type FontFamily = 'inter' | 'noto-sans' | 'cairo' | 'tajawal';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  broadcastId?: string;
  type: 
    | 'alarm' 
    | 'unlock' 
    | 'support' 
    | 'general' 
    | 'challenge' 
    | 'siege' 
    | 'sovereignty' 
    | 'broadcast' 
    | 'reminder'
    | 'challenge_accepted_by_target'
    | 'challenge_final_invite'
    | 'challenge_response'
    | 'battalion_invite'
    | 'battalion_join_request'
    | 'battalion_join_accepted';
  recipientRole?: 'student' | 'parent' | 'teacher' | 'admin';
}

export interface AppSettings {
  fontSize: number;
  voiceEnabled: boolean;
  themeColor: ThemeColor;
  themeMode: 'light' | 'dark';
  fontFamily: FontFamily;
  language: 'ar' | 'en';
  eyeCare: boolean;
  studyReminder: string | null;
  studyTone: string;
  sovereigntyNotifications: boolean;
  classAlertsEnabled: boolean;
  studyReminderDays: number[];
}

export interface ExamResult {
  unit: string;
  score: number;
  total: number;
  date: string;
  errors: { question: string; userAnswer: string; correctAnswer: string }[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'unit' | 'challenge' | 'general';
  color: string;
}

export interface UserProgress {
  completedPages: number[];
  favorites: string[];
  ministerialFavorites: string[];
  masteredPages: number[];
  examResults: ExamResult[];
  stickyNotes: { [pageId: number]: string };
  unlockedUnits: UnitId[];
  badges: { [badgeId: string]: string }; // badgeId -> dateEarned
  totalStudyTime: { [unitId: string]: number }; // unitId -> seconds
  crossingStationProgress: { [unitId: number]: { [passId: string]: boolean } }; // unitId -> passId -> isCompleted
  flashChallengeRewards: string[]; // Array of pass IDs
  rank: 'squire' | 'knight' | 'commander' | 'guardian';
  armor: string[]; // Array of armor pieces earned
  currentUnit?: number;
  points?: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  type?: 'multiple-choice' | 'error-correction' | 'applied' | 'fill-blank';
  difficulty?: 'easy' | 'hard';
  unitId?: number;
  isMinisterial?: boolean;
}

export interface VerbRow {
  source: string;
  arabic: string;
  past?: string;
  pastParticiple?: string;
}

export interface RuleCard {
  type: 'rule';
  title: string;
  description: string;
  icon: 'sparkle' | 'bulb';
}

export interface VerbTable {
  type: 'table';
  rows: VerbRow[];
}

export interface TextBlock {
  type: 'text';
  content: string;
  variant?: 'blue' | 'purple' | 'warning';
}

export type ContentItem = TextBlock | RuleCard | VerbTable;

export interface PageContent {
  id: number;
  title: string;
  unit: string;
  items: ContentItem[];
  solutions?: string[];
  questions?: Question[];
}
