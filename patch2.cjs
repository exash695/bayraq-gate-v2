const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLine = '<main';
const hookStr = '<main id="main-content-area"';

code = code.replace(targetLine, hookStr);
fs.writeFileSync('src/App.tsx', code);
