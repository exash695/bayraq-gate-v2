import os
filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_code = """                             onClick={() => handleSendReply(notif.message, replyInputText, 'رد على تبليغ إداري', undefined, notif.broadcastId || notif.id)}"""
new_code = """                             onClick={() => handleSendReply(notif.message, replyInputText, 'رد على تبليغ إداري', undefined, notif.broadcastId || (notif as any).metadata?.broadcastId || notif.id)}"""
content = content.replace(old_code, new_code)

old_code2 = """                           {allTickets.filter(t => t.issueType === 'رد على تبليغ إداري' && (t.broadcastId === notif.broadcastId || t.broadcastId === notif.id))"""
new_code2 = """                           {allTickets.filter(t => t.issueType === 'رد على تبليغ إداري' && (t.broadcastId === notif.broadcastId || t.broadcastId === (notif as any).metadata?.broadcastId || t.broadcastId === notif.id))"""
content = content.replace(old_code2, new_code2)

with open(filepath, 'w') as f:
    f.write(content)
