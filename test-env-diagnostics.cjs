console.log("=== التشخيص البيئي الآمن ===");
console.log("Environment Type:", process.env.NODE_ENV || "unknown");
console.log("Is AI Studio Container:", !!process.env.APPLET_ID);
console.log("K_REVISION:", process.env.K_REVISION || "none");

const keysToCheck = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_ACCESS_KEY",
  "R2_SECRET_ACCESS_KEY",
  "R2_SECRET_ACC",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_URL"
];

console.log("\n=== فحص المتغيرات في process.env ===");
for (const key of keysToCheck) {
  const val = process.env[key];
  if (!val) {
    console.log(`[${key}]: ❌ غير موجود (أو فارغ)`);
  } else {
    let safeVal = `${val.length} حرف`;
    if (val.includes("dummy") || val.includes("example") || val.includes("placeholder")) {
      safeVal += " ⚠️ (يحتوي على قيمة افتراضية/وهمية: dummy/example)";
    }
    if (key.includes("BUCKET") || key.includes("ENDPOINT") || key.includes("URL")) {
      safeVal = `موجود - طوله ${val.length} حرف. القيمة (مموهة جزئياً): ${val.substring(0, 10)}...`;
    }
    console.log(`[${key}]: ✅ موجود - الوصف: ${safeVal}`);
  }
}
