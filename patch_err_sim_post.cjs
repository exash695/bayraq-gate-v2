const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

content = content.replace(/body: JSON\.stringify\(random\)/g, "body: JSON.stringify({ ...random, id: random.signature })");

fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
