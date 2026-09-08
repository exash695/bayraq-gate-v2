import os

filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

target = """      const { schoolId, userId } = req.query;"""
replacement = """      const { schoolId, userId, userIds } = req.query;"""

if target in content:
    content = content.replace(target, replacement)

target2 = """      if (userId) {
        const uid = userId as string;
        filters.push(or(
          eq(support_tickets.userId, uid),
          eq(support_tickets.userId, `scode_${uid}`),
          eq(support_tickets.userId, `pcode_${uid}`),
          eq(support_tickets.userId, `tcode_${uid}`)
        ));
      }"""
replacement2 = """      
      let idsToMatch: string[] = [];
      if (userId) idsToMatch.push(userId as string);
      if (userIds && typeof userIds === 'string') {
         idsToMatch = [...idsToMatch, ...userIds.split(',')];
      }
      
      if (idsToMatch.length > 0) {
        const uniqueIds = Array.from(new Set(idsToMatch));
        const expandedIds: string[] = [];
        uniqueIds.forEach(uid => {
          expandedIds.push(uid);
          expandedIds.push(`scode_${uid}`);
          expandedIds.push(`pcode_${uid}`);
          expandedIds.push(`tcode_${uid}`);
        });
        filters.push(inArray(support_tickets.userId, expandedIds));
      }"""

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Patched server.ts")
else:
    print("Target 2 not found in server.ts")

with open(filepath, 'w') as f:
    f.write(content)
