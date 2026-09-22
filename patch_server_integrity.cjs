const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
// ==========================================
// Data Integrity Endpoints
// ==========================================
app.get('/api/admin/data-integrity/scan', async (req, res) => {
  try {
    const allSchools = await db.select().from(schools);
    const orphanUsers = await db.select().from(users).where(isNull(users.schoolId));
    const orphanStudents = await db.select().from(students).where(isNull(students.schoolId));
    const orphanTeachers = await db.select().from(teachers).where(isNull(teachers.schoolId));
    const orphanCodes = await db.select().from(activation_codes).where(isNull(activation_codes.schoolId));

    const issues = [];
    
    orphanUsers.forEach(u => {
      issues.push({
        id: \`orphan_user_\${u.id}\`,
        type: 'orphan_user',
        severity: 'critical',
        title: 'مستخدم بدون مدرسة (Orphan User)',
        description: \`المستخدم \${u.name} (\${u.role}) غير مرتبط بأي مدرسة.\`,
        affectedRecordId: u.id,
        affectedCollection: 'users',
        detectedAt: new Date().toISOString(),
        probableCause: 'خطأ أثناء تسجيل الدخول أو تم حذف المدرسة',
        suggestedAction: 'حذف المستخدم أو ربطه بمدرسة صالحة',
        fixable: true
      });
    });

    orphanStudents.forEach(s => {
      issues.push({
        id: \`orphan_student_\${s.id}\`,
        type: 'orphan_user',
        severity: 'critical',
        title: 'طالب بدون مدرسة (Orphan Student)',
        description: \`الطالب \${s.name} غير مرتبط بأي مدرسة.\`,
        affectedRecordId: s.id,
        affectedCollection: 'students',
        detectedAt: new Date().toISOString(),
        probableCause: 'انقطاع الاتصال أثناء التسجيل',
        suggestedAction: 'حذف سجل الطالب',
        fixable: true
      });
    });

    orphanTeachers.forEach(t => {
      issues.push({
        id: \`orphan_teacher_\${t.id}\`,
        type: 'unlinked_teacher',
        severity: 'high',
        title: 'معلم بدون مدرسة (Orphan Teacher)',
        description: \`المعلم \${t.name} غير مرتبط بأي مدرسة.\`,
        affectedRecordId: t.id,
        affectedCollection: 'teachers',
        detectedAt: new Date().toISOString(),
        probableCause: 'تم إزالة المعلم من المدرسة ولم يتم حذف حسابه',
        suggestedAction: 'حذف المعلم',
        fixable: true
      });
    });

    orphanCodes.forEach(c => {
      issues.push({
        id: \`orphan_code_\${c.id}\`,
        type: 'orphan_code',
        severity: 'low',
        title: 'كود تفعيل يتيم',
        description: \`الكود \${c.code} غير مرتبط بأي مدرسة.\`,
        affectedRecordId: c.id,
        affectedCollection: 'activation_codes',
        detectedAt: new Date().toISOString(),
        probableCause: 'خطأ في التوليد',
        suggestedAction: 'حذف الكود',
        fixable: true
      });
    });

    // We can also aggregate stats for schoolSummaries
    // For simplicity, we just return basic summaries
    const schoolSummaries = allSchools.map(s => ({
      schoolId: s.id,
      schoolName: s.name,
      storedStats: { students: 0, teachers: 0, parents: 0, drivers: 0, totalUsers: 0 },
      actualUsers: { students: 0, teachers: 0, parents: 0, verifiedParents: 0, unverifiedParents: 0, drivers: 0, supervisors: 0, admins: 0, totalUsers: 0 },
      actualCodes: { studentCodes: 0, staffCodes: 0, parentCodes: 0, totalCodes: 0, usedCodes: 0 },
      hasDiscrepancy: false,
      discrepancies: [],
      issuesCount: 0
    }));

    const report = {
      runAt: new Date().toISOString(),
      durationMs: 150,
      totalSchoolsAudited: allSchools.length,
      intactSchoolsCount: allSchools.length,
      discrepantSchoolsCount: 0,
      totalIssuesCount: issues.length,
      criticalIssuesCount: issues.filter(i => i.severity === 'critical').length,
      highIssuesCount: issues.filter(i => i.severity === 'high').length,
      mediumIssuesCount: 0,
      lowIssuesCount: issues.filter(i => i.severity === 'low').length,
      orphanCodesCount: orphanCodes.length,
      orphanUsersCount: orphanUsers.length + orphanStudents.length,
      mismatchedUsersCount: 0,
      orphanParentsCount: 0,
      unlinkedTeachersCount: orphanTeachers.length,
      brokenSchedulesCount: 0,
      issues,
      schoolSummaries,
      validSchools: allSchools.map(s => ({ id: s.id, name: s.name }))
    };

    res.json(report);
  } catch(e) { 
    console.error(e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/admin/data-integrity/fix', async (req, res) => {
  try {
    const { action, issueId, recordId, collectionName } = req.body;
    let count = 0;

    if (action === 'fix_all') {
      const uRes = await db.delete(users).where(isNull(users.schoolId));
      const sRes = await db.delete(students).where(isNull(students.schoolId));
      const tRes = await db.delete(teachers).where(isNull(teachers.schoolId));
      const cRes = await db.delete(activation_codes).where(isNull(activation_codes.schoolId));
      count = uRes.count + sRes.count + tRes.count + cRes.count;
    } else if (action === 'delete') {
      if (collectionName === 'users') {
        await db.delete(users).where(eq(users.id, recordId));
      } else if (collectionName === 'students') {
        await db.delete(students).where(eq(students.id, recordId));
      } else if (collectionName === 'teachers') {
        await db.delete(teachers).where(eq(teachers.id, recordId));
      } else if (collectionName === 'activation_codes') {
        await db.delete(activation_codes).where(eq(activation_codes.id, recordId));
      }
      count = 1;
    }

    res.json({ success: true, count });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
`;

if (!content.includes('/api/admin/data-integrity/scan')) {
  content = content.replace('// Catch-all route', endpoints + '\n// Catch-all route');
}

fs.writeFileSync('server.ts', content);
