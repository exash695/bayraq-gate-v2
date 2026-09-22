const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

const additional = `
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/system_errors');
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        setErrors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
`;

content = content.replace(/const handleCopy = /g, additional + "\n  const handleCopy = ");

fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
