const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/components/SchoolPlatform/TeacherControlFilesTab.tsx');
let content = fs.readFileSync(p, 'utf8');

// Replace addDoc for school_files
content = content.replace(
  /await addDoc\(collection\(db, "school_files"\), (\{[^}]+\})\);/g,
  `await fetch('/api/school-files', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify($1)
                                });`
);

// Replace addDoc for recorded_lessons
content = content.replace(
  /await addDoc\(collection\(db, "recorded_lessons"\), (\{[\s\S]+?\}\));/g,
  `await fetch('/api/recorded-lessons', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify($1)
                                });`
);

// Replace deleteDoc for school_files
content = content.replace(
  /await deleteDoc\(doc\(db, "school_files", file\.id\)\);/g,
  `await fetch(\`/api/school-files/\${file.id}\`, { method: 'DELETE' });`
);

// Replace deleteDoc for recorded_lessons
content = content.replace(
  /await deleteDoc\(doc\(db, "recorded_lessons", lesson\.id\)\);/g,
  `await fetch(\`/api/recorded-lessons/\${lesson.id}\`, { method: 'DELETE' });`
);

fs.writeFileSync(p, content, 'utf8');
console.log('Patched TeacherControlFilesTab.tsx');
