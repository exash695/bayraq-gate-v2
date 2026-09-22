const fs = require('fs');
let content = fs.readFileSync('src/components/dev/MaintenanceArchiveSection.tsx', 'utf8');

// Clean up imports
content = content.replace(/import \{ collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, limit \} from '@\/src\/lib\/firebase';\n/g, '');
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/MaintenanceArchiveSection.tsx', content);
