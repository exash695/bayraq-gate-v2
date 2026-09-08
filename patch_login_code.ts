import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const loginCodeEndpoint = `
  app.post('/api/auth/login-code', async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'الكود مطلوب' });
      }

      // 1. Check activation_codes (Admin, Teacher, General)
      const activationList = await db.select().from(activation_codes).where(eq(activation_codes.code, code));
      if (activationList.length > 0) {
        const act = activationList[0];
        const token = jwt.sign(
          { uid: act.id, name: act.role, role: act.role, schoolId: act.schoolId || 'general' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ success: true, token, user: { uid: act.id, displayName: act.role, role: act.role, schoolId: act.schoolId } });
      }

      // 2. Check students (Student)
      const studentList = await db.select().from(students).where(eq(students.code, code));
      if (studentList.length > 0) {
        const stu = studentList[0];
        const token = jwt.sign(
          { uid: stu.id, name: stu.name, role: 'student', schoolId: stu.schoolId },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ success: true, token, user: { uid: stu.id, displayName: stu.name, role: 'student', schoolId: stu.schoolId } });
      }

      // 3. Check students (Parent)
      const parentList = await db.select().from(students).where(eq(students.parentCode, code));
      if (parentList.length > 0) {
        const stu = parentList[0];
        const parentId = "parent_" + stu.id;
        const token = jwt.sign(
          { uid: parentId, name: "ولي أمر " + stu.name, role: 'parent', schoolId: stu.schoolId },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ success: true, token, user: { uid: parentId, displayName: "ولي أمر " + stu.name, role: 'parent', schoolId: stu.schoolId } });
      }
      
      // 4. Check drivers (Driver)
      const driverList = await db.select().from(transport_drivers).where(eq(transport_drivers.accessCode, code));
      if (driverList.length > 0) {
        const drv = driverList[0];
        const token = jwt.sign(
          { uid: drv.id, name: drv.name, role: 'driver', schoolId: drv.schoolId },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ success: true, token, user: { uid: drv.id, displayName: drv.name, role: 'driver', schoolId: drv.schoolId } });
      }

      return res.status(401).json({ success: false, message: 'كود الدخول غير صحيح' });
    } catch (error: any) {
      console.error('Login code error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
`;

if (!code.includes('/api/auth/login-code')) {
  code = code.replace("app.post('/api/auth/login', async (req, res) => {", loginCodeEndpoint + "\n  app.post('/api/auth/login', async (req, res) => {");
  fs.writeFileSync('server.ts', code);
  console.log('Added /api/auth/login-code');
} else {
  console.log('Endpoint already exists');
}
