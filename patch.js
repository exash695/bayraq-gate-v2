const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/services/academicService.ts');
let code = fs.readFileSync(p, 'utf8');
const search = `        const studentRef = doc(db, 'school_students', studentDocId);`;
const replace = `        const studentRef = doc(db, 'school_students', studentDocId);

        // --- 🐘 SHADOW MODE: Sync to PostgreSQL ---
        try {
          fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: studentDocId,
              schoolId: finalSchoolId,
              name: student.name || 'بدون اسم',
              grade: student.grade || 'غير محدد'
            })
          }).catch(() => {});
        } catch (e) {}
        // ----------------------------------------`;
code = code.replace(search, replace);
fs.writeFileSync(p, code);
