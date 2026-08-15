const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\blocalStorage\b/g, 'safeStorage');
content = content.replace(/\bsessionStorage\b/g, 'safeSessionStorage');

fs.writeFileSync(file, content);
console.log('Done replacing in App.tsx');
