import re
with open("src/components/StudentLounge.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace send message
content = re.sub(r"await addDoc\(collection\(db, 'lounge_messages'\), \{[^\}]+\timestamp: serverTimestamp\(\),\n\s+\}\);",
"""await fetch('/api/lounge-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msgText,
          userId: auth.currentUser.uid,
          userName: currentName || 'مستخدم',
          userPhoto: currentPhoto || null,
          userRole: currentRole,
          schoolId: currentChatRoomId,
          realSchoolId: schoolId,
          recipientId: selectedChatUser.id,
          read: false,
          grade: grade || 'all'
        })
      });""", content, flags=re.MULTILINE|re.DOTALL)

with open("src/components/StudentLounge.tsx", "w", encoding="utf-8") as f:
    f.write(content)
