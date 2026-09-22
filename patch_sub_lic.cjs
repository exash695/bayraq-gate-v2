const fs = require('fs');
let content = fs.readFileSync('src/components/dev/SubscriptionsLicensingSection.tsx', 'utf8');

const updateFunction = `
  const handleUpdateLicense = async (updated: SchoolLicense) => {
    try {
      const computedStatus = computeLicenseStatus(updated.status, updated.expiryDate);
      const updatedWithStatus = { ...updated, status: computedStatus };

      const payload = {
        plan: updated.plan,
        maxStudents: Number(updated.maxStudents),
        subscriptionStart: updated.startDate,
        expiryDate: updated.expiryDate,
        subscriptionStatus: computedStatus,
        paymentStatus: updated.paymentStatus,
        licenseNotes: updated.notes
      };

      const res = await fetch(\`/api/schools/\${updated.schoolId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update license');

      await logActivity({
        action: 'تحديث بيانات ترخيص واشتراك المدرسة',
        details: \`تم تحديث اشتراك مدرسة \${updated.schoolName} (\${updated.plan}) (\${computedStatus})\`,
        targetId: updated.schoolId,
        targetType: 'school_license'
      });

      setLicenses(prev => prev.map(lic => lic.id === updated.id ? updatedWithStatus : lic));
      setEditingLicense(null);
      
      const el = document.createElement('div');
      el.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-2';
      el.innerHTML = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> تم تحديث الترخيص والاشتراك بنجاح';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
      
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تحديث بيانات الترخيص. يرجى المحاولة مرة أخرى.');
    }
  };
`;

content = content.replace(/const handleUpdateLicense = async \(updated: SchoolLicense\) => \{[\s\S]*?alert\('حدث خطأ أثناء تحديث بيانات الترخيص\. يرجى المحاولة مرة أخرى\.'\);\n    \}\n  \};/g, updateFunction.trim());

// Remove firebase imports
content = content.replace(/import \{ collection, getDocs, doc, updateDoc, serverTimestamp \} from '@\/src\/lib\/firebase';\n/g, '');
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';\n/g, '');

fs.writeFileSync('src/components/dev/SubscriptionsLicensingSection.tsx', content);
