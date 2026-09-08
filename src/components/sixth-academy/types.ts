export type NoteCategory = 'فكرة ذهبية' | 'تنبيه' | 'امتحاني' | 'قاعدة ملخصة';

export interface NoteItem {
  id: string;
  text: string;
  tag: NoteCategory;
  createdAt: string;
  pageNumber?: number;
}

export interface StructuredContentNode {
  type: 'heading' | 'paragraph' | 'poetry' | 'question' | 'note' | 'badge' | 'example' | 'warning' | 'law' | 'vocabulary' | 'points' | 'list' | string;
  title?: string;
  content?: string;
  questionText?: string;
  solutionText?: string;
  linguisticAnalysis?: string;
  difficulty?: 'أصحاب الـ 100' | 'استنباط دلالي' | 'درجات حرجة' | string;
  verseLines?: { firstHalf: string; secondHalf: string }[];
  vocabItems?: { en: string; ar: string }[];
  points?: string[];
  items?: string[];
  solutions?: string[];
  tag?: string;
  year?: string;
  session?: string;
  branch?: string;
}

export interface NormalizedPage {
  pageNumber: number;
  title: string;
  subtitle: string;
  tag: string;
  unit: string;
  structuredContent: StructuredContentNode[];
  rawText?: string;
  quiz: Array<{
    question: string;
    options: string[];
    correct: number;
    tip?: string;
  }>;
  ministerialQuestions?: any[];
}

export interface MinisterialQuestion {
  questionText: string;
  options: string[];
  correct: number;
  solutionText?: string;
  tip?: string;
  pageNumber: number;
  year?: string;
  session?: string;
  branch?: string;
}

export interface TopicPass {
  id: string;
  topicTitle: string;
  unit: string;
  pageIndices: number[]; // 0-based page indexes
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  isFinished: boolean;
  ministerialQuestions: MinisterialQuestion[];
}

export interface VoiceNoteRecord {
  id: string;
  audioData: string; // base64 / data URL
  duration: number;
  timestamp: string;
  teacherName?: string;
}

export interface PageIllustration {
  id: string;
  title: string;
  svg: string;
  style: string;
  subject?: 'biology' | 'science' | 'chemistry' | 'physics' | 'english' | 'arabic' | 'general';
  createdAt: string;
}

export interface MinisterialBankItem {
  id: string;
  questionText: string;
  solutionText?: string;
  linguisticAnalysis?: string;
  year?: string;
  session?: string; // الدور الأول، الدور الثاني، تمهيدي، خارج القطر، نازحين، د1، د2، ت، خ
  branch?: string; // أحيائي، تطبيقي، أدبي، علمي
  topic: string;
  pageNumber: number;
  difficulty: 'أصحاب الـ 100' | 'استنباط دلالي' | 'درجات حرجة';
  keywords: string[];
  options?: string[];
  correct?: number;
}

export interface ComparisonItem {
  id: string;
  title: string;
  topic: string;
  pageNumber: number;
  conceptA: {
    name: string;
    rule: string;
    example?: string;
    key?: string;
  };
  conceptB: {
    name: string;
    rule: string;
    example?: string;
    key?: string;
  };
  ministerialTip: string;
}

export interface FlashcardItem {
  id: string;
  front: string; // Question or Rule
  back: string; // Answer, Formula, or Meaning
  topic: string;
  pageNumber: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MistakeItem {
  id: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  pageNumber: number;
  explanation: string;
  timestamp: string;
}

export type HighlightColor = 'yellow' | 'pink' | 'cyan' | 'green';

