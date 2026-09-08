const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (student) {
        const currentPaid = student.paidAmount || 0;
        const newPaid = currentPaid + effectiveAmount;

        const currentFinance = student.finance || {};
        const installments = Array.isArray(currentFinance.installments) ? [...currentFinance.installments] : [];`;

const replacement = `      if (student) {
        const currentPaid = student.paidAmount || 0;
        const newPaid = currentPaid + effectiveAmount;

        const currentFinance = student.finance || {};
        const existingInstallments = (Array.isArray(currentFinance.installments) && currentFinance.installments.length > 0) 
            ? currentFinance.installments 
            : (Array.isArray(student.installments) ? student.installments : []);
        const installments = [...existingInstallments];`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched verify-payment installments successfully");
} else {
  console.log("Target string not found in server.ts");
}
