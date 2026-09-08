const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `      // Sync to PostgreSQL for parent app
      if (selectedSchoolId) {
        academicService.syncStudents(selectedSchoolId, updatedStudents);
      }
    }).catch(err => {`;

const replacement = `      // Sync to PostgreSQL for parent app
      if (selectedSchoolId) {
        academicService.syncStudents(selectedSchoolId, updatedStudents);
      }
      
      // Auto-resolve pending requests if paid cash
      if (newPaidStatus) {
        fetch('/api/finance/resolve-installment-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: targetStudent.id, 
            studentCode: targetStudent.code || targetStudent.student, 
            installmentId: installmentId 
          })
        }).catch(e => console.error(e));
      }
    }).catch(err => {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched toggleInstallmentPayment to resolve requests");
} else {
  console.log("Target not found!");
}
