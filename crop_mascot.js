import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MASCOT_DIR = path.join(PUBLIC_DIR, 'mascot');

// Ensure output directory exists
if (!fs.existsSync(MASCOT_DIR)) {
  fs.mkdirSync(MASCOT_DIR, { recursive: true });
}

/**
 * Remove solid white background from an image buffer and make it transparent.
 * Also trims extra whitespace around the mascot.
 */
async function removeWhiteBackgroundAndTrim(inputBuffer) {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Could not get image dimensions');
  }

  // Get raw pixel data to modify the alpha channel
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 245; // Threshold for white color detection
  
  // Create a new buffer with transparent white pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // If the pixel is very close to white, make it transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0; // Set alpha to 0 (fully transparent)
    }
  }

  // Convert raw pixels back to sharp instance, trim extra transparency, and save as PNG
  const processedImageBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    }
  })
  .png()
  .trim() // Automatically crop empty transparent borders
  .toBuffer();

  return processedImageBuffer;
}

/**
 * Crop sheet of 6 mascot poses (3 rows, 2 columns)
 * Row 1: Left: Waving, Right: Reading & holding trophy
 * Row 2: Left: Bus Driver, Right: Winking & holding cup
 * Row 3: Left: Standing with shield, Right: Sleeping on pillow
 */
async function cropSheetPoses(filename) {
  const inputPath = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    return false;
  }

  console.log(`🎬 Slicing 6 main poses from ${filename}...`);
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  const w = metadata.width;
  const h = metadata.height;
  
  const colWidth = Math.floor(w / 2);
  const rowHeight = Math.floor(h / 3);

  const poses = [
    { name: 'waving', left: 0, top: 0, width: colWidth, height: rowHeight },
    { name: 'reading_trophy', left: colWidth, top: 0, width: colWidth, height: rowHeight },
    { name: 'bus_driver', left: 0, top: rowHeight, width: colWidth, height: rowHeight },
    { name: 'wink_cup', left: colWidth, top: rowHeight, width: colWidth, height: rowHeight },
    { name: 'shield', left: 0, top: rowHeight * 2, width: colWidth, height: rowHeight },
    { name: 'sleeping', left: colWidth, top: rowHeight * 2, width: colWidth, height: rowHeight },
  ];

  for (const pose of poses) {
    try {
      console.log(`   ✂️ Extracting pose: ${pose.name}...`);
      const croppedBuffer = await image
        .clone()
        .extract({ left: pose.left, top: pose.top, width: pose.width, height: pose.height })
        .toBuffer();

      const transparentBuffer = await removeWhiteBackgroundAndTrim(croppedBuffer);
      
      const outputPath = path.join(MASCOT_DIR, `mascot_${pose.name}.png`);
      await sharp(transparentBuffer).toFile(outputPath);
      console.log(`   ✅ Saved: /public/mascot/mascot_${pose.name}.png`);
    } catch (err) {
      console.error(`   ❌ Failed to crop ${pose.name}:`, err.message);
    }
  }
  return true;
}

/**
 * Crop sheet of student mascots (Image 7)
 * - Large student mascot on the left: W: ~42%, H: 100%
 * - Right grid of smaller student poses
 */
async function cropSheetStudents(filename) {
  const inputPath = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    return false;
  }

  console.log(`🎬 Slicing student mascot sheet from ${filename}...`);
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  const w = metadata.width;
  const h = metadata.height;

  // Let's crop the main large student on the left
  try {
    console.log(`   ✂️ Extracting main student mascot...`);
    const mainWidth = Math.floor(w * 0.42);
    const mainCropped = await image
      .clone()
      .extract({ left: 0, top: 0, width: mainWidth, height: h })
      .toBuffer();
    
    const mainTransparent = await removeWhiteBackgroundAndTrim(mainCropped);
    const mainOutputPath = path.join(MASCOT_DIR, `mascot_student_main.png`);
    await sharp(mainTransparent).toFile(mainOutputPath);
    console.log(`   ✅ Saved: /public/mascot/mascot_student_main.png`);
  } catch (err) {
    console.error(`   ❌ Failed to crop main student:`, err.message);
  }

  // Let's crop the sub-poses on the right grid (2 columns, 3 rows of small poses)
  const rightStart = Math.floor(w * 0.42);
  const rightWidth = w - rightStart;
  const colWidth = Math.floor(rightWidth / 3);
  const rowHeight = Math.floor(h / 2);

  const subPoses = [
    { name: 'student_thumbs_up', left: rightStart, top: 0, width: colWidth, height: rowHeight },
    { name: 'student_holding_book', left: rightStart + colWidth, top: 0, width: colWidth, height: rowHeight },
    { name: 'student_learning', left: rightStart + colWidth * 2, top: 0, width: colWidth, height: rowHeight },
    { name: 'student_greeting', left: rightStart, top: rowHeight, width: colWidth, height: rowHeight },
    { name: 'student_bell', left: rightStart + colWidth, top: rowHeight, width: colWidth, height: rowHeight },
    { name: 'student_celebrating', left: rightStart + colWidth * 2, top: rowHeight, width: colWidth, height: rowHeight },
  ];

  for (const pose of subPoses) {
    try {
      console.log(`   ✂️ Extracting student pose: ${pose.name}...`);
      const croppedBuffer = await image
        .clone()
        .extract({ left: pose.left, top: pose.top, width: pose.width, height: pose.height })
        .toBuffer();

      const transparentBuffer = await removeWhiteBackgroundAndTrim(croppedBuffer);
      
      const outputPath = path.join(MASCOT_DIR, `mascot_${pose.name}.png`);
      await sharp(transparentBuffer).toFile(outputPath);
      console.log(`   ✅ Saved: /public/mascot/mascot_${pose.name}.png`);
    } catch (err) {
      console.error(`   ❌ Failed to crop small pose ${pose.name}:`, err.message);
    }
  }
  return true;
}

async function run() {
  console.log('🚀 Checking for mascot sheet images in /public directory...');
  
  let processedAny = false;
  
  if (fs.existsSync(path.join(PUBLIC_DIR, 'sheet_poses.png'))) {
    const success = await cropSheetPoses('sheet_poses.png');
    if (success) processedAny = true;
  } else {
    console.log('ℹ️ sheet_poses.png not found. Skip.');
  }

  if (fs.existsSync(path.join(PUBLIC_DIR, 'sheet_students.png'))) {
    const success = await cropSheetStudents('sheet_students.png');
    if (success) processedAny = true;
  } else {
    console.log('ℹ️ sheet_students.png not found. Skip.');
  }

  if (!processedAny) {
    console.log('\n⚠️ No sheet files found to slice!');
    console.log('👉 Please upload the sheets as "/public/sheet_poses.png" or "/public/sheet_students.png"');
  } else {
    console.log('\n🎉 Slicing completed successfully!');
  }
}

run();
