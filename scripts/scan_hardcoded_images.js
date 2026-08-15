import fs from "fs";
import path from "path";

function findImageSrcs(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== ".git") results.push(...findImageSrcs(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((l, idx) => {
        if (l.includes("src=") || l.includes("getSchool") || l.includes("getImageUrl") || l.includes("/mascot/") || l.includes("/schools/") || l.includes("/school-logos/")) {
          results.push({ file: path.relative(process.cwd(), full), line: idx + 1, code: l.trim() });
        }
      });
    }
  }
  return results;
}

const res = findImageSrcs("src");
console.log(`Found ${res.length} potential image references.`);

const hardcodedPaths = new Set();
res.forEach(r => {
  const matches = r.code.match(/["'`]\/.*?\.(?:png|jpg|jpeg|svg|webp|mp4)["'`]/gi);
  if (matches) {
    matches.forEach(m => hardcodedPaths.add(m.replace(/["'`]/g, "")));
  }
});

console.log("\n--- HARDCODED IMAGE/MEDIA PATHS FOUND IN CODE ---");
Array.from(hardcodedPaths).sort().forEach(p => console.log(p));
