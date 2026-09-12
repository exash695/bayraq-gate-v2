const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `      const combined = [...userList];
      for (const st of mappedStudents) {
        if (!combined.some(u => u.id === st.id)) {
          combined.push(st);
        }
      }`;

const newCode = `      const nonStudents = userList.filter(u => u.role !== 'student' && u.role !== 'parent' && u.role !== 'driver');
      const combined = [...nonStudents, ...mappedStudents];
      
      for (const st of combined) {
        if (st.role === 'student') {
          const userMatch = userList.find(u => u.id === st.id);
          if (userMatch && userMatch.lastLogin) {
            st.lastActive = userMatch.lastLogin;
          }
        }
      }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
console.log("Patched server.ts");
