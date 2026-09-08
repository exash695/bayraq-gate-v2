const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', 'utf8');

// Replace 1: search filter in filteredDocs
code = code.replace(
  '          const matchesSearch = doc.title.toLowerCase().includes(studentLibrarySearch.toLowerCase()) || \n                                doc.name.toLowerCase().includes(studentLibrarySearch.toLowerCase());',
  '          const searchLower = (studentLibrarySearch || "").toLowerCase();\n          const matchesSearch = !searchLower || (doc.title || "").toLowerCase().includes(searchLower) || \n                                (doc.name || "").toLowerCase().includes(searchLower);'
);

// Replace 2: search filter in filteredVideos
code = code.replace(
  '          const matchesSearch = vid.title.toLowerCase().includes(studentLibrarySearch.toLowerCase()) || \n                                (vid.description || "").toLowerCase().includes(studentLibrarySearch.toLowerCase());',
  '          const searchLower = (studentLibrarySearch || "").toLowerCase();\n          const matchesSearch = !searchLower || (vid.title || "").toLowerCase().includes(searchLower) || \n                                (vid.description || "").toLowerCase().includes(searchLower);'
);

// Replace 3: search filter in filteredQuestions
code = code.replace(
  '          const matchesSearch = !studentLibrarySearch || (q.text?.toLowerCase().includes(studentLibrarySearch.toLowerCase()) || false);',
  '          const searchLower = (studentLibrarySearch || "").toLowerCase();\n          const matchesSearch = !searchLower || ((q.text || "").toLowerCase().includes(searchLower) || false);'
);

// Replace 4: search filter in filteredPapers
code = code.replace(
  '          const matchesSearch = !studentLibrarySearch || paperTitle.toLowerCase().includes(studentLibrarySearch.toLowerCase());',
  '          const searchLower = (studentLibrarySearch || "").toLowerCase();\n          const matchesSearch = !searchLower || (paperTitle || "").toLowerCase().includes(searchLower);'
);

// Replace 5: filterSubject in isSubjectMatch inside homeworks & competitions
code = code.replace(
  /const s2 = filterSubject.replace\(\/أ\|إ\|آ\/g, 'ا'\).replace\(\/ة\/g, 'ه'\).toLowerCase\(\).trim\(\);/g,
  "const s2 = (filterSubject || '').replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();"
);

fs.writeFileSync('src/components/SchoolPlatform/StudentFilesTab.tsx', code);
console.log("Patched StudentFilesTab");
