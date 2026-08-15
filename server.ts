import "dotenv/config";
import express from "express";
// Removed top-level vite import
import path from "path";
import { GoogleGenAI } from "@google/genai";

import rateLimit from "express-rate-limit";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import os from "os";
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let adminInitialized = false;
function getAdminDb() {
  if (!adminInitialized) {
    const apps = getApps();
    if (!apps.length) {
      try {
        initializeApp();
      } catch (e) {
        console.error("Firebase Admin initialization error:", e);
      }
    }
    adminInitialized = true;
  }
  return getFirestore();
}

import { AnalyticsManager } from "./src/server/ai/AnalyticsManager";
import { decisionEngine } from "./src/server/ai/DecisionEngine";

const upload = multer({ dest: os.tmpdir() });
const memoryUpload = multer({ storage: multer.memoryStorage() });

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "al-sadis-academy";

let s3Client: S3Client | null = null;
if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateContentWithRetry(
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  maxRetries = 5
) {
  const client = getGeminiClient();
  const modelsToTry = Array.from(new Set([
    params.model || "gemini-3.5-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
  ]));
  
  let lastError: any = null;
  
  for (const currentModel of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[Gemini Request] Model: ${currentModel}, Attempt: ${i + 1}/${maxRetries}`);
        const result = await client.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config
        });

        // Real-time AI Counter logging
        console.log(`[AI Call Success] Model: ${currentModel}, Timestamp: ${new Date().toISOString()}`);

        return result;
      } catch (error: any) {
        lastError = error;
        const errMsg = String(error.message || error || "");
        const isRateLimitOrUnavailable = 
          error.status === 429 || 
          error.code === 429 || 
          error.status === 503 ||
          error.code === 503 ||
          errMsg.includes('429') || 
          errMsg.includes('503') || 
          errMsg.includes('quota') || 
          errMsg.includes('limit') || 
          errMsg.includes('exceeded') || 
          errMsg.includes('RESOURCE_EXHAUSTED') || 
          errMsg.includes('overloaded') ||
          errMsg.includes('rate');
          
        if (isRateLimitOrUnavailable) {
          if (i < maxRetries - 1) {
            let delayMs = Math.min((i + 1) * 12000, 45000); // 12s, 24s, 36s, 45s
            if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
               delayMs = 30000;
            }
            console.warn(`[Gemini Rate-Limit/Overload] Retrying model ${currentModel} in ${delayMs}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            console.warn(`[Gemini Retries Exhausted] Model ${currentModel} failed after ${maxRetries} attempts. Trying fallback model if available...`);
          }
        } else {
          // If it's another error (e.g., bad request/invalid content), break immediately to try next model or throw
          console.error(`[Gemini Non-retryable error] Model ${currentModel} error:`, errMsg);
          break; 
        }
      }
    }
  }
  
  throw lastError;
}


// Rate limiter for redeem-code
const redeemCodeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'لقد تجاوزت الحد المسموح به من المحاولات. يرجى الانتظار قليلاً.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }));

  // Cloudflare R2 CDN Streaming Proxy with Local Fallback
  app.get('/cdn/*', async (req, res) => {
    const rawPath = req.params[0] || '';
    const relPath = rawPath.replace(/^\/+/, '');
    if (!relPath) return res.status(400).send('Missing media path');

    // Build candidate keys for R2 and local storage
    const candidates = [relPath];
    const baseName = relPath.split('/').pop() || '';
    const dirName = relPath.substring(0, relPath.lastIndexOf('/') + 1);

    // 1. Auto-mapping ONLY for school logos (logoX.jpg vs schoolX.jpg)
    if (dirName.includes('school-logos') || dirName.includes('schools') || relPath.includes('logo') || relPath.includes('school')) {
      const matchNum = baseName.match(/(\d+)\.(jpg|png|jpeg|webm|mp4)/i);
      if (matchNum) {
        const num = matchNum[1];
        const ext = matchNum[2];
        candidates.push(`${dirName}logo${num}.${ext}`);
        candidates.push(`${dirName}school${num}.${ext}`);
        candidates.push(`${dirName}cover${num}.${ext}`);
        candidates.push(`logo${num}.${ext}`);
        candidates.push(`school${num}.${ext}`);
        if (ext.toLowerCase() === 'png' || ext.toLowerCase() === 'jpg' || ext.toLowerCase() === 'jpeg') {
          const altExt = ext.toLowerCase() === 'png' ? 'jpg' : 'png';
          candidates.push(relPath.replace(/\.(png|jpg|jpeg)$/i, `.${altExt}`));
          candidates.push(`${dirName}logo${num}.${altExt}`);
        }
      }
    }

    // 2. Mascot specific fallbacks if under mascot directory
    if (dirName.includes('mascot')) {
      // Try png <-> jpg
      if (relPath.endsWith('.png')) candidates.push(relPath.replace(/\.png$/i, '.jpg'));
      if (relPath.endsWith('.jpg')) candidates.push(relPath.replace(/\.jpg$/i, '.png'));
      // Fallback clean mascot images if specific sliced PNG is missing
      candidates.push('mascot/welcome.png');
      candidates.push('mascot/welcome.jpg');
      candidates.push('mascot/study.png');
      candidates.push('mascot/connect.png');
      candidates.push('mascot/achieve.png');
      candidates.push('mascot/launch.png');
      candidates.push('mascot/transit.png');
    }

    // 1. Check local public folder FIRST for instant, 100% reliable zero-latency serving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    for (const candidateKey of candidates) {
      const localFilePath = path.join(process.cwd(), 'public', candidateKey);
      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(localFilePath);
      }
    }

    // 2. Try fetching from Cloudflare R2 if not found locally
    if (s3Client && R2_BUCKET_NAME) {
      for (const candidateKey of candidates) {
        try {
          // Use a short timeout for S3 requests to prevent hanging
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 2000); // 2 second timeout

          const s3Res = await s3Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: candidateKey,
            Range: req.headers.range,
          }), { abortSignal: abortController.signal as any });
          
          clearTimeout(timeoutId);

          if (s3Res) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (s3Res.ContentType) res.setHeader('Content-Type', s3Res.ContentType);
            if (s3Res.ContentLength) res.setHeader('Content-Length', s3Res.ContentLength.toString());
            if (s3Res.ContentRange) {
              res.setHeader('Content-Range', s3Res.ContentRange);
              res.status(206);
            } else {
              res.status(200);
            }
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            if (s3Res.Body && typeof (s3Res.Body as any).pipe === 'function') {
              return (s3Res.Body as any).pipe(res);
            }
          }
        } catch (e) {
          // try next candidate
        }
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(404).send('Asset not found');
  });

  // Serve all static files from public folder (including mascots) directly from Express
  app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

  // --- BERQ MASCOT BINARY VERIFICATION & R2 SYNC APIs ---
  app.get("/api/mascot/verify", async (req, res) => {
    try {
      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        fs.mkdirSync(mascotDir, { recursive: true });
      }

      const files = fs.readdirSync(mascotDir);
      const fileResults = [];
      let allValid = true;

      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        // Strict binary Buffer reading (NO utf8 decoding!)
        const buf = fs.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        
        const isPng = fileName.toLowerCase().endsWith(".png");
        const isJpg = fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";

        let isValidHeader = false;
        if (isPng) {
          isValidHeader = headerHex === EXPECTED_PNG_HEADER;
        } else if (isJpg) {
          isValidHeader = headerHex.startsWith("FFD8FF");
        } else {
          isValidHeader = true; // Other binary assets
        }

        let metadata = null;
        let sharpError = null;
        try {
          metadata = await sharp(filePath).metadata();
        } catch (err: any) {
          sharpError = err.message || "Failed to parse image dimensions";
          allValid = false;
        }

        const isHealthy = isValidHeader && metadata !== null && !sharpError;
        if (!isHealthy) allValid = false;

        fileResults.push({
          fileName,
          url: `/mascot/${fileName}?v=${stat.mtimeMs}`,
          sizeBytes: stat.size,
          sizeKb: (stat.size / 1024).toFixed(1),
          headerHex,
          expectedHeader: isPng ? EXPECTED_PNG_HEADER : isJpg ? "FFD8FFE0..." : "N/A",
          isValidHeader,
          width: metadata?.width || null,
          height: metadata?.height || null,
          format: metadata?.format || null,
          sharpError,
          isHealthy,
        });
      }

      return res.json({
        success: true,
        allValid: fileResults.length > 0 && allValid,
        totalFiles: fileResults.length,
        files: fileResults,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/verify:", err);
      return res.status(500).json({ error: err.message || "Failed to verify mascot files" });
    }
  });

  // Upload new original binary files directly without utf8 encoding or text processing
  app.post("/api/mascot/upload-binary", memoryUpload.array("files"), async (req: any, res: any) => {
    try {
      const files = req.files as any[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided for binary copy" });
      }

      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        fs.mkdirSync(mascotDir, { recursive: true });
      }

      const uploadedResults = [];

      for (const file of files) {
        const targetPath = path.join(mascotDir, file.originalname);

        // PURE BINARY COPY: Write raw buffer directly to disk (NO utf8 encoding)
        fs.writeFileSync(targetPath, file.buffer);

        // Verify PNG magic bytes & Sharp dimensions immediately
        const buf = fs.readFileSync(targetPath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        const isPng = file.originalname.toLowerCase().endsWith(".png");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";
        const isValidHeader = isPng ? headerHex === EXPECTED_PNG_HEADER : true;

        let meta = null;
        try {
          meta = await sharp(targetPath).metadata();
        } catch (e) {}

        uploadedResults.push({
          fileName: file.originalname,
          size: file.buffer.length,
          headerHex,
          isValidHeader,
          width: meta?.width || null,
          height: meta?.height || null,
          isHealthy: isValidHeader && meta !== null,
        });
      }

      return res.json({
        success: true,
        message: `Successfully copied ${files.length} files to public/mascot in pure binary mode`,
        files: uploadedResults,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/upload-binary:", err);
      return res.status(500).json({ error: err.message || "Failed to upload binary files" });
    }
  });

  // Re-link Cloudflare R2 only using verified healthy binary files
  app.post("/api/mascot/sync-r2", async (req, res) => {
    try {
      if (!s3Client || !R2_BUCKET_NAME) {
        return res.status(400).json({ error: "Cloudflare R2 is not configured on this server (missing environment variables)." });
      }

      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        return res.status(400).json({ error: "public/mascot directory does not exist" });
      }

      const files = fs.readdirSync(mascotDir);
      if (files.length === 0) {
        return res.status(400).json({ error: "No mascot files available to sync" });
      }

      // 1. Verify all files before uploading to R2
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const buf = fs.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();

        if (fileName.toLowerCase().endsWith(".png") && headerHex !== "89504E470D0A1A0A") {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} has invalid PNG magic bytes (${headerHex}). Only healthy binary files can be uploaded to R2.`
          });
        }

        try {
          await sharp(filePath).metadata();
        } catch (e: any) {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} cannot be read by Sharp (${e.message}). Fix binary corruption first.`
          });
        }
      }

      // 2. Upload verified healthy binary files to R2
      const syncedKeys: string[] = [];
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const fileBuffer = fs.readFileSync(filePath); // Raw binary buffer
        const key = `mascot/${fileName}`;
        const ext = path.extname(fileName).toLowerCase();
        const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";

        await s3Client.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }));
        syncedKeys.push(key);
      }

      return res.json({
        success: true,
        message: `Successfully uploaded ${syncedKeys.length} healthy binary mascot files to Cloudflare R2 bucket (${R2_BUCKET_NAME})`,
        syncedKeys,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/sync-r2:", err);
      return res.status(500).json({ error: err.message || "Failed to sync mascot files to Cloudflare R2" });
    }
  });

  app.post("/api/upload-url", async (req, res) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "Missing fileName or contentType" });
      }

      if (!s3Client || !R2_BUCKET_NAME) {
        return res.json({ local: true });
      }

      const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
      const publicUrl = rawPublicBase 
        ? `${rawPublicBase}/${key}` 
        : (R2_ENDPOINT ? `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}` : `/uploads/${key}`);

      res.json({ presignedUrl, key, publicUrl });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileName = req.file.originalname;
      const contentType = req.file.mimetype;
      const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '-')}`;

      if (!s3Client) {
        // Fallback to local storage in public/uploads
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const destinationPath = path.join(uploadsDir, key);
        
        // Use EXDEV safe copy and unlink fallback for cross-device moves
        try {
          fs.renameSync(req.file.path, destinationPath);
        } catch (renameError: any) {
          if (renameError.code === 'EXDEV') {
            fs.copyFileSync(req.file.path, destinationPath);
            fs.unlinkSync(req.file.path);
          } else {
            throw renameError;
          }
        }
        
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = (req.headers['x-frontend-origin'] as string) || process.env.APP_URL || `${protocol}://${host}`;
        const publicUrl = `${baseUrl}/uploads/${key}`;
        console.log(`[Upload Fallback] File saved locally. Direct absolute URL: ${publicUrl}`);
        return res.json({ key, publicUrl });
      }

      const fileStream = fs.createReadStream(req.file.path);
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Body: fileStream,
      });

      await s3Client.send(command);
      
      // Clean up temp file
      fs.unlinkSync(req.file.path);

      const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
      const publicUrl = rawPublicBase 
        ? `${rawPublicBase}/${key}` 
        : (R2_ENDPOINT ? `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}` : `/uploads/${key}`);

      res.json({ key, publicUrl });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/storage/status", (req, res) => {
    const isR2Configured = Boolean(s3Client && R2_BUCKET_NAME);
    res.json({
      provider: isR2Configured ? "cloudflare_r2" : "local_fallback",
      r2Configured: isR2Configured,
      bucket: isR2Configured ? R2_BUCKET_NAME : null,
      publicBaseUrl: (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '') || null,
      status: "ready"
    });
  });

  app.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrlStr = req.query.url as string;
      if (!videoUrlStr) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      // Determine absolute URL
      let absoluteUrl = videoUrlStr;
      if (videoUrlStr.startsWith("/")) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        absoluteUrl = `${protocol}://${host}${videoUrlStr}`;
      }

      console.log(`[Video Proxy] Requesting: ${absoluteUrl}`);

      // If it is a local file, stream it directly with Range support
      if (absoluteUrl.includes("/uploads/")) {
        const filename = absoluteUrl.split("/uploads/")[1]?.split("?")[0];
        if (filename) {
          const filePath = path.join(process.cwd(), "public", "uploads", filename);
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
            res.setHeader('Accept-Ranges', 'bytes');

            let mime = "video/mp4";
            const ext = path.extname(filename).toLowerCase();
            if (ext === '.webm') mime = 'video/webm';
            else if (ext === '.ogg') mime = 'video/ogg';

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

              const chunksize = (end - start) + 1;
              const fileStream = fs.createReadStream(filePath, { start, end });
              const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mime,
              };

              res.writeHead(206, head);
              fileStream.pipe(res);
              return;
            } else {
              const head = {
                'Content-Length': fileSize,
                'Content-Type': mime,
              };
              res.writeHead(200, head);
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }
      }

      // Serve remote URLs via server fetch with Range headers
      const rangeHeader = req.headers.range;
      const fetchHeaders: Record<string, string> = {};
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      const response = await fetch(absoluteUrl, {
        headers: fetchHeaders,
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Accept-Ranges', 'bytes');

      const contentType = response.headers.get('content-type') || 'video/mp4';
      res.setHeader('Content-Type', contentType);

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      res.status(response.status);

      if (response.body) {
        if (typeof (response.body as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of response.body as any) {
            res.write(chunk);
          }
        } else {
          const reader = (response.body as any).getReader();
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
    } catch (proxyError: any) {
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
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        checkUrl = `${protocol}://${host}${url}`;
      }

      console.log(`[Video Check Server] Checking direct URL: ${checkUrl}`);

      // 1. Physically check file if it is an uploaded local file
      let localExists = false;
      let fileLocationInfo = "رابط خارجي أو من سحابة خارجية";
      let localFileSizeText = "N/A";
      let localFileMime = "video/mp4";

      if (url.includes("/uploads/")) {
        try {
          const filename = url.split("/uploads/")[1];
          if (filename) {
            const rawFilename = filename.split("?")[0];
            const filePath = path.join(process.cwd(), "public", "uploads", rawFilename);
            localExists = fs.existsSync(filePath);
            if (localExists) {
              const stats = fs.statSync(filePath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              localFileSizeText = `${sizeInMB} MB (${stats.size} bytes)`;
              fileLocationInfo = `نعم، الملف موجود مادياً على القرص في المسار: ${filePath}`;
              
              const ext = path.extname(rawFilename).toLowerCase();
              if (ext === '.mp4') localFileMime = 'video/mp4';
              else if (ext === '.webm') localFileMime = 'video/webm';
              else if (ext === '.ogg') localFileMime = 'video/ogg';
              else if (ext === '.m3u8') localFileMime = 'application/x-mpegURL';
            } else {
              fileLocationInfo = `❌ الملف مفقود! لم يتم العثور على أي ملف في المسار المحلي المتوقع: ${filePath}`;
            }
          }
        } catch (err: any) {
          console.error("[Video Check Server] Error during physical file check:", err);
          fileLocationInfo = `خطأ أثناء التحقق من مسار الملف: ${err.message}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(checkUrl, {
          method: 'HEAD',
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
      } catch (headError: any) {
        console.log(`[Video Check Server] HEAD request failed: ${headError.message || headError}. Falling back to GET with byte range.`);
        
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 8000);
        try {
          const response = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              Range: 'bytes=0-0'
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
        } catch (getError: any) {
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
    } catch (err: any) {
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

  // ----------------------------------------------------
  // Cloudflare Workers Gateway Middleware Proxy Routes
  // ----------------------------------------------------
  app.get("/api/worker/health", (req, res) => {
    res.json({
      status: "ok",
      gateway: "Cloudflare-Worker-Development-Proxy",
      provider: "gemini",
      r2Configured: Boolean(process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL),
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/worker/ai/chat", (req, res, next) => {
    req.url = "/api/gemini/chat";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/extract", (req, res, next) => {
    req.url = "/api/gemini/extract";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/radar", (req, res, next) => {
    req.url = "/api/gemini/radar";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/mock-exam", (req, res, next) => {
    req.url = "/api/generate-mock-exam";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/extract-questions", (req, res, next) => {
    req.url = "/api/extract-exam-questions";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/evaluate-homework", (req, res, next) => {
    req.url = "/api/evaluate-homework";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/ai/explain", (req, res, next) => {
    req.url = "/api/explain";
    app._router.handle(req, res, next);
  });

  app.post("/api/worker/upload-url", (req, res) => {
    const { fileName } = req.body;
    const cleanName = `${Date.now()}_${(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
    const publicUrl = rawPublicBase 
      ? `${rawPublicBase}/${cleanName}` 
      : `/uploads/${cleanName}`;

    res.json({
      presignedUrl: null,
      key: cleanName,
      publicUrl
    });
  });

  app.post("/api/worker/upload", upload.single('file'), (req, res, next) => {
    req.url = "/api/upload";
    app._router.handle(req, res, next);
  });

  app.post("/api/gemini/extract", async (req, res) => {
    const { base64Data, mimeType = "image/jpeg", extractedText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const cleanBase64 = base64Data.split(',')[1] || base64Data;
      
      const prompt = `
    أنت محلل بنية هيكلية (Structural Analyzer) ومحول عرض ذكي (Smart Presentation Converter).
    مهمتك هي قراءة نص الصفحة الأصلي وتحويله إلى كتل (Blocks) هيكلية بصرية، دون أي تغيير في النص الأصلي.
    
    القواعد الصارمة والنهائية (إياك مخالفتها):
    1. الحفاظ على المادة العلمية حرفياً (Word-for-Word) بنسبة 100%. يمنع التلخيص، يمنع إعادة الصياغة، يمنع الاختصار.
    2. التجاهل التام والحذف لأي (إعلانات، أرقام هواتف، معرفات تليكرام، أسماء مطابع، وحسابات تواصل) لا تنتمي للمادة العلمية بصورة صافية.
    3. تقسيم النص المتبقي إلى كتل (Block) بحيث كل فقرة، مثال، ملاحظة، سؤال، تعليل، جدول، يتم وضعه في كائن JSON مستقل داخل مصفوفة \`structuredContent\`.
    4. يجب أن يبقى تسلسل الكتل مطابقاً تماماً لتسلسل الصفحة الأصلية من الأعلى للأسفل. لا دمج، ولا تقسيم عشوائي للأسطر.

    أنواع الكتل المدعومة في \`structuredContent\`:
    - "heading": للعناوين الرئيسية والفرعية المطولة.
    - "paragraph": للفقرات النصية العادية والشروحات والنقاط المترابطة.
    - "example": للأمثلة والتمارين الرياضية أو الحياتية.
    - "note": للملاحظات والتنبيهات.
    - "warning": للتحذيرات الوزارية أو التعاليل والنقاط الحرجة.
    - "question": للأسئلة المباشرة (سواء كانت وزارية أو أسئلة فصل).
    - "law": للقوانين أو القواعد الفيزيائية والرياضية.
    - "table": للجداول أو المقارنات (يمثل كصفوف من النصوص داخل \`items\`).
    - "vocabulary": لقوائم المفردات الإنكليزية ومعانيها (يجب استخلاص كائن \`vocabItems\` لها).

    ${extractedText ? `\n--- النص الأصلي الدقيق المستخرج آلياً ---\n${extractedText}\n-----------------------------------\nيجب ألا يضيع أي حرف علمي من هذا النص، انقله كما هو تماماً.` : ''}

    يجب أن يطابق الهيكل بصيغة JSON المخطط التالي بالضبط:
    {
      "pages": [
        {
          "pageNumber": 1,
          "title": "عنوان رئيسي للصفحة المطول",
          "subtitle": "عنوان فرعي أو وصف مبسط",
          "objectives": ["أهداف موجودة في الصفحة إن وجدت"],
          "coreConcepts": ["مفاهيم واسماء رئيسية في المفردات"],
          "structuredContent": [
            {
              "type": "heading" | "paragraph" | "example" | "note" | "warning" | "question" | "law" | "table" | "vocabulary",
              "title": "عنوان اختياري للكتلة (مثال: مثال 1، ملاحظة هامة)",
              "content": "النص الأصلي الحرفي الكامل للكتلة (اجباري لجميع الانواع ما عدا الجداول والمفردات الانكليزية)",
              "items": ["تستخدم في حال القوائم أو الجداول كنصوص مصفوفة"],
              "vocabItems": [{"en": "الكلمة بالانكليزية", "ar": "الترجمة بالعربية"}]
            }
          ],
          "integrityWarning": "رسالة تحذيرية صريحة إذا تم العثور على نقص مقارنة بالنص الأصلي، أو ترك فارغاً.",
          "quiz": [
             {
               "type": "mcq",
               "question": "يجب توليد 5 إلى 8 أسئلة متنوعة هنا من محتوى الصفحة لتوفير تجربة سريعة ومتجددة كل مرة يُفتح فيها تحدي 60 ثانية للمستخدم.",
               "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
               "correct": 0,
               "explanation": "تفسير سريع للإجابة الصحيحة"
             }
          ],
          "ministerialQuestions": [
            {
              "question": "نص السؤال الوزاري كما ورد بحرفيته إذا توفر",
              "answer": "الجواب التوضيحي للسؤال",
              "years": "السنوات او الادوار التي ورد فيها"
            }
          ],
          "passes": []
        }
      ]
    }
  `;

      const fullPrompt = prompt + "\nملاحظة هامة جدا: تأكد من تضمين 5 أسئلة اختيار من متعدد في قسم quiz تحديدا!";

      const parsedResults = await decisionEngine.process({
        prompt: fullPrompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: 'json',
        endpointName: 'extract',
        extractedText
      });

      // parsedResults can be array of extractedBlocks or object. Our JsonParser returns array.
      let extObj = Array.isArray(parsedResults) ? parsedResults[0] : parsedResults;
      
      if (extObj && extObj.pages && extractedText) {
          const originalWordCount = extractedText.trim().split(/\s+/).length;
          let extractedWordCount = 0;
          extObj.pages.forEach((p: any) => {
            if (p.integrityWarning) {
                console.warn(`[Integrity AI Warning on Page ${p.pageNumber}]`, p.integrityWarning);
            }
            if (p.structuredContent) {
                p.structuredContent.forEach((block: any) => {
                  if (block.content) extractedWordCount += block.content.trim().split(/\s+/).length;
                });
            }
          });
          const diffRatio = Math.abs(originalWordCount - extractedWordCount) / Math.max(originalWordCount, 1);
          if (diffRatio > 0.15) {
            console.warn(`[Integrity Validation Failed] Detected large difference between original content length (${originalWordCount} words) and extracted structured content length (${extractedWordCount} words). Total diff ratio: ${(diffRatio*100).toFixed(2)}%.`);
          } else {
            console.log(`[Integrity Validation Passed] Word count diff ratio: ${(diffRatio*100).toFixed(2)}%`);
          }
      }

      let finalPages: any[] = [];
      const blocks = Array.isArray(parsedResults) ? parsedResults : [parsedResults];
      blocks.forEach((block: any) => {
         if (block && block.pages && Array.isArray(block.pages)) {
           finalPages = finalPages.concat(block.pages);
         } else if (block && !block.pages) {
           finalPages.push(block);
         }
      });

      if (finalPages.length === 0) {
        throw new Error("لم يتمكن الذكاء الاصطناعي من استخراج أي بيانات قابلة للاستخدام.");
      }

      res.json({ pages: finalPages });
    } catch (error: any) {
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
      const parsedResults = await decisionEngine.process({
        prompt: `
        بناءً على المحتوى التالي، استنتج 3 أسئلة ذكية وعميقة (أسئلة استنتاجية) للطلاب.
        المحتوى:
        ${content}
        
        أرجع النتيجة كقائمة نصية بسيطة باللغة العربية.
      `,
        endpointName: 'radar',
        responseFormat: 'text'
      });
      
      const text = typeof parsedResults === 'string' ? parsedResults : (parsedResults?.text || "");
      res.json({ questions: text.split('\n').filter(line => line.trim().length > 0) });
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
        أنت واضع أسئلة امتحانات وزارة التربية العراقية لمرحلة السادس الإعدادي.
        بناءً على محتوى الملزمة التالي والمادة الدراسية: [${subject || 'عام'}]، قم بتوليد امتحان تجريبي شامل يتكون من 20 سؤالاً متنوعاً.
        المحتوى المتاح من الملزمة:
        ${content || "لا يوجد محتوى محدد، يرجى توليد أسئلة نموذجية عامة في مادة " + (subject || "الفيزياء")}
        
        شروط توليد الأسئلة:
        1. يجب أن يكون العدد الإجمالي 20 سؤالاً متنوعاً (اختيارات، صح وخطأ، فراغات، تعاليل، تعاريف، تعداد) مصاغة بطريقة الاختيار من متعدد.
        2. أن تكون أسئلة ذكية واستنتاجية من وحي المنهج العراقي الرسمي حصراً وبأسلوب وزاري.
        3. للصح والخطأ: اجعل الخيارات ["صح", "خطأ"]. للتعاليل/التعاريف/التعداد: اجعل الجواب الصحيح أحد الخيارات واصنع ثلاثة خيارات أخرى مموهة ومقاربة.
        4. أن ترفق كل سؤال بـ "التفسير الوزاري الدقيق والعميق" (explanation) باللغة العربية لشرح سبب الإجابة الصحيحة.
        5. أن تعود بالنتيجة كـ مصفوفة JSON صالحة حصراً (valid JSON array of objects) دون أي كلام خارجي أو تغليف ماركداون. الهيكل المطلوب:
        [
          {
            "id": 1,
            "text": "نص السؤال هنا... (مثال: علل: كذا كذا، أو عرف: كذا كذا)",
            "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
            "correctAnswer": 0,
            "explanation": "التفسير الأكاديمي التفصيلي..."
          }
        ]
      `;

      const parsedQuestions = await decisionEngine.process({
        prompt,
        endpointName: 'mock-exam',
        responseFormat: 'json'
      });

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
      const cleanBase64 = base64Data.split(',')[1] || base64Data;
      
      const prompt = `
        قم بقراءة هذه الورقة المكتوبة أو المطبوعة والتي تحتوي على أسئلة امتحانية.
        المهمة الأساسية والأهم هي استخراج **كل الأسئلة وجميع الأفرع والنقاط الفرعية** حرفياً كما هي مكتوبة في الورقة، وعدم إهمال أي سؤال أو فرع.
        لا تهتم كثيراً بتصنيف نوع السؤال إذا كان ذلك سيؤدي إلى فقدان بعض الأسئلة أو تعقيد الاستخراج. اجعل نوع السؤال "custom" (مخصص) افتراضياً لجميع الأسئلة والأفرع المستخرجة، وضع نص السؤال كاملاً في حقل "text". 
        يمكنك تقييم درجة الصعوبة تقريبياً.
        
        أرجع النتيجة حصراً كمصفوفة JSON صالحة بالهيكل التالي (بدون أي علامات ماركداون إضافية أو نصوص خارج الـ JSON):
        [
          {
            "text": "نص السؤال والفرع كاملاً...", 
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
        responseFormat: 'json',
        endpointName: 'extract-questions'
      });

      res.json({ questions: Array.isArray(parsed) ? parsed : [parsed] });
    } catch (error: any) {
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
      أنت مقيّم تربوي ذكي وناقد مبدع في منصة الأستاذ التعليمية.
      مهمتك هي تقييم إجابة الطالب على الواجب الدراسي التالي بشكل تلقائي وعادل.
      
      عنوان الواجب: "${taskTitle}"
      إجابة الطالب:
      "${content}"
      
      المطلوب منك هو:
      1. تقييم جودة الإجابة تربوياً وعلمياً وكتابة تغذية راجعة مفصلة، ودودة، ومشجعة للطالب (باللغة العربية).
      2. احتساب نقاط خبرة (XP / Points) يستحقها الطالب بناءً على جودة وعمق إجابته:
         - إجابة ممتازة ومثالية: من 80 إلى 100 نقطة.
         - إجابة جيدة جداً أو جيدة: من 50 إلى 79 نقطة.
         - إجابة مقبولة أو تحتاج تطوير: من 20 إلى 49 نقطة.
      3. تحديد ما إذا كان الطالب يستحق وساماً شرفياً مميزاً بناءً على تميزه:
         - "honor_mid" (نجم الشهر 🌟): إذا كانت الإجابة نموذجية مذهلة وتفوق التوقعات بشكل كامل.
         - "star" (نجم الأسبوع ⭐): إذا كانت الإجابة إبداعية وتفاعلية جداً وبها فكر مميز.
         - "progress" (تطور ملحوظ 🎯): إذا بذل الطالب جهداً كبيراً جداً في الكتابة والشرح حتى وإن لم يكن خبيراً.
         - "discipline" (وسام الانضباط 🔥): إذا كانت الإجابة منظمة ومرتبة بدقة متناهية والتزمت بجميع عناصر السؤال.
         - null: إذا كانت الإجابة اعتيادية جيدة ولكنها لا تستحق وساماً شرفياً خاصاً في الوقت الحالي.

      يجب أن تكون المخرجات بصيغة JSON تماماً بالمواصفات التالية:
      {
        "points": number,
        "feedback": "string (التغذية الراجعة باللغة العربية)",
        "badge": "string or null"
      }
      `;

      const evaluation = await decisionEngine.process({
        prompt,
        endpointName: 'evaluate-homework',
        responseFormat: 'json'
      });

      // Ensure points is a valid number
      let points = Number(evaluation.points);
      if (isNaN(points) || points < 0) points = 50;
      if (points > 100) points = 100;

      res.json({
        success: true,
        pointsAwarded: points,
        feedback: evaluation.feedback,
        badgeAwarded: evaluation.badge || null
      });

    } catch (error: any) {
      console.error("Error evaluating homework via Gemini:", error);
      res.status(500).json({ error: "Failed to evaluate homework", details: error.message });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    const { context, message, history = [], imageUrl, fileUrls = [] } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const fileParts: any[] = [];
    const urlsToProcess = [];
    if (imageUrl) urlsToProcess.push(imageUrl);
    if (Array.isArray(fileUrls)) urlsToProcess.push(...fileUrls);

    for (const url of urlsToProcess) {
      try {
        const fileRes = await fetch(url);
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let mimeType = fileRes.headers.get("content-type") || "application/octet-stream";
        
        if (url.toLowerCase().endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (url.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        }
        
        const supportedPrefixes = ['image/', 'audio/', 'video/', 'application/pdf', 'text/'];
        const isSupported = supportedPrefixes.some(prefix => mimeType.startsWith(prefix));
        
        if (!isSupported) {
          throw new Error(`نوع الملف غير مدعوم من قبل الذكاء الاصطناعي: ${mimeType}. يرجى رفع ملفات PDF أو صور فقط.`);
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
      أنت مساعد ذكي لمنصة تعليمية.
      مهمتك هي الإجابة على أسئلة الطلاب بناءً حصراً على المحتوى الدراسي المقدم لك أدناه.
      المحتوى الدراسي للصفحة الحالية:
      ${context}

      قواعد العمل:
      1. أجب باللغة العربية الفصحى وبأسلوب تعليمي مشجع.
      2. إذا كان السؤال عن "هذه الصفحة" أو "الملزمة"، اعتمد فقط على المحتوى المذكور أو الصورة المرفقة.
      3. إذا طلب تلخيص الصفحة، قم بتقديم ملخص ذكي ومنظم ومختصر.
      4. إذا طلب إنشاء اختبار أو أسئلة، قم بتوليد الأسئلة من هذا المحتوى.
      5. كن دقيقاً، ووضح المعلومات بشكل يسهل فهمه.
    `;

    const parsedHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
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
              systemInstruction,
            },
            history: parsedHistory
          });

          let parts: any[] = [{ text: message }];
          if (fileParts.length > 0) {
            parts = [...fileParts, ...parts];
          }

          return await chat.sendMessage({ message: parts as any });
        } catch (error: any) {
          if (i === maxRetries - 1) throw error;
          
          const errMsg = String(error.message || error || "");
          const isRateLimitOrUnavailable = 
            error.status === 429 || 
            error.code === 429 || 
            error.status === 503 ||
            error.code === 503 ||
            errMsg.includes('429') || 
            errMsg.includes('503') || 
            errMsg.includes('quota') || 
            errMsg.includes('limit') || 
            errMsg.includes('exceeded') || 
            errMsg.includes('RESOURCE_EXHAUSTED') || 
            errMsg.includes('overloaded') ||
            errMsg.includes('rate');
            
          if (isRateLimitOrUnavailable) {
            let delayMs = Math.min((i + 1) * 10000, 30000); // 10s, 20s, 30s
            if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
               delayMs = 30000;
            }
            console.warn(`Retrying chat message due to rate-limit/quota (Attempt ${i + 1}/${maxRetries}) in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
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
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  app.post("/api/log-error", (req, res) => {
    console.error("FRONTEND ERROR LOG:", req.body);
    res.json({ success: true });
  });

  // API routes
  app.post("/api/explain", async (req, res) => {
    const { questionText } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const parsedResults = await decisionEngine.process({
        prompt: `Explain why the answer to "${questionText}" is wrong and provide the correct answer in Arabic.`,
        endpointName: 'explain',
        responseFormat: 'text'
      });
      const text = typeof parsedResults === 'string' ? parsedResults : (parsedResults?.text || "");
      res.json({ explanation: text });
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
      res.json({ success: true, message: 'تم تفعيل الاشتراك في بوابة بيرق بنجاح!' });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ error: 'حدث خطأ أثناء تفعيل الكود' });
    }
  });

  // Webhook endpoint for payment notifications
  app.post("/api/webhook/payment", async (req, res) => {
    const sig = req.headers['x-payment-signature']; // This header depends on the payment gateway
    
    // TODO: Verify signature here using a secret from process.env.PAYMENT_WEBHOOK_SECRET
    // if (!verifySignature(req.body, sig, process.env.PAYMENT_WEBHOOK_SECRET)) {
    //   return res.status(400).send('Webhook signature verification failed.');
    // }

    const { userId, courseId, status } = req.body;

    if (status === 'success') {
      try {
        console.log(`Subscription activated for user ${userId} and course ${courseId}`);
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Error activating subscription via webhook:", error);
        res.status(500).json({ error: 'Failed to activate subscription' });
      }
    } else {
      res.status(200).json({ received: true, message: 'Payment not successful' });
    }
  });

  // User provided Node.js notification logic
  app.post("/api/notifications/notify-parent-payment", async (req, res) => {
    const { parentToken, amount, receiptId } = req.body;
    
    if (!parentToken || !amount) {
      return res.status(400).json({ error: 'Missing parentToken or amount' });
    }

    const message = {
      notification: {
        title: 'تم تأكيد الدفع ✅',
        body: `عزيزي ولي الأمر، تم استلام مبلغ ${amount} د.ع بنجاح وصدر وصلكم الرقمي.`
      },
      token: parentToken,
      data: {
        type: 'PAYMENT_CONFIRMED',
        receipt_id: receiptId || 'REC-UNKNOWN'
      }
    };

    try {
      // In a real environment with FCM enabled, this would be: await admin.messaging().send(message)
      // Since FCM is not enabled in this AI Studio preview project, we mock the success response.
      console.log('Successfully simulated FCM message sending to:', parentToken);
      res.status(200).json({ success: true, messageId: 'simulated_message_id_' + Date.now() });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // فحص المواعيد النهائية للأقساط وتذكير أولياء الأمور
  app.post("/api/notifications/check-deadlines", async (req, res) => {
    try {
      const today = new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      
      const { studentFinancials } = req.body; 

      if (!studentFinancials || !Array.isArray(studentFinancials)) {
        return res.status(400).json({ error: 'يلزم إرسال قائمة ببيانات الطلاب المالية' });
      }

      let sentCount = 0;

      for (const student of studentFinancials) {
        if (!student.nextInstallmentDate || !student.parentDeviceId) continue;

        const dueDate = new Date(student.nextInstallmentDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        
        if (timeDiff > 0 && timeDiff <= threeDaysInMs && student.remainingAmount > 0) {
          const message = {
            notification: {
              title: "تذكير مالي من بوابة بيرق 🔔",
              body: `عزيزي ولي الأمر، نود تذكيركم باقتراب موعد القسط القادم للطالب ${student.name}.`
            },
            token: student.parentDeviceId,
            data: {
              type: 'INSTALLMENT_REMINDER',
              student_id: String(student.id)
            }
          };

          try {
            // Simulated FCM push for the preview environment
            console.log(`Simulated reminder sent to parent of ${student.name}`);
            sentCount++;
          } catch (err) {
            console.error(`Failed to send reminder to ${student.name}:`, err);
          }
        }
      }

      res.status(200).json({ success: true, sentCount });
    } catch (error) {
      console.error('Error processing deadlines:', error);
      res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
  });

  app.post("/api/notify-attendance", async (req, res) => {
    const { parentUserId, studentId, status, date } = req.body;

    if (!parentUserId || !status) {
      return res.status(400).json({ error: 'Missing parentUserId or status' });
    }

    try {
      const statusText = status === 'absent' ? 'غائب' : 'متأخر';
      const bodyText = `عزيزي ولي الأمر، نود إعلامكم بأن الطالب قد تم تسجيل حالة ${statusText} بتاريخ ${date}.`;
      
      console.log(`Simulated notification: Student ${studentId} is ${status} on ${date}. Parent user: ${parentUserId}. Body: ${bodyText}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.get("/api/ai/analytics", async (req, res) => {
    try {
      const logs = AnalyticsManager.getLogs();
      const totalRequests = logs.length;
      
      if (totalRequests === 0) {
        return res.json({
          totalRequests: 0,
          cacheHits: 0,
          savingsRatio: 0,
          avgProcessingTimeMs: 0,
          modelStats: [],
          endpointStats: [],
          timeSeries: []
        });
      }

      const cacheHits = logs.filter(d => d.isCacheHit).length;
      const totalTime = logs.reduce((sum, d) => sum + (Number(d.processingTimeMs) || 0), 0);
      const avgTime = totalRequests > 0 ? totalTime / totalRequests : 0;
      
      // Group by model
      const modelStats = logs.reduce((acc: any, d) => {
        const model = d.model || 'unknown';
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {});

      // Group by endpoint
      const endpointStats = logs.reduce((acc: any, d) => {
        const endpoint = d.endpoint || 'unknown';
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {});

      // Group by date
      const timeSeriesMap = logs.reduce((acc: any, d) => {
        const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString() : 'unknown';
        acc[date] = acc[date] || { date, requests: 0, cacheHits: 0 };
        acc[date].requests++;
        if (d.isCacheHit) acc[date].cacheHits++;
        return acc;
      }, {});

      res.json({ 
         totalRequests, 
         cacheHits, 
         savingsRatio: cacheHits / totalRequests,
         avgProcessingTimeMs: avgTime,
         modelStats: Object.entries(modelStats).map(([name, value]) => ({ name, value })),
         endpointStats: Object.entries(endpointStats).map(([name, value]) => ({ name, value })),
         timeSeries: Object.values(timeSeriesMap).reverse()
      });
    } catch (e: any) {
      console.error("Analytics Endpoint Error:", e);
      res.json({ 
        totalRequests: 0, cacheHits: 0, savingsRatio: 0, avgProcessingTimeMs: 0,
        modelStats: [], endpointStats: [], timeSeries: [], error: e.message 
      });
    }
  });

  // Error handling middleware to prevent HTML error responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(3000, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });
  
  // Increase timeouts to prevent TCP keep-alive race conditions during 6-second batch delays
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 120000; // 2 minutes
}

startServer().catch(err => {
  console.error("Fatal server startup error:", err);
});
