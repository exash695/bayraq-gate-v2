const fs = require('fs');
let code = fs.readFileSync('src/components/DigitalReceiptModal.tsx', 'utf8');

const target = `'asiahawala': 'آسيا حوالة',
                                           'zaincash': 'زين كاش',
                                           'mastercard': 'ماستر كارد',
                                           'fib': 'مصرف العراق الأول FIB'
                                         };`;

const replacement = `'asiahawala': 'آسيا حوالة',
                                           'zaincash': 'زين كاش',
                                           'mastercard': 'ماستر كارد',
                                           'fib': 'مصرف العراق الأول FIB',
                                           'نقدي/مدير': 'نقدي',
                                           'cash': 'نقدي'
                                         };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/DigitalReceiptModal.tsx', code);
  console.log("Patched DigitalReceiptModal method display");
} else {
  console.log("Target not found");
}
