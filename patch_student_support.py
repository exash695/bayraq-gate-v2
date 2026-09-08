import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the useEffect block for social_notifications
old_effect = """  useEffect(() => {
     if (!isOpen) return;
     try {
      const unsubs: any[] = [];
      
      let items1: any[] = [];
      let items2: any[] = [];
      
      const updateCombined = () => {
        const map = new Map();
        items1.forEach(x => map.set(x.id, x));
        items2.forEach(x => map.set(x.id, x));
        setSocialNotifications(Array.from(map.values()).sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      };

      if (userId) {
        const q1 = query(collection(db, 'social_notifications'), where('recipientUserId', '==', userId));
        unsubs.push(onSnapshot(q1, snap => {
           items1 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           updateCombined();
        }, error => {
           console.warn("Error fetching social_notifications for userId:", error);
        }));
      }
      if (studentName) {
        const q2 = query(collection(db, 'social_notifications'), where('recipientName', '==', studentName));
        unsubs.push(onSnapshot(q2, snap => {
           items2 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           updateCombined();
        }, error => {
           console.warn("Error fetching social_notifications for studentName:", error);
        }));
      }

       return () => unsubs.forEach(u => u());
     } catch (e) {
       console.warn("Social notifications error:", e);
     }
  }, [isOpen, userId, studentName]);"""

new_effect = """  useEffect(() => {
     if (!isOpen) return;
     let isMounted = true;
     const fetchNotifs = async () => {
       try {
         const targetId = userId || studentName || studentCode || parentCode || 'unknown';
         const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(targetId)}`);
         const data = await res.json();
         if (isMounted && data.success) {
           setSocialNotifications(data.notifications || []);
         }
       } catch (e) {
         console.warn("Notifications error:", e);
       }
     };
     fetchNotifs();
     return () => { isMounted = false; };
  }, [isOpen, userId, studentName, studentCode, parentCode]);"""

content = content.replace(old_effect, new_effect)

# Replace handleMarkSocialRead
old_mark_social_read = """  const handleMarkSocialRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    for (const notif of unread) {
      try {
         await updateDoc(doc(db, 'social_notifications', notif.id), { read: true });
      } catch (e) {
         console.warn("Could not mark social notif as read", e);
      }
    }
  };"""

new_mark_social_read = """  const handleMarkSocialRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    for (const notif of unread) {
      try {
         await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      } catch (e) {
         console.warn("Could not mark notif as read", e);
      }
    }
    setSocialNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };"""

content = content.replace(old_mark_social_read, new_mark_social_read)

# Replace handleDeleteSocialNotification
old_delete_notif = """  const handleDeleteSocialNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'social_notifications', id));
    } catch (err) {
      console.warn("Delete social notification failed:", err);
    }
  };"""

new_delete_notif = """  const handleDeleteSocialNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setSocialNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.warn("Delete social notification failed:", err);
    }
  };"""

content = content.replace(old_delete_notif, new_delete_notif)

# Replace handleDeleteAllSocialNotifications
old_delete_all = """  const handleDeleteAllSocialNotifications = async () => {
    if (socialNotifications.length === 0) return;
    const idsToDelete = socialNotifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'social_notifications', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.warn("Delete all social notifications failed:", err);
    }
  };"""

new_delete_all = """  const handleDeleteAllSocialNotifications = async () => {
    if (socialNotifications.length === 0) return;
    const idsToDelete = socialNotifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {}));
      await Promise.all(promises);
      setSocialNotifications([]);
    } catch (err) {
      console.warn("Delete all social notifications failed:", err);
    }
  };"""

content = content.replace(old_delete_all, new_delete_all)

with open(filepath, 'w') as f:
    f.write(content)
print("StudentSupportForm updated successfully")
