const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
// ==========================================
// System Errors Endpoints (Firestore Proxy)
// ==========================================
app.get('/api/system_errors', async (req, res) => {
  try {
    const records = await db.select().from(firestore_docs).where(eq(firestore_docs.collection, 'system_errors'));
    const data = records.map(r => ({ id: r.docId, ...r.data }));
    res.json(data);
  } catch(e) { res.status(500).json([]); }
});

app.post('/api/system_errors', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const docId = id || data.signature || \`err-\${Date.now()}\`;
    await db.insert(firestore_docs).values({
      collection: 'system_errors',
      docId,
      data,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: [firestore_docs.collection, firestore_docs.docId],
      set: { data, updatedAt: new Date() }
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/system_errors/:id', async (req, res) => {
  try {
    await db.delete(firestore_docs).where(and(eq(firestore_docs.collection, 'system_errors'), eq(firestore_docs.docId, req.params.id)));
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
`;

content = content.replace(/app\.get\('\/api\/system_errors'[\s\S]*?app\.put\('\/api\/system_errors\/:id', async \(req, res\) => \{\n    res\.json\(\{ success: true \}\);\n  \}\);/g, replacement);

fs.writeFileSync('server.ts', content);
