const fs = require('fs');
let content = fs.readFileSync('src/components/dev/SecurityAccessSection.tsx', 'utf8');

const fetchEffect = `
  useEffect(() => {
    const fetchBans = async () => {
      try {
        const res = await fetch('/api/security/bans');
        if (res.ok) {
          const data = await res.json();
          setBannedEntities(data.map((d: any) => ({
            id: d.id,
            type: d.type,
            value: d.value,
            reason: d.reason,
            failedAttempts: d.failed_attempts || 0,
            bannedAt: d.banned_at || new Date().toISOString(),
            expiresAt: d.expires_at || '',
            status: d.status
          })));
        }
      } catch (err) {
        console.error('Failed to fetch security bans', err);
      }
    };
    fetchBans();
  }, []);
`;

if (!content.includes('fetchBans')) {
  content = content.replace('const showToast = (msg: string) => {', fetchEffect + '\n  const showToast = (msg: string) => {');
}

fs.writeFileSync('src/components/dev/SecurityAccessSection.tsx', content);
