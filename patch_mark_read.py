import os
filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_1 = """  useEffect(() => {
    if (isOpen && view === 'history') {
      const unreadTickets = allTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined));
      if (unreadTickets.length > 0) {
        markAsRead(unreadTickets);
      }
      
      const unreadNotifs = displayNotifications.filter(n => !n.read);
      if (unreadNotifs.length > 0) {
        markNotificationsAsRead(unreadNotifs);
      }
    }

    if (isOpen && view === 'social') {
      handleMarkSocialRead();
    }
  }, [isOpen, view, allTickets, notifications, socialNotifications]);"""

new_1 = """  useEffect(() => {
    if (isOpen) {
      const unreadTickets = allTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined));
      if (unreadTickets.length > 0) {
        markAsRead(unreadTickets);
      }
      
      const unreadNotifs = displayNotifications.filter(n => !n.read);
      if (unreadNotifs.length > 0) {
        markNotificationsAsRead(unreadNotifs);
      }
      
      handleMarkSocialRead();
      
      // Auto switch view to history if there are unread history items and we just opened it
      if (unreadTickets.length > 0 || unreadNotifs.length > 0) {
         setView('history');
      }
    }
  }, [isOpen, allTickets, displayNotifications]);"""

content = content.replace(old_1, new_1)
with open(filepath, 'w') as f:
    f.write(content)
