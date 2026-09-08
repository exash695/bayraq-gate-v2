const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `          if (t.isElectronic) {`;
const replacement = `          const isElec = t.isElectronic || t.type === 'electronic' || (t.method && typeof t.method === 'string' && t.method !== 'نقدي') || (t.note && typeof t.note === 'string' && t.note.includes('إلكتروني'));
          if (isElec) {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched cashVsElectronicData");
} else {
  console.log("Target not found");
}
