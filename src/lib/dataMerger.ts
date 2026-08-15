const getCanonicalRole = (roleRaw: string, code: string) => {
    const r = (roleRaw || "").toLowerCase().trim();
    const codeUpper = String(code || "").toUpperCase().trim();
    
    if (["student", "طالب", "طالبة", "students"].includes(r)) return "student";
    if (["parent", "ولي", "ولي امر", "أب", "أم", "ولي أمر", "parent_role", "parents"].includes(r)) return "parent";
    if (["teacher", "cadre", "admin", "مدرس", "كادر", "cadre_role", "teachers"].includes(r)) return "cadre";
    if (["staff", "employee", "موظف", "staff_role", "staffs", "employees"].includes(r)) return "staff";
    
    // Prefix checks
    if (codeUpper.startsWith('TCH-') || codeUpper.startsWith('T-')) return "cadre";
    if (codeUpper.startsWith('PAR-') || codeUpper.startsWith('P-')) return "parent";
    if (codeUpper.startsWith('EMP-') || codeUpper.startsWith('E-') || codeUpper.startsWith('STAFF-')) return "staff";
    if (codeUpper.startsWith('STU-') || codeUpper.startsWith('S-')) return "student";
    
    return "";
};

export const mergeDashboardData = (sourceCodes: any[], sData: any[], uData: any[], tData: any[]) => {
    console.log("[DataMerger] Segmented Merging. Codes:", sourceCodes.length, "Students:", sData.length, "Users:", uData.length, "Teachers:", tData.length);
    
    // 1. Build rapid maps of live students and users by their codes
    const sDataMap = new Map<string, any>();
    sData.forEach(item => {
        const code = String(item.code || item.studentCode || '').trim().toUpperCase();
        if (code) {
            sDataMap.set(code, item);
        }
    });

    const uDataMap = new Map<string, any>();
    uData.forEach(item => {
        const code = String(item.code || item.studentCode || item.parentCode || '').trim().toUpperCase();
        if (code) {
            uDataMap.set(code, item);
        }
    });

    const mergedList: any[] = [];

    // 2. Students and Parents MUST come from sourceCodes (Codes Center / activation_codes)
    sourceCodes.forEach(codeItem => {
        const rawRole = (codeItem.role || '').toLowerCase().trim();
        const rawCode = String(codeItem.code || codeItem.studentCode || codeItem.parentCode || '').trim().toUpperCase();
        
        let role = getCanonicalRole(rawRole, rawCode);
        if (!role) {
            if (rawCode.startsWith('PAR-') || rawCode.startsWith('P-')) role = 'parent';
            else role = 'student';
        }

        // Segmenting: only students and parents come from activation_codes
        if (role !== 'student' && role !== 'parent') {
            return;
        }

        // Enforce live registration merges (for active statuses, online states, custom usernames, emails, etc)
        let liveMatch = null;
        if (role === 'student') {
            liveMatch = sDataMap.get(rawCode) || uDataMap.get(rawCode);
        } else if (role === 'parent') {
            liveMatch = uDataMap.get(rawCode);
        }

        const mergedUser: any = {
            ...codeItem,
            ...(liveMatch || {}),
            id: liveMatch?.id || codeItem.id || `scode_${rawCode}`,
            fullName: liveMatch?.fullName || liveMatch?.name || codeItem.fullName || codeItem.name || codeItem.userName || "سجل طالب/ولي",
            role: role,
            foundInInventory: true,
            isOnline: liveMatch?.isOnline || false,
            subscriptionStatus: liveMatch?.subscriptionStatus || codeItem.status || 'pending'
        };

        // Standardize stage based on active grade to prevent anomalies (like "الخامس ابتدائي علمي")
        const gradeClean = String(mergedUser.grade || codeItem.grade || '').trim().toLowerCase();
        if (gradeClean.includes('علمي') || gradeClean.includes('أدبي') || gradeClean === '4s' || gradeClean === '4l' || gradeClean === '5s' || gradeClean === '5l' || gradeClean === '6s' || gradeClean === '6l') {
            mergedUser.stage = 'preparatory';
        } else if (gradeClean.includes('متوسط') || gradeClean === '1m' || gradeClean === '2m' || gradeClean === '3m') {
            mergedUser.stage = 'intermediate';
        } else if (gradeClean.includes('ابتدائي') || gradeClean === '1p' || gradeClean === '2p' || gradeClean === '3p' || gradeClean === '4p' || gradeClean === '5p' || gradeClean === '6p') {
            mergedUser.stage = 'primary';
        }

        mergedList.push(mergedUser);
    });

    // 3. Teaching Cadre and Staff MUST come from tData (Cadre and Staff / teachers collection)
    tData.forEach(teacherItem => {
        const rawRole = (teacherItem.role || '').toLowerCase().trim();
        const rawCode = String(teacherItem.code || '').trim().toUpperCase();
        
        let role = getCanonicalRole(rawRole, rawCode);
        if (!role || (role !== 'cadre' && role !== 'staff')) {
            if (rawRole === 'staff') role = 'staff';
            else role = 'cadre';
        }

        // Merge active credential details or status from user collection if they registered
        const liveMatch = uDataMap.get(rawCode) || (rawCode ? uDataMap.get(`TCH-${rawCode}`) : null);

        const mergedTeacher = {
            ...teacherItem,
            ...(liveMatch || {}),
            id: teacherItem.id || `tch_${rawCode}`,
            fullName: teacherItem.fullName || teacherItem.name || liveMatch?.fullName || liveMatch?.name || "سجل كادر تدريسي",
            role: role,
            foundInInventory: false,
            isOnline: teacherItem.isOnline || liveMatch?.isOnline || false,
            subscriptionStatus: 'active'
        };

        mergedList.push(mergedTeacher);
    });

    return mergedList;
};
