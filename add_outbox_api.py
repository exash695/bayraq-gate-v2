import os

filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

outbox_api = """
  // Admin Outbox
  app.get('/api/admin-outbox', async (req, res) => {
    try {
      const allOutbox = await db.select().from(schema.admin_outbox).orderBy(desc(schema.admin_outbox.timestamp));
      res.json({ success: true, admin_outbox: allOutbox, data: allOutbox });
    } catch (error: any) {
      console.error('Error fetching admin_outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin-outbox', async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newOutbox = {
        id,
        schoolId: data.schoolId || data.school_id || null,
        title: data.title || null,
        message: data.message || null,
        type: data.type || null,
        targetRole: data.targetRole || data.target_role || null,
        count: data.count || 0,
        refIds: data.refIds || data.ref_ids || null,
        broadcastId: data.broadcastId || data.broadcast_id || null,
        timestamp: new Date(),
        createdAt: new Date(),
      };
      await db.insert(schema.admin_outbox).values(newOutbox);
      res.json({ success: true, id, admin_outbox: newOutbox, data: newOutbox });
    } catch (error: any) {
      console.error('Error inserting admin_outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/admin-outbox/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      await db.update(schema.admin_outbox).set(updates).where(eq(schema.admin_outbox.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin-outbox/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.admin_outbox).where(eq(schema.admin_outbox.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
"""

if "/api/admin-outbox" not in content:
    content = content.replace("app.post('/api/support-tickets', async (req, res) => {", outbox_api + "\n  app.post('/api/support-tickets', async (req, res) => {")
    with open(filepath, 'w') as f:
        f.write(content)
