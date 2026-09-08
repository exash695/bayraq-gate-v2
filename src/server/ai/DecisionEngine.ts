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
    const preferOpenRouter = process.env.AI_PROVIDER === 'openrouter' || (!process.env.GEMINI_API_KEY && !!process.env.OPENROUTER_API_KEY);
    
    if (preferOpenRouter && process.env.OPENROUTER_API_KEY) {
      console.log('[DecisionEngine] Setting OpenRouter as PRIMARY');
      this.primaryProvider = new OpenRouterProvider();
      if (process.env.GEMINI_API_KEY) {
        this.secondaryProvider = new GeminiProvider();
      }
    } else {
      console.log('[DecisionEngine] Setting Gemini as PRIMARY');
      this.primaryProvider = new GeminiProvider();
      if (process.env.OPENROUTER_API_KEY) {
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

    console.log(`[DecisionEngine] Cache MISS. Calling ${this.primaryProvider.name}...`);

    // 3. AI Service Call with Fallback
    let resultText = "";
    let activeProvider = this.primaryProvider;
    
    try {
      resultText = await activeProvider.generate(request);
    } catch(err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[DecisionEngine] Primary provider (${activeProvider.name}) failed: ${errMsg}`);
      
      if (this.secondaryProvider) {
        console.log(`[DecisionEngine] Falling back to secondary provider: ${this.secondaryProvider.name}`);
        activeProvider = this.secondaryProvider;
        try {
          resultText = await activeProvider.generate(request);
        } catch(secErr: any) {
          console.error(`[DecisionEngine] All providers failed: ${secErr.message}`);
          throw secErr;
        }
      } else {
        console.log(`[DecisionEngine] No secondary provider. Retrying primary once after delay...`);
        await new Promise(res => setTimeout(res, 3000));
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
