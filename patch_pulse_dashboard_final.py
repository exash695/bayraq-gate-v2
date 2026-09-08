import re

with open('src/components/PortalPulseDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update toggleExpand
old_toggle = """                    const toggleExpand = async () => {
                      const copy = new Set(expandedNotifIds);
                      if (copy.has(n.id)) {
                        copy.delete(n.id);
                      } else {
                        copy.add(n.id);
                        // When expanding, mark unread replies as read
                        const unreadReplies = replies.filter(t => !t.readByAdmin);
                        if (unreadReplies.length > 0) {
                          try {
                            await Promise.all(unreadReplies.map(t => 
                              fetch(`/api/support-tickets/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readByAdmin: true }) }).catch(() => {})
                            ));
                          } catch (err) {
                            console.error("Error marking replies as read", err);
                          }
                        }
                      }
                      setExpandedNotifIds(copy);
                    };"""

new_toggle = """                    const toggleExpand = async () => {
                      const copy = new Set(expandedNotifIds);
                      if (copy.has(n.id)) {
                        copy.delete(n.id);
                      } else {
                        copy.add(n.id);
                        // When expanding, mark unread replies as read
                        const unreadReplies = replies.filter(t => !t.readByAdmin);
                        if (unreadReplies.length > 0) {
                          setAllTickets(prev => prev.map(t => unreadReplies.some(u => u.id === t.id) ? { ...t, readByAdmin: true } : t));
                          try {
                            await Promise.all(unreadReplies.map(t => 
                              fetch(`/api/support-tickets/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readByAdmin: true }) }).catch(() => {})
                            ));
                          } catch (err) {
                            console.error("Error marking replies as read", err);
                          }
                        }
                      }
                      setExpandedNotifIds(copy);
                    };"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle)
    print("Replaced toggleExpand")
else:
    print("Could not find old_toggle")

# 2. Update handleDeleteNotification and handleDeleteAllNotifications
old_delete_block = """  const handleDeleteNotification = async (outboxId: string, refIds: any[] = []) => {
    try {
      if (refIds && refIds.length > 0) {
        await Promise.all(refIds.map(async (ref) => {
          if (ref.collection === 'support_tickets') {
            await fetch(`/api/support-tickets/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          } else if (ref.collection === 'notifications') {
            await fetch(`/api/notifications/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          }
        }));
      }
      await fetch(`/api/admin-outbox/${outboxId}`, { method: 'DELETE' });
      setAdminNotifs(prev => prev.filter(n => n.id !== outboxId));
      showToast('تمت إزالة التبليغ بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast('حدث خطأ أثناء إزالة التبليغ', 'error');
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      if (adminNotifs.length === 0) return;
      
      const deletePromises: Promise<any>[] = [];
      for (const n of adminNotifs) {
        if (n.refIds && n.refIds.length > 0) {
          n.refIds.forEach((ref: any) => {
            if (ref.collection === 'support_tickets') {
              deletePromises.push(fetch(`/api/support-tickets/${ref.id}`, { method: 'DELETE' }).catch(() => {}));
            } else if (ref.collection === 'notifications') {
              deletePromises.push(fetch(`/api/notifications/${ref.id}`, { method: 'DELETE' }).catch(() => {}));
            }
          });
        }
        deletePromises.push(fetch(`/api/admin-outbox/${n.id}`, { method: 'DELETE' }).catch(() => {}));
      }
      
      await Promise.all(deletePromises);
      setAdminNotifs([]);
      showToast('تم حذف كافة التبليغات المُرسلة بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      showToast('حدث خطأ أثناء حذف كافة التبليغات', 'error');
    }
  };"""

new_delete_block = """  const handleDeleteNotification = async (outboxId: string, refIds: any[] = []) => {
    setAdminNotifs(prev => prev.filter(n => n.id !== outboxId));
    try {
      if (refIds && refIds.length > 0) {
        await Promise.all(refIds.map(async (ref) => {
          if (ref.collection === 'support_tickets') {
            await fetch(`/api/support-tickets/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          } else if (ref.collection === 'notifications') {
            await fetch(`/api/notifications/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          }
        }));
      }
      await fetch(`/api/admin-outbox/${outboxId}`, { method: 'DELETE' });
      showToast('تمت إزالة التبليغ بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast('حدث خطأ أثناء إزالة التبليغ', 'error');
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      if (adminNotifs.length === 0) return;
      setAdminNotifs([]);
      setIsDeleteAllNotifsConfirmOpen(false);
      await fetch('/api/admin-outbox', { method: 'DELETE' }).catch(() => {});
      showToast('تم حذف كافة التبليغات المُرسلة بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      showToast('حدث خطأ أثناء حذف كافة التبليغات', 'error');
    }
  };"""

if old_delete_block in content:
    content = content.replace(old_delete_block, new_delete_block)
    print("Replaced delete functions in PortalPulseDashboard")
else:
    print("Could not find old_delete_block")

with open('src/components/PortalPulseDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
