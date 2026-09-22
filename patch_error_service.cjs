const fs = require('fs');
let content = fs.readFileSync('src/services/errorMonitoringService.ts', 'utf8');

// Stop writing to Firestore
content = content.replace(/private async persistErrorToFirestore[\s\S]*?\}\s*\}/g, 'private async persistErrorToFirestore(item: SystemErrorItem) { /* disabled */ }');

// Stop reading from Firestore
content = content.replace(/private subscribeToFirestore\(\) \{[\s\S]*?\}\s*\}\s*\n/g, 'private subscribeToFirestore() { /* disabled */ }\n');

fs.writeFileSync('src/services/errorMonitoringService.ts', content);
