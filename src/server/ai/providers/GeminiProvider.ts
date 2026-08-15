import { GoogleGenAI } from '@google/genai';
import { IAIProvider, AIRequest } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  name = 'gemini-1.5-flash-latest';
  private fallbackModels = ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest'];
  private client: GoogleGenAI | null = null;

  constructor() {}

  private getClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
    return this.client;
  }

  async generate(request: AIRequest): Promise<string> {
    const client = this.getClient();
    const contents: any[] = [];
    
    if (request.base64Data && request.mimeType) {
       contents.push({
         role: 'user',
         parts: [
           { text: request.prompt },
           {
             inlineData: {
               data: request.base64Data,
               mimeType: request.mimeType
             }
           }
         ]
       });
    } else {
       contents.push({
         role: 'user',
         parts: [{ text: request.prompt }]
       });
    }

    const config: any = {};
    if (request.responseFormat === 'json') {
       config.responseMimeType = 'application/json';
    }

    const modelsToTry = [this.name, ...this.fallbackModels];
    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        if (i > 0) {
            console.log(`[GeminiProvider] Attempting fallback model: ${model}`);
        }
        const result = await client.models.generateContent({
          model: model,
          contents,
          config
        });
        
        this.name = model; // Update for Analytics
        return result?.text || "";
      } catch(err: any) {
        lastError = err;
        const msg = (err.message || "").toLowerCase();
        console.warn(`[GeminiProvider] Error with model ${model}:`, msg);
        
        const isRecoverable = 
            msg.includes('429') || 
            msg.includes('quota') || 
            msg.includes('exhausted') || 
            msg.includes('503') || 
            msg.includes('500') ||
            msg.includes('504') ||
            msg.includes('404') ||
            msg.includes('not found') ||
            msg.includes('fetch failed');
            
        if (isRecoverable && i < modelsToTry.length - 1) {
            console.log(`[GeminiProvider] Recoverable error. Switching to next fallback model...`);
            await new Promise(res => setTimeout(res, 1500)); // wait before retry
            continue;
        }
        
        throw err;
      }
    }
    
    throw lastError;
  }
}
