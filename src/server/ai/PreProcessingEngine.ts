export class PreProcessingEngine {
  static analyzeText(text: string) {
    if (!text) return { wordCount: 0, isArabic: false };
    
    const wordCount = text.trim().split(/\s+/).length;
    const isArabic = /[\u0600-\u06FF]/.test(text);
    
    return {
      wordCount,
      isArabic,
      cleanText: text.replace(/\s+/g, ' ').trim()
    };
  }

  static chunkText(text: string, maxWordsPerChunk: number = 1000): string[] {
     const words = text.split(/\s+/);
     const chunks: string[] = [];
     for (let i = 0; i < words.length; i += maxWordsPerChunk) {
        chunks.push(words.slice(i, i + maxWordsPerChunk).join(' '));
     }
     return chunks;
  }
}
