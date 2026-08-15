import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId: accessKeyId || "", secretAccessKey: secretAccessKey || "" },
});

async function runFullAudit() {
  console.log("=== STARTING FULL AUDIT OF ALL BERQ CHARACTER POSES AND MEDIA ===");

  // 1. Fetch all R2 keys
  let isTruncated = true;
  let continuationToken;
  const r2Keys = new Map();
  while (isTruncated) {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken }));
    (res.Contents || []).forEach(c => r2Keys.set(c.Key, c.Size));
    isTruncated = res.IsTruncated;
    continuationToken = res.NextContinuationToken;
  }
  console.log(`Total R2 Objects: ${r2Keys.size}`);

  // 2. Read BerqCharacterManager.tsx
  const code = fs.readFileSync("src/components/BerqCharacterManager.tsx", "utf8");

  // Extract IMAGE_MAP
  const imgMapMatch = code.match(/const MASCOT_IMAGE_MAP[^{]*=\{([^;]+)\};/s);
  // Extract VIDEO_MAP
  const vidMapMatch = code.match(/const MASCOT_VIDEO_MAP[^{]*=\{([^;]+)\};/s);

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

  console.log(`Found ${Object.keys(imgMap).length} pose keys in MASCOT_IMAGE_MAP`);
  console.log(`Found ${Object.keys(vidMap).length} pose keys in MASCOT_VIDEO_MAP`);

  const allPoseKeys = Array.from(new Set([...Object.keys(imgMap), ...Object.keys(vidMap)])).sort();

  console.log(`\n================ ALL POSES AUDIT MATRIX ================`);

  const auditResults = [];

  for (const poseKey of allPoseKeys) {
    const mappedImg = imgMap[poseKey];
    const mappedVid = vidMap[poseKey];

    // Check image match
    let imgStatus = 0;
    if (mappedImg) {
      try {
        const res = await fetch("http://localhost:3000/cdn" + mappedImg.replace(/\?.*$/, ""));
        imgStatus = res.status;
      } catch (e) { imgStatus = 500; }
    }

    // Check video match
    let vidStatus = 0;
    if (mappedVid) {
      try {
        const res = await fetch("http://localhost:3000/cdn" + mappedVid.replace(/\?.*$/, ""));
        vidStatus = res.status;
      } catch (e) { vidStatus = 500; }
    }

    // Check if there is a more exact filename in R2 matching poseKey
    const exactR2Matches = Array.from(r2Keys.keys()).filter(k => k.includes(poseKey));

    auditResults.push({
      poseKey,
      mappedImg,
      imgStatus,
      mappedVid,
      vidStatus,
      exactR2Matches
    });
  }

  for (const r of auditResults) {
    console.log(`\n----------------------------------------`);
    console.log(`POSE KEY: "${r.poseKey}"`);
    console.log(`  IMAGE IN CODE: ${r.mappedImg || "NONE"} [HTTP ${r.imgStatus}]`);
    console.log(`  VIDEO IN CODE: ${r.mappedVid || "NONE"} [HTTP ${r.vidStatus}]`);
    
    // Check if current mapped image key exists in R2
    const imgKeyInR2 = r.mappedImg ? r.mappedImg.replace(/^\/+/, "").replace(/\?.*$/, "") : "";
    const vidKeyInR2 = r.mappedVid ? r.mappedVid.replace(/^\/+/, "").replace(/\?.*$/, "") : "";
    
    console.log(`  Image in R2? ${r2Keys.has(imgKeyInR2) ? "YES (" + r2Keys.get(imgKeyInR2) + " B)" : "NO"}`);
    if (r.mappedVid) {
      console.log(`  Video in R2? ${r2Keys.has(vidKeyInR2) ? "YES (" + r2Keys.get(vidKeyInR2) + " B)" : "NO"}`);
    }

    if (r.exactR2Matches.length > 0) {
      console.log(`  Exact Pose Name Matches in R2:`, r.exactR2Matches);
    }
  }
}

runFullAudit();
