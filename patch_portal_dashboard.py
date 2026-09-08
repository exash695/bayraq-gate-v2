import os
import re

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace handleSendAdminQuickReply
target_reply = """      await updateDoc(doc(db, 'support_tickets', ticketId), {
        adminReply: adminQuickReplyText,
        status: 'resolved',
        readByStudent: false,
        readByAdmin: true
      });"""

replacement_reply = """      await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminReply: adminQuickReplyText,
          status: 'resolved',
          readByStudent: false,
          readByAdmin: true
        })
      });"""
if target_reply in content:
    content = content.replace(target_reply, replacement_reply)
    print("Replaced quick reply")
else:
    print("Failed to replace quick reply")


# Replace adding tickets in handleSendMessage
# We have 4 blocks of:
# const docRef = await addDoc(collection(db, 'support_tickets'), {
# ...
# readByStudent: false,
# senderType: '...'
# });
# We will use regex to replace all of them.

pattern = r"const docRef = await addDoc\(collection\(db, 'support_tickets'\), (\{[\s\S]*?senderType: '([^']+)'\s*\})\);"

def replacer(match):
    obj_str = match.group(1)
    sender = match.group(2)
    # obj_str looks like: { userId: targetUserId, role: 'teacher', ... timestamp: serverTimestamp(), ... senderType: 'teacher' }
    # We need to remove timestamp: serverTimestamp(),
    obj_str = re.sub(r"timestamp:\s*serverTimestamp\(\),", "", obj_str)
    
    return f"""const response = await fetch('/api/support-tickets', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({obj_str})
          }});
          const resJson = await response.json();
          const docRef = {{ id: resJson.ticket?.id || '' }};"""

content, count = re.subn(pattern, replacer, content)
print(f"Replaced {count} addDoc calls for support_tickets")

with open(filepath, 'w') as f:
    f.write(content)
