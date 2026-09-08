import re

with open("src/components/SchoolPlatform.tsx", "r") as f:
    content = f.read()

load_funcs = """
  // Migration to PostgreSQL API
  const loadSchoolFiles = async () => {
    if (!resolvedSchoolId) return;
    try {
      const res = await fetch(`/api/school-files?schoolId=${resolvedSchoolId}`);
      if (res.ok) {
        const data = await res.json();
        setSchoolFiles(data.data.sort((a: any, b: any) => {
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
      const res = await fetch(`/api/recorded-lessons?schoolId=${resolvedSchoolId}`);
      if (res.ok) {
        const data = await res.json();
        setRecordedLessons(data.data.sort((a: any, b: any) => {
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
"""

# Replace onSnapshot for recorded_lessons
content = re.sub(r'useEffect\(\(\) => \{\s*if \(!resolvedSchoolId\) return;\s*const q = query\(collection\(db, "recorded_lessons"\),.*?\n\s*return \(\) => unsub\(\);\s*\}, \[resolvedSchoolId\]\);', load_funcs, content, flags=re.DOTALL)

# Replace onSnapshot for school_files
# It's inside a useEffect that also loads question_bank and exam_papers!
# We just need to remove the school_files part from that useEffect.
content = re.sub(r'const q = query\(collection\(db, "school_files"\).*?handleFirestoreError\([\s\S]*?false\s*\);\s*\}\);', '', content, flags=re.DOTALL)

with open("src/components/SchoolPlatform.tsx", "w") as f:
    f.write(content)
print("Patched SchoolPlatform.tsx")
