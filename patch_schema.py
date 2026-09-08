import os
filepath = 'src/db/schema.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('  broadcastId: varchar("broadcast_id", { length: 128 }),', '  broadcastId: varchar("broadcast_id", { length: 128 }),\n  replyToTicketId: varchar("reply_to_ticket_id", { length: 128 }),')
with open(filepath, 'w') as f:
    f.write(content)
