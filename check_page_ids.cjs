const { INITIAL_PAGES } = require('./src/data.ts'); // Wait, require on ts might fail. We can parse it.
const fs = require('fs');

const content = fs.readFileSync('src/data.ts', 'utf8');

let pageIds = [];
// Match top level objects in INITIAL_PAGES array.
const idMatches = content.matchAll(/id:\s*(\d+),/g);

let duplicates = new Set();
let seen = new Set();
for(let match of idMatches) {
   let id = match[1];
   if (seen.has(id)) duplicates.add(id);
   seen.add(id);
}

console.log('Duplicates:', Array.from(duplicates));
