const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolSelection.tsx', 'utf8');

// Remove UNSPLASH_FALLBACKS definition
code = code.replace(/const UNSPLASH_FALLBACKS: Record<string, string> = \{[\s\S]*?\};\n?/, '');

// Replace SchoolCardImage onError logic
code = code.replace(/if \(fallbackStage === 0\) \{\s*setFallbackStage\(1\);\s*setImgSrc\(UNSPLASH_FALLBACKS\[schoolId\] \|\| UNSPLASH_FALLBACKS\['school1'\]\);\s*\}\s*else if \(fallbackStage === 1\)/g, 'if (fallbackStage === 0) {\n          setFallbackStage(1);\n          setImgSrc(`/schools/school${num}.jpg`);\n        } else if (fallbackStage === 1)');

fs.writeFileSync('src/components/SchoolSelection.tsx', code, 'utf8');
console.log('Successfully removed Unsplash fallbacks from SchoolSelection.tsx');
