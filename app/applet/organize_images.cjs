const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const mascotDir = path.join(publicDir, 'mascot');
const schoolsDir = path.join(publicDir, 'schools');
const schoolLogosDir = path.join(publicDir, 'school-logos');

[mascotDir, schoolsDir, schoolLogosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// 1. Mascot / welcome / onboarding images
const mascotFiles = ['welcome.jpg', 'connect.jpg', 'study.jpg', 'transit.jpg', 'achieve.jpg', 'launch.jpg'];
mascotFiles.forEach(file => {
  const src = path.join(process.cwd(), file);
  if (fs.existsSync(src)) {
    const destJpg = path.join(mascotDir, file);
    fs.copyFileSync(src, destJpg);
    console.log(`Copied ${file} to ${destJpg}`);

    const baseName = path.basename(file, '.jpg');
    const destPng = path.join(mascotDir, `${baseName}.png`);
    fs.copyFileSync(src, destPng);
    console.log(`Copied ${file} to ${destPng} (as png fallback)`);
  } else {
    console.warn(`Source file not found in root: ${file}`);
  }
});

// 2. School covers (cover1.jpg ... cover8.jpg)
for (let i = 1; i <= 8; i++) {
  const filename = `cover${i}.jpg`;
  const src = path.join(process.cwd(), filename);
  if (fs.existsSync(src)) {
    const dest = path.join(schoolsDir, filename);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${filename} to ${dest}`);

    fs.copyFileSync(src, path.join(schoolsDir, `school${i}.jpg`));
    fs.copyFileSync(src, path.join(schoolsDir, `school${i}.png`));
  } else {
    console.warn(`Source file not found in root: ${filename}`);
  }
}

// 3. School logos (logo1.jpg ... logo8.jpg)
for (let i = 1; i <= 8; i++) {
  const filename = `logo${i}.jpg`;
  const src = path.join(process.cwd(), filename);
  if (fs.existsSync(src)) {
    const dest = path.join(schoolLogosDir, filename);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${filename} to ${dest}`);

    fs.copyFileSync(src, path.join(schoolLogosDir, `school${i}.jpg`));
    fs.copyFileSync(src, path.join(schoolLogosDir, `school${i}.png`));
    fs.copyFileSync(src, path.join(schoolLogosDir, `logo${i}.png`));
  } else {
    console.warn(`Source file not found in root: ${filename}`);
  }
}

console.log('Image organization completed successfully.');
