import os
filepath = 'src/services/supportService.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("broadcastId?: string;", "broadcastId?: string;\n  replyToTicketId?: string;")
with open(filepath, 'w') as f:
    f.write(content)
