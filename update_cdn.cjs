const fs = require('fs');

const files = [
  'src/lib/constants.ts',
  'src/components/SchoolSelection.tsx',
  'src/components/WelcomeIntroScreen.tsx',
  'src/components/BerqCharacterManager.tsx',
  'src/components/LoadingScreen.tsx',
  'src/components/SchoolAccessGate.tsx',
  'src/utils/imageCacher.ts',
  'src/App.tsx'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping missing file:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove import of cdnService
  content = content.replace(/import\s+\{\s*cdnService\s*\}\s+from\s+['"][^'"]+cdnService['"];?\n?/g, '');
  content = content.replace(/import\s+.*?cdnService.*?;\n?/g, '');

  let prev;
  do {
    prev = content;
    content = content.replace(/cdnService\.getMediaUrl\(([^)]+)\)/g, '$1');
    content = content.replace(/cdnService\.getMascotAssetUrl\(([^)]+)\)/g, '$1');
    content = content.replace(/cdnService\.getSchoolLogoUrl\(([^)]+)\)/g, '$1');
    content = content.replace(/cdnService\.getSchoolCardUrl\(([^)]+)\)/g, '$1');
  } while (content !== prev);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', filePath);
});

console.log('CDN service removal complete.');
