const fs = require('fs');
let content = fs.readFileSync('src/components/dev/SecurityAccessSection.tsx', 'utf8');

const replacementFunc = `
  useEffect(() => {
    const fetchBanned = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/security/bans');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setBannedList(data);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load bans:', e);
      } finally {
        setLoading(false);
      }
      setBannedList(DEFAULT_BANNED);
    };
    fetchBanned();
  }, []);

  const handleLiftBan = async (id: string, value: string) => {
    try {
      await fetch(\`/api/security/bans/\${id}\`, { method: 'DELETE' });
    } catch (e) {}
    
    setBannedList(prev => prev.filter(b => b.id !== id));
    showActionToast(\`تم رفع الحظر بنجاح عن \${value}\`, 'lift_ban');
  };

  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banForm.value || !banForm.reason) {
      showActionToast('يرجى تعبئة كافة حقول الحظر', 'error');
      return;
    }
    
    const newBan: BannedEntity = {
      id: \`ban_\${Date.now()}\`,
      type: banForm.type as any,
      value: banForm.value,
      reason: banForm.reason,
      failedAttempts: 10,
      bannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + Number(banForm.durationHours) * 60 * 60 * 1000).toISOString(),
      status: 'active_ban'
    };

    try {
      await fetch('/api/security/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBan)
      });
    } catch (err) {}

    setBannedList(prev => [newBan, ...prev]);
    setIsBanModalOpen(false);
    showActionToast(\`تم فرض حظر أمني جديد على \${banForm.value}\`, 'add_ban');
  };
`;

content = content.replace(/\/\/ Load Banned data[\s\S]*?showActionToast\(`تم فرض حظر أمني جديد على \$\{banForm.value\}`\, 'add_ban'\);\n  \};/g, replacementFunc.trim());

// Clean up imports
content = content.replace(/import \{ collection, getDocs, doc, setDoc, updateDoc, serverTimestamp \} from '@\/src\/lib\/firebase';\n/g, '');
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/SecurityAccessSection.tsx', content);
