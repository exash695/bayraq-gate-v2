const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processUploadedAssets() {
  console.log('=== Processing Uploaded School Assets ===');
  
  const rootDir = process.cwd();
  const schoolsDir = path.join(rootDir, 'public', 'schools');
  const logosDir = path.join(rootDir, 'public', 'school-logos');

  if (!fs.existsSync(schoolsDir)) fs.mkdirSync(schoolsDir, { recursive: true });
  if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

  const files = fs.readdirSync(rootDir);

  for (let i = 1; i <= 8; i++) {
    const schoolId = `school${i}`;

    // 1. Check for Card/Mayadeen Image (e.g. school1_card.png, school1_card.jpg, school1_mayadeen.png)
    const cardPatterns = [
      `${schoolId}_card.png`, `${schoolId}_card.jpg`, `${schoolId}_card.jpeg`, `${schoolId}_card.webp`,
      `${schoolId}_mayadeen.png`, `${schoolId}_mayadeen.jpg`, `${schoolId}_banner.png`, `${schoolId}_banner.jpg`
    ];

    for (const pattern of cardPatterns) {
      if (fs.existsSync(pattern)) {
        console.log(`Found Mayadeen card for ${schoolId}: ${pattern}`);
        try {
          const buffer = await sharp(pattern)
            .resize(1200, 800, { fit: 'cover', position: 'center' })
            .png()
            .toBuffer();
          fs.writeFileSync(path.join(schoolsDir, `${schoolId}.png`), buffer);
          console.log(`--> Updated public/schools/${schoolId}.png successfully!`);
        } catch (err) {
          console.error(`Error processing ${pattern}:`, err.message);
        }
      }
    }

    // 2. Check for Receipt Logo (e.g. school1_logo.png, school1_logo.jpg, school1_receipt.png)
    const logoPatterns = [
      `${schoolId}_logo.png`, `${schoolId}_logo.jpg`, `${schoolId}_logo.jpeg`, `${schoolId}_logo.webp`,
      `${schoolId}_receipt.png`, `${schoolId}_receipt.jpg`
    ];

    for (const pattern of logoPatterns) {
      if (fs.existsSync(pattern)) {
        console.log(`Found Receipt logo for ${schoolId}: ${pattern}`);
        try {
          const buffer = await sharp(pattern)
            .resize(500, 500, { fit: 'cover', position: 'center' })
            .png()
            .toBuffer();
          fs.writeFileSync(path.join(logosDir, `${schoolId}.png`), buffer);
          console.log(`--> Updated public/school-logos/${schoolId}.png successfully!`);
        } catch (err) {
          console.error(`Error processing ${pattern}:`, err.message);
        }
      }
    }
  }
}

processUploadedAssets().catch(console.error);
