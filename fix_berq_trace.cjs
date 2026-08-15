const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

code = code.replace(`          onError={(e) => {
            const target = e.currentTarget;
            console.log('[BERQ TRACE] 9. onError is triggered! pose:', pose, 'failed src:', target.src);
            const target = e.currentTarget;`, `          onError={(e) => {
            const target = e.currentTarget;
            console.log('[BERQ TRACE] 9. onError is triggered! pose:', pose, 'failed src:', target.src);`);

fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
console.log('Fixed duplicate target declaration.');
