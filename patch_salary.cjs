const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `    const base = Number(
      updates.baseSalary !== undefined 
        ? updates.baseSalary 
        : (existingRecord.baseSalary !== undefined ? existingRecord.baseSalary : (fallbackRecord.baseSalary ?? 0))
    );`;

const replacement = `    const base = Number(
      updates.baseSalary !== undefined 
        ? updates.baseSalary 
        : (existingRecord.baseSalary !== undefined && Number(existingRecord.baseSalary) > 0 ? existingRecord.baseSalary : (fallbackRecord.baseSalary ?? 0))
    );`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched updateStaffSalary");
} else {
  console.log("Target not found");
}

const target2 = `      const baseSalary = salaryRecord?.baseSalary !== undefined 
        ? Number(salaryRecord.baseSalary) 
        : (fallbackRecord?.baseSalary !== undefined ? Number(fallbackRecord.baseSalary) : 0);`;

const replacement2 = `      const baseSalary = salaryRecord?.baseSalary !== undefined && Number(salaryRecord.baseSalary) > 0
        ? Number(salaryRecord.baseSalary) 
        : (fallbackRecord?.baseSalary !== undefined ? Number(fallbackRecord.baseSalary) : 0);`;

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched currentSalaries");
}
