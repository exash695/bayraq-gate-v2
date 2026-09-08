import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const srcDir = path.join(process.cwd(), 'src');

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(srcDir, (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace firestore imports
    if (content.includes("from 'firebase/firestore'")) {
      content = content.replace(/import\s+{[^}]+}\s+from\s+'firebase\/firestore';/g, (match) => {
          const imports = match.match(/{([^}]+)}/)?.[1] || '';
          return `import { ${imports.trim()} } from '@/src/lib/firebase';`;
      });
      changed = true;
    }

    // Replace auth imports
    if (content.includes("from 'firebase/auth'")) {
      content = content.replace(/import\s+{[^}]+}\s+from\s+'firebase\/auth';/g, (match) => {
          const imports = match.match(/{([^}]+)}/)?.[1] || '';
          return `import { ${imports.trim()} } from '@/src/lib/firebase';`;
      });
      changed = true;
    }

    // Handle cases where both were imported
    if (changed) {
      // Deduplicate imports if they now point to the same place
      const lines = content.split('\n');
      const firebaseLines = lines.filter(l => l.includes("from '@/src/lib/firebase'"));
      if (firebaseLines.length > 1) {
          const allImports = firebaseLines.map(l => l.match(/{([^}]+)}/)?.[1] || '').join(', ');
          const firstIndex = lines.indexOf(firebaseLines[0]);
          const newImport = `import { ${Array.from(new Set(allImports.split(',').map(s => s.trim()))).filter(Boolean).join(', ')} } from '@/src/lib/firebase';`;
          
          const filteredLines = lines.filter(l => !firebaseLines.includes(l));
          filteredLines.splice(firstIndex, 0, newImport);
          content = filteredLines.join('\n');
      }

      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
