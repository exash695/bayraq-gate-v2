const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const patchEndpoint = `
app.patch('/api/system_errors/:id', async (req, res) => {
  try {
    const { status } = req.body;
    // first get the existing doc
    const records = await db.select().from(firestore_docs).where(and(eq(firestore_docs.collection, 'system_errors'), eq(firestore_docs.docId, req.params.id)));
    if (records.length > 0) {
      const data = { ...records[0].data, status };
      await db.update(firestore_docs).set({ data }).where(and(eq(firestore_docs.collection, 'system_errors'), eq(firestore_docs.docId, req.params.id)));
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
`;

content = content.replace(/app\.patch\('\/api\/system_errors\/:id', async \(req, res\) => \{\n    res\.json\(\{ success: true \}\);\n  \}\);/g, patchEndpoint);

fs.writeFileSync('server.ts', content);
