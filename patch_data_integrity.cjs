const fs = require('fs');
let content = fs.readFileSync('src/components/dev/DataIntegritySection.tsx', 'utf8');

const syncCodesFunction = `
  const handleSyncCodesToSql = async () => {
    setIsSyncingCodes(true);
    try {
      console.log('Starting sync of activation codes...');
      const res = await fetch('/api/activation-codes');
      if (!res.ok) throw new Error('Failed to fetch activation codes');
      
      const codes = await res.json();

      if (!codes || codes.length === 0) {
        showSuccessBanner('لا توجد أكواد تفعيل صالحة للمزامنة');
        return;
      }

      console.log(\`Syncing \${codes.length} codes to SQL...\`);
      const result = await activationCodesService.syncToSql(codes);
      console.log('Sync result:', result);
      
      await logActivity({
        action: 'مزامنة أكواد التفعيل إلى SQL',
        details: \`تمت مزامنة \${result.synced || codes.length} كود تفعيل بنجاح\`,
        targetType: 'system_integrity'
      });
      showSuccessBanner(\`تمت مزامنة \${result.synced || codes.length} كود تفعيل مع قاعدة البيانات (PostgreSQL)\`);
      
      if (result.failed > 0) {
        setTimeout(() => showSuccessBanner(\`فشلت مزامنة \${result.failed} كود بسبب التكرار أو أخطاء\`), 4000);
      }
      
      handleRunAudit();
    } catch (e: any) {
      console.error('Error syncing codes:', e);
      showErrorBanner('فشلت مزامنة أكواد التفعيل: ' + e.message);
    } finally {
      setIsSyncingCodes(false);
    }
  };
`;

content = content.replace(/const handleSyncCodesToSql = async \(\) => \{[\s\S]*?setIsSyncingCodes\(false\);\n    \}\n  \};/g, syncCodesFunction.trim());

// Clean up imports
content = content.replace(/import \{ collection, getDocs, query \} from '@\/src\/lib\/firebase';\n/g, '');
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/DataIntegritySection.tsx', content);
