export interface AIRequest {
  prompt: string;
  base64Data?: string;
  mimeType?: string;
  responseFormat?: 'json' | 'text';
}

export interface IAIProvider {
  name: string;
  generate(request: AIRequest): Promise<string>;
}
