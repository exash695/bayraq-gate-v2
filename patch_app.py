import os
filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """         const targetId = possibleIds[0] || 'unknown';
         const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(targetId)}`);"""

new_code = """         const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(possibleIds.join(','))}`);"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)
