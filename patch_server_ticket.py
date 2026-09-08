import os
filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """      const broadcastId = data.broadcastId || data.broadcast_id || null;
      const senderType = data.senderType || data.sender_type || (role === 'parent' ? 'parent' : role === 'teacher' ? 'teacher' : 'student');"""

new_code = """      const broadcastId = data.broadcastId || data.broadcast_id || null;
      const replyToTicketId = data.replyToTicketId || data.reply_to_ticket_id || null;
      const senderType = data.senderType || data.sender_type || (role === 'parent' ? 'parent' : role === 'teacher' ? 'teacher' : 'student');"""

old_code_2 = """        role,
        broadcastId,
        senderType,
        readByAdmin,
        readByStudent,"""

new_code_2 = """        role,
        broadcastId,
        replyToTicketId,
        senderType,
        readByAdmin,
        readByStudent,"""

content = content.replace(old_code, new_code).replace(old_code_2, new_code_2)
with open(filepath, 'w') as f:
    f.write(content)
