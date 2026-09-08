const adminContent = require('fs').readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /window\.innerWidth/g;
let match;
while ((match = regex.exec(adminContent)) !== null) {
  console.log(`Found window.innerWidth at index ${match.index}. Extracting context:`);
  console.log(adminContent.substring(Math.max(0, match.index - 50), Math.min(adminContent.length, match.index + 100)));
}
