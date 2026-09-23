import { CacheManager } from './CacheManager';
import { AnalyticsManager } from './AnalyticsManager';
import { IAIProvider } from './providers/IAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { PreProcessingEngine } from './PreProcessingEngine';
import { JsonParser } from './utils/JsonParser';

export class DecisionEngine {
  private primaryProvider: IAIProvider;
  private secondaryProvider: IAIProvider | null = null;

  constructor() {
    // If OPENROUTER_API_KEY is present, set it as primary (or secondary if AI_PROVIDER='gemini')
    const preferGemini = process.env.AI_PROVIDER === 'gemini';
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    if (hasOpenRouter && !preferGemini) {
      console.log('[DecisionEngine] Setting OpenRouter as PRIMARY provider');
      this.primaryProvider = new OpenRouterProvider();
      if (hasGemini) {
        this.secondaryProvider = new GeminiProvider();
      }
    } else {
      console.log('[DecisionEngine] Setting Gemini as PRIMARY provider');
      this.primaryProvider = new GeminiProvider();
      if (hasOpenRouter) {
        this.secondaryProvider = new OpenRouterProvider();
      }
    }
  }

  async process(request: {
    prompt: string;
    base64Data?: string;
    mimeType?: string;
    responseFormat?: 'json' | 'text';
    endpointName: string;
    extractedText?: string;
  }): Promise<any> {
    const startTime = Date.now();
    
    // 1. Pre-Processing & Hashing
    let preProcessedStats = {};
    if (request.extractedText) {
      preProcessedStats = PreProcessingEngine.analyzeText(request.extractedText);
    }
    
    const contentToHash = (request.base64Data || "") + request.prompt + (request.extractedText || "");
    const hash = CacheManager.generateHash(contentToHash);

    // 2. Check Cache
    const cachedResult = await CacheManager.getCachedResult(hash);
    if (cachedResult) {
      await AnalyticsManager.logUsage({
        endpoint: request.endpointName,
        model: this.primaryProvider.name,
        isCacheHit: true,
        processingTimeMs: Date.now() - startTime,
        metadata: { ...preProcessedStats, hash }
      });
      console.log(`[DecisionEngine] Cache HIT for hash ${hash.substring(0, 8)}`);
      return cachedResult;
    }

    // Determine the active provider.
    // If request contains image/base64 data, GeminiProvider MUST be used because OpenRouter models may lack vision endpoint support.
    let activeProvider: IAIProvider;
    let fallbackProvider: IAIProvider | null = null;

    const hasImageData = Boolean(request.base64Data && request.mimeType);
    if (hasImageData) {
      // Prioritize Gemini for multimodal vision/OCR extraction
      if (this.primaryProvider instanceof GeminiProvider) {
        activeProvider = this.primaryProvider;
        fallbackProvider = (this.secondaryProvider instanceof GeminiProvider) ? this.secondaryProvider : null;
      } else if (this.secondaryProvider instanceof GeminiProvider) {
        activeProvider = this.secondaryProvider;
        fallbackProvider = null;
      } else {
        activeProvider = new GeminiProvider();
        fallbackProvider = null;
      }
      console.log(`[DecisionEngine] Vision/multimodal input detected. Routing directly to ${activeProvider.name}`);
    } else {
      activeProvider = this.primaryProvider;
      fallbackProvider = this.secondaryProvider;
      console.log(`[DecisionEngine] Cache MISS. Calling ${activeProvider.name}...`);
    }

    // 3. AI Service Call with Fallback
    let resultText = "";
    
    try {
      resultText = await activeProvider.generate(request);
    } catch(err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[DecisionEngine] Provider (${activeProvider.name}) failed: ${errMsg}`);
      
      if (fallbackProvider) {
        console.log(`[DecisionEngine] Falling back to secondary provider: ${fallbackProvider.name}`);
        activeProvider = fallbackProvider;
        try {
          resultText = await activeProvider.generate(request);
        } catch(secErr: any) {
          console.error(`[DecisionEngine] All providers failed: ${secErr.message}`);
          throw secErr;
        }
      } else {
        console.log(`[DecisionEngine] No secondary fallback provider. Retrying active provider once after delay...`);
        await new Promise(res => setTimeout(res, 2000));
        resultText = await activeProvider.generate(request);
      }
    }
    
    // Parse if JSON
    let finalResult: any = resultText;
    if (request.responseFormat === 'json') {
      try {
        finalResult = JsonParser.extractJsonFromContent(resultText);
      } catch(e) {
        console.warn(`[DecisionEngine] Failed to parse JSON, returning raw text.`);
        finalResult = { text: resultText, unparsed: true };
      }
    }

    // 4. Save to Cache
    await CacheManager.saveToCache(hash, finalResult, {
      model: activeProvider.name,
      endpoint: request.endpointName,
      ...preProcessedStats
    });

    // 5. Log Analytics
    await AnalyticsManager.logUsage({
      endpoint: request.endpointName,
      model: activeProvider.name,
      isCacheHit: false,
      processingTimeMs: Date.now() - startTime,
      metadata: { ...preProcessedStats, hash }
    });

    return finalResult;
  }
}

export const decisionEngine = new DecisionEngine();
