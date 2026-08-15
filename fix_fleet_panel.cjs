const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/FleetPanel.tsx', 'utf8');

code = code.replace(/onSelectBus=\{\(id\) => \{[\s\S]*?\}\}/g, `onSelectBus={(id) => {
                 setSelectedBusId(id);
                 if (!id) {
                    setSelectedStopId(null);
                 }
              }}`);

fs.writeFileSync('src/components/Transport/FleetPanel.tsx', code);
