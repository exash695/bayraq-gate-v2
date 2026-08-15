const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  useEffect\(\(\) => \{\n    \/\/ Reset scroll position instantly when switching sections\n    window\.scrollTo\(0, 0\);\n    \n    \/\/ Also try to reset any scroll containers if needed\n    const mainContent = document\.getElementById\("main-content-area"\);\n    if \(mainContent\) \{\n      mainContent\.scrollTop = 0;\n    \}\n  \}, \[activeSectionState, isChoosingSchool\]\);/g;

code = code.replace(regex, '');
fs.writeFileSync('src/App.tsx', code);
