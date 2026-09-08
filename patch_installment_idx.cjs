const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `const idx = installments.findIndex((i: any) => i.id === meta.installmentId || installments.indexOf(i).toString() === meta.installmentId);`;
const replacement = `const idx = installments.findIndex((i: any) => String(i.id) === String(meta.installmentId) || installments.indexOf(i).toString() === String(meta.installmentId));`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched idx comparison");
} else {
  console.log("Target string not found in server.ts");
}
