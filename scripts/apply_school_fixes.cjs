const fs = require('fs');
const path = require('path');

// 1. Script to patch dist/server.cjs or server.ts
function patchServerFile() {
  const possiblePaths = [
    '/app/applet/dist/server.cjs',
    './dist/server.cjs',
    '../dist/server.cjs'
  ];
  for (const serverPath of possiblePaths) {
    if (fs.existsSync(serverPath)) {
      let file = fs.readFileSync(serverPath, 'utf8');

      // Replace ensureSchoolExists logic
      if (file.includes('const ensureSchoolExists = async')) {
        file = file.replace(/const ensureSchoolExists = async \(schoolId, schoolName\) => \{[\s\S]*?console\.error\(\`\[DB\] Failed to ensure school exists: \${schoolId}\`, err\);\s*\}\s*\};/,
`const ensureSchoolExists = async (schoolId, schoolName) => {
    if (!schoolId || schoolId === "all" || schoolId === "general") return;
    try {
      const existing = await db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, schoolId));
      if (existing.length === 0) {
        let name = schoolName;
        if (!name) {
          const baseId = schoolId.replace(/-(boys|girls)$/i, "");
          const baseSchool = await db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, baseId));
          if (baseSchool.length > 0 && baseSchool[0].name) {
            name = baseSchool[0].name + (schoolId.endsWith("-boys") ? " (بنين)" : schoolId.endsWith("-girls") ? " (بنات)" : "");
          } else {
            name = "مدرسة جديدة";
          }
        }
        await db.insert(schools).values({
          id: schoolId,
          name,
          governorate: "الديوانية - غماس",
          status: "active"
        }).onConflictDoNothing();
        console.log(\`[DB] Auto-created school: \${schoolId} -> \${name}\`);
      }
    } catch (err) {
      console.error(\`[DB] Failed to ensure school exists: \${schoolId}\`, err);
    }
  };`);
        fs.writeFileSync(serverPath, file);
        console.log(`[Fix Script] Successfully patched ${serverPath}!`);
      }
    }
  }
}

// 2. Re-assign orphaned lists and users to school6 (مدرسة اليمامة الابتدائية)
async function syncDatabaseData() {
  try {
    const listsRes = await fetch("http://localhost:3000/api/academic-lists?schoolId=all");
    if (!listsRes.ok) return;
    const listsData = await listsRes.json();
    const lists = listsData.academicLists || [];
    
    for (const l of lists) {
      if (l.schoolId === "school1-boys" || l.schoolId === "school1") {
        console.log(`[Fix Script] Migrating list ${l.id} (${l.name}) to school6...`);
        await fetch("http://localhost:3000/api/academic-lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...l, schoolId: "school6", schoolName: "مدرسة اليمامة الابتدائية" })
        });
      }
    }

    const usersRes = await fetch("http://localhost:3000/api/users?schoolId=all");
    if (!usersRes.ok) return;
    const usersData = await usersRes.json();
    const users = usersData.users || [];

    for (const u of users) {
      if ((u.schoolId === "school1-boys" || u.schoolId === "school1") && (u.role === "student" || u.role === "parent")) {
        console.log(`[Fix Script] Migrating user ${u.id} (${u.name}) to school6...`);
        await fetch(`http://localhost:3000/api/users/${u.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId: "school6", schoolName: "مدرسة اليمامة الابتدائية" })
        });
      }
    }
    console.log('[Fix Script] Database sync completed successfully!');
  } catch (err) {
    console.error('[Fix Script] DB Sync Error:', err.message);
  }
}

patchServerFile();
syncDatabaseData();
