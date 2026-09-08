import { aiWorkerService } from './aiWorkerService';

const sleep = (ms: number, signal?: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The user aborted a request.", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("The user aborted a request.", "AbortError"));
    };
    if (signal) {
      signal.addEventListener("abort", onAbort);
    }
  });
};

export const extractTextFromFile = async (
  base64Data: string,
  mimeType: string = "image/jpeg",
  signal?: AbortSignal,
  extractedText?: string,
  onRetry?: (msg: string) => void
) => {
  let retries = 4; // Total 5 attempts

  while (retries >= 0) {
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    try {
      const data = await aiWorkerService.extractPageContent({
        base64Data,
        mimeType,
        extractedText,
        signal,
        onRetry
      });

      return data;
    } catch (e: any) {
      if (signal?.aborted || e.name === "AbortError" || e.message?.includes("aborted")) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const errMsg = e.message || String(e);
      const isRetryable =
        errMsg.includes("429") ||
        errMsg.includes("503") ||
        errMsg.includes("502") ||
        errMsg.includes("500") ||
        errMsg.includes("504") ||
        errMsg.includes("HTML") ||
        errMsg.includes("غير متاح") ||
        errMsg.includes("غير متوقعة") ||
        errMsg.includes("Unexpected token") ||
        errMsg.includes("JSON") ||
        errMsg.includes("Gateway") ||
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("high demand") ||
        errMsg.includes("unavailable");

      if (isRetryable && retries > 0) {
        const waitSecs = 3; // Reduced retry wait from 10s to 3s for faster recovery
        const msg = `بوابة بيرق الذكية تجري محاولة جديدة... (${5 - retries + 1}/5)`;
        console.warn(msg, e);
        if (onRetry) onRetry(msg);

        await sleep(waitSecs * 1000, signal);
        retries--;
        continue;
      }

      // If network/worker failed after retries and we have local text, return fallback structured content
      if (extractedText && extractedText.trim().length > 0) {
        console.info("[GeminiService] AI extraction failed, utilizing local text fallback for display.");
        const paragraphs = extractedText.split("\n\n").filter(p => p.trim().length > 0);
        return {
          pages: [
            {
              pageNumber: 1,
              title: "المحتوى العلمي المستخرج محلياً",
              subtitle: "تم الاعتماد على النص المحول محلياً لضمان عدم توقف العرض",
              structuredContent: paragraphs.map(p => ({
                type: "paragraph",
                content: p.trim()
              })),
              quiz: [
                {
                  type: "mcq",
                  question: "ما هو المحور الأساسي الذي يتناوله هذا الدرس المستخرج؟",
                  options: [
                    "المفاهيم والشروحات العلمية الموضحة في النص",
                    "معلومات خارجية غير واردة بالمنهج",
                    "إلغاء التطبيقات والتمارين",
                    "نصوص تجريبية عشوائية"
                  ],
                  correct: 0,
                  explanation: "المحتوى يركز على المفاهيم العلمية المستخرجة من الصفحة."
                },
                {
                  type: "mcq",
                  question: "كيف تحقق أفضل استفادة من مراجعة هذا النص التعليمي؟",
                  options: [
                    "المطابقة الدقيقة مع الأمثلة وحل التحديات التفاعلية",
                    "الحفظ السطحي دون مراجعة الشرح",
                    "تجاوز الملاحظات والقواعد الهامة",
                    "إهمال حل التمارين التفاعلية"
                  ],
                  correct: 0,
                  explanation: "الفهم والتدريب العملي المستمر يضمنان استقرار المعلومة والدرجة الكاملة."
                }
              ]
            }
          ]
        };
      }

      throw new Error(errMsg || "فشلت عملية معالجة الملف بواسطة الذكاء الاصطناعي.");
    }
  }

  throw new Error("فشلت عملية معالجة الملف بشكل نهائي بعد استنفاذ كافة المحاولات عبر البوابة الذكية.");
};

export const generateRadarQuestions = async (content: string): Promise<string[]> => {
  try {
    return await aiWorkerService.generateRadarQuestions(content);
  } catch (e) {
    console.error("Cloudflare Worker AI Radar Error:", e);
    return ["فشل في استنتاج أسئلة الرادار حالياً بسبب التحميل العالي"];
  }
};
