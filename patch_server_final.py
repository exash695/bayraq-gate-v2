import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update /api/notifications GET endpoint
notif_pattern = r"app\.get\('/api/notifications', async \(req, res\) => \{[\s\S]*?const logs = await queryBuilder\.orderBy\(desc\(notifications\.createdAt\)\)\.limit\(Number\(limitParam\) \|\| 100\);[\s\S]*?res\.json\(\{ success: true, notifications: logs, data: logs \}\);[\s\S]*?\}\);"

new_notif_endpoint = """app.get('/api/notifications', async (req, res) => {
    try {
      const { recipientId, recipientIds, userId, schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(notifications);
      const filters = [];
      
      let idsToMatch: string[] = [];
      if (recipientIds) {
        idsToMatch = (recipientIds as string).split(',').map(s => s.trim()).filter(Boolean);
      } else if (recipientId || userId) {
        const singleId = (recipientId || userId) as string;
        if (singleId !== 'all') idsToMatch.push(singleId);
      }
      
      if (idsToMatch.length > 0) {
        const expandedSet = new Set<string>();
        for (const rawId of idsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());

          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());

          if (stripped.toUpperCase().startsWith('S-') || stripped.toUpperCase().startsWith('P-') || stripped.toUpperCase().startsWith('T-') || stripped.toUpperCase().startsWith('TCH-')) {
            const pure = stripped.replace(/^(S-|P-|T-|TCH-)/i, '');
            expandedSet.add(pure);
            expandedSet.add(pure.toLowerCase());
            expandedSet.add(pure.toUpperCase());
            expandedSet.add(`scode_${pure}`);
            expandedSet.add(`pcode_${pure}`);
            expandedSet.add(`tcode_${pure}`);
            expandedSet.add(`tch_${pure}`);
          }

          expandedSet.add(`scode_${stripped}`);
          expandedSet.add(`pcode_${stripped}`);
          expandedSet.add(`tcode_${stripped}`);
          expandedSet.add(`tch_${stripped}`);
          expandedSet.add(`scode_${stripped.toLowerCase()}`);
          expandedSet.add(`pcode_${stripped.toLowerCase()}`);
          expandedSet.add(`tcode_${stripped.toLowerCase()}`);
          expandedSet.add(`scode_${stripped.toUpperCase()}`);
          expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          expandedSet.add(`tcode_${stripped.toUpperCase()}`);
        }
        expandedSet.add('all');
        filters.push(inArray(notifications.recipientId, Array.from(expandedSet)));
      }
      if (schoolId && schoolId !== 'all') {
        filters.push(eq(notifications.schoolId, schoolId as string));
      }
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const logs = await queryBuilder.orderBy(desc(notifications.createdAt)).limit(Number(limitParam) || 100);
      res.json({ success: true, notifications: logs, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });"""

content, count1 = re.subn(notif_pattern, new_notif_endpoint, content, count=1)
print(f"Patched /api/notifications: {count1}")

# 2. Update /api/support-tickets GET endpoint
ticket_pattern = r"app\.get\('/api/support-tickets', async \(req, res\) => \{[\s\S]*?const tickets = await queryBuilder;[\s\S]*?res\.json\(\{ success: true, tickets \}\);[\s\S]*?\}\);"

new_ticket_endpoint = """app.get('/api/support-tickets', async (req, res) => {
    try {
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
        const expandedSet = new Set<string>();
        for (const rawId of uidsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());

          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());

          if (stripped.toUpperCase().startsWith('S-') || stripped.toUpperCase().startsWith('P-') || stripped.toUpperCase().startsWith('T-') || stripped.toUpperCase().startsWith('TCH-')) {
            const pure = stripped.replace(/^(S-|P-|T-|TCH-)/i, '');
            expandedSet.add(pure);
            expandedSet.add(pure.toLowerCase());
            expandedSet.add(pure.toUpperCase());
            expandedSet.add(`scode_${pure}`);
            expandedSet.add(`pcode_${pure}`);
            expandedSet.add(`tcode_${pure}`);
            expandedSet.add(`tch_${pure}`);
          }

          expandedSet.add(`scode_${stripped}`);
          expandedSet.add(`pcode_${stripped}`);
          expandedSet.add(`tcode_${stripped}`);
          expandedSet.add(`tch_${stripped}`);
          expandedSet.add(`scode_${stripped.toLowerCase()}`);
          expandedSet.add(`pcode_${stripped.toLowerCase()}`);
          expandedSet.add(`tcode_${stripped.toLowerCase()}`);
          expandedSet.add(`scode_${stripped.toUpperCase()}`);
          expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          expandedSet.add(`tcode_${stripped.toUpperCase()}`);
        }
        filters.push(inArray(support_tickets.userId, Array.from(expandedSet)));
      }
      
      if (filters.length > 0) {
        // @ts-ignore
        queryBuilder = queryBuilder.where(and(...filters));
      }
      
      const tickets = await queryBuilder;
      res.json({ success: true, tickets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });"""

content, count2 = re.subn(ticket_pattern, new_ticket_endpoint, content, count=1)
print(f"Patched /api/support-tickets: {count2}")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished writing server.ts")
