import fs from "fs";

async function verifyAllHttp() {
  const data = JSON.parse(fs.readFileSync("scripts/audit_output.json", "utf8"));
  const { imageMap, videoMap, auditReport } = data;

  console.log(`\n=== VERIFYING HTTP 200 FOR ALL ${Object.keys(imageMap).length} IMAGE POSES & ${Object.keys(videoMap).length} VIDEO POSES ===`);

  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (const [key, pathUrl] of Object.entries(imageMap)) {
    const fullUrl = "http://localhost:3000/cdn" + pathUrl;
    try {
      const res = await fetch(fullUrl);
      if (res.status === 200) {
        successCount++;
      } else {
        failCount++;
        failures.push({ type: "IMAGE", key, pathUrl, status: res.status });
      }
    } catch (e) {
      failCount++;
      failures.push({ type: "IMAGE", key, pathUrl, error: e.message });
    }
  }

  for (const [key, pathUrl] of Object.entries(videoMap)) {
    const fullUrl = "http://localhost:3000/cdn" + pathUrl;
    try {
      const res = await fetch(fullUrl);
      if (res.status === 200) {
        successCount++;
      } else {
        failCount++;
        failures.push({ type: "VIDEO", key, pathUrl, status: res.status });
      }
    } catch (e) {
      failCount++;
      failures.push({ type: "VIDEO", key, pathUrl, error: e.message });
    }
  }

  console.log(`\nHTTP AUDIT SUMMARY:`);
  console.log(`✅ SUCCESS (HTTP 200): ${successCount}`);
  console.log(`❌ FAILURES         : ${failCount}`);

  if (failures.length > 0) {
    console.log("\nFAILURES LIST:");
    failures.forEach(f => console.log(`  [${f.type}] Key: "${f.key}" -> Path: "${f.pathUrl}" [Status: ${f.status || f.error}]`));
  }
}

verifyAllHttp();
