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

export const mergeDashboardData = (sourceCodes: any[], sData: any[], uData: any[], tData: any[], aData?: any[]) => {
    console.log("[DataMerger] Segmented Merging. Codes:", sourceCodes.length, "Students:", sData.length, "Users:", uData.length, "Teachers:", tData.length, "Lists:", aData?.length);

    const activeStudentCodes = new Set<string>();
    const activeParentCodes = new Set<string>();
    const academicStudentsList: any[] = [];

    if (aData && aData.length > 0) {
        aData.forEach(list => {
            if (list.students && Array.isArray(list.students)) {
                list.students.forEach((student: any) => {
                    const stCode = String(student.student || student.code || '').trim().toUpperCase();
                    const paCode = String(student.parent || student.parentCode || (stCode ? `P-${stCode}` : '')).trim().toUpperCase();
                    if (stCode) {
                        activeStudentCodes.add(stCode);
                        academicStudentsList.push({ ...student, resolvedStudentCode: stCode, resolvedParentCode: paCode, listName: list.name, grade: student.grade || list.grade || list.name });
                    }
                    if (paCode) activeParentCodes.add(paCode);
                });
            }
        });
    }

    // 1. Build rapid maps of live students and users by their codes
    const sDataMap = new Map<string, any>();
    sData.forEach(item => {
        const sCode = String(item.code || item.studentCode || '').trim().toUpperCase();
        const pCode = String(item.parentCode || '').trim().toUpperCase();
        if (sCode) sDataMap.set(sCode, item);
        if (pCode) sDataMap.set(pCode, item);
    });

    const uDataMap = new Map<string, any>();
    uData.forEach(item => {
        const code = String(item.code || item.studentCode || item.parentCode || '').trim().toUpperCase();
        if (code) {
            uDataMap.set(code, item);
        }
    });

    const mergedList: any[] = [];
    const processedCodes = new Set<string>();
    const processedParentCodes = new Set<string>();

    // If academic lists exist, we prioritize generating exact student and parent records from academic_lists (Source of Truth)
    const hasAcademicLists = Array.isArray(aData);
    
    if (hasAcademicLists && aData.length > 0) {
        academicStudentsList.forEach((stuItem) => {
            const stCode = stuItem.resolvedStudentCode;
            const paCode = stuItem.resolvedParentCode;
            processedCodes.add(stCode);

            // 1. Student Record
            const liveMatchStudent = sDataMap.get(stCode) || uDataMap.get(stCode);
            const sourceCodeMatchStudent = sourceCodes.find(c => String(c.code || c.studentCode || '').trim().toUpperCase() === stCode);
            const mergedStudent: any = {
                ...(sourceCodeMatchStudent || {}),
                ...(liveMatchStudent || {}),
                id: liveMatchStudent?.id || sourceCodeMatchStudent?.id || `scode_${stCode}`,
                fullName: stuItem.name || liveMatchStudent?.fullName || liveMatchStudent?.name || sourceCodeMatchStudent?.fullName || "طالب",
                role: 'student',
                studentCode: stCode,
                code: stCode,
                parentCode: paCode,
                grade: stuItem.grade || sourceCodeMatchStudent?.grade || 'غير محدد',
                foundInInventory: true,
                isOnline: liveMatchStudent?.isOnline || false,
                subscriptionStatus: liveMatchStudent?.subscriptionStatus || sourceCodeMatchStudent?.status || 'active',
                isBanned: liveMatchStudent?.isBanned ?? sourceCodeMatchStudent?.isBanned ?? false,
                canPost: liveMatchStudent?.canPost ?? sourceCodeMatchStudent?.canPost ?? true,
                canComment: liveMatchStudent?.canComment ?? sourceCodeMatchStudent?.canComment ?? true
            };
            mergedList.push(mergedStudent);

            // 2. Parent Record (matching the student) - ONLY if not already processed for this dashboard
            if (paCode && !processedParentCodes.has(paCode)) {
                processedParentCodes.add(paCode);
                processedCodes.add(paCode);
                
                const liveMatchParent = uDataMap.get(paCode) || sDataMap.get(paCode);
                const sourceCodeMatchParent = sourceCodes.find(c => String(c.code || c.parentCode || '').trim().toUpperCase() === paCode);

                const mergedParent: any = {
                    ...(sourceCodeMatchParent || {}),
                    ...(liveMatchParent || {}),
                    id: liveMatchParent?.id || sourceCodeMatchParent?.id || `pcode_${paCode}`,
                    fullName: liveMatchParent?.fullName || liveMatchParent?.name || sourceCodeMatchParent?.fullName || `ولي أمر (${stuItem.name || 'طالب'})`,
                    role: 'parent',
                    parentCode: paCode,
                    code: paCode,
                    studentCode: stCode,
                    foundInInventory: true,
                    isOnline: liveMatchParent?.isOnline || false,
                    subscriptionStatus: liveMatchParent?.subscriptionStatus || 'active',
                    isBanned: liveMatchParent?.isBanned ?? sourceCodeMatchParent?.isBanned ?? false,
                    canPost: liveMatchParent?.canPost ?? sourceCodeMatchParent?.canPost ?? true,
                    canComment: liveMatchParent?.canComment ?? sourceCodeMatchParent?.canComment ?? true
                };
                mergedList.push(mergedParent);
            }
        });
    } else if (!hasAcademicLists) {
        // Fallback to sourceCodes ONLY if academic lists are not provided (legacy mode)
        sourceCodes.forEach(codeItem => {
            const rawRole = (codeItem.role || '').toLowerCase().trim();
            const rawCode = String(codeItem.code || codeItem.studentCode || codeItem.parentCode || '').trim().toUpperCase();
            
            let role = getCanonicalRole(rawRole, rawCode);
            if (!role) {
                if (rawCode.startsWith('PAR-') || rawCode.startsWith('P-')) role = 'parent';
                else role = 'student';
            }

            if (role !== 'student' && role !== 'parent') {
                return;
            }

            let liveMatch = null;
            if (role === 'student') {
                liveMatch = sDataMap.get(rawCode) || uDataMap.get(rawCode);
            } else if (role === 'parent') {
                liveMatch = uDataMap.get(rawCode) || sDataMap.get(rawCode);
            }

            const mergedUser: any = {
                ...codeItem,
                ...(liveMatch || {}),
                id: liveMatch?.id || codeItem.id || `scode_${rawCode}`,
                fullName: liveMatch?.fullName || liveMatch?.name || codeItem.fullName || codeItem.name || "سجل طالب/ولي",
                role: role,
                foundInInventory: true,
                isOnline: liveMatch?.isOnline || false,
                subscriptionStatus: liveMatch?.subscriptionStatus || codeItem.status || 'pending',
                isBanned: liveMatch?.isBanned ?? codeItem.isBanned ?? false,
                canPost: liveMatch?.canPost ?? codeItem.canPost ?? true,
                canComment: liveMatch?.canComment ?? codeItem.canComment ?? true
            };
            mergedList.push(mergedUser);
        });
    }

    // 3. Teaching Cadre and Staff MUST come from tData (Cadre and Staff / teachers collection)
    tData.forEach(teacherItem => {
        const rawRole = (teacherItem.role || '').toLowerCase().trim();
        const rawCode = String(teacherItem.code || '').trim().toUpperCase();
        
        let role = getCanonicalRole(rawRole, rawCode);
        if (!role || (role !== 'cadre' && role !== 'staff')) {
            if (rawRole === 'staff') role = 'staff';
            else role = 'cadre';
        }

        const liveMatch = uDataMap.get(rawCode) || (rawCode ? uDataMap.get(`TCH-${rawCode}`) : null) || sDataMap.get(rawCode);

        const mergedTeacher = {
            ...teacherItem,
            ...(liveMatch || {}),
            id: teacherItem.id || `tch_${rawCode}`,
            fullName: teacherItem.fullName || teacherItem.name || liveMatch?.fullName || liveMatch?.name || "سجل كادر تدريسي",
            role: role,
            foundInInventory: false,
            isOnline: teacherItem.isOnline || liveMatch?.isOnline || false,
            subscriptionStatus: 'active',
            isBanned: liveMatch?.isBanned ?? teacherItem.isBanned ?? false,
            canPost: liveMatch?.canPost ?? teacherItem.canPost ?? true,
            canComment: liveMatch?.canComment ?? teacherItem.canComment ?? true
        };
        mergedList.push(mergedTeacher);
    });

    return mergedList;
};
