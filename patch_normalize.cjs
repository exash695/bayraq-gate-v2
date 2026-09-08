const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', 'utf8');

code = code.replace(
  '          return s\n            .trim()',
  '          return String(s)\n            .trim()'
);

fs.writeFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', code);
console.log("Patched normalizeSubject");
