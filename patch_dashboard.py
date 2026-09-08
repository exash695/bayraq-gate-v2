import os

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_single = """      await fetch(`/api/admin-outbox/${outboxId}`, { method: 'DELETE' });
      showToast('تمت إزالة التبليغ بنجاح', 'success');"""
new_single = """      await fetch(`/api/admin-outbox/${outboxId}`, { method: 'DELETE' });
      setAdminNotifs(prev => prev.filter(n => n.id !== outboxId));
      showToast('تمت إزالة التبليغ بنجاح', 'success');"""
content = content.replace(old_single, new_single)

old_all = """      await Promise.all(deletePromises);
      showToast('تم حذف كافة التبليغات المُرسلة بنجاح', 'success');"""
new_all = """      await Promise.all(deletePromises);
      setAdminNotifs([]);
      showToast('تم حذف كافة التبليغات المُرسلة بنجاح', 'success');"""
content = content.replace(old_all, new_all)

with open(filepath, 'w') as f:
    f.write(content)
