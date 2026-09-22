const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

const refreshBlock = `
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

  const handleStatusChange = async (signature: string, newStatus: ErrorStatus) => {
    await errorMonitoringService.updateStatus(signature, newStatus);
    await logActivity({
      action: 'تحديث حالة خطأ بالنظام',
      details: \`تم تغيير حالة الخطأ إلى: \${newStatus}\`,
      targetId: signature,
      targetType: 'system_error'
    });
    handleRefreshData();
  };

  const handleDelete = async (signature: string) => {
    await errorMonitoringService.deleteError(signature);
    handleRefreshData();
  };

  const handleClearResolved = async () => {
    await errorMonitoringService.clearAllResolved();
    showBanner('تم مسح كافة الأخطاء المحلولة بنجاح');
    handleRefreshData();
  };
`;

content = content.replace(/const handleStatusChange = async \([\s\S]*?showBanner\('تم مسح كافة الأخطاء المحلولة بنجاح'\);\n  \};/g, refreshBlock);

// and also refresh on handleSmartFix
content = content.replace(/showBanner\(res\.message\);\n    \} catch/g, "showBanner(res.message);\n      handleRefreshData();\n    } catch");
content = content.replace(/showBanner\(`تم حل وتصحيح \$\{count\} خطأ حرج بالنظام دفعة واحدة بنجاح`\);\n    \} finally/g, "showBanner(`تم حل وتصحيح ${count} خطأ حرج بالنظام دفعة واحدة بنجاح`);\n      handleRefreshData();\n    } finally");
content = content.replace(/showBanner\(`تم حل وتنشيط \$\{count\} استثناء شبكة دفعة واحدة`\);\n    \} finally/g, "showBanner(`تم حل وتنشيط ${count} استثناء شبكة دفعة واحدة`);\n      handleRefreshData();\n    } finally");


fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
