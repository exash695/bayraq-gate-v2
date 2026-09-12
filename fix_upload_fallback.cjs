const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Don't initialize S3 if endpoint has 'dummy'
content = content.replace(
  "if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {",
  "if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && !R2_ENDPOINT.includes('dummy')) {"
);

fs.writeFileSync(file, content);
console.log("Patched S3 initialization");
