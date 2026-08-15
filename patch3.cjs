const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  useEffect\(\(\) => \{\n    \/\/ Reset window scroll position when changing sections to prevent black space\n    window\.scrollTo\(\{ top: 0, behavior: 'auto' \}\);\n  \}, \[activeSection, isChoosingSchool\]\);/g;

code = code.replace(regex, '');
fs.writeFileSync('src/App.tsx', code);
