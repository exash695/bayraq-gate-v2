import os

filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

outbox_routes = """
  // --- صندوق الصادر للإدارة (Admin Outbox) ---
  app.get('/api/admin-outbox', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(admin_outbox).orderBy(desc(admin_outbox.timestamp));
      
      const filters = [];
      if (schoolId) filters.push(eq(admin_outbox.schoolId, schoolId as string));
      
      if (filters.length > 0) {
        // @ts-ignore
        queryBuilder = queryBuilder.where(and(...filters));
      }
      
      const outbox = await queryBuilder;
      res.json({ success: true, admin_outbox: outbox });
    } catch (error: any) {
      console.error('Error fetching admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin-outbox', async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newRecord = {
        id,
        schoolId: data.schoolId || null,
        title: data.title || null,
        message: data.message || null,
        type: data.type || null,
        targetRole: data.targetRole || null,
        count: data.count || 0,
        refIds: data.refIds || null,
        broadcastId: data.broadcastId || null,
        timestamp: new Date()
      };
      
      await db.insert(admin_outbox).values(newRecord);
      res.json({ success: true, id, data: newRecord });
    } catch (error: any) {
      console.error('Error inserting admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin-outbox/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(admin_outbox).where(eq(admin_outbox.id, id));
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error deleting admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- الدعم والشكاوى (Support & Complaints) ---"""

content = content.replace("  // --- الدعم والشكاوى (Support & Complaints) ---", outbox_routes)

with open(filepath, 'w') as f:
    f.write(content)
print("Injected admin_outbox routes")
