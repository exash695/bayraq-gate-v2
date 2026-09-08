import os
filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """  app.get('/api/notifications', async (req, res) => {
    try {
      const { recipientId, userId, schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(notifications);
      const targetUser = recipientId || userId;
      const filters = [];
      if (targetUser && targetUser !== 'all') {
        filters.push(or(eq(notifications.recipientId, targetUser as string), eq(notifications.recipientId, 'all')));
      }"""

new_code = """  app.get('/api/notifications', async (req, res) => {
    try {
      const { recipientId, recipientIds, userId, schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(notifications);
      const filters = [];
      
      let idsToMatch = [];
      if (recipientIds) {
        idsToMatch = (recipientIds as string).split(',').map(s => s.trim()).filter(Boolean);
      } else if (recipientId || userId) {
        const singleId = (recipientId || userId) as string;
        if (singleId !== 'all') idsToMatch.push(singleId);
      }
      
      if (idsToMatch.length > 0) {
        idsToMatch.push('all');
        filters.push(inArray(notifications.recipientId, idsToMatch));
      }"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)
