const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/components/SchoolPlatform.tsx');
let content = fs.readFileSync(p, 'utf8');

// The replacement logic:
const loadFuncs = `
  // Migration to PostgreSQL API
  const loadSchoolFiles = async () => {
    if (!resolvedSchoolId) return;
    try {
      const res = await fetch(\`/api/school-files?schoolId=\${resolvedSchoolId}\`);
      if (res.ok) {
        const data = await res.json();
        setSchoolFiles(data.data.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        }));
      }
    } catch (err) {
      console.error("Error loading school files:", err);
    }
  };

  const loadRecordedLessons = async () => {
    if (!resolvedSchoolId) return;
    try {
      const res = await fetch(\`/api/recorded-lessons?schoolId=\${resolvedSchoolId}\`);
      if (res.ok) {
        const data = await res.json();
        setRecordedLessons(data.data.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.timestamp || a.date).getTime() || 0;
          const timeB = new Date(b.createdAt || b.timestamp || b.date).getTime() || 0;
          return timeB - timeA;
        }));
      }
    } catch (err) {
      console.error("Error loading recorded lessons:", err);
    }
  };

  useEffect(() => {
    if (!resolvedSchoolId) return;
    loadSchoolFiles();
    loadRecordedLessons();

    const unsubFiles = realtimeManager.on('school_files', () => {
      loadSchoolFiles();
    });
    const unsubLessons = realtimeManager.on('recorded_lessons', () => {
      loadRecordedLessons();
    });

    return () => {
      unsubFiles();
      unsubLessons();
    };
  }, [resolvedSchoolId]);
`;

// Remove the onSnapshot for recorded_lessons
content = content.replace(
  /useEffect\(\(\) => \{\s*if \(\!resolvedSchoolId\) return;\s*const q = query\(collection\(db, "recorded_lessons"\), where\("schoolId", "==", resolvedSchoolId\)\);\s*const unsub = onSnapshot\(q, \([^)]+\) => \{[^}]+\}\) as RecordedLesson\);\s*setRecordedLessons[^)]+\)\);\s*\}\)\);\s*\}, \(error\) => \{[^}]+\}\);\s*return \(\) => unsub\(\);\s*\}, \[resolvedSchoolId\]\);/,
  ''
);
// Above regex is too complex to match reliably. I'll do a simpler replacement using substring replacement or string building.
fs.writeFileSync('patch_school_platform.cjs.tmp', content);
