import { GoogleGenAI } from '@google/genai';
import { IAIProvider, AIRequest } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  name = 'gemini-3.1-flash-lite';
  private fallbackModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview'
  ];
  private client: GoogleGenAI | null = null;

  constructor() {}

  private getClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
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

    const modelsToTry = Array.from(new Set([this.name, ...this.fallbackModels]));
    let lastError: any = null;
    const MAX_CYCLES = 2;

    for (let cycle = 0; cycle < MAX_CYCLES; cycle++) {
      for (let i = 0; i < modelsToTry.length; i++) {
        const model = modelsToTry[i];
        try {
          if (cycle > 0 || i > 0) {
              console.log(`[GeminiProvider] Attempting model: ${model} (Pass ${cycle + 1}/${MAX_CYCLES}, Model ${i + 1}/${modelsToTry.length})`);
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
          const msg = (err.message || String(err)).toLowerCase();
          console.warn(`[GeminiProvider] Error with model ${model}:`, msg);
          
          const isRecoverable = 
              err?.status === 503 ||
              err?.code === 503 ||
              err?.status === 429 ||
              err?.code === 429 ||
              err?.status === 500 ||
              err?.code === 500 ||
              msg.includes('429') || 
              msg.includes('quota') || 
              msg.includes('exhausted') || 
              msg.includes('503') || 
              msg.includes('500') || 
              msg.includes('504') || 
              msg.includes('404') || 
              msg.includes('not found') || 
              msg.includes('unavailable') ||
              msg.includes('high demand') ||
              msg.includes('overloaded') ||
              msg.includes('resource_exhausted') ||
              msg.includes('fetch failed');
              
          if (isRecoverable) {
              const isLastModel = i === modelsToTry.length - 1;
              const isLastCycle = cycle === MAX_CYCLES - 1;
              if (!isLastModel) {
                console.log(`[GeminiProvider] Recoverable high-demand/availability error on ${model}. Switching immediately to next fallback model (${modelsToTry[i + 1]})...`);
                await new Promise(res => setTimeout(res, 400));
                continue;
              } else if (!isLastCycle) {
                console.warn(`[GeminiProvider] All models experienced high demand in pass ${cycle + 1}. Backing off for 2.5s before retry pass...`);
                await new Promise(res => setTimeout(res, 2500));
                break; // proceed to next cycle
              }
          }
          
          if (!isRecoverable) {
            throw err;
          }
        }
      }
    }
    
    throw lastError;
  }
}
