import fs from "fs";

async function verifyLiveBerqCharacterManager() {
  const code = fs.readFileSync("src/components/BerqCharacterManager.tsx", "utf8");

  // Extract all pose keys from type BerqPose
  const typeMatch = code.match(/export type BerqPose =([^;]+);/s);
  const poseKeys = typeMatch[1]
    .split("\n")
    .map(l => l.replace(/[^a-zA-Z0-9_]/g, "").trim())
    .filter(l => l.length > 0);

  console.log(`=== LIVE AUDIT OF BerqCharacterManager (${poseKeys.length} Poses) ===`);

  // Extract mappings from code
  const imgMapMatch = code.match(/const imageMapping: Record<BerqPose, string> = \{([^}]+)\};/s);
  const vidMapMatch = code.match(/const videoMapping: Partial<Record<BerqPose, string>> = \{([^}]+)\};/s);

  function parseMap(str) {
    const map = {};
    if (!str) return map;
    const lines = str.split("\n");
    for (const l of lines) {
      const match = l.match(/['"]?([a-zA-Z0-9_]+)['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (match) {
        map[match[1]] = match[2];
      }
    }
    return map;
  }

  const imgMap = parseMap(imgMapMatch ? imgMapMatch[1] : "");
  const vidMap = parseMap(vidMapMatch ? vidMapMatch[1] : "");

  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (const poseKey of poseKeys) {
    const imgPath = imgMap[poseKey];
    const vidPath = vidMap[poseKey];

    // Test Image
    if (imgPath) {
      const url = "http://localhost:3000/cdn" + imgPath;
      try {
        const res = await fetch(url);
        if (res.status === 200) {
          successCount++;
        } else {
          failCount++;
          failures.push({ poseKey, type: "IMAGE", path: imgPath, status: res.status });
        }
      } catch (e) {
        failCount++;
        failures.push({ poseKey, type: "IMAGE", path: imgPath, error: e.message });
      }
    } else {
      failCount++;
      failures.push({ poseKey, type: "IMAGE", path: "MISSING_IN_CODE", status: 404 });
    }

    // Test Video if present
    if (vidPath) {
      const url = "http://localhost:3000/cdn" + vidPath;
      try {
        const res = await fetch(url);
        if (res.status === 200) {
          successCount++;
        } else {
          failCount++;
          failures.push({ poseKey, type: "VIDEO", path: vidPath, status: res.status });
        }
      } catch (e) {
        failCount++;
        failures.push({ poseKey, type: "VIDEO", path: vidPath, error: e.message });
      }
    }
  }

  console.log(`\nFINAL LIVE VERIFICATION RESULTS:`);
  console.log(`✅ SUCCESS (HTTP 200 OK) : ${successCount}`);
  console.log(`❌ FAILURES              : ${failCount}`);

  if (failures.length === 0) {
    console.log(`\n🎉 PERFECT 100% SUCCESS! ALL BERQ POSES AND VIDEOS RETURN HTTP 200 OK!`);
  } else {
    console.log("\nFAILURES:", failures);
  }
}

verifyLiveBerqCharacterManager();
