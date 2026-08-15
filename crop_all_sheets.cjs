const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MASCOT_DIR = path.join(PUBLIC_DIR, 'mascot');

if (!fs.existsSync(MASCOT_DIR)) {
  fs.mkdirSync(MASCOT_DIR, { recursive: true });
}

/**
 * Automatically detects the background color of an image by sampling its corners
 * and returns the RGB values of the background.
 */
async function detectBackgroundColor(imageInstance) {
  const { data, info } = await imageInstance
    .raw()
    .toBuffer({ resolveWithObject: true });

  const corners = [
    { r: data[0], g: data[1], b: data[2] }, // top-left
    { r: data[(info.width - 1) * 4], g: data[(info.width - 1) * 4 + 1], b: data[(info.width - 1) * 4 + 2] }, // top-right
  ];

  // Average them
  const avgR = Math.round((corners[0].r + corners[1].r) / 2);
  const avgG = Math.round((corners[0].g + corners[1].g) / 2);
  const avgB = Math.round((corners[0].b + corners[1].b) / 2);

  return { r: avgR, g: avgG, b: avgB };
}

/**
 * Removes the background color from an image buffer and trims any extra transparent edges.
 */
async function makeTransparentAndTrim(inputBuffer) {
  const image = sharp(inputBuffer);
  const { r: rBg, g: gBg, b: bBg } = await detectBackgroundColor(image);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 45; // Distance threshold for color similarity

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Euclidean distance in RGB space to background color
    const dist = Math.sqrt(
      Math.pow(r - rBg, 2) +
      Math.pow(g - gBg, 2) +
      Math.pow(b - bBg, 2)
    );

    // Also clear out extremely dark pixels (which correspond to dark navy/black background gradients)
    const isVeryDark = r < 30 && g < 40 && b < 70;

    if (dist < threshold || isVeryDark) {
      data[i + 3] = 0; // Fully transparent
    }
  }

  // Convert raw pixels back to sharp and trim transparent borders
  const processedBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    }
  })
  .png()
  .trim() // Automatically crop empty transparent borders
  .toBuffer();

  return processedBuffer;
}

async function processSheet(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n------------------------------------------------------------`);
  console.log(`🎬 Processing sheet: ${fileName}...`);

  const image = sharp(filePath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;
  console.log(`📏 Original size: ${width}x${height}`);

  const base64Image = fs.readFileSync(filePath).toString('base64');

  const prompt = `
You are an expert image analysis assistant. Your job is to locate and return the bounding boxes for all the Bairaq mascot poses in this sheet image.
The image can contain different poses of an eagle/falcon mascot named Bairaq, with optional Arabic labels below them.
Find the precise bounding boxes enclosing each distinct pose (including its label if present).

Return a JSON array of objects. Each object must have:
- "name": English descriptive name of the pose (use lowercase with underscores, e.g. "face_happy", "rotation_front", "use_bus", "greet_welcome")
- "arabic_name": The Arabic name of the pose if written near it, otherwise a brief Arabic description of what the mascot is doing (e.g. "سعيد", "يلوح بيده", "مساعد الصف")
- "category": One of: "facial_expression", "rotation", "greeting", "in_app_use", "general_pose"
- "box_normalized": [ymin, xmin, ymax, xmax] as normalized coordinates on a 0-1000 scale. Where ymin is top, xmin is left, ymax is bottom, xmax is right.

Return ONLY a valid JSON array, surrounded by \`\`\`json and \`\`\`.
`;

  console.log('📡 Sending request to Gemini to locate poses...');
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text.trim();
    let poses;
    try {
      poses = JSON.parse(jsonText);
    } catch (e) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        poses = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON: ' + jsonText);
      }
    }

    console.log(`✨ Gemini located ${poses.length} poses on this sheet.`);
    const results = [];

    const prefix = path.basename(filePath, path.extname(filePath));

    for (const pose of poses) {
      try {
        const [ymin, xmin, ymax, xmax] = pose.box_normalized;
        
        // Convert normalized coordinates (0-1000) to actual pixels
        const left = Math.max(0, Math.floor((xmin / 1000) * width));
        const top = Math.max(0, Math.floor((ymin / 1000) * height));
        const cropWidth = Math.min(width - left, Math.ceil(((xmax - xmin) / 1000) * width));
        const cropHeight = Math.min(height - top, Math.ceil(((ymax - ymin) / 1000) * height));

        if (cropWidth <= 10 || cropHeight <= 10) {
          console.warn(`⚠️ Invalid box size for ${pose.name}, skipping.`);
          continue;
        }

        console.log(`   ✂️ Slicing pose: ${pose.name} (${pose.arabic_name})`);

        const croppedBuffer = await image
          .clone()
          .extract({ left, top, width: cropWidth, height: cropHeight })
          .toBuffer();

        // Make background transparent and auto-trim excess transparent padding
        const transparentBuffer = await makeTransparentAndTrim(croppedBuffer);

        const outFileName = `sliced_${prefix}_${pose.name}.png`;
        const outFilePath = path.join(MASCOT_DIR, outFileName);
        
        await sharp(transparentBuffer).toFile(outFilePath);
        console.log(`   ✅ Saved: /public/mascot/${outFileName}`);

        results.push({
          name: `${prefix}_${pose.name}`,
          arabicName: pose.arabic_name,
          category: pose.category,
          path: `/public/mascot/${outFileName}`,
          url: `/mascot/${outFileName}`
        });
      } catch (err) {
        console.error(`   ❌ Failed to crop ${pose.name}:`, err.message);
      }
    }

    return results;
  } catch (err) {
    console.error(`❌ Gemini request failed for sheet ${fileName}:`, err);
    return [];
  }
}

async function run() {
  console.log('🚀 Scanning /public for mascot sheets...');
  const files = fs.readdirSync(PUBLIC_DIR);
  
  // Find files that are PNG/JPG sheets (excluding logos and media)
  const sheetFiles = files.filter(f => {
    const nameLower = f.toLowerCase();
    const isImage = nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg');
    const isExcluded = f === 'logo.png' || f === 'school-logo.png';
    return isImage && !isExcluded;
  });

  if (sheetFiles.length === 0) {
    console.log('⚠️ No sheet files found in /public.');
    console.log('👉 Please upload your sheet files to /public/ (e.g. bairaq_sheet1.png, bairaq_sheet2.png) and run this script.');
    return;
  }

  console.log(`📂 Found ${sheetFiles.length} image sheets to process:`, sheetFiles);
  let allMascots = [];

  for (const f of sheetFiles) {
    const fullPath = path.join(PUBLIC_DIR, f);
    const mascots = await processSheet(fullPath);
    allMascots = allMascots.concat(mascots);
  }

  // Load existing manifest if present to preserve other sliced assets
  const manifestPath = path.join(MASCOT_DIR, 'manifest.json');
  let finalManifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const old = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // Merge by unique path
      const pathMap = new Map();
      old.forEach(item => pathMap.set(item.path, item));
      allMascots.forEach(item => pathMap.set(item.path, item));
      finalManifest = Array.from(pathMap.values());
    } catch (e) {
      finalManifest = allMascots;
    }
  } else {
    finalManifest = allMascots;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2), 'utf8');
  console.log(`\n🎉 Slicing completely finished! Sliced a total of ${allMascots.length} mascots.`);
  console.log(`📝 Sliced poses manifest saved at: /public/mascot/manifest.json`);
}

run();
