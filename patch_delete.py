import os
filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_1 = """    // 2. background firestore delete
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {"""

new_1 = """    // 2. background pg delete
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {"""

old_2 = """    // 2. background firestore delete
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'notifications', id)).catch(() => {}));"""

new_2 = """    // 2. background pg delete
    try {
      const promises = idsToDelete.map(id => fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {}));"""

old_3 = """    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'social_notifications', id)).catch(() => {}));"""

new_3 = """    try {
      const promises = idsToDelete.map(id => fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {}));"""

content = content.replace(old_1, new_1).replace(old_2, new_2).replace(old_3, new_3)
with open(filepath, 'w') as f:
    f.write(content)
