const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'ArrowLeft } from "lucide-react";',
  'ArrowLeft, ArrowRight, Lock as LockIcon } from "lucide-react";'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Added ArrowRight to App.tsx");
