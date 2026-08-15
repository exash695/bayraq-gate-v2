const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/FleetPanel.tsx', 'utf8');

const mapRenderOld = `          return (
            <LeafletTrackingMap 
              center={{ lat: 31.735500, lng: 44.605000 }}
              zoom={14}
              school={schoolCoord}
              stops={filteredStops}
              buses={filteredBuses}
              landmarks={[]} // Clean map, no landmarks
              routeLine={activeRouteLine}
              selectedBusId={selectedBusId}
              selectedStopId={selectedStopId}
            />
          );`;

const mapRenderNew = `          // Compute progress based on path index
          const busProgressMap = buses.reduce((acc, bus) => {
             const path = BUS_PATHS[bus.id];
             if (!path) { acc[bus.id] = 0; return acc; }
             const maxIndex = path.length - 1;
             const currentIdx = busPathIndices[bus.id] || 0;
             acc[bus.id] = maxIndex > 0 ? currentIdx / maxIndex : 0;
             return acc;
          }, {} as Record<string, number>);

          return (
            <MetroTransitViewer 
              buses={buses}
              stops={GHAMMAS_STOPS}
              schoolName={schoolCoord.name}
              busProgressMap={busProgressMap}
              selectedBusId={selectedBusId}
              onSelectBus={(id) => {
                 setSelectedBusId(id);
                 if (id) {
                    const bus = buses.find(b => b.id === id);
                    if (bus) setActiveRouteLine(BUS_PATHS[bus.id] || null);
                 } else {
                    setActiveRouteLine(null);
                    setSelectedStopId(null);
                 }
              }}
            />
          );`;

code = code.replace(mapRenderOld, mapRenderNew);
fs.writeFileSync('src/components/Transport/FleetPanel.tsx', code);
