import fs from "fs";

const data = JSON.parse(fs.readFileSync("scripts/audit_output.json", "utf8"));
const { imageMap, videoMap } = data;

let code = fs.readFileSync("src/components/BerqCharacterManager.tsx", "utf8");

// Generate clean JS object string for MASCOT_IMAGE_MAP
const imgLines = Object.entries(imageMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `    '${k}': '${v}',`)
  .join("\n");

// Generate clean JS object string for MASCOT_VIDEO_MAP
const vidLines = Object.entries(videoMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `    '${k}': '${v}',`)
  .join("\n");

// Replace getBerqImageUrl mapping object
const newGetBerqImageUrl = `export const getBerqImageUrl = (pose: BerqPose): string => {
  const videoMapping: Partial<Record<BerqPose, string>> = {
${vidLines}
  };

  const imageMapping: Record<BerqPose, string> = {
${imgLines}
  };

  // If a video pose exists, return video url unless fallback PNG is requested
  const videoUrl = videoMapping[pose];
  if (videoUrl) {
    return cdnService.getMediaUrl(videoUrl);
  }

  const rawUrl = imageMapping[pose] || imageMapping['standing_arms_crossed'] || '/mascot/sliced_bairaq_sheet5_main_standing_pose.png';
  return cdnService.getMediaUrl(rawUrl);
};`;

// Replace getBerqFallbackPngUrl
const newGetBerqFallbackPngUrl = `export const getBerqFallbackPngUrl = (pose: BerqPose): string => {
  const imageMapping: Record<BerqPose, string> = {
${imgLines}
  };

  const rawUrl = imageMapping[pose] || '/mascot/sliced_bairaq_sheet5_main_standing_pose.png';
  return cdnService.getMediaUrl(rawUrl);
};`;

// Find where getBerqImageUrl starts and ends
const imgUrlStart = code.indexOf("export const getBerqImageUrl =");
const imgUrlEnd = code.indexOf("export const getBerqFallbackPngUrl =");
const fallbackEnd = code.indexOf("export const BerqCharacter: React.FC");

if (imgUrlStart !== -1 && imgUrlEnd !== -1 && fallbackEnd !== -1) {
  const before = code.substring(0, imgUrlStart);
  const after = code.substring(fallbackEnd);
  const updatedCode = before + newGetBerqImageUrl + "\n\n" + newGetBerqFallbackPngUrl + "\n\n" + after;
  fs.writeFileSync("src/components/BerqCharacterManager.tsx", updatedCode);
  console.log("Successfully updated src/components/BerqCharacterManager.tsx!");
} else {
  console.error("Could not find replacement boundaries in BerqCharacterManager.tsx!");
}
