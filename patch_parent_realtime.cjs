const fs = require('fs');
let code = fs.readFileSync('src/components/ParentPaymentView.tsx', 'utf8');

const targetImport = `import { BerqCharacter } from './BerqCharacterManager';`;
const replacementImport = `import { BerqCharacter } from './BerqCharacterManager';\nimport { realtimeManager } from '../lib/realtimeManager';`;

const targetEffect = `    const interval = setInterval(fetchFinanceData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [studentCode]);`;
const replacementEffect = `    const interval = setInterval(fetchFinanceData, 30000); // Poll every 30 seconds
    
    // Subscribe to realtime updates for this student's data
    const unsubRealtime = realtimeManager.on('students', (event) => {
        // We could check if it's the right student, but fetching is safe enough
        fetchFinanceData();
    });
    
    const unsubTransactions = realtimeManager.on('student_transactions', () => {
        fetchFinanceData();
    });

    return () => {
       clearInterval(interval);
       unsubRealtime();
       unsubTransactions();
    };
  }, [studentCode]);`;

if (code.includes(targetImport) && code.includes(targetEffect)) {
  code = code.replace(targetImport, replacementImport);
  code = code.replace(targetEffect, replacementEffect);
  fs.writeFileSync('src/components/ParentPaymentView.tsx', code);
  console.log("Patched ParentPaymentView.tsx with realtime updates");
} else {
  console.log("Target strings not found in ParentPaymentView.tsx");
}
