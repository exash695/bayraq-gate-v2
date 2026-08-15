import fs from 'fs';
import path from 'path';

const walk = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./src/components');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/backdrop-blur-xl/g, 'backdrop-blur-sm');
  content = content.replace(/backdrop-blur-2xl/g, 'backdrop-blur-sm');
  content = content.replace(/backdrop-blur-md/g, 'backdrop-blur-sm');
  fs.writeFileSync(file, content);
});

console.log('Done replacing backdrop-blurs');
