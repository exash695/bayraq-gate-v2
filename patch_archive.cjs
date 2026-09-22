const fs = require('fs');
let content = fs.readFileSync('src/components/dev/SchoolArchiveManager.tsx', 'utf8');

// Clean up imports
content = content.replace(/import \{ auth \} from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/SchoolArchiveManager.tsx', content);
