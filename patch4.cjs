const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('}, [activeSectionState]);', '}, [activeSectionState, isChoosingSchool]);');
fs.writeFileSync('src/App.tsx', code);
