const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

console.log("\n=== اختبار الاتصال المباشر بـ R2 ===");
console.log("Endpoint Length:", R2_ENDPOINT ? R2_ENDPOINT.length : 0);
console.log("Access Key ID Length:", R2_ACCESS_KEY_ID.length);
console.log("Secret Access Key Length:", R2_SECRET_ACCESS_KEY.length);

if (R2_ACCESS_KEY_ID.includes("dummy")) {
    console.log("⚠️ تم الكشف عن مفتاح وهمي (dummy). لن يتم اختبار الاتصال الفعلي لتجنب الخطأ.");
} else {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    s3Client.send(new ListBucketsCommand({}))
      .then(res => console.log("✅ الاتصال ناجح. الدلاء المتاحة:", res.Buckets.map(b => b.Name)))
      .catch(err => console.error("❌ فشل الاتصال:", err.message));
}
