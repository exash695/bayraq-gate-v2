import os

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_func = """      await addDoc(collection(db, 'notifications'), {
        title: 'رد من الادارة 💬',
        message: adminQuickReplyText,
        type: 'broadcast',
        userId: originalTicket.userId || '',
        read: false,
        isRead: false,
        recipientRole: originalTicket.role || 'student',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });"""

new_func = """      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolId || 'school_awail_ghamas',
          recipientId: originalTicket.userId || '',
          title: 'رد من الادارة 💬',
          body: adminQuickReplyText,
          type: 'general',
          read: false
        })
      });"""

content = content.replace(old_func, new_func)

old_update = """                            updateDoc(doc(db, 'support_tickets', t.id), { readByAdmin: true })"""
new_update = """                            fetch(`/api/support-tickets/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readByAdmin: true }) }).catch(() => {})"""

content = content.replace(old_update, new_update)

with open(filepath, 'w') as f:
    f.write(content)
print("Replacements done")
