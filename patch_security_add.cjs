const fs = require('fs');
let content = fs.readFileSync('src/components/dev/SecurityAccessSection.tsx', 'utf8');

const newAdd = `
  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanValue.trim()) {
      showToast('يرجى كتابة عنوان IP أو معرف الجهاز');
      return;
    }

    const item: BannedEntity = {
      id: \`ban-\${Date.now()}\`,
      type: newBanType,
      value: newBanValue.trim(),
      reason: newBanReason,
      failedAttempts: 6,
      bannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active_ban'
    };

    try {
      await fetch('/api/security/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {
      console.error(e);
    }

    setBannedEntities(prev => [item, ...prev]);
    setNewBanValue('');
    showToast(\`تم حظر \${item.value} وتعميمه على جدار الحماية 🛡️\`);

    await logActivity({
      action: 'إضافة حظر أمني',
      details: \`تم حظر \${item.type}: \${item.value} - السبب: \${item.reason}\`,
      targetId: item.id,
      targetType: 'security_bans'
    });
  };
`;

const newLift = `
  const handleLiftBan = async (id: string, val: string) => {
    try {
      await fetch(\`/api/security/bans/\${id}\`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    setBannedEntities(prev => prev.filter(b => b.id !== id));
    showToast(\`تم رفع الحظر عن (\${val}) بنجاح ✓\`);

    await logActivity({
      action: 'رفع حظر أمني',
      details: \`تم رفع الحظر عن: \${val}\`,
      targetId: id,
      targetType: 'security_bans'
    });
  };
`;

content = content.replace(/const handleAddBan = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n/g, newAdd + '\n');
content = content.replace(/const handleLiftBan = async \(id: string, val: string\) => \{[\s\S]*?\n  \};\n/g, newLift + '\n');

fs.writeFileSync('src/components/dev/SecurityAccessSection.tsx', content);
