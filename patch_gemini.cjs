const fs = require('fs');
const filePath = 'src/server/ai/providers/GeminiProvider.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "    if (!this.client) {\n      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });\n    }",
  "    const key = process.env.GEMINI_API_KEY;\n    if (!key) {\n      throw new Error('GEMINI_API_KEY environment variable is missing.');\n    }\n    if (!this.client) {\n      this.client = new GoogleGenAI({ apiKey: key });\n    }"
);

fs.writeFileSync(filePath, code);
