const fs = require('fs');
const contents = fs.readFileSync('./src/data.ts', 'utf-8');
const matches = [...contents.matchAll(/^\s*:?\s*id:\s*(\d+),/gm)];
const ids = matches.map(m => m[1]);
const counts = {};
ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
const dupes = Object.keys(counts).filter(id => counts[id] > 1);
console.log('Duplicates in pages:', dupes);

// Also look for duplicate question IDs across all questions:
const qMatches = [...contents.matchAll(/{\s*id:\s*(\d+).*?text:/gm)];
const qIds = qMatches.map(m => m[1]);
const qCounts = {};
qIds.forEach(id => qCounts[id] = (qCounts[id] || 0) + 1);
const qDupes = Object.keys(qCounts).filter(id => qCounts[id] > 1);
console.log('Duplicates in questions:', qDupes);
