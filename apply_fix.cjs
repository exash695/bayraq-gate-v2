const fs = require('fs');

try {
  let serverCode = fs.readFileSync('server.ts', 'utf8');
  
  // Find the /api/schools GET endpoint and update it to include general and school8 defaults
  const targetRoute = "app.get('/api/schools', async (req, res) => {";
  if (serverCode.includes(targetRoute)) {
    console.log("Found /api/schools route in server.ts");
  } else {
    console.log("Route not found exactly");
  }
} catch (e) {
  console.error("Error reading server.ts:", e);
}
