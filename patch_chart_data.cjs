const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `  const chartData = React.useMemo(() => {
     const months = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
     const monthlyData = months.reduce((acc, month) => ({ ...acc, [month]: { value: 0, count: 0 } }), {} as Record<string, { value: number; count: number }>);
     
     // Derive monthly data from ALL relevant students' paid installments
     relevantStudents.forEach(stu => {
       const installments = stu.finance?.installments || stu.installments || [];
       installments.forEach((inst: any) => {
         const isPaid = inst.paid === true || 
                        ['paid', 'completed', 'verified', 'approved', 'verified_payment'].includes((inst.status || '').toLowerCase());
         
         if (isPaid && inst.paidAt) {
           const date = inst.paidAt.toDate ? inst.paidAt.toDate() : new Date(inst.paidAt);
           const monthIndex = date.getMonth();
           const monthName = months[monthIndex];
           
           if (monthlyData[monthName]) {
             // Use proper effective amount if installments were gross
             const financials = calculateStudentFinancials(stu, tuition, safeDiscountRates);
             const discountFactor = financials.discountFactor;
             const amount = financials.isInstallmentsAtGross ? Math.round(Number(inst.amount) * discountFactor) : Number(inst.amount);
             
             monthlyData[monthName].value += (amount || 0);
             monthlyData[monthName].count += 1;
           }
         }
       });
     });

     return Object.entries(monthlyData).map(([name, data]) => ({ 
       name, 
       value: data.value,
       count: data.count 
     }));
   }, [relevantStudents, tuition, safeDiscountRates]);`;

const replacement = `  const chartData = React.useMemo(() => {
     const months = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
     const monthlyData = months.reduce((acc, month) => ({ ...acc, [month]: { value: 0, count: 0 } }), {} as Record<string, { value: number; count: number }>);
     
     // Derive monthly data from ALL relevant students' completed transactions
     relevantStudents.forEach(stu => {
       const transactions = stu.finance?.transactions || [];
       transactions.forEach((tx: any) => {
         // Count only completed transactions
         if (tx.status === 'completed' || tx.status === 'success' || tx.paid === true) {
           const txDateValue = tx.timestamp || tx.date || tx.time || tx.createdAt;
           if (txDateValue) {
             let date: Date;
             if (txDateValue.toDate) {
               date = txDateValue.toDate();
             } else if (txDateValue.seconds) {
               date = new Date(txDateValue.seconds * 1000);
             } else {
               date = new Date(txDateValue);
             }
             
             if (!isNaN(date.getTime())) {
               const monthIndex = date.getMonth();
               const monthName = months[monthIndex];
               
               if (monthlyData[monthName]) {
                 monthlyData[monthName].value += (Number(tx.amount) || 0);
                 monthlyData[monthName].count += 1;
               }
             }
           }
         }
       });
     });

     return Object.entries(monthlyData).map(([name, data]) => ({ 
       name, 
       value: data.value,
       count: data.count 
     }));
   }, [relevantStudents]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched chartData in FinanceSection");
} else {
  console.log("Target not found");
}
