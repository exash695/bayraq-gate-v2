import os
filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_1 = """  function addNotification(
    title: string,
    message: string,
    type: AppNotification["type"],
    optionalId?: string,
    recipientRole?: "student" | "parent" | "teacher",
    showToast = true,
  ) {"""

new_1 = """  function addNotification(
    title: string,
    message: string,
    type: AppNotification["type"],
    optionalId?: string,
    recipientRole?: "student" | "parent" | "teacher",
    showToast = true,
    broadcastId?: string
  ) {"""

old_2 = """    const newNotif: AppNotification = {
      id: optionalId || Math.random().toString(36).substr(2, 9),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      recipientRole:"""

new_2 = """    const newNotif: AppNotification = {
      id: optionalId || Math.random().toString(36).substr(2, 9),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      broadcastId,
      recipientRole:"""

old_3 = """               addNotification(title, message, type as any, doc.id, doc.recipientRole || doc.type, showToast);"""

new_3 = """               addNotification(title, message, type as any, doc.id, doc.recipientRole || doc.type, showToast, doc.metadata?.broadcastId);"""

content = content.replace(old_1, new_1).replace(old_2, new_2).replace(old_3, new_3)
with open(filepath, 'w') as f:
    f.write(content)
