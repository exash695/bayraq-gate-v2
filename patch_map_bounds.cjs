const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/LeafletTrackingMap.tsx', 'utf8');

// We want to remove the static ghammasBounds and use dynamic bounds
code = code.replace(/const ghammasBounds = L.latLngBounds\([\s\S]*?\);\n/g, "");

// Modify minZoom and maxBounds when creating the map
code = code.replace(/minZoom: 13,/g, "minZoom: 14,");
code = code.replace(/maxBounds: ghammasBounds,/g, "maxBounds: undefined, // will be set dynamically");

// Now let's inject setMaxBounds in the bounds effect
const boundsLogicOld = `const bounds = L.latLngBounds(allPoints);
      
      // We only execute fitBounds if it's a structural change or returning to overview
      if (stopsChanged || routeChanged || (!selectedBusId && !selectedStopId)) {
        // slight delay to let the map finish rendering DOM elements
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            }
        }, 100);
      }`;

const boundsLogicNew = `const bounds = L.latLngBounds(allPoints);
      
      // Restrict panning completely outside the active school zone
      // Padding of ~1.5km to allow reasonable drag
      if (mapInstanceRef.current) {
          mapInstanceRef.current.setMaxBounds(bounds.pad(0.2));
      }
      
      // We only execute fitBounds if it's a structural change or returning to overview
      if (stopsChanged || routeChanged || (!selectedBusId && !selectedStopId)) {
        // slight delay to let the map finish rendering DOM elements
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            }
        }, 100);
      }`;

code = code.replace(boundsLogicOld, boundsLogicNew);

fs.writeFileSync('src/components/Transport/LeafletTrackingMap.tsx', code);
