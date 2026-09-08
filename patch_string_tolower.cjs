const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', 'utf8');

const regex1 = /\(r.name && r.name.toLowerCase\(\).includes\(\(studentLibrarySearch \|\| ''\).toLowerCase\(\)\)\)/g;
const replacement1 = "(r.name && String(r.name).toLowerCase().includes((studentLibrarySearch || '').toLowerCase()))";

const regex2 = /\(r.content && r.content.toLowerCase\(\).includes\(\(studentLibrarySearch \|\| ''\).toLowerCase\(\)\)\)/g;
const replacement2 = "(r.content && String(r.content).toLowerCase().includes((studentLibrarySearch || '').toLowerCase()))";

code = code.replace(regex1, replacement1);
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', code);
console.log("Patched toLowerCase safe casting");
