const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');

code = code.replace(/<MetroTransitViewer[\s\S]*?\/>/g, `<MetroTransitViewer 
                                    buses={mapBuses}
                                    stops={Object.entries(STOPS).map(([id, s]) => ({ id, name: s.name, waitingStudents: 0, busId: route?.busId }))}
                                    schoolName={SCHOOL_COORDINATE.name}
                                    busProgressMap={mapBuses.reduce((acc, bus) => { acc[bus.id] = 0.5; return acc; }, {})}
                                    selectedBusId={null}
                                    onSelectBus={() => {}}
                                  />`);

fs.writeFileSync('src/components/Transport/ParentTransportView.tsx', code);
