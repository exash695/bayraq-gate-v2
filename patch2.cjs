const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', 'utf8');

const regex1 = /\(!\(studentLibrarySearch \|\| ''\).trim\(\) \|\| \(r.name && r.name.includes\(studentLibrarySearch\)\) \|\| \(r.content && r.content.includes\(studentLibrarySearch\)\)\)/g;

code = code.replace(regex1, "(!(studentLibrarySearch || '').trim() || (r.name && r.name.toLowerCase().includes((studentLibrarySearch || '').toLowerCase())) || (r.content && r.content.toLowerCase().includes((studentLibrarySearch || '').toLowerCase())))");

fs.writeFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', code);
console.log("Patched includes");
