const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `const firstUnpaidIdx = installments.findIndex((i: any) => !i.paid && i.status !== 'completed' && i.status !== 'verified');`;
const replacement = `const firstUnpaidIdx = installments.findIndex((i: any) => i.paid !== true && i.paid !== 'true' && i.status !== 'completed' && i.status !== 'verified' && i.status !== 'paid');`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched firstUnpaidIdx");
} else {
  console.log("Target string not found in server.ts");
}
