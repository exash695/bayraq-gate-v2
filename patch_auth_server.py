import re

with open("server.ts", "r") as f:
    content = f.read()

auth_routes = """
  // ==========================================
  // 🔐 Custom JWT Authentication - PostgreSQL
  // ==========================================
  const JWT_SECRET = process.env.JWT_SECRET || 'bairaq-gate6-secret-key-2026';
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role, schoolId } = req.body;
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = `usr_${Date.now()}`;
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'student',
        schoolId: schoolId || 'general'
      });
      
      res.json({ success: true, userId });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');

      const userList = await db.select().from(users).where(eq(users.email, email));
      if (userList.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      const user = userList[0];
      const isValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { uid: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({ success: true, token, user: { uid: user.id, email: user.email, displayName: user.name, role: user.role, schoolId: user.schoolId } });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const userList = await db.select().from(users).where(eq(users.id, decoded.uid));
      if (userList.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      const user = userList[0];

      res.json({ success: true, user: { uid: user.id, email: user.email, displayName: user.name, role: user.role, schoolId: user.schoolId } });
    } catch (error: any) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  });

"""

# Insert right before "const server = app.listen("
if "const server = app.listen(" in content:
    content = content.replace("const server = app.listen(", auth_routes + "\n  const server = app.listen(")
    with open("server.ts", "w") as f:
        f.write(content)
    print("Injected auth routes successfully.")
else:
    print("Could not find insertion point.")
