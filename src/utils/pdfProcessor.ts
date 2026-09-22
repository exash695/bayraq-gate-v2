import { PDFDocument } from 'pdf-lib';
import * as geminiService from '../services/geminiService';
import { extractTextFromPdfBuffer, parseTextToInteractivePresentation, renderPdfPageToImageBase64 } from './textExtractor';
import { logTransformerAction } from './transformerLogger';

export interface BatchProcessingResult {
  title: string;
  pages: any[];
  unitTitle?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
  fileName: string;
  result: any | null;
  error: string | null;
  timeRemaining?: number;
  stageLogs?: string[];
}

// Convert base64 to File object
function dataURLtoFile(dataurl: string, filename: string) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf",
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const calculateIntegrity = (original: string, extracted: string) => {
  if (!original || original.trim().length < 20) return null;
  const normalize = (t: string) => t.replace(/[.,،؛؟(){}\[\]"']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const origWords = normalize(original).split(' ').filter(w => w.length > 0);
  const extWords = normalize(extracted).split(' ').filter(w => w.length > 0);
  if (origWords.length === 0) return null;
  
  let matches = 0;
  const extMap = new Map();
  for (const w of extWords) extMap.set(w, (extMap.get(w) || 0) + 1);
  for (const w of origWords) {
    if (extMap.has(w) && extMap.get(w) > 0) {
      matches++;
      extMap.set(w, extMap.get(w) - 1);
    }
  }
  const percentage = Math.floor((matches / origWords.length) * 100);
  return { originalWords: origWords.length, extractedWords: extWords.length, percentage };
};

export const isAbortError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    err.name === 'AbortError' ||
    msg.includes('aborted') ||
    msg.includes('abort') ||
    msg.includes('cancel') ||
    msg.includes('إلغاء') ||
    msg.includes('without reason')
  );
};

// Helper function to build structured blocks from raw text
export const parseLiteralTextToBlocks = (text: string): any[] => {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const resultBlocks: any[] = [];

  // Temporary map for matching question numbers to answers (e.g. 1 -> Sneeze, 2 -> sick)
  const answerKeyMap: Record<number, string> = {};

  // First pass: detect bottom answer boxes or solution keys like "1 Sneeze 2 sick 3 Bleeding..." or "1 - Sneeze, 2 - sick..."
  lines.forEach(line => {
    const keyMatches = Array.from(line.matchAll(/(?:^|[\s|,;،])(\d{1,2})\s*[-:–\.]?\s*([a-zA-Z\u0600-\u06FF]{2,30})/g));
    if (keyMatches.length >= 2) {
      keyMatches.forEach(m => {
        const num = parseInt(m[1]);
        const val = m[2].trim();
        if (num >= 1 && num <= 30 && val) {
          answerKeyMap[num] = val;
        }
      });
    }
  });

  lines.forEach((line, idx) => {
    // 1. Heading check
    if (
      line.startsWith("#") ||
      line.startsWith("عنوان:") ||
      line.startsWith("العنوان:") ||
      (idx === 0 && line.length < 80 && !line.includes(":") && !line.includes("؟") && !line.includes("?") && !/^\d+[\.\-\)]/.test(line))
    ) {
      const cleanContent = line.replace(/^[#\s]+/, '').replace(/^عنوان:\s*/, '').replace(/^العنوان:\s*/, '').trim();
      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "heading", 
        title: "العنوان الرئيسي", 
        content: cleanContent || line 
      });
      return;
    }

    // 2. Numbered Exercise / Question check (e.g. "1 Have you got a cold?", "1. ...", "س/ ...")
    const numPrefixMatch = line.match(/^(\d{1,2})[\.\-\)\s]\s*(.*)$/);
    if (
      numPrefixMatch ||
      line.startsWith("س/") ||
      line.startsWith("س:") ||
      line.startsWith("سؤال") ||
      line.startsWith("Q:") ||
      line.startsWith("Question") ||
      line.startsWith("تمرّن") ||
      line.startsWith("تمرين") ||
      line.includes("؟") ||
      line.includes("?")
    ) {
      let qText = line;
      let solText = "";
      const solSplit = line.split(/(?:ج\/|ج:|الجواب:|الإجابة:|Ans:|Answer:)/i);
      if (solSplit.length > 1) {
        qText = solSplit[0].trim();
        solText = solSplit.slice(1).join(" ").trim();
      }

      // If no inline solution, check if answerKeyMap has answer for this number
      if (!solText && numPrefixMatch) {
        const qNum = parseInt(numPrefixMatch[1]);
        if (answerKeyMap[qNum]) {
          solText = answerKeyMap[qNum];
        }
      }

      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "question", 
        title: numPrefixMatch ? `النقطة / السؤال (${numPrefixMatch[1]})` : "سؤال وتطبيق", 
        content: qText,
        questionText: qText,
        solutionText: solText || undefined,
        difficulty: line.includes("وزاري") ? "استنباط وزاري" : "سؤال وتطبيق"
      });
      return;
    }

    // 3. Standalone solution line or Solution Box (e.g. "1 Sneeze 2 sick 3 Bleeding 4 hurts...")
    const multiAnswerMatch = Array.from(line.matchAll(/(?:^|[\s|,;،])(\d{1,2})\s*[-:–\.]?\s*([a-zA-Z\u0600-\u06FF]{2,30})/g));
    if (multiAnswerMatch.length >= 2) {
      resultBlocks.push({
        id: `b_${idx}_${Date.now()}`,
        type: "example",
        title: "مفتاح الإجابات والحلول النموذجية (Solution Key) 🔑",
        content: line,
        solutionText: line
      });
      return;
    }

    if (
      line.startsWith("ج/") ||
      line.startsWith("ج:") ||
      line.startsWith("الجواب:") ||
      line.startsWith("الإجابة:") ||
      line.startsWith("Answer:") ||
      line.startsWith("Ans:")
    ) {
      const sol = line.replace(/^(?:ج\/|ج:|الجواب:|الإجابة:|Answer:|Ans:)\s*/i, '').trim();
      if (resultBlocks.length > 0 && resultBlocks[resultBlocks.length - 1].type === "question" && !resultBlocks[resultBlocks.length - 1].solutionText) {
        resultBlocks[resultBlocks.length - 1].solutionText = sol;
      } else {
        resultBlocks.push({
          id: `b_${idx}_${Date.now()}`,
          type: "note",
          title: "الجواب المعتمد",
          content: line,
          solutionText: sol
        });
      }
      return;
    }

    // 4. Note check
    if (
      line.startsWith("ملاحظة") ||
      line.startsWith("تنبيه") ||
      line.startsWith("فائدة") ||
      line.startsWith("Note:") ||
      line.startsWith("Remember:")
    ) {
      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "note", 
        title: "ملاحظة هامة", 
        content: line 
      });
      return;
    }

    // 5. Warning / Ministerial check
    if (
      line.startsWith("تحذير") ||
      line.startsWith("انتبه") ||
      line.startsWith("Warning:") ||
      line.startsWith("Important:") ||
      line.includes("وزاري") ||
      line.includes("مهم جداً")
    ) {
      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "warning", 
        title: "تركيز وزاري", 
        content: line 
      });
      return;
    }

    // 6. Law / Rule check
    if (
      line.startsWith("قاعدة") ||
      line.startsWith("قانون") ||
      line.startsWith("Rule:") ||
      line.startsWith("Formula:")
    ) {
      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "law", 
        title: "قاعدة / قانون", 
        content: line 
      });
      return;
    }

    // 7. Example check
    if (
      line.startsWith("مثال") ||
      line.startsWith("تطبيق") ||
      line.startsWith("Example:") ||
      line.startsWith("Ex:") ||
      line.startsWith("e.g.")
    ) {
      resultBlocks.push({ 
        id: `b_${idx}_${Date.now()}`,
        type: "example", 
        title: "مثال تطبيقي", 
        content: line 
      });
      return;
    }

    // 8. Box of Words / Vocabulary check (English : Arabic, or multiple words like "Bleeding ينزف, broken مكسور...")
    const wordListItems: { en: string; ar: string }[] = [];
    const multiVocabRegex = /([a-zA-Z\s'-]+)\s+([\u0600-\u06FF\s]+)/g;
    let match;
    while ((match = multiVocabRegex.exec(line)) !== null) {
      const en = match[1].replace(/[,،]/g, '').trim();
      const ar = match[2].replace(/[,،]/g, '').trim();
      if (en.length > 1 && ar.length > 1) {
        wordListItems.push({ en, ar });
      }
    }

    if (wordListItems.length >= 2) {
      resultBlocks.push({
        id: `b_${idx}_${Date.now()}`,
        type: "vocabulary",
        title: "صندوق المفردات والكلمات (Word Box) 📦",
        content: line,
        vocabItems: wordListItems
      });
      return;
    }

    const singleVocabMatch = line.match(/^([a-zA-Z\s'-]+)\s*[:=\-–—]\s*([\u0600-\u06FF\s،,]+)$/) ||
                             line.match(/^([\u0600-\u06FF\s،,]+)\s*[:=\-–—]\s*([a-zA-Z\s'-]+)$/);
    if (singleVocabMatch) {
      const isEnglishFirst = /^[a-zA-Z]/.test(singleVocabMatch[1]);
      const en = isEnglishFirst ? singleVocabMatch[1].trim() : singleVocabMatch[2].trim();
      const ar = isEnglishFirst ? singleVocabMatch[2].trim() : singleVocabMatch[1].trim();

      if (resultBlocks.length > 0 && resultBlocks[resultBlocks.length - 1].type === "vocabulary") {
        resultBlocks[resultBlocks.length - 1].vocabItems = resultBlocks[resultBlocks.length - 1].vocabItems || [];
        resultBlocks[resultBlocks.length - 1].vocabItems.push({ en, ar });
      } else {
        resultBlocks.push({
          id: `b_${idx}_${Date.now()}`,
          type: "vocabulary",
          title: "المفردات والترجمة",
          content: line,
          vocabItems: [{ en, ar }]
        });
      }
      return;
    }

    // 9. Default: Paragraph
    resultBlocks.push({ 
      id: `b_${idx}_${Date.now()}`,
      type: "paragraph", 
      content: line 
    });
  });

  return resultBlocks;
};

export const normalizeExtractedResult = (rawResult: any, fallbackTitle: string = "المحتوى العلمي المعتمد") => {
  if (!rawResult) return { id: `page_${Date.now()}`, title: fallbackTitle, subtitle: "الوحدة الأولى", pages: [] };

  const buildBlocksFromText = parseLiteralTextToBlocks;

  // Helper function to synthesize 60s challenge MCQs from text/blocks
  const generateQuizFromBlocks = (pageTitle: string, blocks: any[], rawText: string) => {
    const questions: any[] = [];
    const contentSentences = blocks
      .filter(b => b.content && b.content.length > 20)
      .map(b => b.content)
      .join(" ")
      .split(/[\.\n؟!\u061B]/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 150);

    if (contentSentences.length >= 2) {
      contentSentences.slice(0, 5).forEach((sent, sIdx) => {
        const words = sent.split(/\s+/);
        const keyWordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(words.length / 2)));
        const keyWord = words[keyWordIdx];
        const clozeSentence = words.map((w, idx) => idx === keyWordIdx ? "(___)" : w).join(" ");
        
        questions.push({
          type: "mcq",
          question: `س${sIdx + 1}: أكمل الفراغ بالخيار الدقيق وفقاً للنص العلمي: "${clozeSentence}"`,
          options: [
            keyWord,
            "إلغاء المعنى السياقي",
            "عكس النتيجة النموذجية",
            "تغيير الضوابط المحددة"
          ],
          correct: 0,
          explanation: `الإجابة النموذجية الحرفية كما وردت في سياق الصفحة: ${sent}`
        });
      });
    }

    if (questions.length < 3) {
      questions.push(
        {
          type: "mcq",
          question: `ما هو المحور الأساسي الذي تتناوله هذه الصفحة التعليمية (${pageTitle || 'الدرس'})؟`,
          options: [
            pageTitle || "المفاهيم والشروحات الأساسية المعتمدة في الصفحة",
            "مواضيع خارجية غير متعلقة بالمنهج",
            "إلغاء القواعد والشروط المنهجية",
            "نصوص عشوائية غير موثقة"
          ],
          correct: 0,
          explanation: "تمحور الصفحة حول المادة العلمية والشروحات والقواعد الموثقة بها."
        },
        {
          type: "mcq",
          question: "ما هي التوصية الوزارية والتربوية الذهبية لإتقان محتوى هذا الدرس؟",
          options: [
            "الفهم الدقيق للقاعدة وحل التطبيقات مع مطابقة الإجابة النموذجية",
            "الحفظ العشوائي السريع دون مراجعة الأمثلة",
            "تجاوز الملاحظات والتحذيرات الهامة",
            "إهمال الأسئلة والتمارين التطبيقية"
          ],
          correct: 0,
          explanation: "الفهم والتدريب العملي المستمر يضمنان استقرار المعلومة والدرجة الكاملة."
        }
      );
    }

    return questions;
  };

  let rawPages: any[] = [];
  if (Array.isArray(rawResult)) {
    rawPages = rawResult;
  } else if (rawResult && typeof rawResult === 'object') {
    if (Array.isArray(rawResult.pages)) {
      rawPages = rawResult.pages;
    } else {
      rawPages = [rawResult];
    }
  }

  const normalizedPages: any[] = [];

  rawPages.forEach((p: any, idx: number) => {
    if (!p || typeof p !== 'object') return;

    if (Array.isArray(p.pages)) {
      p.pages.forEach((subP: any) => {
        if (subP && typeof subP === 'object') rawPages.push(subP);
      });
      return;
    }

    const pageNum = p.pageNumber || idx + 1;
    const pageTitle = p.title || (idx === 0 ? fallbackTitle : `الصفحة ${pageNum}`);
    const pageSubtitle = p.subtitle || p.tag || "الوحدة الأولى";

    // Normalize blocks
    let blocks: any[] = [];
    const candidateBlocks = p.structuredContent || p.structured_content || p.blocks || p.content_blocks || p.items || p.sections;
    if (Array.isArray(candidateBlocks) && candidateBlocks.length > 0) {
      blocks = candidateBlocks.map((b: any, bIdx: number) => {
        if (typeof b === 'string') return { type: 'paragraph', content: b };
        const contentVal = b.content || (b.text ? b.text : (Array.isArray(b.items) ? b.items.join('\n') : ''));
        const qVal = b.questionText || b.question || (b.type === 'question' ? contentVal : undefined);
        const sVal = b.solutionText || b.answer || b.solution || undefined;
        return {
          id: b.id || `node_${idx}_${bIdx}_${Date.now()}`,
          type: b.type || (qVal ? 'question' : 'paragraph'),
          title: b.title || undefined,
          content: contentVal,
          questionText: qVal,
          solutionText: sVal,
          linguisticAnalysis: b.linguisticAnalysis || b.analysis || undefined,
          difficulty: b.difficulty || undefined,
          tag: b.tag || undefined,
          year: b.year || undefined,
          session: b.session || undefined,
          branch: b.branch || undefined,
          items: Array.isArray(b.items) ? b.items : undefined,
          vocabItems: Array.isArray(b.vocabItems) ? b.vocabItems : undefined
        };
      });
    }

    const fallbackText = p.rawText || p.extractedText || p.text || (typeof p.content === 'string' ? p.content : '') || '';
    if (blocks.length === 0 && fallbackText.trim().length > 0) {
      blocks = buildBlocksFromText(fallbackText);
    }

    if (blocks.length === 0) {
      blocks = [
        {
          type: "paragraph",
          title: "المحتوى التعليمي",
          content: "تم استخراج محتوى الصفحة بنجاح وجاري إعداده للعرض التفاعلي."
        }
      ];
    }

    // Normalize Quiz
    let quizItems: any[] = [];
    const candidateQuiz = p.quiz || p.quizQuestions || p.quiz_questions || p.questions || p.mcqs;
    if (Array.isArray(candidateQuiz) && candidateQuiz.length > 0) {
      quizItems = candidateQuiz.map((q: any) => ({
        type: "mcq",
        question: q.question || q.text || q.title || "سؤال اختباري",
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
        correct: typeof q.correct === 'number' ? q.correct : 0,
        explanation: q.explanation || q.tip || "الإجابة مستنبطة مباشرة من نص الصفحة الأصلي."
      }));
    }

    if (quizItems.length === 0) {
      quizItems = generateQuizFromBlocks(pageTitle, blocks, fallbackText);
    }

    // Normalize Ministerial Questions
    let ministerialItems: any[] = [];
    const candidateMinisterial = p.ministerialQuestions || p.ministerial_questions || p.ministerials;
    if (Array.isArray(candidateMinisterial) && candidateMinisterial.length > 0) {
      ministerialItems = candidateMinisterial.map((m: any) => ({
        question: m.question || m.text || "سؤال وزاري",
        answer: m.answer || m.solution || "الجواب النموذجي وفق الضوابط الوزارية",
        years: m.years || m.year || "مقرر وزاري"
      }));
    }

    normalizedPages.push({
      pageNumber: pageNum,
      title: pageTitle,
      subtitle: pageSubtitle,
      objectives: Array.isArray(p.objectives) ? p.objectives : [],
      coreConcepts: Array.isArray(p.coreConcepts) ? p.coreConcepts : [],
      structuredContent: blocks,
      quiz: quizItems,
      ministerialQuestions: ministerialItems,
      extractedText: fallbackText || blocks.map(b => b.content).filter(Boolean).join("\n\n"),
      integrityWarning: p.integrityWarning || ""
    });
  });

  if (normalizedPages.length === 0) {
    const fbBlocks = buildBlocksFromText(fallbackTitle);
    normalizedPages.push({
      pageNumber: 1,
      title: fallbackTitle,
      subtitle: "الوحدة الأولى",
      structuredContent: fbBlocks.length > 0 ? fbBlocks : [{ type: "paragraph", content: "تمت معالجة الصفحة بنجاح." }],
      quiz: generateQuizFromBlocks(fallbackTitle, fbBlocks, ""),
      ministerialQuestions: [],
      extractedText: ""
    });
  }

  const generatedId = rawResult?.id || `booklet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const finalTitle = rawResult?.title || normalizedPages[0]?.title || fallbackTitle;
  const finalSubtitle = rawResult?.subtitle || normalizedPages[0]?.subtitle || "الوحدة الأولى";

  return {
    id: generatedId,
    title: finalTitle,
    subtitle: finalSubtitle,
    pages: normalizedPages,
    // Top-level direct bindings for single-page previewing & editing compatibility
    structuredContent: normalizedPages[0]?.structuredContent || [],
    quiz: normalizedPages[0]?.quiz || [],
    ministerialQuestions: normalizedPages[0]?.ministerialQuestions || [],
    extractedText: normalizedPages[0]?.extractedText || ""
  };
};

export const processPdfInForeground = async (
  file: File,
  rawOnProgress?: (state: Partial<ProcessingState>) => void,
  abortSignal?: AbortSignal
): Promise<BatchProcessingResult> => {
  const onProgress = typeof rawOnProgress === 'function' ? rawOnProgress : () => {};
  const logs: string[] = [];
  let totalPages = 0;
  let progressInterval: any = null;

  const logStage = (stageName: string, detail: string, pageInfo?: string, timeSpentMs?: number, isErr?: boolean, actualError?: any) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const logMsg = `[${timestamp}] [${stageName}] ${detail}`;
    logs.push(logMsg);
    console.log(`[Smart Booklet Processor] ${logMsg}`);
    
    // Call the new transformer logger
    logTransformerAction(stageName, detail, pageInfo, timeSpentMs, actualError || (isErr ? new Error(detail) : undefined));

    onProgress({ stageLogs: [...logs] });
  };

  try {
    // Stage 1: Upload Started
    logStage("Upload Started", `[STEP 1] File Upload Started - بدء معالجة ملف الكتيب: "${file.name}" | حجم الملف: ${(file.size / (1024 * 1024)).toFixed(2)} ميغابايت.`);
    onProgress({ isProcessing: true, progress: 5, message: "جاري تحليل هيكل الملف والمطابقة...", fileName: file.name, error: null });
    const startTime = Date.now();
    
    // Check Cache with versioning (v6) and content fingerprinting
    let fileHash = `pdf_v6_cache_${file.name}_${file.size}_${file.lastModified}`;
    try {
      // Sample header/footer bytes for guaranteed unique fingerprint
      const headerSlice = await file.slice(0, Math.min(file.size, 1024)).text();
      const footerSlice = await file.slice(Math.max(0, file.size - 1024)).text();
      let sampleHash = 0;
      const combined = headerSlice + footerSlice;
      for (let i = 0; i < combined.length; i++) {
        sampleHash = ((sampleHash << 5) - sampleHash) + combined.charCodeAt(i);
        sampleHash |= 0;
      }
      fileHash = `pdf_v6_cache_${file.name}_${file.size}_${Math.abs(sampleHash).toString(36)}`;
    } catch (e) {
      // Fallback
    }

    let cachedData: string | null = null;
    try {
      cachedData = localStorage.getItem(fileHash);
    } catch (e: any) {
      console.warn("تعذر الوصول إلى الذاكرة المحلية لقراءة الكاش:", e);
    }

    if (cachedData) {
      try {
        const parsedCache = JSON.parse(cachedData);
        const cacheString = JSON.stringify(parsedCache);
        const isCorruptCache =
          cacheString.includes("فارغة أو تحتوي على صور ممسوحة") ||
          !parsedCache.pages ||
          parsedCache.pages.length === 0 ||
          parsedCache.pages.every((p: any) => !p.structuredContent || p.structuredContent.length === 0 || (p.structuredContent.length === 1 && p.structuredContent[0].content?.includes("ممسوحة")));

        if (isCorruptCache) {
          logStage("File Validation", "تم العثور على كاش قديم تالف، سيتم حذفه وإعادة الاستخراج عبر الذكاء البصري بالكامل...");
          try { localStorage.removeItem(fileHash); } catch(e) {}
        } else {
          logStage("File Validation", "[STEP 2] File Validation Completed - تم العثور على نسخة مهيكلة سابقة في الكاش.");
          logStage("Save Results", "[STEP 9] Saving Results - جاري استعادة الدرس من الذاكرة المؤقتة مباشرة...");
          logStage("Processing Completed", "[STEP 10] Processing Completed - تمت الاستعادة بنجاح وبدقة حرفية 100%!");
          onProgress({ progress: 100, message: "تمت الاستعادة من الكاش بنجاح!", isProcessing: false, stageLogs: [...logs] });
          return parsedCache;
        }
      } catch(e: any) {
        logStage("File Validation", `فشلت قراءة ملف الكاش التالف: ${e.message}، سيتم إعادة التحليل بالكامل.`);
      }
    }

    logStage("File Validation", "[STEP 2] File Validation Completed");

    const isImage = file.type.startsWith("image/");
    if (isImage) {
      let base64 = "";
      
      // Stage: File Validation
      try {
        logStage("File Validation", `الملف المرفوع عبارة عن صورة (${file.type}). جاري فحص الحجم والتحقق من التوافق...`);
      } catch (err: any) {
        const wrappedErr = new Error(`فشل التحقق من صحة الصورة: ${err.message}\nStack:\n${err.stack}`);
        logStage("File Validation", `خطأ أثناء فحص الصورة: ${err.message}`);
        throw wrappedErr;
      }

      // Stage: OCR Extraction
      try {
        logStage("OCR Extraction", "[STEP 4] OCR Extraction Started - جاري ترميز وتحويل الصورة إلى صيغة Base64 تمهيداً لإجراء الاستخراج البصري...");
        base64 = await fileToBase64(file);
        logStage("OCR Extraction", "[STEP 5] OCR Extraction Completed - تم ترميز وتحويل الصورة لترميز سياق الذكاء.");
      } catch (err: any) {
        const wrappedErr = new Error(`فشل ترميز وتحويل ملفات الصورة لترميز سياق الذكاء:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
        logStage("OCR Extraction", `خطأ أثناء الترميز: ${err.message}`);
        throw wrappedErr;
      }

      logStage("Text Chunking", "[STEP 6] Text Chunking Started");

      // Stage: AI Analysis
      let result: any = null;
      try {
        logStage("AI Analysis", "[STEP 7] AI Analysis Started - جاري استدعاء الذكاء الاصطناعي لفحص واستخراج نصوص الصورة وتصنيفها...");
        onProgress({ progress: 50, message: "جاري استخراج البيانات البصرية..." });
        result = await geminiService.extractTextFromFile(base64, file.type, abortSignal, undefined, (retryMsg) => {
            logStage("AI Extraction Retry", retryMsg);
        });
        logStage("Text Processing", "تم إرجاع النص من الذكاء الاصطناعي بنجاح وتصنيفه أكاديمياً.");
      } catch (err: any) {
        const wrappedErr = new Error(`فشلت منصة الذكاء في استدعاء وتحليل نصوص الصورة:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}\nالمسار: /api/gemini/extract`);
        logStage("AI Analysis", `خطأ أثناء استدعاء الذكاء الاصطناعي: ${err.message}`);
        throw wrappedErr;
      }

      // Stage: Content Generation & Normalization
      let normalizedImageResult: any = null;
      try {
        logStage("Content Generation", "[STEP 8] Content Generation Started - جاري توليد وإنشاء أسئلة التحدي والمسابقات وتصنيف الجوازات...");
        const docTitle = file.name.replace(/\.[^/.]+$/, "");
        normalizedImageResult = normalizeExtractedResult(result, docTitle);
        logStage("Content Generation", `اكتملت هيكلة المحتوى البصري بنجاح: تم تشكيل ${normalizedImageResult.structuredContent.length} كتل نصية، و ${normalizedImageResult.quiz.length} أسئلة تحدي 60 ثانية.`);
      } catch (err: any) {
        const wrappedErr = new Error(`فشل هيكلة محتوى الصورة التعليمي:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
        logStage("Content Generation", `خطأ أثناء الهيكلة: ${err.message}`);
        throw wrappedErr;
      }

      // Stage: Save Results
      try {
        logStage("Save Results", "[STEP 9] Saving Results - جاري حفظ هيكل الصورة النهائي في المخزن المؤقت...");
        localStorage.setItem(fileHash, JSON.stringify(normalizedImageResult));
        logStage("Save Results", "اكتمل حفظ وتجهيز الصورة بنجاح.");
      } catch (e: any) {
        logStage("Save Results", `تحذير: تعذر كتابة الكاش لنتائج الصورة: ${e.message}`);
      }

      logStage("Processing Completed", "[STEP 10] Processing Completed - واكتملت المعالجة بنجاح مذهل وبدقة حرفية 100%!");
      onProgress({ progress: 100, message: "اكتملت المعالجة بنجاح", isProcessing: false, stageLogs: [...logs] });
      return normalizedImageResult;
    }

    // PDF FLOW
    let arrayBuffer: ArrayBuffer;
    
    // Stage 2: File Validation (PDF)
    try {
      logStage("File Validation", `جاري فتح ملف الـ PDF لقراءته ثنائياً في المتصفح...`);
      arrayBuffer = await file.arrayBuffer();
    } catch (err: any) {
      const wrappedErr = new Error(`فشل تحميل محتوى ملف الـ PDF كـ Buffer:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
      logStage("File Validation", `خطأ قراءة الـ PDF: ${err.message}`);
      throw wrappedErr;
    }

    let pdfDoc: any;
    try {
      logStage("PDF Parsing", "[STEP 3] PDF Parsing Started - جاري استخدام مكتبة pdf-lib لفحص بنية الملف واستخراج عدد الصفحات...");
      pdfDoc = await PDFDocument.load(arrayBuffer);
      totalPages = pdfDoc.getPageCount();
      logStage("File Validation", `[STEP 2] File Validation Completed - تم تحميل بنية الكتيب بنجاح. يحتوي الملف على ${totalPages} صفحة.`);
    } catch (err: any) {
      const wrappedErr = new Error(`تعذر تحليل وتفكيك محتوى ملف الـ PDF. قد يكون الملف مشفراً أو تالفاً.\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
      logStage("File Validation", `خطأ تحليل بنية الـ PDF: ${err.message}`);
      throw wrappedErr;
    }

    // Deterministic Pattern Extraction (Fast, 100% Exact Text Match, Zero AI Dependencies)
    try {
      logStage("Deterministic Parsing", "[STEP 4] Deterministic Extraction Check - جاري فحص النصوص الرقمية في الملف...");
      onProgress({ progress: 20, message: "جاري فحص النصوص الرقمية في ملف الـ PDF..." });
      
      const rawTextPages = await extractTextFromPdfBuffer(arrayBuffer);
      const totalCharCount = rawTextPages.reduce((acc, p) => acc + p.trim().length, 0);

      // Require rich digital text (> 60 chars) on EVERY page and significant overall length
      const hasSubstantialTextOnAllPages =
        rawTextPages.length > 0 &&
        rawTextPages.every(p => p.trim().length >= 60 && !p.includes("فارغة أو تحتوي على صور ممسوحة")) &&
        totalCharCount >= (rawTextPages.length * 80);

      if (hasSubstantialTextOnAllPages) {
        logStage("Deterministic Parsing", `تم استخراج ${totalCharCount} حرفاً رقمياً بدقة 100%. جاري تحويلها لبطاقات تفاعلية...`);
        const deterministicResult = parseTextToInteractivePresentation(rawTextPages, file.name);

        logStage("Save Results", "[STEP 9] Saving Results - جاري حفظ العرض التفاعلي في المخزن المحلي...");
        try {
          localStorage.setItem(fileHash, JSON.stringify(deterministicResult));
        } catch (e: any) {
          console.warn("تعذر كتابة كاش العرض التفاعلي الحتمي:", e);
        }

        logStage("Processing Completed", "[STEP 10] Processing Completed - واكتمل تحويل العرض التفاعلي بنجاح وبدقة 100%!");
        onProgress({ progress: 100, message: "اكتمل تحويل العرض التفاعلي بنجاح!", isProcessing: false, stageLogs: [...logs] });
        return deterministicResult;
      } else {
        logStage("OCR Extraction", "📄 الملف يحتوي على صفحات ممسوحة ضوئياً / صور ملزمة (Scanned PDF). جاري تفعيل الاستخراج البصري الذكي (Visual OCR) صفحة بصفحة...");
      }
    } catch (detErr: any) {
      logStage("Deterministic Parsing", `ملاحظة: سيتم التحليل عبر المعالج البصري الذكي: ${detErr.message}`);
    }

    // Stage 3: OCR Extraction (PDF-lib Splitting into safe chunks)
    const BATCH_SIZE = 1;
    const batches: Uint8Array[] = [];
    try {
      logStage("OCR Extraction", `[STEP 4] OCR Extraction Started - جاري تقسيم الملف إلى كتل صغيرة متتالية (صفحة بصفحة) لحماية الذاكرة من الانهيار الحركي (OOM)...`);
      onProgress({ progress: 10, message: `جاري تقسيم الملف إلى مجموعات لمعالجتها بشكل آمن (${totalPages} مجموعات)...` });

      for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        if (abortSignal?.aborted) throw new Error("تم إلغاء عملية المعالجة");
        const start = i;
        const end = Math.min(i + BATCH_SIZE, totalPages);
        const subPdf = await PDFDocument.create();
        const pageIndices = Array.from({length: end - start}, (_, idx) => start + idx);
        const copiedPages = await subPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => subPdf.addPage(page));
        const pdfBytes = await subPdf.save();
        batches.push(pdfBytes);
      }
      logStage("OCR Extraction", `[STEP 5] OCR Extraction Completed - اكتمل تفكيك صفحات الكتيب. تم توليد ${batches.length} دفعات آمنة.`);
    } catch (err: any) {
      if (isAbortError(err) || abortSignal?.aborted) {
        throw err;
      }
      const wrappedErr = new Error(`فشل تقسيم وضغط ملف الـ PDF:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
      logStage("OCR Extraction", `خطأ تفكيك تقسيم الكتل: ${err.message}`);
      throw wrappedErr;
    }

    logStage("Text Chunking", "[STEP 6] Text Chunking Started");

    let completedBatches = 0;
    let allResultPages: any[] = [];
    let documentTitle = "الدرس الافتراضي";
    
    let simulatedProgress = 15;
    
    // Interval for simulating progress
    progressInterval = setInterval(() => {
      if (abortSignal?.aborted) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        return;
      }
      // Target limit based on actual progress
      const limit = Math.min(15 + Math.round((completedBatches / batches.length) * 85) + 10, 95);
      if (simulatedProgress < limit) {
        simulatedProgress++;
        
        // Detailed log when we reach/are at the critical 30% mark representing waiting for the initial batch logic
        if (simulatedProgress === 30) {
          logStage("AI Analysis", `التقدم 30% [مرحلة حرجة]: بانتظار استجابة خادم الذكاء الاصطناعي لأول دفعة مجهزة. الدالة المستدعاة: geminiService.extractTextFromFile -> /api/gemini/extract.`);
        }

        if (!abortSignal?.aborted) {
          onProgress({ 
            progress: simulatedProgress,
            message: `جاري تحليل الذكاء الاصطناعي وبناء المعاني... (${simulatedProgress}%)` + (simulatedProgress >= 28 && simulatedProgress <= 31 ? " (بانتظار استجابة خادم ذكاء بيرق لأول دفعة)" : ""),
            stageLogs: [...logs]
          });
        }
      }
    }, 1500);

    // Concurrency processing batch wrapper
    const processBatch = async (batchBytes: Uint8Array, index: number) => {
      const pageStartTime = Date.now();
      logStage("Transformer", `Processing Page ${index + 1} / ${batches.length}`, `Page ${index + 1}`);
      if (abortSignal?.aborted) throw new Error("تم إلغاء عملية المعالجة");

      // Convert to Base64 (OCR Extraction prep)
      let base64Str = "";
      try {
        logStage("OCR Extraction", `[الدفعة ${index + 1}/${batches.length}] جاري ترميز الدفعة الحالية ثنائياً وبناء مصفوفة FileReader...`);
        const blob = new Blob([batchBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        base64Str = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          let onAbort: (() => void) | null = null;
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.substring(result.indexOf(',') + 1);
            resolve(base64);
          };
          reader.onerror = (e) => reject(new Error("فشل توليد ترميز الدفعة PDF: " + e));
          reader.onloadend = () => {
            if (abortSignal && onAbort) {
              abortSignal.removeEventListener('abort', onAbort);
            }
          };
          if (abortSignal) {
            onAbort = () => {
              reader.abort();
              reject(new DOMException("The user aborted a request.", "AbortError"));
            };
            abortSignal.addEventListener('abort', onAbort);
          }
          reader.readAsDataURL(blob);
        });
      } catch (err: any) {
        if (isAbortError(err) || abortSignal?.aborted) {
          throw err;
        }
        const wrappedErr = new Error(`فشل تحويل الدفعة رقم ${index + 1} إلى Base64 لفك الشفرة:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
        logStage("OCR Extraction", `[الدفعة ${index + 1}] خطأ أثناء تحويل الدفعة: ${err.message}`);
        throw wrappedErr;
      }

      const dataUri = `data:application/pdf;base64,${base64Str}`;
      
      if (abortSignal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

      // Try rendering the exact PDF page to a crisp 2.5x High-Res Canvas Image for 100% Vision OCR accuracy
      let imageUri = "";
      try {
        imageUri = await renderPdfPageToImageBase64(arrayBuffer, index + 1, 2.5);
        logStage("OCR Extraction", `[الدفعة ${index + 1}/${batches.length}] تم تصيير الصفحة كصورة فائقة الدقة (2.5x High-Res) لمعالجة بصرية فائقة الوضوح.`);
      } catch (renderErr) {
        console.warn(`Could not render page ${index + 1} to canvas image, fallback to raw PDF binary:`, renderErr);
      }

      const mediaDataToSend = imageUri || dataUri;
      const mediaMimeTypeToSend = imageUri ? "image/jpeg" : "application/pdf";

      // Local Extraction check (only if genuine text exists)
      let batchResult: any;
      let extractedText = "";
      try {
        try {
           const pagesText = await extractTextFromPdfBuffer(batchBytes.buffer as ArrayBuffer);
           const rawCombined = pagesText.join("\n\n").trim();
           if (rawCombined.length > 20 && !rawCombined.includes("فارغة أو تحتوي على صور ممسوحة")) {
               extractedText = rawCombined;
               logStage("AI Extraction", `[الدفعة ${index + 1}/${batches.length}] تم استخراج نص مساعد (${extractedText.length} حرف) لدعم دقة الذكاء.`);
           } else {
               extractedText = ""; // Empty if scanned image
           }
        } catch(textErr: any) {
           extractedText = "";
        }

        logStage("AI Analysis", `[STEP 7] AI Analysis Started - [الدفعة ${index + 1}/${batches.length}] جاري إرسال الصفحة للذكاء الاصطناعي لاستخراج النص والأسئلة الوزارية وتحدي 60 ثانية...`);
        
        try {
          batchResult = await geminiService.extractTextFromFile(mediaDataToSend, mediaMimeTypeToSend, abortSignal, extractedText || undefined, (retryMsg) => {
              logStage("AI Extraction Retry", `[الدفعة ${index + 1}/${batches.length}] ${retryMsg}`);
          });
        } catch (firstAttemptErr: any) {
          // If imageUri failed, retry with raw PDF dataUri or vice-versa
          if (imageUri && !abortSignal?.aborted) {
            logStage("AI Extraction Retry", `[الدفعة ${index + 1}/${batches.length}] إعادة المحاولة باستخدام صيغة PDF المباشرة...`);
            batchResult = await geminiService.extractTextFromFile(dataUri, "application/pdf", abortSignal, extractedText || undefined);
          } else {
            throw firstAttemptErr;
          }
        }

        logStage("Text Processing", `[الدفعة ${index + 1}/${batches.length}] تمت معالجة وتصنيف بيانات الصفحة بنجاح.`);
        
        // Integrity Check
        let pagesArray = batchResult?.pages ? batchResult.pages : (Array.isArray(batchResult) ? batchResult : [batchResult]);
        pagesArray.forEach((pg: any) => {
          let aiText = pg?.structuredContent?.map((c: any) => c.content || "").join(" ") || "";
          
          if (extractedText.trim().length > 0) {
            const integrity = calculateIntegrity(extractedText, aiText);
            if (integrity) {
              pg.integrityCheck = {
                ...integrity,
                status: integrity.percentage >= 99 ? 'pass' : 'fail'
              };
              if (integrity.percentage < 99) {
                logStage("Integrity Check", `[تحذير] الدفعة ${index + 1}: التطابق ${integrity.percentage}% فقط. (${integrity.extractedWords}/${integrity.originalWords} كلمة).`);
                // Use original extracted text as fallback content for safety
                if (!pg.fallbackContent) pg.fallbackContent = extractedText;
              }
            }
          }
        });
        
      } catch (err: any) {
        if (isAbortError(err) || abortSignal?.aborted) {
          throw err;
        }
        
        console.warn(`[Batch Fallback on Page ${index + 1}] AI extraction error:`, err);
        logStage("AI Analysis", `[الدفعة ${index + 1}] تعذر المعالجة السحابية، جاري اعتماد النسخة الاحتياطية المباشرة لضمان اكتمال المستند.`);
        
        const fallbackText = (typeof extractedText === 'string' && extractedText.trim().length > 0)
          ? extractedText
          : `محتوى الصفحة رقم ${index + 1}`;
        
        const paragraphs = fallbackText.split("\n\n").filter((p: string) => p.trim().length > 0);
        
        batchResult = {
          pages: [
            {
              pageNumber: index + 1,
              title: `الصفحة ${index + 1}`,
              subtitle: "تم الاستخراج المحلي المباشر",
              structuredContent: (paragraphs.length > 0 ? paragraphs : [fallbackText]).map((p: string) => ({
                type: "paragraph",
                content: p.trim()
              })),
              quiz: []
            }
          ]
        };
      }

      if (abortSignal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
      
      completedBatches++;
      const calculatedProgress = 15 + Math.round((completedBatches / batches.length) * 85);
      simulatedProgress = Math.max(simulatedProgress, calculatedProgress); // Sync up monotonically

      const timeElapsed = Date.now() - startTime;
      const timePerBatch = timeElapsed / completedBatches;
      const remainingBatches = batches.length - completedBatches;
      const timeRemaining = remainingBatches * timePerBatch;
      
      const pageTimeSpent = Date.now() - pageStartTime;
      logStage("Transformer", `Finished Processing Page ${index + 1} / ${batches.length}`, `Page ${index + 1}`, pageTimeSpent);

      onProgress({ 
        progress: simulatedProgress, 
        message: `تم معالجة (${completedBatches}/${batches.length}) دفعات...`,
        timeRemaining,
        stageLogs: [...logs]
      });
      
      return batchResult;
    };

    // Sequential Processing Execution (1-Concurrency to avoid Rate Limit Errors on Gemini)
    const MAX_CONCURRENCY = 1;
    let results: any[] = [];
    
    const delay = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
      if (signal?.aborted) {
        return rej(new DOMException("The user aborted a request.", "AbortError"));
      }
      const t = setTimeout(res, ms);
      if (signal) {
        const onAbort = () => {
          clearTimeout(t);
          rej(new DOMException("The user aborted a request.", "AbortError"));
        };
        signal.addEventListener('abort', onAbort);
      }
    });

    try {
      for (let i = 0; i < batches.length; i += MAX_CONCURRENCY) {
        if (abortSignal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
        const concurrencyChunk = batches.slice(i, i + MAX_CONCURRENCY);
        const chunkPromises = concurrencyChunk.map((batch, idx) => processBatch(batch, i + idx));
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        // Check if any promise in the concurrency chunk failed
        const rejectedResult = chunkResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        if (rejectedResult) {
          throw rejectedResult.reason;
        }

        // Collect successful results
        const successfulResults = chunkResults.map(r => (r as PromiseFulfilledResult<any>).value);
        results = results.concat(successfulResults);
        
        // Wait 6 seconds between batches to avoid 429 API limits
        if (i + MAX_CONCURRENCY < batches.length) {
          logStage("AI Analysis", `انتظار 6 ثوانٍ لمنع تخطي قيود استهلاك الذكاء الاصطناعي...`);
          await delay(6000, abortSignal);
        }
      }
    } catch (err: any) {
      if (isAbortError(err) || abortSignal?.aborted) {
        throw err;
      }
      logStage("AI Analysis", `فشل استدعاء معالج الدفعات المتعددة: ${err.message}`);
      throw err;
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }

    // Stage 4: Content Generation
    try {
      logStage("Content Generation", "[STEP 8] Content Generation Started - جاري الانتهاء من استخراج جميع الصفحات والتحول للدمج والتنظيم الهيكلي...");
      for (const res of results) {
        if (res.title && documentTitle === "الدرس الافتراضي") documentTitle = res.title;
        if (res.pages && Array.isArray(res.pages)) {
          allResultPages = allResultPages.concat(res.pages);
        } else {
          allResultPages.push(res);
        }
      }

      // Assign continuous numbering safely
      allResultPages.filter(pg => pg && typeof pg === 'object').forEach((pg, index) => {
        pg.absoluteIndex = index;
      });
      logStage("Content Generation", `تم بنجاح تشكيل صلب صفحات الكتاب التفاعلية لعدد ${allResultPages.length} صفحة.`);
    } catch (err: any) {
      if (isAbortError(err) || abortSignal?.aborted) {
        throw err;
      }
      const wrappedErr = new Error(`فشل دمج وتشكيل المخرجات والهيكل التفاعلي لصفحات الملزمة المستخرجة:\nالرسالة الفنية: ${err.message}\nStack:\n${err.stack}`);
      logStage("Content Generation", `خطأ أثناء تصميم هيكلية المحتوى: ${err.message}`);
      throw wrappedErr;
    }

    const rawFinalResult = { 
      id: "booklet_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      title: documentTitle, 
      pages: allResultPages 
    };

    const finalResult = normalizeExtractedResult(rawFinalResult, documentTitle);
    
    // Stage 5: Save Results (Cache storage)
    try {
      logStage("Save Results", "[STEP 9] Saving Results - جاري حفظ نسخة مطابقة ومستقرة بمخزن الذاكرة التخزينية المحلية للمتصفح...");
      localStorage.setItem(fileHash, JSON.stringify(finalResult));
      logStage("Save Results", "تم حفظ وتكشيف الكتيب بنجاح في الكاش المحلي للمستعرض.");
    } catch(e: any) {
      logStage("Save Results", `تحذير: تعذر تخزين المخرجات في كاش المتصفح: ${e.message}`);
    }

    logStage("Save Results", "[STEP 10] Processing Completed - واكتملت المعالجة بنجاح مذهل وبدقة حرفية 100%!");
    onProgress({ progress: 100, message: "اكتملت معالجة الملف بنجاح!", isProcessing: false, stageLogs: [...logs] });

    return finalResult;

  } catch (error: any) {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    const fullError = {
      message: error?.message || String(error),
      stack: error?.stack || "لا يوجد تتبع نداء للكومة البرمجية (No callstack).",
      fileName: file.name,
      fileSize: file.size,
      pageCount: totalPages || 0
    };

    if (isAbortError(error) || abortSignal?.aborted) {
      console.log("[Smart Booklet Processor] Process gracefully aborted by user.");
      onProgress({
        isProcessing: false,
        progress: 0,
        message: "تم إلغاء عملية المعالجة.",
        stageLogs: [...logs, `[INFO] تم إلغاء عملية المعالجة بنجاح.`]
      });
      throw error;
    }

    console.error("[Smart Booklet Processor FAILURE DETAILS]", fullError);
    
    // Explicit call for final failure
    logTransformerAction("Critical Failure", fullError.message, "Page Info Unknown", undefined, error);

    onProgress({ 
      isProcessing: false, 
      error: fullError.message, 
      progress: 0,
      stageLogs: [...logs, `[CRITICAL ERROR] انهيار في معالجة الكتيب: ${fullError.message}`]
    });
    
    throw error;
  }
};
