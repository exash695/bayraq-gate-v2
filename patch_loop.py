import os
filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("  }, [isOpen, allTickets, displayNotifications]);", "  }, [isOpen, allTickets, notifications, socialNotifications]);")
with open(filepath, 'w') as f:
    f.write(content)
