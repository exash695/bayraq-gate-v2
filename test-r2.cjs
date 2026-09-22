require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "al-sadis-academy";

console.log("R2_ENDPOINT:", R2_ENDPOINT);
console.log("R2_ACCESS_KEY_ID length:", R2_ACCESS_KEY_ID.length);
console.log("R2_SECRET_ACCESS_KEY length:", R2_SECRET_ACCESS_KEY.length);
console.log("R2_BUCKET_NAME:", R2_BUCKET_NAME);

if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCESS_KEY_ID !== "dummy_access_key") {
  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  console.log("S3Client initialized.");
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "test-upload.txt",
    Body: "Hello from test script",
    ContentType: "text/plain"
  });
  
  s3Client.send(command).then(res => {
    console.log("Upload successful:", res);
  }).catch(err => {
    console.error("Upload failed:", err);
  });
} else {
  console.log("Failed conditions to init S3Client");
}
