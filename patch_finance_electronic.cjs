const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `                                                  const isElectronic = inst.transactionId || matchingTx?.transactionId || (matchingTx?.note && (matchingTx.note.includes('إلكتروني') || matchingTx.note.includes('AsiaPay') || matchingTx.note.includes('زين كاش')));
const finalMethod = matchingTx?.method || inst.method || (isElectronic ? 'إلكتروني' : 'نقدي/مدير');`;

const replacement = `                                                  const isTxElectronic = inst.transactionId && !String(inst.transactionId).startsWith('TXN_MANUAL') && !String(inst.transactionId).startsWith('txn_');
                                                  const isMatchingTxElectronic = matchingTx?.transactionId && !String(matchingTx.transactionId).startsWith('TXN_MANUAL') && !String(matchingTx.transactionId).startsWith('txn_');
                                                  const isElectronic = isTxElectronic || isMatchingTxElectronic || (matchingTx?.note && (matchingTx.note.includes('إلكتروني') || matchingTx.note.includes('AsiaPay') || matchingTx.note.includes('زين كاش')));
const finalMethod = matchingTx?.method || inst.method || (isElectronic ? 'إلكتروني' : 'نقدي');`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched isElectronic in FinanceSection");
} else {
  console.log("Target not found");
}
