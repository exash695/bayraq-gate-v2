import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('Missing R2 environment variables!');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.json': return 'application/json';
    case '.svg': return 'image/svg+xml';
    case '.gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function migrate() {
  console.log('🚀 Fetching existing objects in Cloudflare R2 bucket...');
  let isTruncated = true;
  let continuationToken;
  const existingKeys = new Map();

  while (isTruncated) {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    }));
    (res.Contents || []).forEach(c => {
      existingKeys.set(c.Key, c.Size);
    });
    isTruncated = res.IsTruncated;
    continuationToken = res.NextContinuationToken;
  }

  console.log(`📦 Currently ${existingKeys.size} objects in R2 bucket.`);

  const publicDir = path.join(process.cwd(), 'public');
  const allFiles = getAllFiles(publicDir);
  console.log(`📂 Total local files in /public: ${allFiles.length}`);

  const filesToUpload = allFiles.filter(filePath => {
    const relKey = path.relative(publicDir, filePath).split(path.sep).join('/');
    const stat = fs.statSync(filePath);
    if (existingKeys.has(relKey) && existingKeys.get(relKey) === stat.size) {
      return false; // already uploaded and matches exact size
    }
    return true;
  });

  console.log(`⚡ Files remaining to upload: ${filesToUpload.length}`);

  let successCount = 0;
  let failCount = 0;
  const BATCH_SIZE = 8;

  for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
    const batch = filesToUpload.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (filePath) => {
      const relKey = path.relative(publicDir, filePath).split(path.sep).join('/');
      const mimeType = getMimeType(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      try {
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: relKey,
          Body: fileBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        const verifyRes = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: relKey,
        }));

        if (verifyRes.ContentLength && verifyRes.ContentLength > 0) {
          successCount++;
          console.log(`✅ Uploaded & Verified: ${relKey} (${(verifyRes.ContentLength / 1024).toFixed(1)} KB)`);
        } else {
          throw new Error('Verification returned 0 bytes');
        }
      } catch (err) {
        failCount++;
        console.error(`❌ Failed: ${relKey}`, err.message);
      }
    }));
  }

  console.log('\n========================================');
  console.log(`🎉 Cloudflare R2 Upload Finished!`);
  console.log(`✅ Total files in R2: ${allFiles.length - filesToUpload.length + successCount} / ${allFiles.length}`);
  console.log(`✅ Newly uploaded in this run: ${successCount}`);
  console.log(`❌ Failures: ${failCount}`);
  console.log('========================================\n');
}

migrate();
