const { execSync } = require('child_process');
const output = execSync(`grep -hro 'key={[A-Za-z0-9_.$` + "`" + `-]+}' src/ || true`).toString();
const counts = {};
output.split('\n').filter(Boolean).forEach(line => {
   counts[line] = (counts[line] || 0) + 1;
});
const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
console.log(sorted.slice(0, 30));
