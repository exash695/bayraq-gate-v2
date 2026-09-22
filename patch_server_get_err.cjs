const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacementGet = `
app.get('/api/system_errors', async (req, res) => {
  try {
    // using like instead of eq collection due to schema changes
    const records = await db.select().from(firestore_docs).where(sql\`path LIKE 'system_errors/%'\`);
    const data = records.map(r => ({ id: r.path.split('/')[1], ...r.data }));
    res.json(data);
  } catch(e) { 
    console.error(e);
    res.status(500).json([]); 
  }
});
`;

content = content.replace(/app\.get\('\/api\/system_errors'[\s\S]*?\}\);/g, replacementGet);

const replacementDel = `
app.delete('/api/system_errors/:id', async (req, res) => {
  try {
    await db.delete(firestore_docs).where(eq(firestore_docs.path, \`system_errors/\${req.params.id}\`));
    res.json({ success: true });
  } catch(e) { 
    console.error(e);
    res.status(500).json({ error: e.message }); 
  }
});
`;

content = content.replace(/app\.delete\('\/api\/system_errors\/:id'[\s\S]*?\}\);/g, replacementDel);

const replacementPatch = `
app.patch('/api/system_errors/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const fullPath = \`system_errors/\${req.params.id}\`;
    const records = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
    if (records.length > 0) {
      const data = { ...records[0].data, status };
      await db.update(firestore_docs).set({ data }).where(eq(firestore_docs.path, fullPath));
    }
    res.json({ success: true });
  } catch(e) { 
    console.error(e);
    res.status(500).json({ error: e.message }); 
  }
});
`;

content = content.replace(/app\.patch\('\/api\/system_errors\/:id'[\s\S]*?\}\);/g, replacementPatch);

fs.writeFileSync('server.ts', content);
