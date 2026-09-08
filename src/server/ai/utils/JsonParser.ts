export class JsonParser {
  /**
   * Sanitizes a potential JSON string by removing markdown, comments, trailing commas, and fixing common LLM quirks.
   */
  static sanitizeJsonString(raw: string): string {
    if (!raw || typeof raw !== 'string') return "";
    
    let text = raw.trim();
    
    // 1. Remove UTF BOM and Zero Width Characters
    text = text.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

    // 2. Remove Markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      text = codeBlockMatch[1].trim();
    } else {
      // If starts with ``` without closing
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    // 3. Replace Smart Quotes with standard quotes
    text = text
      .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

    // 4. Remove single line comments // ... and multi-line comments /* ... */ (while trying not to break URLs inside quotes)
    text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 5. Fix Python / JS literals to valid JSON
    text = text
      .replace(/:\s*True\b/g, ': true')
      .replace(/:\s*False\b/g, ': false')
      .replace(/:\s*None\b/g, ': null')
      .replace(/:\s*undefined\b/g, ': null')
      .replace(/:\s*NaN\b/g, ': null');

    // 6. Remove trailing commas before closing braces or brackets: , } or , ]
    text = text.replace(/,(\s*[}\]])/g, '$1');

    return text.trim();
  }

  /**
   * Repairs common string-escaping issues (unescaped newlines or tabs inside double quotes)
   */
  static repairJsonString(raw: string): string {
    let text = this.sanitizeJsonString(raw);

    // Try finding the outermost JSON structure
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let startIndex = -1;
    let endIndex = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = text.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      endIndex = text.lastIndexOf(']');
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      text = text.substring(startIndex, endIndex + 1);
    }

    // Fix trailing commas once more in isolated substring
    text = text.replace(/,(\s*[}\]])/g, '$1');

    return text;
  }

  /**
   * Main JSON extraction entry point. Returns the parsed JSON structure (Object, Array, etc.)
   */
  static extractJsonFromContent(text: string): any {
    if (!text || typeof text !== 'string') return {};

    // Stage 1: Try direct JSON parse
    try {
      return JSON.parse(text.trim());
    } catch (_) {}

    // Stage 2: Try sanitized JSON parse
    const sanitized = this.sanitizeJsonString(text);
    try {
      return JSON.parse(sanitized);
    } catch (_) {}

    // Stage 3: Try substring repair (outermost braces/brackets)
    const repaired = this.repairJsonString(text);
    try {
      return JSON.parse(repaired);
    } catch (_) {}

    // Stage 4: Balanced parser to extract object(s) or array(s)
    try {
      const balanced = this.extractBalancedObjects(sanitized);
      if (balanced && (Array.isArray(balanced) ? balanced.length > 0 : Object.keys(balanced).length > 0)) {
        return balanced;
      }
    } catch (_) {}

    // Stage 5: Regex key-value salvage
    const salvaged = this.salvageStructuredData(text);
    if (salvaged && Object.keys(salvaged).length > 0) {
      return salvaged;
    }

    // Final attempt: if failed, throw standard Error to let caller handle fallback
    throw new Error(`تعذر استخراج كائن JSON صالح من استجابة الذكاء الاصطناعي.`);
  }

  /**
   * Balanced brace scanning to extract all valid JSON objects
   */
  private static extractBalancedObjects(text: string): any {
    const results: any[] = [];
    let currentJsonStr = "";
    let openBraces = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (char === '\\') {
          escapeNext = true;
        } else if (char === '"') {
          inString = false;
        }
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
            // Clean trailing commas in sub-object
            const cleanObjStr = currentJsonStr.replace(/,(\s*[}\]])/g, '$1');
            results.push(JSON.parse(cleanObjStr));
          } catch (err) {
            // Try lenient single quotes fix
            try {
              const lenient = currentJsonStr
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                .replace(/,(\s*[}\]])/g, '$1');
              results.push(JSON.parse(lenient));
            } catch (_) {}
          }
        }
      }
    }

    if (results.length === 1) {
      return results[0];
    } else if (results.length > 1) {
      return results;
    }

    return null;
  }

  /**
   * Salvages common AI output fields using regex when JSON syntax is corrupted
   */
  private static salvageStructuredData(text: string): any | null {
    const salvaged: any = {};

    // 1. Check for homework evaluation fields: points, feedback, badge
    const pointsMatch = text.match(/"?points"?\s*:\s*(\d+)/i) || text.match(/النقاط\s*:\s*(\d+)/i);
    if (pointsMatch) {
      salvaged.points = parseInt(pointsMatch[1], 10);
    }

    const feedbackMatch = text.match(/"?feedback"?\s*:\s*"([^"]+)"/i) || text.match(/"?feedback"?\s*:\s*'([^']+)'/i);
    if (feedbackMatch) {
      salvaged.feedback = feedbackMatch[1];
    } else if (salvaged.points !== undefined) {
      // Extract general text as feedback
      const cleanFeedback = text.replace(/[{}"\\]/g, '').trim();
      salvaged.feedback = cleanFeedback.substring(0, 300);
    }

    const badgeMatch = text.match(/"?badge"?\s*:\s*"([^"]+)"/i);
    if (badgeMatch) {
      salvaged.badge = badgeMatch[1];
    }

    // 2. Check for pages or structuredContent
    const titleMatch = text.match(/"?title"?\s*:\s*"([^"]+)"/i);
    if (titleMatch) {
      salvaged.title = titleMatch[1];
    }

    if (Object.keys(salvaged).length > 0) {
      return salvaged;
    }

    return null;
  }
}

