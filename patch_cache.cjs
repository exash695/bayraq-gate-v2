const fs = require('fs');

// Patch financeService.ts
let fsCode = fs.readFileSync('src/services/financeService.ts', 'utf8');
fsCode = fsCode.replace('const url = schoolId ? `/api/finance/pending-payments?schoolId=${schoolId}` : \'/api/finance/pending-payments\';', 'const url = schoolId ? `/api/finance/pending-payments?schoolId=${schoolId}&t=${Date.now()}` : `/api/finance/pending-payments?t=${Date.now()}`;');
fs.writeFileSync('src/services/financeService.ts', fsCode);

// Patch FinanceSection.tsx
let fSec = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');
fSec = fSec.replace('const res = await fetch(`/api/finance/payment-requests?schoolId=${selectedSchoolId || \'all\'}`);', 'const res = await fetch(`/api/finance/payment-requests?schoolId=${selectedSchoolId || \'all\'}&t=${Date.now()}`);');
fSec = fSec.replace('const res = await fetch(`/api/finance/transactions?schoolId=${selectedSchoolId || \'all\'}`);', 'const res = await fetch(`/api/finance/transactions?schoolId=${selectedSchoolId || \'all\'}&t=${Date.now()}`);');
fs.writeFileSync('src/components/FinanceSection.tsx', fSec);

console.log("Patched cache busting");
