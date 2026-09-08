const fs = require('fs');
let code = fs.readFileSync('src/components/DigitalReceiptModal.tsx', 'utf8');

const regex = /const methodMap:\s*Record<string,\s*string>\s*=\s*{[^}]*};/g;
const replacement = `const methodMap: Record<string, string> = {
  'asiahawala': 'آسيا حوالة',
  'zaincash': 'زين كاش',
  'mastercard': 'ماستر كارد',
  'fib': 'مصرف العراق الأول FIB',
  'نقدي/مدير': 'نقدي',
  'cash': 'نقدي'
};`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/DigitalReceiptModal.tsx', code);
console.log("Forced patch DigitalReceiptModal method display");
