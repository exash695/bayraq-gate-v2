const fs = require('fs');
let driverCode = fs.readFileSync('src/components/Transport/DriverDashboard.tsx', 'utf8');
driverCode = driverCode.replace(/lat: 31\.8145, lng: 44\.6055/g, "lat: 31.735500, lng: 44.605000");
fs.writeFileSync('src/components/Transport/DriverDashboard.tsx', driverCode);

let parentCode = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');
parentCode = parentCode.replace(/lat: 31\.8145, lng: 44\.6055/g, "lat: 31.735500, lng: 44.605000");

// Also let's update Leaflet map bounding box fallbacks
let mapCode = fs.readFileSync('src/components/Transport/LeafletTrackingMap.tsx', 'utf8');
mapCode = mapCode.replace(/31\.88, 44\.70/g, "31.80, 44.70"); // adjust bounds slightly if needed
mapCode = mapCode.replace(/31\.75, 44\.50/g, "31.60, 44.50");
mapCode = mapCode.replace(/31\.8145, 44\.6055/g, "31.7355, 44.6050");
mapCode = mapCode.replace(/31\.8200, 44\.6000/g, "31.7400, 44.6000");
fs.writeFileSync('src/components/Transport/LeafletTrackingMap.tsx', mapCode);

