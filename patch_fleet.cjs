const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/FleetPanel.tsx', 'utf8');

code = code.replace(/selectedBus \|\|/g, "selectedBusId ||");
code = code.replace(/selectedStop \?/g, "selectedStopId ?");
code = code.replace(/selectedStop\)\?/g, "selectedStopId)?");
code = code.replace(/selectedBusId=\{selectedBus\}/g, "selectedBusId={selectedBusId}");
code = code.replace(/selectedStopId=\{selectedStop\}/g, "selectedStopId={selectedStopId}");

fs.writeFileSync('src/components/Transport/FleetPanel.tsx', code);
