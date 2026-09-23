import { IAIProvider, AIRequest } from './IAIProvider';

export class OpenRouterProvider implements IAIProvider {
  name = 'openrouter-gemini';
  private fallbackModels = [
    'google/gemini-2.5-flash',
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat'
  ];

  async generate(request: AIRequest): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is missing.');
    }

    const messages: any[] = [];
    if (request.base64Data && request.mimeType) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: request.prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.mimeType};base64,${request.base64Data}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: request.prompt
      });
    }

    const initialModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
    const modelsToTry = Array.from(new Set([initialModel, ...this.fallbackModels]));
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bairaq.app',
            'X-Title': 'Bairaq Gate 6'
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 4096,
            response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        this.name = `openrouter-${model}`;
        return data.choices?.[0]?.message?.content || '';
      } catch (err: any) {
        lastError = err;
        console.warn(`[OpenRouterProvider] Model ${model} failed:`, err.message || err);
      }
    }

    throw lastError || new Error('All OpenRouter models failed');
  }
}
