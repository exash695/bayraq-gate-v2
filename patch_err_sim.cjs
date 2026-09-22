const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

const simBlock = `
  const handleTriggerTestError = async () => {
    const testErrors = [
      {
        signature: \`test_err_\${Date.now()}\`,
        service: 'firestore',
        module: 'collection:users',
        errorMessage: 'PERMISSION_DENIED: Missing or insufficient permissions on /users/test_user',
        severity: 'critical',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        action: 'test_simulation_probe'
      },
      {
        signature: \`test_err_\${Date.now()}\`,
        service: 'network',
        module: 'api:worker:ai:chat',
        errorMessage: 'Network timeout (504 Gateway Timeout) when contacting AI Worker Gateway',
        severity: 'warning',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        action: 'test_simulation_probe'
      },
      {
        signature: \`test_err_\${Date.now()}\`,
        service: 'ui',
        module: 'DevDashboard',
        errorMessage: 'TypeError: Cannot read properties of undefined (reading "schoolConfig")',
        severity: 'critical',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        stackTrace: 'Error: Cannot read properties of undefined\\n    at DevDashboard.render (DevDashboard.tsx:492)\\n    at ReactCompositeComponent.mountComponent',
        action: 'test_simulation_probe'
      }
    ];

    const random = testErrors[Math.floor(Math.random() * testErrors.length)];
    try {
      await fetch('/api/system_errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(random)
      });
      // Force refresh
      const res = await fetch('/api/system_errors');
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        setErrors(data);
      }
    } catch (e) {
      console.error(e);
    }
  };
`;

content = content.replace(/const handleTriggerTestError = async \(\) => \{[\s\S]*?await errorMonitoringService\.captureError\(random\);\n  \};/g, simBlock);

fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
