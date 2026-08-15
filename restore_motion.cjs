const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -lr "fake-framer" src/ || true').toString().split('\n').filter(Boolean);
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/['"][./]+lib\/fake-framer['"]/g, "'motion/react'");
  fs.writeFileSync(file, content);
  console.log('Restored motion in', file);
}
