const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/DriverDashboard.tsx', 'utf8');

const mapOld = `<LeafletTrackingMap 
                              center={gpsCoordinates}
                              zoom={15}
                              school={schoolCoord}
                              stops={mapStops}
                              buses={mapBuses}
                              routeLine={routeLine}
                              selectedBusId={routeId}
                              interactive={true}
                              height="100%"
                            />`;

const mapNew = `<MetroTransitViewer 
                              buses={mapBuses}
                              stops={mapStops}
                              schoolName={schoolCoord.name}
                              busProgressMap={{ [routeId]: 0.5 }}
                              selectedBusId={null}
                              onSelectBus={() => {}}
                            />`;

code = code.replace(mapOld, mapNew);
code = code.replace(/<LeafletTrackingMap[\s\S]*?\/>/g, mapNew);

fs.writeFileSync('src/components/Transport/DriverDashboard.tsx', code);
