import os
filepath = 'server.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_code_1 = """             body: messageText,
             type: 'broadcast',
             read: false,
             createdAt: new Date()"""

new_code_1 = """             body: messageText,
             type: 'broadcast',
             read: false,
             metadata: { broadcastId: outboxId },
             createdAt: new Date()"""

old_code_2 = """          body: messageText,
          type: 'general',
          read: false,
          createdAt: new Date()"""

new_code_2 = """          body: messageText,
          type: 'general',
          read: false,
          metadata: { broadcastId: outboxId },
          createdAt: new Date()"""

content = content.replace(old_code_1, new_code_1).replace(old_code_2, new_code_2)
with open(filepath, 'w') as f:
    f.write(content)
