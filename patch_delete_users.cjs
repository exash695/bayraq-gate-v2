const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace /api/teachers/:id DELETE endpoint
const oldTeacherDelete = `  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(teachers).where(eq(teachers.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });`;

const newTeacherDelete = `  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Get teacher to find code
      const tList = await db.select().from(teachers).where(eq(teachers.id, id));
      if (tList.length > 0 && tList[0].code) {
        const c = tList[0].code;
        await db.delete(activation_codes).where(eq(activation_codes.code, c));
      }
      await db.delete(teachers).where(eq(teachers.id, id));
      await db.delete(users).where(eq(users.id, id));
      await db.delete(activation_codes).where(eq(activation_codes.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });`;

code = code.replace(oldTeacherDelete, newTeacherDelete);

// Replace /api/users/:id DELETE endpoint
const oldUserDeleteRegex = /app\.delete\('\/api\/users\/:id', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\s*\}\s*catch\s*\(error:\s*any\)\s*\{\s*console\.error\('Error deleting user:', error\);\s*res\.status\(500\)\.json\(\{ success: false, message: error\.message \}\);\s*\}\s*\}\);/g;

const newUserDelete = `app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { role, schoolId, code } = req.query; 

      // 1. Delete from users table
      await db.delete(users).where(eq(users.id, id));
      
      // 2. Delete from activation_codes
      await db.delete(activation_codes).where(eq(activation_codes.id, id));

      // 3. Delete from students
      await db.delete(students).where(eq(students.id, id));
      await db.delete(attendance_logs).where(eq(attendance_logs.studentId, id));
      await db.delete(behavior_logs).where(eq(behavior_logs.studentId, id));
      await db.delete(student_transactions).where(eq(student_transactions.studentId, id));

      const altStudentId = id.includes('_') ? id : (schoolId && code ? \`\${schoolId}_\${code}\` : null);
      if (altStudentId && altStudentId !== id) {
        await db.delete(students).where(eq(students.id, altStudentId));
        await db.delete(attendance_logs).where(eq(attendance_logs.studentId, altStudentId));
        await db.delete(behavior_logs).where(eq(behavior_logs.studentId, altStudentId));
        await db.delete(student_transactions).where(eq(student_transactions.studentId, altStudentId));
      }

      // 4. Delete from teachers
      await db.delete(teachers).where(eq(teachers.id, id));
      await db.delete(salaries).where(eq(salaries.staffId, id));

      // 5. Delete by code alias
      if (code) {
        const c = String(code);
        await db.delete(students).where(eq(students.code, c));
        await db.delete(students).where(eq(students.parentCode, c));
        await db.delete(teachers).where(eq(teachers.code, c));
        await db.delete(activation_codes).where(eq(activation_codes.code, c));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });`;

code = code.replace(oldUserDeleteRegex, newUserDelete);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts DELETE endpoints");
