const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

const fetchEffect = `
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchErrors = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/system_errors');
        if (res.ok) {
          const data = await res.json();
          data.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
          setErrors(data);
        }
      } catch (err) {
        console.error('Failed to fetch errors', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchErrors();
    const interval = setInterval(fetchErrors, 10000);
    return () => clearInterval(interval);
  }, []);
`;

content = content.replace(/useEffect\(\(\) => \{\s*const unsubscribe = errorMonitoringService\.subscribe\(\(list\) => \{\s*setErrors\(list\);\s*\}\);\s*return \(\) => \{\s*unsubscribe\(\);\s*\};\s*\}, \[\]\);/g, fetchEffect);

fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
