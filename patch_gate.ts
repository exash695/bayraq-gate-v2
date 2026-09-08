import fs from 'fs';

let code = fs.readFileSync('src/components/SchoolAccessGate.tsx', 'utf8');
const oldHandleVerify = `  const handleVerify = () => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      setError('يرجى إدخال الكود أولاً');
      return;
    }

    if (cleanCode.startsWith('PAR-') || cleanCode.startsWith('PCODE-')) {
      onVerify(cleanCode, true);
    } else if (
      cleanCode.startsWith('STU-') || 
      cleanCode.startsWith('PRI-') || 
      cleanCode.startsWith('INT-') || 
      cleanCode.startsWith('SCI-') || 
      cleanCode.startsWith('LIT-') ||
      cleanCode.startsWith('DRI-') ||
      cleanCode.startsWith('TCH-') ||
      /^P\d/i.test(cleanCode) ||
      /^M\d/i.test(cleanCode) ||
      /^S\d/i.test(cleanCode) ||
      cleanCode.startsWith('P-') ||
      cleanCode.startsWith('M-') ||
      cleanCode.startsWith('S-')
    ) {
      onVerify(cleanCode, false);
    } else if (cleanCode.startsWith('ADM-')) {
      onVerify(cleanCode, false); // Admin flag is routed in App.tsx
    } else {
      // Pass general code to onVerify so App.tsx can check Firestore database
      onVerify(cleanCode, false);
    }
  };`;

const newHandleVerify = `  const handleVerify = () => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      setError('يرجى إدخال الكود أولاً');
      return;
    }
    
    // We send to App.tsx via onVerify, which will now use customAuth.loginWithCode
    onVerify(cleanCode, false);
  };`;

if (code.includes(oldHandleVerify)) {
  code = code.replace(oldHandleVerify, newHandleVerify);
  fs.writeFileSync('src/components/SchoolAccessGate.tsx', code);
  console.log('Patched SchoolAccessGate handleVerify');
} else {
  console.log('Could not find exact handleVerify code block');
}
