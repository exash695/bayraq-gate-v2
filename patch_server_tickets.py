import os
filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """    try {
      const { schoolId, userId } = req.query;
      let queryBuilder = db.select().from(support_tickets).orderBy(desc(support_tickets.timestamp));
      
      const filters = [];
      if (schoolId) filters.push(eq(support_tickets.schoolId, schoolId as string));
      if (userId) {
        const uid = userId as string;
        filters.push(or(
          eq(support_tickets.userId, uid),
          eq(support_tickets.userId, `scode_${uid}`),
          eq(support_tickets.userId, `pcode_${uid}`),
          eq(support_tickets.userId, `tcode_${uid}`)
        ));
      }"""

new_code = """    try {
      const { schoolId, userId, userIds } = req.query;
      let queryBuilder = db.select().from(support_tickets).orderBy(desc(support_tickets.timestamp));
      
      const filters = [];
      if (schoolId) filters.push(eq(support_tickets.schoolId, schoolId as string));
      
      let uidsToMatch: string[] = [];
      if (userIds) {
        uidsToMatch = (userIds as string).split(',').map(u => u.trim()).filter(Boolean);
      } else if (userId) {
        uidsToMatch.push(userId as string);
      }
      
      if (uidsToMatch.length > 0) {
        const userFilters = [];
        for (const uid of uidsToMatch) {
          userFilters.push(
            eq(support_tickets.userId, uid),
            eq(support_tickets.userId, `scode_${uid}`),
            eq(support_tickets.userId, `pcode_${uid}`),
            eq(support_tickets.userId, `tcode_${uid}`)
          );
        }
        filters.push(or(...userFilters));
      }"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)
