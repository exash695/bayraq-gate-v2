import os

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_mark_read = """        for (const reply of repliesToMark) {
          await fetch(`/api/support-tickets/${reply.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readByAdmin: true })
          }).catch(e => console.warn("Failed to mark reply as read:", e));
        }"""

new_mark_read = """        for (const reply of repliesToMark) {
          await fetch(`/api/support-tickets/${reply.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readByAdmin: true })
          }).then(() => {
             setAllTickets(prev => prev.map(t => t.id === reply.id ? { ...t, readByAdmin: true } : t));
          }).catch(e => console.warn("Failed to mark reply as read:", e));
        }"""

content = content.replace(old_mark_read, new_mark_read)
with open(filepath, 'w') as f:
    f.write(content)

