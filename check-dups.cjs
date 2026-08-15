const fs = require('fs');
const contents = fs.readFileSync('./src/data.ts', 'utf-8');

// A sloppy but fast regex: find all objects inside `questions: [...]` 
// and see if within a block there are duplicates.
const questionBlocks = contents.split('questions:');
questionBlocks.shift(); // remove first part before any questions

questionBlocks.forEach((block, idx) => {
  const blockContent = block.split(']')[0];
  const qMatches = [...blockContent.matchAll(/{\s*id:\s*(\d+)/gm)];
  const qIds = qMatches.map(m => m[1]);
  const dups = qIds.filter((item, index) => qIds.indexOf(item) !== index);
  if (dups.length > 0) {
    console.log(`Duplicate question IDs in block ${idx}:`, dups);
  }
});
console.log('Done checking duplicate questions per block.');
