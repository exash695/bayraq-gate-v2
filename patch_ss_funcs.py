import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# markNotificationsAsRead
old_mark = """  const markNotificationsAsRead = async (notifs: AppNotification[]) => {
    for (const notif of notifs) {
      if (onMarkNotificationAsRead) {
        onMarkNotificationAsRead(notif.id);
      } else {
        try {
          await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        } catch (e) {
          console.error("Could not mark notification as read", e);
        }
      }
    }
  };"""

new_mark = """  const markNotificationsAsRead = async (notifs: AppNotification[]) => {
    for (const notif of notifs) {
      if (onMarkNotificationAsRead) {
        onMarkNotificationAsRead(notif.id);
      } else {
        try {
          await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
        } catch (e) {
          console.error("Could not mark notification as read", e);
        }
      }
    }
  };"""
content = content.replace(old_mark, new_mark)

# handleMarkSocialRead
old_social_read = """  const handleMarkSocialRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    for (const notif of unread) {
      try {
         await updateDoc(doc(db, 'social_notifications', notif.id), { read: true });
      } catch (e) {
         console.warn("Could not mark social notif as read", e);
      }
    }
  };"""

new_social_read = """  const handleMarkSocialRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    for (const notif of unread) {
      try {
         await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      } catch (e) {
         console.warn("Could not mark social notif as read", e);
      }
    }
    if (unread.length > 0) {
       setSocialNotifications(prev => prev.map(n => unread.find(u => u.id === n.id) ? { ...n, read: true } : n));
    }
  };"""
content = content.replace(old_social_read, new_social_read)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated mark functions")
