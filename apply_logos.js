const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function applyLogos(logoMap) {
  const schoolLogosDir = path.join(__dirname, 'public', 'school-logos');
  if (!fs.existsSync(schoolLogosDir)) fs.mkdirSync(schoolLogosDir, { recursive: true });

  for (const [schoolId, filename] of Object.entries(logoMap)) {
    const srcPath = path.join(__dirname, filename);
    if (!fs.existsSync(srcPath)) {
      console.error(`Source file not found: ${srcPath}`);
      continue;
    }
    const dstPng = path.join(schoolLogosDir, `${schoolId}.png`);
    const dstJpg = path.join(schoolLogosDir, `${schoolId}.jpg`);

    fs.copyFileSync(srcPath, dstJpg);
    await sharp(srcPath).png().toFile(dstPng);
    console.log(`✅ Applied receipt logo for ${schoolId}: ${filename} -> ${schoolId}.png & .jpg`);
  }
}

module.exports = { applyLogos };
