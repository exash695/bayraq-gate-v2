const fs = require('fs');
const path = require('path');

// 1. Update server.ts
const serverPath = path.join(__dirname, '../server.ts');
let serverCode = fs.readFileSync(serverPath, 'utf8');

const targetLoopStart = `      for (const item of updates) {
        const phoneRaw = String(item.phone || item.formattedPhone || '').trim();
        const studentName = String(item.studentName || '').trim();`;

const newLoopStart = `      for (const item of updates) {
        const phoneRaw = String(item.phone || item.formattedPhone || '').trim();
        const studentName = String(item.studentName || '').trim();
        const grade = String(item.grade || '').trim();`;

if (serverCode.includes(targetLoopStart)) {
  serverCode = serverCode.replace(targetLoopStart, newLoopStart);
  
  // phoneToNameMap -> store object { studentName, grade }
  serverCode = serverCode.replace(
    `const phoneToNameMap = new Map<string, string>();`,
    `const phoneToNameMap = new Map<string, { studentName: string; grade: string }>();`
  );

  serverCode = serverCode.replace(
    `phoneToNameMap.set(raw7Phone, studentName);\n        if (cleanPhone) phoneToNameMap.set(cleanPhone, studentName);`,
    `phoneToNameMap.set(raw7Phone, { studentName, grade });\n        if (cleanPhone) phoneToNameMap.set(cleanPhone, { studentName, grade });`
  );

  serverCode = serverCode.replace(
    `data: { ...currentData, studentName },`,
    `data: { ...currentData, studentName, ...(grade ? { grade } : {}) },`
  );

  serverCode = serverCode.replace(
    `for (const [pKey, newName] of phoneToNameMap.entries()) {
                if (accPhone === pKey || accPhone.endsWith(pKey) || pKey.endsWith(accPhone)) {
                  modified = true;
                  return { ...acc, studentName: newName };
                }
              }`,
    `for (const [pKey, info] of phoneToNameMap.entries()) {
                if (accPhone === pKey || accPhone.endsWith(pKey) || pKey.endsWith(accPhone)) {
                  modified = true;
                  return { ...acc, studentName: info.studentName, ...(info.grade ? { grade: info.grade } : {}) };
                }
              }`
  );

  fs.writeFileSync(serverPath, serverCode, 'utf8');
  console.log('server.ts successfully patched with grade handling.');
} else {
  console.log('server.ts loop target not found or already patched.');
}
