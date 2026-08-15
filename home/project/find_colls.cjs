const cp = require('child_process');
const out = cp.execSync('grep -rI "collection(db" src/').toString();
const matches = out.match(/collection\(db,\s*["'][a-zA-Z_0-9]+["']/g);
console.log([...new Set(matches)]);
