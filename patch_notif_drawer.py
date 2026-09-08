import os
filepath = 'src/components/NotificationDrawer.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_1 = "import React, { useState } from 'react';"
new_1 = "import React, { useState, useEffect } from 'react';"
content = content.replace(old_1, new_1)

old_2 = """  const unreadCount = notifications.filter(n => !n.read).length;

  const [confirmDelete, setConfirmDelete] = useState(false);"""

new_2 = """  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notifications.filter(n => !n.read).forEach(notif => {
         if (notif.id) onMarkAsRead(notif.id);
      });
    }
  }, [isOpen, unreadCount, notifications, onMarkAsRead]);

  const [confirmDelete, setConfirmDelete] = useState(false);"""
content = content.replace(old_2, new_2)

with open(filepath, 'w') as f:
    f.write(content)
