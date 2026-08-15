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

async function runMappingBuilder() {
  // 1. Fetch all R2 keys
  let isTruncated = true;
  let continuationToken;
  const r2Keys = new Set();
  while (isTruncated) {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken }));
    (res.Contents || []).forEach(c => r2Keys.add(c.Key));
    isTruncated = res.IsTruncated;
    continuationToken = res.NextContinuationToken;
  }

  const mascotR2Keys = Array.from(r2Keys).filter(k => k.startsWith("mascot/")).sort();
  console.log(`Found ${mascotR2Keys.length} mascot keys in R2.`);

  // 2. Read BerqCharacterManager.tsx
  const code = fs.readFileSync("src/components/BerqCharacterManager.tsx", "utf8");

  // Extract all pose types
  const typeMatch = code.match(/export type BerqPose =([^;]+);/s);
  let poseKeys = [];
  if (typeMatch) {
    poseKeys = typeMatch[1]
      .split("\n")
      .map(l => l.replace(/[^a-zA-Z0-9_]/g, "").trim())
      .filter(l => l.length > 0);
  }

  console.log(`Extracted ${poseKeys.length} BerqPose keys from type definition.`);

  const newImageMap = {};
  const newVideoMap = {};
  const auditReport = [];

  for (const poseKey of poseKeys) {
    // Search R2 keys for best match
    // Strategy:
    // 1. Exact match with poseKey suffix: e.g. poseKey "pose_waving_hand" -> "mascot/sliced_bairaq_sheet2_pose_waving_hand.png"
    // 2. Search by key name parts (e.g., "waving_hand", "broadcaster", "finance_officer")
    
    // Find png/jpg
    const matchingImages = mascotR2Keys.filter(k => (k.endsWith(".png") || k.endsWith(".jpg")) && k.includes(poseKey));
    const matchingVideos = mascotR2Keys.filter(k => k.endsWith(".mp4") && k.includes(poseKey));

    let bestImage = matchingImages[0] || "";
    let bestVideo = matchingVideos[0] || "";

    // Fallbacks if no exact poseKey string match
    if (!bestImage) {
      // Try core concept match
      const keyShort = poseKey.replace(/^pose_/, "").replace(/^face_/, "").replace(/^greeting_/, "").replace(/^in_app_use_/, "");
      const partialMatches = mascotR2Keys.filter(k => (k.endsWith(".png") || k.endsWith(".jpg")) && k.includes(keyShort));
      if (partialMatches.length > 0) {
        bestImage = partialMatches[0];
      }
    }

    if (!bestVideo) {
      const keyShort = poseKey.replace(/^pose_/, "").replace(/^face_/, "").replace(/^greeting_/, "").replace(/^in_app_use_/, "");
      const partialMatches = mascotR2Keys.filter(k => k.endsWith(".mp4") && k.includes(keyShort));
      if (partialMatches.length > 0) {
        bestVideo = partialMatches[0];
      }
    }

    // Default fallbacks if still empty
    if (!bestImage) {
      bestImage = "mascot/sliced_bairaq_sheet5_main_standing_pose.png";
    }

    const imgPath = "/" + bestImage;
    const vidPath = bestVideo ? "/" + bestVideo : "";

    newImageMap[poseKey] = imgPath;
    if (vidPath) {
      newVideoMap[poseKey] = vidPath;
    }

    auditReport.push({
      poseKey,
      imageFile: bestImage,
      videoFile: bestVideo,
      exactMatch: matchingImages.length > 0
    });
  }

  // Also check existing keys in MASCOT_IMAGE_MAP that might not be in type
  const imgMapMatch = code.match(/const MASCOT_IMAGE_MAP[^{]*=\{([^;]+)\};/s);
  if (imgMapMatch) {
    const lines = imgMapMatch[1].split("\n");
    for (const l of lines) {
      const match = l.match(/['"]?([a-zA-Z0-9_]+)['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (match && !newImageMap[match[1]]) {
        const k = match[1];
        const cleanVal = match[2].replace(/^\/+/, "");
        if (r2Keys.has(cleanVal)) {
          newImageMap[k] = match[2];
        }
      }
    }
  }

  // Write out the result
  fs.writeFileSync("scripts/audit_output.json", JSON.stringify({
    imageMap: newImageMap,
    videoMap: newVideoMap,
    auditReport
  }, null, 2));

  console.log("Audit complete! Results written to scripts/audit_output.json");
}

runMappingBuilder();
