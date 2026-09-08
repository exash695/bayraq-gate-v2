import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_del = """  const handleDeleteAllSocialNotifications = async () => {
    if (!socialNotifications.length) return;
    const idsToDelete = socialNotifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'social_notifications', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.warn("Delete all social notifications failed:", err);
    }
  };"""

new_del = """  const handleDeleteAllSocialNotifications = async () => {
    if (!socialNotifications.length) return;
    const idsToDelete = socialNotifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {}));
      await Promise.all(promises);
      setSocialNotifications([]);
    } catch (err) {
      console.warn("Delete all social notifications failed:", err);
    }
  };"""
content = content.replace(old_del, new_del)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated delete all")
