const fs = require('fs');

const content = fs.readFileSync('src/data.ts', 'utf8');

// The easiest fix is to find all `{ id: NUMBER` and replace them sequentially or just append a random string.
// Actually, `StrictContentViewer` might rely on page IDs being correct?

const matches = [...content.matchAll(/id:\s*([0-9a-zA-Z_-]+)/g)];
const observed = new Set();
const duplicates = new Set();

for(const m of matches) {
   if (observed.has(m[1])) {
       duplicates.add(m[1]);
   }
   observed.add(m[1]);
}

console.log('Duplicates:', Array.from(duplicates));
