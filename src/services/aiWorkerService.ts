/**
 * Cloudflare Worker AI Service Gateway for Bairaq Portal
 * Isolates and manages all AI communication (Assistant, Summaries, Explanations,
 * Presentation Converter, Question Generation, Radar, Homework Evaluation)
 * via Cloudflare Workers. Keeps API keys strictly hidden from frontend.
 */

import { cacheService } from './cacheService';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  context?: string;
  message: string;
  history?: AIChatMessage[];
  imageUrl?: string;
  fileUrls?: string[];
  signal?: AbortSignal;
}

export interface AIExtractOptions {
  base64Data: string;
  mimeType?: string;
  extractedText?: string;
  signal?: AbortSignal;
  onRetry?: (msg: string) => void;
}

export interface AIMockExamOptions {
  content?: string;
  subject?: string;
  signal?: AbortSignal;
}

export interface AIHomeworkOptions {
  schoolId: string;
  taskId: string;
  taskTitle: string;
  studentId: string;
  studentName?: string;
  content: string;
}

class AIWorkerService {
  private getWorkerBaseUrl(): string {
    const customUrl = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_WORKER_GATEWAY_URL || '')
      : '';
    
    if (customUrl) {
      const clean = customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
      return clean.endsWith('/api/worker/ai') ? clean : `${clean}/api/worker/ai`;
    }
    return '/api/worker/ai';
  }

  /**
   * Helper to execute requests through Cloudflare Worker Gateway
   */
  private async callWorkerGateway<T>(endpoint: string, body: any, signal?: AbortSignal): Promise<T> {
    const baseUrl = this.getWorkerBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bairaq-Gateway': 'Cloudflare-Worker',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errObj = JSON.parse(errorText);
        parsedError = errObj.details || errObj.error || errorText;
      } catch (e) {}
      throw new Error(parsedError || `Worker Gateway error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    const rawText = await response.text();
    return JSON.parse(rawText) as T;
  }

  /**
   * 1. Smart Assistant Chat Gateway Call
   */
  public async chat(options: AIChatOptions): Promise<string> {
    const cacheKey = cacheService.generateHashKey('ai_chat', {
      msg: options.message,
      ctx: options.context?.slice(0, 100),
      img: options.imageUrl,
    });

    // Check smart cache for duplicate chat prompt
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    const result = await this.callWorkerGateway<{ response: string }>('/chat', {
      context: options.context,
      message: options.message,
      history: options.history || [],
      imageUrl: options.imageUrl,
      fileUrls: options.fileUrls || [],
    }, options.signal);

    const responseText = result.response || 'عذراً، لم يتوفر رد من الذكاء الاصطناعي.';
    cacheService.set(cacheKey, responseText, 15 * 60 * 1000); // 15 min TTL
    return responseText;
  }

  /**
   * 2. Page OCR & Structural Content Extraction Gateway Call
   */
  public async extractPageContent(options: AIExtractOptions): Promise<any> {
    const cacheKey = cacheService.generateHashKey('ai_extract', {
      b64: options.base64Data.slice(0, 200),
      txt: options.extractedText?.slice(0, 100),
    });

    const cached = cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const result = await this.callWorkerGateway<any>('/extract', {
      base64Data: options.base64Data,
      mimeType: options.mimeType || 'image/jpeg',
      extractedText: options.extractedText,
    }, options.signal);

    if (result && result.pages) {
      cacheService.set(cacheKey, result, 60 * 60 * 1000); // 1 hour TTL
    }

    return result;
  }

  /**
   * 3. Radar Question Generation Gateway Call
   */
  public async generateRadarQuestions(content: string): Promise<string[]> {
    const cacheKey = cacheService.generateHashKey('ai_radar', content.slice(0, 300));
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.callWorkerGateway<{ questions: string[] }>('/radar', { content });
      const questions = result.questions || [];
      if (questions.length > 0) {
        cacheService.set(cacheKey, questions, 24 * 3600 * 1000); // 24 hours TTL
      }
      return questions;
    } catch (e) {
      console.error('[AIWorkerService] Radar questions failed:', e);
      return ['ما هي النقطة الأساسية المحورية في هذا القسم المستخلص؟', 'كيف يمكنك تعليل هذه الظاهرة بالاستناد إلى القواعد المذكورة؟', 'ما أثر تغيير إحدى المتغيرات الرئيسية في المسألة؟'];
    }
  }

  /**
   * 4. Comprehensive Ministerial Mock Exam Generator
   */
  public async generateMockExam(options: AIMockExamOptions): Promise<any[]> {
    const cacheKey = cacheService.generateHashKey('ai_mock_exam', {
      sub: options.subject,
      cnt: options.content?.slice(0, 200),
    });

    const cached = cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.callWorkerGateway<{ questions: any[] }>('/mock-exam', {
      content: options.content,
      subject: options.subject,
    }, options.signal);

    const questions = result.questions || [];
    if (questions.length > 0) {
      cacheService.set(cacheKey, questions, 12 * 3600 * 1000); // 12 hours TTL
    }

    return questions;
  }

  /**
   * 5. Exam Paper Question Extraction
   */
  public async extractQuestionsFromPaper(base64Data: string, mimeType: string = 'image/jpeg'): Promise<any[]> {
    const cacheKey = cacheService.generateHashKey('ai_paper_questions', base64Data.slice(0, 200));
    const cached = cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.callWorkerGateway<{ questions: any[] }>('/extract-questions', {
      base64Data,
      mimeType,
    });

    const questions = result.questions || [];
    if (questions.length > 0) {
      cacheService.set(cacheKey, questions, 6 * 3600 * 1000);
    }
    return questions;
  }

  /**
   * 6. Homework Automatic Evaluation
   */
  public async evaluateHomework(options: AIHomeworkOptions): Promise<{ pointsAwarded: number; feedback: string; badgeAwarded: string | null }> {
    return await this.callWorkerGateway<{ pointsAwarded: number; feedback: string; badgeAwarded: string | null }>('/evaluate-homework', options);
  }

  /**
   * 7. AI Answer Explanation Generator
   */
  public async explainQuestion(questionText: string): Promise<string> {
    const cacheKey = cacheService.generateHashKey('ai_explain', questionText);
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    const result = await this.callWorkerGateway<{ explanation: string }>('/explain', { questionText });
    const exp = result.explanation || 'التفسير غير متوفر حالياً.';
    cacheService.set(cacheKey, exp, 24 * 3600 * 1000);
    return exp;
  }
}

export const aiWorkerService = new AIWorkerService();
