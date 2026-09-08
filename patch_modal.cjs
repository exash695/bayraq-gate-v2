const fs = require('fs');
let code = fs.readFileSync('src/components/DigitalReceiptModal.tsx', 'utf8');

const target1 = `      // 1. Add to parent_receipts collection
      const receiptRef = await addDoc(collection(db, 'parent_receipts'), {
        studentName: receipt.studentName,
        studentId: receipt.studentId,
        amount: receipt.amount,
        time: new Date(receipt.time || new Date()).toISOString(),
        adminName: receipt.adminName,
        schoolId: receipt.schoolId || null,
        createdAt: new Date().toISOString(),
        status: 'completed',
        type: 'digital_receipt'
      });

      // 2. Add to student's finance.transactions in school_students`;

const replace1 = `      // 1. Generate ID for new transaction
      const newTransactionId = Math.random().toString(36).substring(2, 15);

      // 2. Add to student's finance.transactions in school_students`;

if (code.includes(target1)) {
  code = code.replace(target1, replace1);
  console.log("Patched target1");
} else {
  console.log("target1 not found");
}

const target2 = `            isStamped,
            stampTime,
            // isSyncedToParent: true
          };`;
const replace2 = `            isStamped,
            stampTime,
            isSyncedToParent: true
          };`;

if (code.includes(target2)) {
  code = code.replace(target2, replace2);
  console.log("Patched target2");
}

const target3 = `                isStamped: true,
                stampTime: stampTime,
                // isSyncedToParent: true,`;
const replace3 = `                isStamped: true,
                stampTime: stampTime,
                isSyncedToParent: true,`;

if (code.includes(target3)) {
  code = code.replace(target3, replace3);
  console.log("Patched target3");
}

const target4 = `id: receiptRef.id,`;
const replace4 = `id: newTransactionId,`;
if (code.includes(target4)) {
  code = code.replace(target4, replace4);
  console.log("Patched target4");
}

fs.writeFileSync('src/components/DigitalReceiptModal.tsx', code);
