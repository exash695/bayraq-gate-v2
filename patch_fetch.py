import os

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """          // Fetch Notifications
          const notifRes = await fetch('/api/notifications');
          const notifData = await notifRes.json();
          if (notifData.success) setAdminNotifs(notifData.notifications);"""

new_code = """          // Fetch Admin Outbox
          const outboxRes = await fetch('/api/admin-outbox' + (selectedSchoolId ? `?schoolId=${selectedSchoolId}` : ''));
          const outboxData = await outboxRes.json();
          if (outboxData.success) setAdminNotifs(outboxData.admin_outbox);"""

content = content.replace(old_code, new_code)

with open(filepath, 'w') as f:
    f.write(content)
print("fetchAdminData updated")
