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

  // Replace cdnService.getMediaUrl(...) with just the inner argument
  // e.g. cdnService.getMediaUrl('/schools/cover1.jpg') -> '/schools/cover1.jpg'
  // We can use a regex to match cdnService.getMediaUrl( ... ) handling matching parentheses.
  // Or replace common calls:
  content = content.replace(/cdnService\.getMediaUrl\((['"`])([^'"`]+)\1\)/g, '$1$2$1');
  content = content.replace(/cdnService\.getMascotAssetUrl\((['"`])([^'"`]+)\1\)/g, '(assetFilename => assetFilename.startsWith(\'/mascot/\') ? assetFilename : `/mascot/${assetFilename}`)($1$2$1)');
  content = content.replace(/cdnService\.getSchoolLogoUrl\((['"`])([^'"`]+)\1\)/g, '(logoFilename => logoFilename.startsWith(\'/school-logos/\') ? logoFilename : `/school-logos/${logoFilename}`)($1$2$1)');
  content = content.replace(/cdnService\.getSchoolCardUrl\((['"`])([^'"`]+)\1\)/g, '(cardFilename => cardFilename.startsWith(\'/schools/\') ? cardFilename : `/schools/${cardFilename}`)($1$2$1)');

  // Generic replacement for cdnService.getMediaUrl(variable or expression)
  // cdnService.getMediaUrl(expr) -> expr
  // Let's do iterative regex replacement for cdnService.getMediaUrl(...)
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
