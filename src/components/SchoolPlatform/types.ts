export interface Teacher {
  name: string;
  desc: string;
}

export interface MaterialField {
  material: string;
  icon: any;
  color?: string;
  bgColor?: string;
  teachers: Teacher[];
}

export interface Post {
  id: string;
  userId?: string;
  userName: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  type: "admin" | "teacher" | "student";
  timestamp?: any;
  isPinned?: boolean;
  isLocked?: boolean;
  adminNotes?: any[];
  userPhotoURL?: string;
  mediaUrl?: string;
  stageIcon?: string;
  stageStickers?: string[];
  reactions?: { [key: string]: number };
  userReaction?: string | null;
  shares?: number;
  schoolId?: string;
  grade?: string;
}

export type HandRaiseStatus = "pending" | "approved" | "rejected";

export interface HandRaiseRequest {
  id: string;
  name: string;
  timestamp: number;
  status: HandRaiseStatus;
}

export interface LiveQuestion {
  id: string;
  name: string;
  text: string;
  timestamp: number;
  pinned?: boolean;
}

export interface SchoolPlatformProps {
  progress?: any;
  setProgress?: any;
  schoolName: string;
  schoolId: string;
  grade: string;
  gradeName?: string | null;
  onBack: () => void;
  language?: "ar" | "en";
  portalType?: string;
  isTeacher?: boolean;
  teacherData?: any;
  userProfile?: any;
  onUpdateProfile?: (data: any) => void;
  onOpenNotifications?: () => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  notifications?: any[];
  highlightTasksSection?: boolean;
  onClearHighlightTasks?: () => void;
  activeMainTab?: string;
  onSwitchMainTab?: (tab: any) => void;
  navTriggers?: any;
}

export interface RecordedLesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section?: string | null;
  duration: string;
  date: string;
  videoUrl: string;
  description: string;
  schoolId: string;
  timestamp?: any;
  views?: number;
  comment_count?: number;
  viewCount?: number;
  commentCount?: number;
  viewers?: string[];
}

export interface SchoolFile {
  id: string;
  title: string;
  name?: string;
  size: string;
  downloads: number;
  tag: string;
  subject: string;
  grade: string;
  section?: string | null;
  schoolId: string;
  fileUrl: string;
  allowDownload?: boolean;
  createdAt: string;
}

export type PlatformTab =
  | "feed"
  | "files"
  | "materials"
  | "excellence"
  | "control"
  | "schedule"
  | "lounge"
  | "live_watch"
  | "questions_bank"
  | "ai_assistant"
  | "dev_dashboard";
