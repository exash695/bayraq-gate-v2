export class JsonParser {
  static extractJsonFromContent(text: string): any[] {
    let cleanText = text;
    
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      cleanText = match[1];
    }
    
    cleanText = cleanText.trim();

    try {
      const parsed = JSON.parse(cleanText);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e: any) {
      let results: any[] = [];
      let currentJsonStr = "";
      let openBraces = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        
        if (inString) {
          if (escapeNext) escapeNext = false;
          else if (char === '\\') escapeNext = true;
          else if (char === '"') inString = false;
          if (openBraces > 0) currentJsonStr += char;
          continue;
        } else {
          if (char === '"') inString = true;
        }

        if (char === '{') {
          if (openBraces === 0) currentJsonStr = "";
          openBraces++;
        }
        
        if (openBraces > 0) currentJsonStr += char;
        
        if (char === '}') {
          openBraces--;
          if (openBraces === 0) {
            try {
              results.push(JSON.parse(currentJsonStr));
            } catch(err) {}
          }
        }
      }
      
      if (results.length > 0) {
         return results;
      }
      
      throw e;
    }
  }
}
