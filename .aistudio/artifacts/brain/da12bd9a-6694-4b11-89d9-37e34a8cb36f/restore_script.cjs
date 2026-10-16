const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../app/applet');
console.log('Target applet dir:', ROOT_DIR);

// 1. Patch server.ts
const serverPath = path.join(ROOT_DIR, 'server.ts');
if (fs.existsSync(serverPath)) {
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
    console.log('server.ts patched.');
  }
}

// 2. Patch ParentBulkAccountsModal.tsx
const modalPath = path.join(ROOT_DIR, 'src/components/ParentBulkAccountsModal.tsx');
if (fs.existsSync(modalPath)) {
  let modalCode = fs.readFileSync(modalPath, 'utf8');

  if (!modalCode.includes('grade?: string;')) {
    modalCode = modalCode.replace(
      'export interface ParentAccountRow {\n  id: string;\n  studentName: string;\n',
      'export interface ParentAccountRow {\n  id: string;\n  studentName: string;\n  grade?: string;\n'
    );
  }

  if (!modalCode.includes('export const normalizeGrade =')) {
    const helpers = `
export const normalizeGrade = (raw: string): string => {
  if (!raw) return '';
  const s = raw.toString().trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  if (/أول|اول|\\b1\\b|الأول/.test(s)) return 'الصف الأول';
  if (/ثان|تاني|\\b2\\b|الثاني/.test(s)) return 'الصف الثاني';
  if (/ثالث|\\b3\\b|الثالث/.test(s)) return 'الصف الثالث';
  if (/رابع|\\b4\\b|الرابع/.test(s)) return 'الصف الرابع';
  if (/خامس|\\b5\\b|الخامس/.test(s)) return 'الصف الخامس';
  if (/سادس|\\b6\\b|السادس/.test(s)) return 'الصف السادس';
  return s;
};

export const getGradeSortOrder = (grade?: string): number => {
  if (!grade) return 999;
  const s = grade.toString();
  if (/أول|اول|\\b1\\b/.test(s)) return 1;
  if (/ثان|تاني|\\b2\\b/.test(s)) return 2;
  if (/ثالث|\\b3\\b/.test(s)) return 3;
  if (/رابع|\\b4\\b/.test(s)) return 4;
  if (/خامس|\\b5\\b/.test(s)) return 5;
  if (/سادس|\\b6\\b/.test(s)) return 6;
  return 100;
};
`;
    modalCode = modalCode.replace(
      'export const generateDefaultPassword = (): string => {',
      `${helpers}\nexport const generateDefaultPassword = (): string => {`
    );
  }

  fs.writeFileSync(modalPath, modalCode, 'utf8');
  console.log('ParentBulkAccountsModal.tsx verified/patched.');
}
console.log('Done restoring features.');
