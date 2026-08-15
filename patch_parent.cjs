const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');

const mapOld = `                                  <LeafletTrackingMap 
                                    center={{ lat: studentStop.lat, lng: studentStop.lng }}
                                    zoom={15}
                                    school={{ lat: SCHOOL_COORDINATE.lat, lng: SCHOOL_COORDINATE.lng, name: SCHOOL_COORDINATE.name }}
                                    stops={mapStops}
                                    buses={mapBuses}
                                    routeLine={routeLine}
                                    selectedStopId={student.id}
                                    interactive={true}
                                    height="100%"
                                  />`;

// I will simulate the bus progress for the parent view.
// In the parent view, buses have a `progress` variable? No, it's simulated with lat/lng.
// For the metro transit, we just pass the dummy progress.
const mapNew = `                                  <MetroTransitViewer 
                                    buses={mapBuses}
                                    stops={Object.entries(STOPS).map(([id, s]) => ({ id, name: s.name, waitingStudents: 0, busId: route?.busId }))}
                                    schoolName={SCHOOL_COORDINATE.name}
                                    busProgressMap={mapBuses.reduce((acc, bus) => { acc[bus.id] = 0.5; return acc; }, {} as Record<string, number>)}
                                    selectedBusId={null}
                                    onSelectBus={() => {}}
                                  />`;

code = code.replace(mapOld, mapNew);
code = code.replace(/<LeafletTrackingMap/g, "<MetroTransitViewer");

fs.writeFileSync('src/components/Transport/ParentTransportView.tsx', code);
