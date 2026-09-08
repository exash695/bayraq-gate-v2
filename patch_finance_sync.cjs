const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceSection.tsx', 'utf8');

const target = `                                                      isStamped: matchingTx?.isStamped || false,
                                                      stampTime: matchingTx?.stampTime || null
                                                  });`;

const replacement = `                                                      isStamped: matchingTx?.isStamped || false,
                                                      stampTime: matchingTx?.stampTime || null,
                                                      isSyncedToParent: matchingTx?.isSyncedToParent || false
                                                  });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FinanceSection.tsx', code);
  console.log("Patched FinanceSection.tsx");
} else {
  console.log("Target not found");
}
