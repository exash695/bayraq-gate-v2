const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');

code = code.replace(/stops=\{Object.entries\(STOPS\).map/g, "stops={Object.entries(STOP_COORDINATES).map");

fs.writeFileSync('src/components/Transport/ParentTransportView.tsx', code);
