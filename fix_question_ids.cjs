const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf8');

// The duplicate question IDs are [ '2', '4', '7', '8', '1', '6' ]
// We will simply make them unique by appending the match index!
let i = 0;
content = content.replace(/id: (\d+)(?=,\s*(text|isMinisterial|options):)/g, (match, p1) => {
   i++;
   return `id: ${i * 1000 + parseInt(p1)}`; 
});

fs.writeFileSync('src/data.ts', content);
console.log('Fixed questions IDs.');
