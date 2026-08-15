const fs = require('fs');
let code = fs.readFileSync('src/components/SixthAcademyPro.tsx', 'utf8');

code = code.replace(
  "  pageData?: any;\n}",
  "  pageData?: any;\n  isTeacherEditMode?: boolean;\n}"
);

fs.writeFileSync('src/components/SixthAcademyPro.tsx', code);
