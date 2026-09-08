import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_del1 = """  const handleDeleteNotification = async (id: string) => {
    try {
      if (onMarkNotificationAsRead) {
        // App controls it
      } else {
        await deleteDoc(doc(db, 'notifications', id));
      }
    } catch (err) {
      console.warn("Delete notification failed:", err);
    }
  };"""

new_del1 = """  const handleDeleteNotification = async (id: string) => {
    try {
      if (onMarkNotificationAsRead) {
        // App controls it
      } else {
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn("Delete notification failed:", err);
    }
  };"""

old_del2 = """  const handleDeleteAllNotifications = async () => {
    if (!notifications?.length) return;
    const idsToDelete = notifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'notifications', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.warn("Delete all notifications failed:", err);
    }
    setConfirmDeleteAll(false);
  };"""

new_del2 = """  const handleDeleteAllNotifications = async () => {
    if (!notifications?.length) return;
    const idsToDelete = notifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.warn("Delete all notifications failed:", err);
    }
    setConfirmDeleteAll(false);
  };"""

content = content.replace(old_del1, new_del1).replace(old_del2, new_del2)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated delete funcs")
