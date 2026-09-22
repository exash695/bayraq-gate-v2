const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
app.post('/api/system_errors', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const docId = id || data.signature || \`err-\${Date.now()}\`;
    const fullPath = \`system_errors/\${docId}\`;
    await db.insert(firestore_docs).values({
      path: fullPath,
      data,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: firestore_docs.path,
      set: { data, updatedAt: new Date() }
    });
    res.json({ success: true });
  } catch(e) { 
    console.error(e);
    res.status(500).json({ error: e.message }); 
  }
});
`;

content = content.replace(/app\.post\('\/api\/system_errors'[\s\S]*?\}\);/g, replacement);

fs.writeFileSync('server.ts', content);
