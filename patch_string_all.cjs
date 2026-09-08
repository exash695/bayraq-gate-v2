const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', 'utf8');

code = code.replace(/\(doc.title \|\| ""\).toLowerCase\(\)/g, "String(doc.title || '').toLowerCase()");
code = code.replace(/\(doc.name \|\| ""\).toLowerCase\(\)/g, "String(doc.name || '').toLowerCase()");
code = code.replace(/\(vid.title \|\| ""\).toLowerCase\(\)/g, "String(vid.title || '').toLowerCase()");
code = code.replace(/\(vid.description \|\| ""\).toLowerCase\(\)/g, "String(vid.description || '').toLowerCase()");
code = code.replace(/\(\(q.text \|\| ""\).toLowerCase\(\)/g, "(String(q.text || '').toLowerCase()");
code = code.replace(/\(paperTitle \|\| ""\).toLowerCase\(\)/g, "String(paperTitle || '').toLowerCase()");
code = code.replace(/\(studentLibrarySearch \|\| ""\).toLowerCase\(\)/g, "String(studentLibrarySearch || '').toLowerCase()");

fs.writeFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', code);
console.log("Patched all toLowerCase casts");
