with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update teacher/parent possibleIds logic
old_code_block = """    } else if (portalType === "parent") {
      processCode(parentCode, true);
    } else if (portalType === "teacher" && teacherCode) {
      const clean = teacherCode.trim();
      const upper = clean.toUpperCase();
      const lower = clean.toLowerCase();
      possibleIdsSet.add(clean);
      possibleIdsSet.add(upper);
      possibleIdsSet.add(lower);
      possibleIdsSet.add(`tcode_${clean}`);
      possibleIdsSet.add(`tcode_${upper}`);
      possibleIdsSet.add(`tcode_${lower}`);
    }"""

new_code_block = """    } else if (portalType === "parent") {
      processCode(parentCode, true);
      const extraParentIds = [studentData?.parentCode, verifiedStudentInfo?.parentCode, userProfile?.parentCode, activeUserId].filter(Boolean);
      for (const pId of extraParentIds) {
        processCode(pId as string, true);
      }
    } else if (portalType === "teacher") {
      const teacherIds = [teacherCode, loggedInTeacher?.id, loggedInTeacher?.code, userProfile?.code, userProfile?.studentCode, activeUserId].filter(Boolean);
      for (const tId of teacherIds) {
        const clean = (tId as string).trim();
        const upper = clean.toUpperCase();
        const lower = clean.toLowerCase();
        possibleIdsSet.add(clean);
        possibleIdsSet.add(upper);
        possibleIdsSet.add(lower);
        possibleIdsSet.add(`tcode_${clean}`);
        possibleIdsSet.add(`tcode_${upper}`);
        possibleIdsSet.add(`tcode_${lower}`);
        possibleIdsSet.add(`tch_${clean}`);
        possibleIdsSet.add(`tch_${upper}`);
        possibleIdsSet.add(`tch_${lower}`);
        if (upper.startsWith("TCH-") || upper.startsWith("T-")) {
          const pure = upper.startsWith("TCH-") ? upper.slice(4) : upper.slice(2);
          possibleIdsSet.add(pure);
          possibleIdsSet.add(pure.toLowerCase());
          possibleIdsSet.add(`tcode_${pure}`);
          possibleIdsSet.add(`tcode_${pure.toLowerCase()}`);
        }
      }
    }"""

if old_code_block in content:
    content = content.replace(old_code_block, new_code_block)
    print("Replaced teacher/parent possibleIds in App.tsx")
else:
    print("Could not find old_code_block in App.tsx")

# 2. Update recipientRole filtering
old_filter_block = """           .filter((d: any) => {
             if (d.recipientRole) return d.recipientRole === portalType;
             return portalType === "student";
           });"""

new_filter_block = """           .filter((d: any) => {
             if (d.recipientRole) {
               if (portalType === "teacher") return d.recipientRole === "teacher" || d.recipientRole === "cadre" || d.recipientRole === "staff";
               if (portalType === "parent") return d.recipientRole === "parent";
               return d.recipientRole === "student";
             }
             if (d.recipientId && d.recipientId !== 'all') return true;
             return portalType === "student";
           });"""

if old_filter_block in content:
    content = content.replace(old_filter_block, new_filter_block)
    print("Replaced filter block in App.tsx")
else:
    print("Could not find old_filter_block in App.tsx")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
