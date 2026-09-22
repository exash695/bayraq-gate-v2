const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

console.log("Endpoint:", R2_ENDPOINT);
console.log("Key ID Length:", R2_ACCESS_KEY_ID.length);
console.log("Secret Length:", R2_SECRET_ACCESS_KEY.length);

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

s3Client.send(new ListBucketsCommand({}))
  .then(res => console.log("Success! Buckets:", res.Buckets.map(b => b.Name)))
  .catch(err => console.error("Error connecting to R2:", err.message));
