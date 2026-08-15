import fs from "fs";

async function testAllHardcodedPaths() {
  const code = fs.readFileSync("scripts/scan_hardcoded_images.js", "utf8");
  // Read paths from output or rerun
  const res = [];
  function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = dir + "/" + f;
      if (fs.statSync(full).isDirectory()) {
        if (f !== "node_modules" && f !== ".git") scan(full);
      } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
        const content = fs.readFileSync(full, "utf8");
        const matches = content.match(/["'`]\/.*?\.(?:png|jpg|jpeg|svg|webp|mp4)["'`]/gi);
        if (matches) {
          matches.forEach(m => res.push(m.replace(/["'`]/g, "")));
        }
      }
    }
  }
  scan("src");

  const uniquePaths = Array.from(new Set(res)).filter(p => !p.includes("${"));

  console.log(`Testing ${uniquePaths.length} unique hardcoded media paths...`);

  const failures = [];
  for (const p of uniquePaths) {
    const url = "http://localhost:3000/cdn" + p;
    try {
      const r = await fetch(url);
      if (r.status !== 200) {
        failures.push({ path: p, status: r.status });
      }
    } catch (e) {
      failures.push({ path: p, error: e.message });
    }
  }

  if (failures.length === 0) {
    console.log("✅ ALL HARDCODED PATHS RETURN HTTP 200 OK!");
  } else {
    console.log("❌ FAILURES:", failures);
  }
}

testAllHardcodedPaths();
