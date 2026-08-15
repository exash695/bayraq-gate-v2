var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai2 = require("@google/genai");
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_multer = __toESM(require("multer"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);

// src/server/ai/CacheManager.ts
var import_crypto = __toESM(require("crypto"), 1);
var cache = /* @__PURE__ */ new Map();
var CacheManager = class {
  static generateHash(content) {
    return import_crypto.default.createHash("sha256").update(content).digest("hex");
  }
  static async getCachedResult(hash) {
    try {
      if (cache.has(hash)) {
        return cache.get(hash);
      }
      return null;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }
  static async saveToCache(hash, result, metadata = {}) {
    try {
      cache.set(hash, result);
      if (cache.size > 1e3) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }
    } catch (error) {
      console.error("Cache save error:", error);
    }
  }
};

// src/server/ai/AnalyticsManager.ts
var AnalyticsManager = class {
  static async logUsage(params) {
    try {
      console.log("[Analytics]", JSON.stringify({
        ...params,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
};

// src/server/ai/providers/GeminiProvider.ts
var import_genai = require("@google/genai");
var GeminiProvider = class {
  constructor() {
    this.name = "gemini-3.5-flash";
    this.fallbackModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];
    this.client = null;
  }
  getClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    if (!this.client) {
      this.client = new import_genai.GoogleGenAI({ apiKey: key });
    }
    return this.client;
  }
  async generate(request) {
    const client = this.getClient();
    const contents = [];
    if (request.base64Data && request.mimeType) {
      contents.push({
        role: "user",
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
        role: "user",
        parts: [{ text: request.prompt }]
      });
    }
    const config = {};
    if (request.responseFormat === "json") {
      config.responseMimeType = "application/json";
    }
    const modelsToTry = [this.name, ...this.fallbackModels];
    let lastError = null;
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        if (i > 0) {
          console.log(`[GeminiProvider] Attempting fallback model: ${model}`);
        }
        const result = await client.models.generateContent({
          model,
          contents,
          config
        });
        this.name = model;
        return result?.text || "";
      } catch (err) {
        lastError = err;
        const msg = (err.message || "").toLowerCase();
        console.warn(`[GeminiProvider] Error with model ${model}:`, msg);
        const isRecoverable = msg.includes("429") || msg.includes("quota") || msg.includes("exhausted") || msg.includes("503") || msg.includes("500") || msg.includes("504") || msg.includes("404") || msg.includes("not found") || msg.includes("fetch failed");
        if (isRecoverable && i < modelsToTry.length - 1) {
          console.log(`[GeminiProvider] Recoverable error. Switching to next fallback model...`);
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
};

// src/server/ai/PreProcessingEngine.ts
var PreProcessingEngine = class {
  static analyzeText(text) {
    if (!text) return { wordCount: 0, isArabic: false };
    const wordCount = text.trim().split(/\s+/).length;
    const isArabic = /[\u0600-\u06FF]/.test(text);
    return {
      wordCount,
      isArabic,
      cleanText: text.replace(/\s+/g, " ").trim()
    };
  }
  static chunkText(text, maxWordsPerChunk = 1e3) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      chunks.push(words.slice(i, i + maxWordsPerChunk).join(" "));
    }
    return chunks;
  }
};

// src/server/ai/utils/JsonParser.ts
var JsonParser = class {
  static extractJsonFromContent(text) {
    let cleanText = text;
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      cleanText = match[1];
    }
    cleanText = cleanText.trim();
    try {
      const parsed = JSON.parse(cleanText);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      let results = [];
      let currentJsonStr = "";
      let openBraces = 0;
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (inString) {
          if (escapeNext) escapeNext = false;
          else if (char === "\\") escapeNext = true;
          else if (char === '"') inString = false;
          if (openBraces > 0) currentJsonStr += char;
          continue;
        } else {
          if (char === '"') inString = true;
        }
        if (char === "{") {
          if (openBraces === 0) currentJsonStr = "";
          openBraces++;
        }
        if (openBraces > 0) currentJsonStr += char;
        if (char === "}") {
          openBraces--;
          if (openBraces === 0) {
            try {
              results.push(JSON.parse(currentJsonStr));
            } catch (err) {
            }
          }
        }
      }
      if (results.length > 0) {
        return results;
      }
      throw e;
    }
  }
};

// src/server/ai/DecisionEngine.ts
var DecisionEngine = class {
  constructor() {
    this.provider = new GeminiProvider();
  }
  async process(request) {
    const startTime = Date.now();
    let preProcessedStats = {};
    if (request.extractedText) {
      preProcessedStats = PreProcessingEngine.analyzeText(request.extractedText);
    }
    const contentToHash = (request.base64Data || "") + request.prompt + (request.extractedText || "");
    const hash = CacheManager.generateHash(contentToHash);
    const cachedResult = await CacheManager.getCachedResult(hash);
    if (cachedResult) {
      await AnalyticsManager.logUsage({
        endpoint: request.endpointName,
        model: this.provider.name,
        isCacheHit: true,
        processingTimeMs: Date.now() - startTime,
        metadata: { ...preProcessedStats, hash }
      });
      console.log(`[DecisionEngine] Cache HIT for hash ${hash.substring(0, 8)}`);
      return cachedResult;
    }
    console.log(`[DecisionEngine] Cache MISS for hash ${hash.substring(0, 8)}. Calling ${this.provider.name}...`);
    let resultText = "";
    try {
      resultText = await this.provider.generate(request);
    } catch (err) {
      console.warn(`[DecisionEngine] Error calling AI, retrying once...`);
      await new Promise((res) => setTimeout(res, 3e3));
      resultText = await this.provider.generate(request);
    }
    let finalResult = resultText;
    if (request.responseFormat === "json") {
      try {
        finalResult = JsonParser.extractJsonFromContent(resultText);
      } catch (e) {
        console.warn(`[DecisionEngine] Failed to parse JSON, returning raw text.`);
        finalResult = { text: resultText, unparsed: true };
      }
    }
    await CacheManager.saveToCache(hash, finalResult, {
      model: this.provider.name,
      endpoint: request.endpointName,
      ...preProcessedStats
    });
    await AnalyticsManager.logUsage({
      endpoint: request.endpointName,
      model: this.provider.name,
      isCacheHit: false,
      processingTimeMs: Date.now() - startTime,
      metadata: { ...preProcessedStats, hash }
    });
    return finalResult;
  }
};
var decisionEngine = new DecisionEngine();

// server.ts
var upload = (0, import_multer.default)({ dest: import_os.default.tmpdir() });
var R2_ENDPOINT = process.env.R2_ENDPOINT;
var R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
var R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
var R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "al-sadis-academy";
var s3Client = null;
if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3Client = new import_client_s3.S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
}
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new import_genai2.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function generateContentWithRetry(params, maxRetries = 5) {
  const client = getGeminiClient();
  const modelsToTry = Array.from(/* @__PURE__ */ new Set([
    params.model || "gemini-3.5-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
  ]));
  let lastError = null;
  for (const currentModel of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[Gemini Request] Model: ${currentModel}, Attempt: ${i + 1}/${maxRetries}`);
        const result = await client.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config
        });
        console.log(`[AI Call Success] Model: ${currentModel}, Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
        return result;
      } catch (error) {
        lastError = error;
        const errMsg = String(error.message || error || "");
        const isRateLimitOrUnavailable = error.status === 429 || error.code === 429 || error.status === 503 || error.code === 503 || errMsg.includes("429") || errMsg.includes("503") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exceeded") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("overloaded") || errMsg.includes("rate");
        if (isRateLimitOrUnavailable) {
          if (i < maxRetries - 1) {
            let delayMs = Math.min((i + 1) * 12e3, 45e3);
            if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
              delayMs = 3e4;
            }
            console.warn(`[Gemini Rate-Limit/Overload] Retrying model ${currentModel} in ${delayMs}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            console.warn(`[Gemini Retries Exhausted] Model ${currentModel} failed after ${maxRetries} attempts. Trying fallback model if available...`);
          }
        } else {
          console.error(`[Gemini Non-retryable error] Model ${currentModel} error:`, errMsg);
          break;
        }
      }
    }
  }
  throw lastError;
}
var redeemCodeLimiter = (0, import_express_rate_limit.default)({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 5,
  // limit each IP to 5 requests per windowMs
  message: { error: "\u0644\u0642\u062F \u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0645\u0646 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B." },
  standardHeaders: true,
  legacyHeaders: false
});
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "500mb" }));
  app.use(import_express.default.urlencoded({ limit: "500mb", extended: true }));
  app.use("/uploads", import_express.default.static(import_path.default.join(process.cwd(), "public", "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Accept-Ranges", "bytes");
    }
  }));
  app.post("/api/upload-url", async (req, res) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "Missing fileName or contentType" });
      }
      if (!s3Client || !R2_BUCKET_NAME) {
        return res.json({ local: true });
      }
      const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      const command = new import_client_s3.PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType
      });
      const presignedUrl = await (0, import_s3_request_presigner.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
      const publicUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${key}` : `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}`;
      res.json({ presignedUrl, key, publicUrl });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const fileName = req.file.originalname;
      const contentType = req.file.mimetype;
      const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      if (!s3Client) {
        const uploadsDir = import_path.default.join(process.cwd(), "public", "uploads");
        if (!import_fs.default.existsSync(uploadsDir)) {
          import_fs.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const destinationPath = import_path.default.join(uploadsDir, key);
        try {
          import_fs.default.renameSync(req.file.path, destinationPath);
        } catch (renameError) {
          if (renameError.code === "EXDEV") {
            import_fs.default.copyFileSync(req.file.path, destinationPath);
            import_fs.default.unlinkSync(req.file.path);
          } else {
            throw renameError;
          }
        }
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const baseUrl = req.headers["x-frontend-origin"] || process.env.APP_URL || `${protocol}://${host}`;
        const publicUrl2 = `${baseUrl}/uploads/${key}`;
        console.log(`[Upload Fallback] File saved locally. Direct absolute URL: ${publicUrl2}`);
        return res.json({ key, publicUrl: publicUrl2 });
      }
      const fileStream = import_fs.default.createReadStream(req.file.path);
      const command = new import_client_s3.PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Body: fileStream
      });
      await s3Client.send(command);
      import_fs.default.unlinkSync(req.file.path);
      const publicUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${key}` : `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}`;
      res.json({ key, publicUrl });
    } catch (error) {
      if (req.file && import_fs.default.existsSync(req.file.path)) {
        try {
          import_fs.default.unlinkSync(req.file.path);
        } catch (e) {
        }
      }
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  app.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrlStr = req.query.url;
      if (!videoUrlStr) {
        return res.status(400).json({ error: "Missing url parameter" });
      }
      let absoluteUrl = videoUrlStr;
      if (videoUrlStr.startsWith("/")) {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        absoluteUrl = `${protocol}://${host}${videoUrlStr}`;
      }
      console.log(`[Video Proxy] Requesting: ${absoluteUrl}`);
      if (absoluteUrl.includes("/uploads/")) {
        const filename = absoluteUrl.split("/uploads/")[1]?.split("?")[0];
        if (filename) {
          const filePath = import_path.default.join(process.cwd(), "public", "uploads", filename);
          if (import_fs.default.existsSync(filePath)) {
            const stat = import_fs.default.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
            res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
            res.setHeader("Accept-Ranges", "bytes");
            let mime = "video/mp4";
            const ext = import_path.default.extname(filename).toLowerCase();
            if (ext === ".webm") mime = "video/webm";
            else if (ext === ".ogg") mime = "video/ogg";
            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              if (start >= fileSize || end >= fileSize) {
                res.writeHead(416, {
                  "Content-Range": `bytes */${fileSize}`
                });
                return res.end();
              }
              const chunksize = end - start + 1;
              const fileStream = import_fs.default.createReadStream(filePath, { start, end });
              const head = {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": mime
              };
              res.writeHead(206, head);
              fileStream.pipe(res);
              return;
            } else {
              const head = {
                "Content-Length": fileSize,
                "Content-Type": mime
              };
              res.writeHead(200, head);
              import_fs.default.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }
      }
      const rangeHeader = req.headers.range;
      const fetchHeaders = {};
      if (rangeHeader) {
        fetchHeaders["Range"] = rangeHeader;
      }
      const response = await fetch(absoluteUrl, {
        headers: fetchHeaders
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Accept-Ranges", "bytes");
      const contentType = response.headers.get("content-type") || "video/mp4";
      res.setHeader("Content-Type", contentType);
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      const contentRange = response.headers.get("content-range");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }
      res.status(response.status);
      if (response.body) {
        if (typeof response.body[Symbol.asyncIterator] === "function") {
          for await (const chunk of response.body) {
            res.write(chunk);
          }
        } else {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      } else {
        res.end();
      }
    } catch (proxyError) {
      console.error("[Video Proxy Error]:", proxyError);
      if (!res.headersSent) {
        res.status(500).json({ error: `Proxy failed: ${proxyError.message}` });
      }
    }
  });
  app.post("/api/check-video", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }
      let checkUrl = url;
      if (url.startsWith("/")) {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        checkUrl = `${protocol}://${host}${url}`;
      }
      console.log(`[Video Check Server] Checking direct URL: ${checkUrl}`);
      let localExists = false;
      let fileLocationInfo = "\u0631\u0627\u0628\u0637 \u062E\u0627\u0631\u062C\u064A \u0623\u0648 \u0645\u0646 \u0633\u062D\u0627\u0628\u0629 \u062E\u0627\u0631\u062C\u064A\u0629";
      let localFileSizeText = "N/A";
      let localFileMime = "video/mp4";
      if (url.includes("/uploads/")) {
        try {
          const filename = url.split("/uploads/")[1];
          if (filename) {
            const rawFilename = filename.split("?")[0];
            const filePath = import_path.default.join(process.cwd(), "public", "uploads", rawFilename);
            localExists = import_fs.default.existsSync(filePath);
            if (localExists) {
              const stats = import_fs.default.statSync(filePath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              localFileSizeText = `${sizeInMB} MB (${stats.size} bytes)`;
              fileLocationInfo = `\u0646\u0639\u0645\u060C \u0627\u0644\u0645\u0644\u0641 \u0645\u0648\u062C\u0648\u062F \u0645\u0627\u062F\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0635 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631: ${filePath}`;
              const ext = import_path.default.extname(rawFilename).toLowerCase();
              if (ext === ".mp4") localFileMime = "video/mp4";
              else if (ext === ".webm") localFileMime = "video/webm";
              else if (ext === ".ogg") localFileMime = "video/ogg";
              else if (ext === ".m3u8") localFileMime = "application/x-mpegURL";
            } else {
              fileLocationInfo = `\u274C \u0627\u0644\u0645\u0644\u0641 \u0645\u0641\u0642\u0648\u062F! \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u0645\u0644\u0641 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062D\u0644\u064A \u0627\u0644\u0645\u062A\u0648\u0642\u0639: ${filePath}`;
            }
          }
        } catch (err) {
          console.error("[Video Check Server] Error during physical file check:", err);
          fileLocationInfo = `\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0644\u0641: ${err.message}`;
        }
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      try {
        const response = await fetch(checkUrl, {
          method: "HEAD",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const contentType = response.headers.get("content-type") || localFileMime;
        const contentLength = response.headers.get("content-length");
        const acceptRanges = response.headers.get("accept-ranges") || "none";
        let calculatedSize = localFileSizeText;
        if (contentLength) {
          const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
          calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
        }
        return res.json({
          status: response.status,
          statusText: response.statusText,
          contentType,
          fileSize: calculatedSize,
          acceptRanges,
          localExists,
          fileLocationInfo,
          ok: response.ok
        });
      } catch (headError) {
        console.log(`[Video Check Server] HEAD request failed: ${headError.message || headError}. Falling back to GET with byte range.`);
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 8e3);
        try {
          const response = await fetch(checkUrl, {
            method: "GET",
            headers: {
              Range: "bytes=0-0"
            },
            signal: getController.signal
          });
          clearTimeout(getTimeoutId);
          const contentType = response.headers.get("content-type") || localFileMime;
          const contentLength = response.headers.get("content-length");
          const acceptRanges = response.headers.get("accept-ranges") || "none";
          let calculatedSize = localFileSizeText;
          if (contentLength) {
            const rangeHeader = response.headers.get("content-range");
            if (rangeHeader && rangeHeader.includes("/")) {
              const totalBytes = rangeHeader.split("/")[1];
              const sizeInMB = (parseInt(totalBytes, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${totalBytes} bytes)`;
            } else {
              const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
            }
          }
          return res.json({
            status: response.status,
            statusText: response.statusText,
            contentType,
            fileSize: calculatedSize,
            acceptRanges,
            localExists,
            fileLocationInfo,
            ok: response.ok
          });
        } catch (getError) {
          console.error(`[Video Check Server] GET request also failed: ${getError.message || getError}`);
          return res.json({
            status: 500,
            statusText: getError.message || "Network Error",
            contentType: localFileMime,
            fileSize: localFileSizeText,
            acceptRanges: "none",
            localExists,
            fileLocationInfo,
            ok: false
          });
        }
      }
    } catch (err) {
      console.error(`[Video Check Server] Fatal exception during check:`, err);
      return res.json({
        status: 500,
        statusText: err.message || "Internal Server Error",
        contentType: "video/mp4",
        fileSize: "N/A",
        acceptRanges: "none",
        localExists: false,
        fileLocationInfo: err.message || "N/A",
        ok: false
      });
    }
  });
  app.post("/api/gemini/extract", async (req, res) => {
    const { base64Data, mimeType = "image/jpeg", extractedText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const cleanBase64 = base64Data.split(",")[1] || base64Data;
      const prompt = `
    \u0623\u0646\u062A \u0645\u062D\u0644\u0644 \u0628\u0646\u064A\u0629 \u0647\u064A\u0643\u0644\u064A\u0629 (Structural Analyzer) \u0648\u0645\u062D\u0648\u0644 \u0639\u0631\u0636 \u0630\u0643\u064A (Smart Presentation Converter).
    \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0642\u0631\u0627\u0621\u0629 \u0646\u0635 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0635\u0644\u064A \u0648\u062A\u062D\u0648\u064A\u0644\u0647 \u0625\u0644\u0649 \u0643\u062A\u0644 (Blocks) \u0647\u064A\u0643\u0644\u064A\u0629 \u0628\u0635\u0631\u064A\u0629\u060C \u062F\u0648\u0646 \u0623\u064A \u062A\u063A\u064A\u064A\u0631 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A.
    
    \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0635\u0627\u0631\u0645\u0629 \u0648\u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 (\u0625\u064A\u0627\u0643 \u0645\u062E\u0627\u0644\u0641\u062A\u0647\u0627):
    1. \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u062D\u0631\u0641\u064A\u0627\u064B (Word-for-Word) \u0628\u0646\u0633\u0628\u0629 100%. \u064A\u0645\u0646\u0639 \u0627\u0644\u062A\u0644\u062E\u064A\u0635\u060C \u064A\u0645\u0646\u0639 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0635\u064A\u0627\u063A\u0629\u060C \u064A\u0645\u0646\u0639 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631.
    2. \u0627\u0644\u062A\u062C\u0627\u0647\u0644 \u0627\u0644\u062A\u0627\u0645 \u0648\u0627\u0644\u062D\u0630\u0641 \u0644\u0623\u064A (\u0625\u0639\u0644\u0627\u0646\u0627\u062A\u060C \u0623\u0631\u0642\u0627\u0645 \u0647\u0648\u0627\u062A\u0641\u060C \u0645\u0639\u0631\u0641\u0627\u062A \u062A\u0644\u064A\u0643\u0631\u0627\u0645\u060C \u0623\u0633\u0645\u0627\u0621 \u0645\u0637\u0627\u0628\u0639\u060C \u0648\u062D\u0633\u0627\u0628\u0627\u062A \u062A\u0648\u0627\u0635\u0644) \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0644\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0628\u0635\u0648\u0631\u0629 \u0635\u0627\u0641\u064A\u0629.
    3. \u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0625\u0644\u0649 \u0643\u062A\u0644 (Block) \u0628\u062D\u064A\u062B \u0643\u0644 \u0641\u0642\u0631\u0629\u060C \u0645\u062B\u0627\u0644\u060C \u0645\u0644\u0627\u062D\u0638\u0629\u060C \u0633\u0624\u0627\u0644\u060C \u062A\u0639\u0644\u064A\u0644\u060C \u062C\u062F\u0648\u0644\u060C \u064A\u062A\u0645 \u0648\u0636\u0639\u0647 \u0641\u064A \u0643\u0627\u0626\u0646 JSON \u0645\u0633\u062A\u0642\u0644 \u062F\u0627\u062E\u0644 \u0645\u0635\u0641\u0648\u0641\u0629 \`structuredContent\`.
    4. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u0642\u0649 \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0643\u062A\u0644 \u0645\u0637\u0627\u0628\u0642\u0627\u064B \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0633\u0641\u0644. \u0644\u0627 \u062F\u0645\u062C\u060C \u0648\u0644\u0627 \u062A\u0642\u0633\u064A\u0645 \u0639\u0634\u0648\u0627\u0626\u064A \u0644\u0644\u0623\u0633\u0637\u0631.

    \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0643\u062A\u0644 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629 \u0641\u064A \`structuredContent\`:
    - "heading": \u0644\u0644\u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0648\u0627\u0644\u0641\u0631\u0639\u064A\u0629 \u0627\u0644\u0645\u0637\u0648\u0644\u0629.
    - "paragraph": \u0644\u0644\u0641\u0642\u0631\u0627\u062A \u0627\u0644\u0646\u0635\u064A\u0629 \u0627\u0644\u0639\u0627\u062F\u064A\u0629 \u0648\u0627\u0644\u0634\u0631\u0648\u062D\u0627\u062A \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u062A\u0631\u0627\u0628\u0637\u0629.
    - "example": \u0644\u0644\u0623\u0645\u062B\u0644\u0629 \u0648\u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0623\u0648 \u0627\u0644\u062D\u064A\u0627\u062A\u064A\u0629.
    - "note": \u0644\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A.
    - "warning": \u0644\u0644\u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0623\u0648 \u0627\u0644\u062A\u0639\u0627\u0644\u064A\u0644 \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u062D\u0631\u062C\u0629.
    - "question": \u0644\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 (\u0633\u0648\u0627\u0621 \u0643\u0627\u0646\u062A \u0648\u0632\u0627\u0631\u064A\u0629 \u0623\u0648 \u0623\u0633\u0626\u0644\u0629 \u0641\u0635\u0644).
    - "law": \u0644\u0644\u0642\u0648\u0627\u0646\u064A\u0646 \u0623\u0648 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629.
    - "table": \u0644\u0644\u062C\u062F\u0627\u0648\u0644 \u0623\u0648 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0627\u062A (\u064A\u0645\u062B\u0644 \u0643\u0635\u0641\u0648\u0641 \u0645\u0646 \u0627\u0644\u0646\u0635\u0648\u0635 \u062F\u0627\u062E\u0644 \`items\`).
    - "vocabulary": \u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629 \u0648\u0645\u0639\u0627\u0646\u064A\u0647\u0627 (\u064A\u062C\u0628 \u0627\u0633\u062A\u062E\u0644\u0627\u0635 \u0643\u0627\u0626\u0646 \`vocabItems\` \u0644\u0647\u0627).

    ${extractedText ? `
--- \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0627\u0644\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C \u0622\u0644\u064A\u0627\u064B ---
${extractedText}
-----------------------------------
\u064A\u062C\u0628 \u0623\u0644\u0627 \u064A\u0636\u064A\u0639 \u0623\u064A \u062D\u0631\u0641 \u0639\u0644\u0645\u064A \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0646\u0635\u060C \u0627\u0646\u0642\u0644\u0647 \u0643\u0645\u0627 \u0647\u0648 \u062A\u0645\u0627\u0645\u0627\u064B.` : ""}

    \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0647\u064A\u0643\u0644 \u0628\u0635\u064A\u063A\u0629 JSON \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u0628\u0627\u0644\u0636\u0628\u0637:
    {
      "pages": [
        {
          "pageNumber": 1,
          "title": "\u0639\u0646\u0648\u0627\u0646 \u0631\u0626\u064A\u0633\u064A \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0637\u0648\u0644",
          "subtitle": "\u0639\u0646\u0648\u0627\u0646 \u0641\u0631\u0639\u064A \u0623\u0648 \u0648\u0635\u0641 \u0645\u0628\u0633\u0637",
          "objectives": ["\u0623\u0647\u062F\u0627\u0641 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629 \u0625\u0646 \u0648\u062C\u062F\u062A"],
          "coreConcepts": ["\u0645\u0641\u0627\u0647\u064A\u0645 \u0648\u0627\u0633\u0645\u0627\u0621 \u0631\u0626\u064A\u0633\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A"],
          "structuredContent": [
            {
              "type": "heading" | "paragraph" | "example" | "note" | "warning" | "question" | "law" | "table" | "vocabulary",
              "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u062E\u062A\u064A\u0627\u0631\u064A \u0644\u0644\u0643\u062A\u0644\u0629 (\u0645\u062B\u0627\u0644: \u0645\u062B\u0627\u0644 1\u060C \u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629)",
              "content": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0627\u0644\u062D\u0631\u0641\u064A \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0643\u062A\u0644\u0629 (\u0627\u062C\u0628\u0627\u0631\u064A \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0627\u0646\u0648\u0627\u0639 \u0645\u0627 \u0639\u062F\u0627 \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0648\u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A \u0627\u0644\u0627\u0646\u0643\u0644\u064A\u0632\u064A\u0629)",
              "items": ["\u062A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u062D\u0627\u0644 \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0623\u0648 \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0643\u0646\u0635\u0648\u0635 \u0645\u0635\u0641\u0648\u0641\u0629"],
              "vocabItems": [{"en": "\u0627\u0644\u0643\u0644\u0645\u0629 \u0628\u0627\u0644\u0627\u0646\u0643\u0644\u064A\u0632\u064A\u0629", "ar": "\u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629"}]
            }
          ],
          "integrityWarning": "\u0631\u0633\u0627\u0644\u0629 \u062A\u062D\u0630\u064A\u0631\u064A\u0629 \u0635\u0631\u064A\u062D\u0629 \u0625\u0630\u0627 \u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0646\u0642\u0635 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A\u060C \u0623\u0648 \u062A\u0631\u0643 \u0641\u0627\u0631\u063A\u0627\u064B.",
          "quiz": [
             {
               "type": "mcq",
               "question": "\u064A\u062C\u0628 \u062A\u0648\u0644\u064A\u062F 5 \u0625\u0644\u0649 8 \u0623\u0633\u0626\u0644\u0629 \u0645\u062A\u0646\u0648\u0639\u0629 \u0647\u0646\u0627 \u0645\u0646 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0644\u062A\u0648\u0641\u064A\u0631 \u062A\u062C\u0631\u0628\u0629 \u0633\u0631\u064A\u0639\u0629 \u0648\u0645\u062A\u062C\u062F\u062F\u0629 \u0643\u0644 \u0645\u0631\u0629 \u064A\u064F\u0641\u062A\u062D \u0641\u064A\u0647\u0627 \u062A\u062D\u062F\u064A 60 \u062B\u0627\u0646\u064A\u0629 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645.",
               "options": ["\u062E\u064A\u0627\u0631 1", "\u062E\u064A\u0627\u0631 2", "\u062E\u064A\u0627\u0631 3", "\u062E\u064A\u0627\u0631 4"],
               "correct": 0,
               "explanation": "\u062A\u0641\u0633\u064A\u0631 \u0633\u0631\u064A\u0639 \u0644\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629"
             }
          ],
          "ministerialQuestions": [
            {
              "question": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u0648\u0632\u0627\u0631\u064A \u0643\u0645\u0627 \u0648\u0631\u062F \u0628\u062D\u0631\u0641\u064A\u062A\u0647 \u0625\u0630\u0627 \u062A\u0648\u0641\u0631",
              "answer": "\u0627\u0644\u062C\u0648\u0627\u0628 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u0644\u0644\u0633\u0624\u0627\u0644",
              "years": "\u0627\u0644\u0633\u0646\u0648\u0627\u062A \u0627\u0648 \u0627\u0644\u0627\u062F\u0648\u0627\u0631 \u0627\u0644\u062A\u064A \u0648\u0631\u062F \u0641\u064A\u0647\u0627"
            }
          ],
          "passes": []
        }
      ]
    }
  `;
      const fullPrompt = prompt + "\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629 \u062C\u062F\u0627: \u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u0636\u0645\u064A\u0646 5 \u0623\u0633\u0626\u0644\u0629 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F \u0641\u064A \u0642\u0633\u0645 quiz \u062A\u062D\u062F\u064A\u062F\u0627!";
      const parsedResults = await decisionEngine.process({
        prompt: fullPrompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: "json",
        endpointName: "extract",
        extractedText
      });
      let extObj = Array.isArray(parsedResults) ? parsedResults[0] : parsedResults;
      if (extObj && extObj.pages && extractedText) {
        const originalWordCount = extractedText.trim().split(/\s+/).length;
        let extractedWordCount = 0;
        extObj.pages.forEach((p) => {
          if (p.integrityWarning) {
            console.warn(`[Integrity AI Warning on Page ${p.pageNumber}]`, p.integrityWarning);
          }
          if (p.structuredContent) {
            p.structuredContent.forEach((block) => {
              if (block.content) extractedWordCount += block.content.trim().split(/\s+/).length;
            });
          }
        });
        const diffRatio = Math.abs(originalWordCount - extractedWordCount) / Math.max(originalWordCount, 1);
        if (diffRatio > 0.15) {
          console.warn(`[Integrity Validation Failed] Detected large difference between original content length (${originalWordCount} words) and extracted structured content length (${extractedWordCount} words). Total diff ratio: ${(diffRatio * 100).toFixed(2)}%.`);
        } else {
          console.log(`[Integrity Validation Passed] Word count diff ratio: ${(diffRatio * 100).toFixed(2)}%`);
        }
      }
      let finalPages = [];
      const blocks = Array.isArray(parsedResults) ? parsedResults : [parsedResults];
      blocks.forEach((block) => {
        if (block && block.pages && Array.isArray(block.pages)) {
          finalPages = finalPages.concat(block.pages);
        } else if (block && !block.pages) {
          finalPages.push(block);
        }
      });
      if (finalPages.length === 0) {
        throw new Error("\u0644\u0645 \u064A\u062A\u0645\u0643\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0646 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0623\u064A \u0628\u064A\u0627\u0646\u0627\u062A \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645.");
      }
      res.json({ pages: finalPages });
    } catch (error) {
      console.error("Error generating content via AI service:", error);
      res.status(500).json({ error: "Failed to generate content", details: error.message });
    }
  });
  app.post("/api/gemini/radar", async (req, res) => {
    const { content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const result = await generateContentWithRetry({
        contents: `
        \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0627\u0633\u062A\u0646\u062A\u062C 3 \u0623\u0633\u0626\u0644\u0629 \u0630\u0643\u064A\u0629 \u0648\u0639\u0645\u064A\u0642\u0629 (\u0623\u0633\u0626\u0644\u0629 \u0627\u0633\u062A\u0646\u062A\u0627\u062C\u064A\u0629) \u0644\u0644\u0637\u0644\u0627\u0628.
        \u0627\u0644\u0645\u062D\u062A\u0648\u0649:
        ${content}
        
        \u0623\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0643\u0642\u0627\u0626\u0645\u0629 \u0646\u0635\u064A\u0629 \u0628\u0633\u064A\u0637\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.
      `
      });
      const text = result?.text || "";
      res.json({ questions: text.split("\n").filter((line) => line.trim().length > 0) });
    } catch (error) {
      console.error("Error getting radar:", error);
      res.status(500).json({ error: "Failed to process" });
    }
  });
  app.post("/api/gemini/mock-exam", async (req, res) => {
    const { content, subject } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const prompt = `
        \u0623\u0646\u062A \u0648\u0627\u0636\u0639 \u0623\u0633\u0626\u0644\u0629 \u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0639\u0631\u0627\u0642\u064A\u0629 \u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A.
        \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0632\u0645\u0629 \u0627\u0644\u062A\u0627\u0644\u064A \u0648\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629: [${subject || "\u0639\u0627\u0645"}]\u060C \u0642\u0645 \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0645\u062A\u062D\u0627\u0646 \u062A\u062C\u0631\u064A\u0628\u064A \u0634\u0627\u0645\u0644 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 20 \u0633\u0624\u0627\u0644\u0627\u064B \u0645\u062A\u0646\u0648\u0639\u0627\u064B.
        \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u062A\u0627\u062D \u0645\u0646 \u0627\u0644\u0645\u0644\u0632\u0645\u0629:
        ${content || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u062F\u062F\u060C \u064A\u0631\u062C\u0649 \u062A\u0648\u0644\u064A\u062F \u0623\u0633\u0626\u0644\u0629 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0639\u0627\u0645\u0629 \u0641\u064A \u0645\u0627\u062F\u0629 " + (subject || "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621")}
        
        \u0634\u0631\u0648\u0637 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0633\u0626\u0644\u0629:
        1. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A 20 \u0633\u0624\u0627\u0644\u0627\u064B \u0645\u062A\u0646\u0648\u0639\u0627\u064B (\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A\u060C \u0635\u062D \u0648\u062E\u0637\u0623\u060C \u0641\u0631\u0627\u063A\u0627\u062A\u060C \u062A\u0639\u0627\u0644\u064A\u0644\u060C \u062A\u0639\u0627\u0631\u064A\u0641\u060C \u062A\u0639\u062F\u0627\u062F) \u0645\u0635\u0627\u063A\u0629 \u0628\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F.
        2. \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0633\u0626\u0644\u0629 \u0630\u0643\u064A\u0629 \u0648\u0627\u0633\u062A\u0646\u062A\u0627\u062C\u064A\u0629 \u0645\u0646 \u0648\u062D\u064A \u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u0639\u0631\u0627\u0642\u064A \u0627\u0644\u0631\u0633\u0645\u064A \u062D\u0635\u0631\u0627\u064B \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u0648\u0632\u0627\u0631\u064A.
        3. \u0644\u0644\u0635\u062D \u0648\u0627\u0644\u062E\u0637\u0623: \u0627\u062C\u0639\u0644 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A ["\u0635\u062D", "\u062E\u0637\u0623"]. \u0644\u0644\u062A\u0639\u0627\u0644\u064A\u0644/\u0627\u0644\u062A\u0639\u0627\u0631\u064A\u0641/\u0627\u0644\u062A\u0639\u062F\u0627\u062F: \u0627\u062C\u0639\u0644 \u0627\u0644\u062C\u0648\u0627\u0628 \u0627\u0644\u0635\u062D\u064A\u062D \u0623\u062D\u062F \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0635\u0646\u0639 \u062B\u0644\u0627\u062B\u0629 \u062E\u064A\u0627\u0631\u0627\u062A \u0623\u062E\u0631\u0649 \u0645\u0645\u0648\u0647\u0629 \u0648\u0645\u0642\u0627\u0631\u0628\u0629.
        4. \u0623\u0646 \u062A\u0631\u0641\u0642 \u0643\u0644 \u0633\u0624\u0627\u0644 \u0628\u0640 "\u0627\u0644\u062A\u0641\u0633\u064A\u0631 \u0627\u0644\u0648\u0632\u0627\u0631\u064A \u0627\u0644\u062F\u0642\u064A\u0642 \u0648\u0627\u0644\u0639\u0645\u064A\u0642" (explanation) \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u0634\u0631\u062D \u0633\u0628\u0628 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.
        5. \u0623\u0646 \u062A\u0639\u0648\u062F \u0628\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0643\u0640 \u0645\u0635\u0641\u0648\u0641\u0629 JSON \u0635\u0627\u0644\u062D\u0629 \u062D\u0635\u0631\u0627\u064B (valid JSON array of objects) \u062F\u0648\u0646 \u0623\u064A \u0643\u0644\u0627\u0645 \u062E\u0627\u0631\u062C\u064A \u0623\u0648 \u062A\u063A\u0644\u064A\u0641 \u0645\u0627\u0631\u0643\u062F\u0627\u0648\u0646. \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628:
        [
          {
            "id": 1,
            "text": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0647\u0646\u0627... (\u0645\u062B\u0627\u0644: \u0639\u0644\u0644: \u0643\u0630\u0627 \u0643\u0630\u0627\u060C \u0623\u0648 \u0639\u0631\u0641: \u0643\u0630\u0627 \u0643\u0630\u0627)",
            "options": ["\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0623\u0648\u0644", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0646\u064A", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0644\u062B", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0631\u0627\u0628\u0639"],
            "correctAnswer": 0,
            "explanation": "\u0627\u0644\u062A\u0641\u0633\u064A\u0631 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A..."
          }
        ]
      `;
      const result = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const responseText = result?.text || "";
      const parsedQuestions = JSON.parse(responseText.trim());
      res.json({ questions: parsedQuestions });
    } catch (error) {
      console.error("Error generating mock exam via Gemini:", error);
      res.status(500).json({ error: "Failed to generate mock exam", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app.post("/api/gemini/extract-questions", async (req, res) => {
    const { base64Data, mimeType = "image/jpeg" } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const cleanBase64 = base64Data.split(",")[1] || base64Data;
      const prompt = `
        \u0642\u0645 \u0628\u0642\u0631\u0627\u0621\u0629 \u0647\u0630\u0647 \u0627\u0644\u0648\u0631\u0642\u0629 \u0627\u0644\u0645\u0643\u062A\u0648\u0628\u0629 \u0623\u0648 \u0627\u0644\u0645\u0637\u0628\u0648\u0639\u0629 \u0648\u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u0633\u0626\u0644\u0629 \u0627\u0645\u062A\u062D\u0627\u0646\u064A\u0629.
        \u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0648\u0627\u0644\u0623\u0647\u0645 \u0647\u064A \u0627\u0633\u062A\u062E\u0631\u0627\u062C **\u0643\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0641\u0631\u0639 \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0641\u0631\u0639\u064A\u0629** \u062D\u0631\u0641\u064A\u0627\u064B \u0643\u0645\u0627 \u0647\u064A \u0645\u0643\u062A\u0648\u0628\u0629 \u0641\u064A \u0627\u0644\u0648\u0631\u0642\u0629\u060C \u0648\u0639\u062F\u0645 \u0625\u0647\u0645\u0627\u0644 \u0623\u064A \u0633\u0624\u0627\u0644 \u0623\u0648 \u0641\u0631\u0639.
        \u0644\u0627 \u062A\u0647\u062A\u0645 \u0643\u062B\u064A\u0631\u0627\u064B \u0628\u062A\u0635\u0646\u064A\u0641 \u0646\u0648\u0639 \u0627\u0644\u0633\u0624\u0627\u0644 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0630\u0644\u0643 \u0633\u064A\u0624\u062F\u064A \u0625\u0644\u0649 \u0641\u0642\u062F\u0627\u0646 \u0628\u0639\u0636 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0623\u0648 \u062A\u0639\u0642\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u062E\u0631\u0627\u062C. \u0627\u062C\u0639\u0644 \u0646\u0648\u0639 \u0627\u0644\u0633\u0624\u0627\u0644 "custom" (\u0645\u062E\u0635\u0635) \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0627\u0644\u0623\u0641\u0631\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C\u0629\u060C \u0648\u0636\u0639 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0643\u0627\u0645\u0644\u0627\u064B \u0641\u064A \u062D\u0642\u0644 "text". 
        \u064A\u0645\u0643\u0646\u0643 \u062A\u0642\u064A\u064A\u0645 \u062F\u0631\u062C\u0629 \u0627\u0644\u0635\u0639\u0648\u0628\u0629 \u062A\u0642\u0631\u064A\u0628\u064A\u0627\u064B.
        
        \u0623\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u062D\u0635\u0631\u0627\u064B \u0643\u0645\u0635\u0641\u0648\u0641\u0629 JSON \u0635\u0627\u0644\u062D\u0629 \u0628\u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0627\u0644\u064A (\u0628\u062F\u0648\u0646 \u0623\u064A \u0639\u0644\u0627\u0645\u0627\u062A \u0645\u0627\u0631\u0643\u062F\u0627\u0648\u0646 \u0625\u0636\u0627\u0641\u064A\u0629 \u0623\u0648 \u0646\u0635\u0648\u0635 \u062E\u0627\u0631\u062C \u0627\u0644\u0640 JSON):
        [
          {
            "text": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0648\u0627\u0644\u0641\u0631\u0639 \u0643\u0627\u0645\u0644\u0627\u064B...", 
            "type": "custom", 
            "difficulty": "medium", // easy, medium, hard
            "options": []
          }
        ]
      `;
      const parsed = await decisionEngine.process({
        prompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: "json",
        endpointName: "extract-questions"
      });
      res.json({ questions: Array.isArray(parsed) ? parsed : [parsed] });
    } catch (error) {
      console.error("Error extracting questions via Gemini:", error);
      res.status(500).json({ error: "Failed to extract questions from image", details: error.message });
    }
  });
  app.post("/api/gemini/evaluate-homework", async (req, res) => {
    const { schoolId, taskId, taskTitle, studentId, studentName, content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    if (!schoolId || !taskId || !studentId || !content) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    try {
      const prompt = `
      \u0623\u0646\u062A \u0645\u0642\u064A\u0651\u0645 \u062A\u0631\u0628\u0648\u064A \u0630\u0643\u064A \u0648\u0646\u0627\u0642\u062F \u0645\u0628\u062F\u0639 \u0641\u064A \u0645\u0646\u0635\u0629 \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629.
      \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u062A\u0642\u064A\u064A\u0645 \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0637\u0627\u0644\u0628 \u0639\u0644\u0649 \u0627\u0644\u0648\u0627\u062C\u0628 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u062A\u0627\u0644\u064A \u0628\u0634\u0643\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0648\u0639\u0627\u062F\u0644.
      
      \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0648\u0627\u062C\u0628: "${taskTitle}"
      \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0637\u0627\u0644\u0628:
      "${content}"
      
      \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0646\u0643 \u0647\u0648:
      1. \u062A\u0642\u064A\u064A\u0645 \u062C\u0648\u062F\u0629 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u062A\u0631\u0628\u0648\u064A\u0627\u064B \u0648\u0639\u0644\u0645\u064A\u0627\u064B \u0648\u0643\u062A\u0627\u0628\u0629 \u062A\u063A\u0630\u064A\u0629 \u0631\u0627\u062C\u0639\u0629 \u0645\u0641\u0635\u0644\u0629\u060C \u0648\u062F\u0648\u062F\u0629\u060C \u0648\u0645\u0634\u062C\u0639\u0629 \u0644\u0644\u0637\u0627\u0644\u0628 (\u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629).
      2. \u0627\u062D\u062A\u0633\u0627\u0628 \u0646\u0642\u0627\u0637 \u062E\u0628\u0631\u0629 (XP / Points) \u064A\u0633\u062A\u062D\u0642\u0647\u0627 \u0627\u0644\u0637\u0627\u0644\u0628 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062C\u0648\u062F\u0629 \u0648\u0639\u0645\u0642 \u0625\u062C\u0627\u0628\u062A\u0647:
         - \u0625\u062C\u0627\u0628\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0645\u062B\u0627\u0644\u064A\u0629: \u0645\u0646 80 \u0625\u0644\u0649 100 \u0646\u0642\u0637\u0629.
         - \u0625\u062C\u0627\u0628\u0629 \u062C\u064A\u062F\u0629 \u062C\u062F\u0627\u064B \u0623\u0648 \u062C\u064A\u062F\u0629: \u0645\u0646 50 \u0625\u0644\u0649 79 \u0646\u0642\u0637\u0629.
         - \u0625\u062C\u0627\u0628\u0629 \u0645\u0642\u0628\u0648\u0644\u0629 \u0623\u0648 \u062A\u062D\u062A\u0627\u062C \u062A\u0637\u0648\u064A\u0631: \u0645\u0646 20 \u0625\u0644\u0649 49 \u0646\u0642\u0637\u0629.
      3. \u062A\u062D\u062F\u064A\u062F \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u064A\u0633\u062A\u062D\u0642 \u0648\u0633\u0627\u0645\u0627\u064B \u0634\u0631\u0641\u064A\u0627\u064B \u0645\u0645\u064A\u0632\u0627\u064B \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062A\u0645\u064A\u0632\u0647:
         - "honor_mid" (\u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631 \u{1F31F}): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0645\u0630\u0647\u0644\u0629 \u0648\u062A\u0641\u0648\u0642 \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0628\u0634\u0643\u0644 \u0643\u0627\u0645\u0644.
         - "star" (\u0646\u062C\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u2B50): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0648\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062C\u062F\u0627\u064B \u0648\u0628\u0647\u0627 \u0641\u0643\u0631 \u0645\u0645\u064A\u0632.
         - "progress" (\u062A\u0637\u0648\u0631 \u0645\u0644\u062D\u0648\u0638 \u{1F3AF}): \u0625\u0630\u0627 \u0628\u0630\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u062C\u0647\u062F\u0627\u064B \u0643\u0628\u064A\u0631\u0627\u064B \u062C\u062F\u0627\u064B \u0641\u064A \u0627\u0644\u0643\u062A\u0627\u0628\u0629 \u0648\u0627\u0644\u0634\u0631\u062D \u062D\u062A\u0649 \u0648\u0625\u0646 \u0644\u0645 \u064A\u0643\u0646 \u062E\u0628\u064A\u0631\u0627\u064B.
         - "discipline" (\u0648\u0633\u0627\u0645 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u{1F525}): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0645\u0646\u0638\u0645\u0629 \u0648\u0645\u0631\u062A\u0628\u0629 \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629 \u0648\u0627\u0644\u062A\u0632\u0645\u062A \u0628\u062C\u0645\u064A\u0639 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0633\u0624\u0627\u0644.
         - null: \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0639\u062A\u064A\u0627\u062F\u064A\u0629 \u062C\u064A\u062F\u0629 \u0648\u0644\u0643\u0646\u0647\u0627 \u0644\u0627 \u062A\u0633\u062A\u062D\u0642 \u0648\u0633\u0627\u0645\u0627\u064B \u0634\u0631\u0641\u064A\u0627\u064B \u062E\u0627\u0635\u0627\u064B \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u062D\u0627\u0644\u064A.

      \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0628\u0635\u064A\u063A\u0629 JSON \u062A\u0645\u0627\u0645\u0627\u064B \u0628\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
      {
        "points": number,
        "feedback": "string (\u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0631\u0627\u062C\u0639\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629)",
        "badge": "string or null"
      }
      `;
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      let evaluation = { points: 50, feedback: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0627\u062C\u0628\u0643 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0642\u064A\u064A\u0645\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B. \u0627\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u0633\u0639\u064A \u0646\u062D\u0648 \u0627\u0644\u0642\u0645\u0629!", badge: null };
      try {
        evaluation = JSON.parse(text.trim());
      } catch (e) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          evaluation = JSON.parse(match[1].trim());
        }
      }
      let points = Number(evaluation.points);
      if (isNaN(points) || points < 0) points = 50;
      if (points > 100) points = 100;
      res.json({
        success: true,
        pointsAwarded: points,
        feedback: evaluation.feedback,
        badgeAwarded: evaluation.badge || null
      });
    } catch (error) {
      console.error("Error evaluating homework via Gemini:", error);
      res.status(500).json({ error: "Failed to evaluate homework", details: error.message });
    }
  });
  app.post("/api/gemini/chat", async (req, res) => {
    const { context, message, history = [], imageUrl, fileUrls = [] } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    const fileParts = [];
    const urlsToProcess = [];
    if (imageUrl) urlsToProcess.push(imageUrl);
    if (Array.isArray(fileUrls)) urlsToProcess.push(...fileUrls);
    for (const url of urlsToProcess) {
      try {
        const fileRes = await fetch(url);
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let mimeType = fileRes.headers.get("content-type") || "application/octet-stream";
        if (url.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (url.toLowerCase().endsWith(".png")) {
          mimeType = "image/png";
        } else if (url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        }
        const supportedPrefixes = ["image/", "audio/", "video/", "application/pdf", "text/"];
        const isSupported = supportedPrefixes.some((prefix) => mimeType.startsWith(prefix));
        if (!isSupported) {
          throw new Error(`\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: ${mimeType}. \u064A\u0631\u062C\u0649 \u0631\u0641\u0639 \u0645\u0644\u0641\u0627\u062A PDF \u0623\u0648 \u0635\u0648\u0631 \u0641\u0642\u0637.`);
        }
        fileParts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType
          }
        });
      } catch (err) {
        console.error("Failed to fetch file for Gemini:", err);
      }
    }
    const systemInstruction = `
      \u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0644\u0645\u0646\u0635\u0629 \u062A\u0639\u0644\u064A\u0645\u064A\u0629.
      \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0639\u0644\u0649 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0646\u0627\u0621\u064B \u062D\u0635\u0631\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u0645\u0642\u062F\u0645 \u0644\u0643 \u0623\u062F\u0646\u0627\u0647.
      \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:
      ${context}

      \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0639\u0645\u0644:
      1. \u0623\u062C\u0628 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u062A\u0639\u0644\u064A\u0645\u064A \u0645\u0634\u062C\u0639.
      2. \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0633\u0624\u0627\u0644 \u0639\u0646 "\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629" \u0623\u0648 "\u0627\u0644\u0645\u0644\u0632\u0645\u0629"\u060C \u0627\u0639\u062A\u0645\u062F \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0623\u0648 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u0641\u0642\u0629.
      3. \u0625\u0630\u0627 \u0637\u0644\u0628 \u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0635\u0641\u062D\u0629\u060C \u0642\u0645 \u0628\u062A\u0642\u062F\u064A\u0645 \u0645\u0644\u062E\u0635 \u0630\u0643\u064A \u0648\u0645\u0646\u0638\u0645 \u0648\u0645\u062E\u062A\u0635\u0631.
      4. \u0625\u0630\u0627 \u0637\u0644\u0628 \u0625\u0646\u0634\u0627\u0621 \u0627\u062E\u062A\u0628\u0627\u0631 \u0623\u0648 \u0623\u0633\u0626\u0644\u0629\u060C \u0642\u0645 \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649.
      5. \u0643\u0646 \u062F\u0642\u064A\u0642\u0627\u064B\u060C \u0648\u0648\u0636\u062D \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0628\u0634\u0643\u0644 \u064A\u0633\u0647\u0644 \u0641\u0647\u0645\u0647.
    `;
    const parsedHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    async function sendChatWithRetry(maxRetries = 4) {
      const client = getGeminiClient();
      let currentModel = "gemini-3.5-flash";
      for (let i = 0; i < maxRetries; i++) {
        try {
          const chat = client.chats.create({
            model: currentModel,
            config: {
              systemInstruction
            },
            history: parsedHistory
          });
          let parts = [{ text: message }];
          if (fileParts.length > 0) {
            parts = [...fileParts, ...parts];
          }
          return await chat.sendMessage({ message: parts });
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          const errMsg = String(error.message || error || "");
          const isRateLimitOrUnavailable = error.status === 429 || error.code === 429 || error.status === 503 || error.code === 503 || errMsg.includes("429") || errMsg.includes("503") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exceeded") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("overloaded") || errMsg.includes("rate");
          if (isRateLimitOrUnavailable) {
            let delayMs = Math.min((i + 1) * 1e4, 3e4);
            if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
              delayMs = 3e4;
            }
            console.warn(`Retrying chat message due to rate-limit/quota (Attempt ${i + 1}/${maxRetries}) in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            throw error;
          }
        }
      }
    }
    try {
      const result = await sendChatWithRetry();
      const responseText = result?.text || "";
      res.json({ response: responseText });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (s3Client && R2_BUCKET_NAME) {
        const fileStream = import_fs.default.createReadStream(req.file.path);
        const fileKey = `uploads/${Date.now()}-${req.file.originalname}`;
        await s3Client.send(new import_client_s3.PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: fileStream,
          ContentType: req.file.mimetype
        }));
        const publicUrl2 = `${process.env.R2_PUBLIC_URL || `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com`}/${fileKey}`;
        import_fs.default.unlink(req.file.path, () => {
        });
        return res.json({ publicUrl: publicUrl2, url: publicUrl2 });
      }
      const uploadsDir = import_path.default.join(process.cwd(), "public", "uploads");
      if (!import_fs.default.existsSync(uploadsDir)) {
        import_fs.default.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const destPath = import_path.default.join(uploadsDir, fileName);
      import_fs.default.copyFileSync(req.file.path, destPath);
      import_fs.default.unlink(req.file.path, () => {
      });
      const publicUrl = `/uploads/${fileName}`;
      return res.json({ publicUrl, url: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process upload" });
    }
  });
  app.post("/api/log-error", (req, res) => {
    console.error("FRONTEND ERROR LOG:", req.body);
    res.json({ success: true });
  });
  app.post("/api/explain", async (req, res) => {
    const { questionText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const result = await generateContentWithRetry({
        contents: `Explain why the answer to "${questionText}" is wrong and provide the correct answer in Arabic.`
      });
      res.json({ explanation: result?.text || "" });
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      res.status(500).json({ error: "Failed to get explanation" });
    }
  });
  app.post("/api/redeem-code", redeemCodeLimiter, async (req, res) => {
    const { code } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      res.json({ success: true, message: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u0628\u0646\u062C\u0627\u062D!" });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0643\u0648\u062F" });
    }
  });
  app.post("/api/webhook/payment", async (req, res) => {
    const sig = req.headers["x-payment-signature"];
    const { userId, courseId, status } = req.body;
    if (status === "success") {
      try {
        console.log(`Subscription activated for user ${userId} and course ${courseId}`);
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Error activating subscription via webhook:", error);
        res.status(500).json({ error: "Failed to activate subscription" });
      }
    } else {
      res.status(200).json({ received: true, message: "Payment not successful" });
    }
  });
  app.post("/api/notifications/notify-parent-payment", async (req, res) => {
    const { parentToken, amount, receiptId } = req.body;
    if (!parentToken || !amount) {
      return res.status(400).json({ error: "Missing parentToken or amount" });
    }
    const message = {
      notification: {
        title: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639 \u2705",
        body: `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0628\u0644\u063A ${amount} \u062F.\u0639 \u0628\u0646\u062C\u0627\u062D \u0648\u0635\u062F\u0631 \u0648\u0635\u0644\u0643\u0645 \u0627\u0644\u0631\u0642\u0645\u064A.`
      },
      token: parentToken,
      data: {
        type: "PAYMENT_CONFIRMED",
        receipt_id: receiptId || "REC-UNKNOWN"
      }
    };
    try {
      console.log("Successfully simulated FCM message sending to:", parentToken);
      res.status(200).json({ success: true, messageId: "simulated_message_id_" + Date.now() });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  app.post("/api/notifications/check-deadlines", async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1e3;
      const { studentFinancials } = req.body;
      if (!studentFinancials || !Array.isArray(studentFinancials)) {
        return res.status(400).json({ error: "\u064A\u0644\u0632\u0645 \u0625\u0631\u0633\u0627\u0644 \u0642\u0627\u0626\u0645\u0629 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A\u0629" });
      }
      let sentCount = 0;
      for (const student of studentFinancials) {
        if (!student.nextInstallmentDate || !student.parentDeviceId) continue;
        const dueDate = new Date(student.nextInstallmentDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        if (timeDiff > 0 && timeDiff <= threeDaysInMs && student.remainingAmount > 0) {
          const message = {
            notification: {
              title: "\u062A\u0630\u0643\u064A\u0631 \u0645\u0627\u0644\u064A \u0645\u0646 \u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u{1F514}",
              body: `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u0646\u0648\u062F \u062A\u0630\u0643\u064A\u0631\u0643\u0645 \u0628\u0627\u0642\u062A\u0631\u0627\u0628 \u0645\u0648\u0639\u062F \u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0642\u0627\u062F\u0645 \u0644\u0644\u0637\u0627\u0644\u0628 ${student.name}.`
            },
            token: student.parentDeviceId,
            data: {
              type: "INSTALLMENT_REMINDER",
              student_id: String(student.id)
            }
          };
          try {
            console.log(`Simulated reminder sent to parent of ${student.name}`);
            sentCount++;
          } catch (err) {
            console.error(`Failed to send reminder to ${student.name}:`, err);
          }
        }
      }
      res.status(200).json({ success: true, sentCount });
    } catch (error) {
      console.error("Error processing deadlines:", error);
      res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645" });
    }
  });
  app.post("/api/notify-attendance", async (req, res) => {
    const { parentUserId, studentId, status, date } = req.body;
    if (!parentUserId || !status) {
      return res.status(400).json({ error: "Missing parentUserId or status" });
    }
    try {
      const statusText = status === "absent" ? "\u063A\u0627\u0626\u0628" : "\u0645\u062A\u0623\u062E\u0631";
      const bodyText = `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u0646\u0648\u062F \u0625\u0639\u0644\u0627\u0645\u0643\u0645 \u0628\u0623\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u0642\u062F \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062D\u0627\u0644\u0629 ${statusText} \u0628\u062A\u0627\u0631\u064A\u062E ${date}.`;
      console.log(`Simulated notification: Student ${studentId} is ${status} on ${date}. Parent user: ${parentUserId}. Body: ${bodyText}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sending attendance notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  app.get("/api/ai/analytics", async (req, res) => {
    try {
      const docs = [];
      const totalRequests = docs.length;
      const cacheHits = docs.filter((d) => d.isCacheHit).length;
      const totalTime = docs.reduce((sum, d) => sum + (d.processingTimeMs || 0), 0);
      const avgTime = totalRequests > 0 ? totalTime / totalRequests : 0;
      res.json({
        totalRequests,
        cacheHits,
        savingsRatio: totalRequests > 0 ? cacheHits / totalRequests : 0,
        avgProcessingTimeMs: avgTime
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(3e3, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });
  server.keepAliveTimeout = 12e4;
  server.headersTimeout = 12e4;
}
startServer();
//# sourceMappingURL=server.cjs.map
