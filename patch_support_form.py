import os
filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """        status: 'pending',
        readByAdmin: false,
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student',
        broadcastId: broadcastId || undefined
      });"""

new_code = """        status: 'pending',
        readByAdmin: false,
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student',
        broadcastId: broadcastId || undefined,
        replyToTicketId: replyToTicketId || undefined
      });"""

content = content.replace(old_code, new_code)
with open(filepath, 'w') as f:
    f.write(content)
