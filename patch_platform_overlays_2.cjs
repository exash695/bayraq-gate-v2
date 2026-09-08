const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/PlatformOverlays.tsx', 'utf8');

code = code.replace(
  /\{\(previewingFile\.title \|\| ''\)\.endsWith\('\.pdf'\) \? previewingFile\.title : \`\$\{previewingFile\.title\}\.pdf\`\}/g,
  "{(previewingFile.title || '').endsWith('.pdf') ? previewingFile.title : `${previewingFile.title || previewingFile.name || 'بدون_عنوان'}.pdf`}"
);

fs.writeFileSync('src/components/SchoolPlatform/PlatformOverlays.tsx', code);
console.log("Patched endsWith title");
