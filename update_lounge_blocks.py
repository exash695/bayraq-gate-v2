import sys

def replace_between(content, start_str, end_str, new_code):
    start = content.find(start_str)
    if start == -1: return content
    end = content.find(end_str, start)
    if end == -1: return content
    end += len(end_str)
    return content[:start] + new_code + content[end:]

with open("src/components/StudentLounge.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Unread
unread_start = "  // Track unread messages per user"
unread_end = "  }, [currentUserUid]);"
unread_new = """  // Track unread messages per user (PostgreSQL)
  useEffect(() => {
    if (!currentUserUid) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/unread/${currentUserUid}`);
        const data = await res.json();
        if (data.success) {
          setUnreadCounts(data.counts);
        }
      } catch (e) {
        console.error("Error fetching unread", e);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [currentUserUid]);"""
content = replace_between(content, unread_start, unread_end, unread_new)

# Replace Load messages
messages_start = "  // Load private messages"
messages_end = "  }, [currentChatRoomId]);"
messages_new = """  // Load private messages (PostgreSQL)
  useEffect(() => {
    if (!currentChatRoomId) {
       setMessages([]);
       return;
    }
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/${currentChatRoomId}`);
        const data = await res.json();
        if (data.success) {
           const msgs = data.messages.map((m: any) => ({
             ...m,
             userId: m.userId || m.user_id,
             userName: m.userName || m.user_name,
             userPhoto: m.userPhoto || m.user_photo,
             userRole: m.userRole || m.user_role,
             recipientId: m.recipientId || m.recipient_id,
             schoolId: m.schoolId || m.school_id,
             timestamp: { seconds: new Date(m.timestamp).getTime() / 1000 }
           }));
           setMessages(msgs.slice(-100));
        }
      } catch (e) {
        console.error("Error loading lounge messages", e);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentChatRoomId]);"""
content = replace_between(content, messages_start, messages_end, messages_new)

# Replace Mark as read
read_start = "  // Mark as read when opening chat"
read_end = "  }, [activeTab, currentChatRoomId, currentUserUid, messages]);"
read_new = """  // Mark as read when opening chat (PostgreSQL)
  useEffect(() => {
    if (activeTab === 'chat' && currentChatRoomId && currentUserUid) {
       const markRead = async () => {
         try {
           await fetch(`/api/lounge-messages/read/${currentChatRoomId}/${currentUserUid}`, { method: 'PATCH' });
         } catch(e) {}
       };
       markRead();
    }
  }, [activeTab, currentChatRoomId, currentUserUid, messages]);"""
content = replace_between(content, read_start, read_end, read_new)

# Replace sendMessage
send_start = "      await addDoc(collection(db, 'lounge_messages'), {"
send_end = "        timestamp: serverTimestamp(),\n      });"
send_new = """      await fetch('/api/lounge-messages', {
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
      });"""
content = replace_between(content, send_start, send_end, send_new)

with open("src/components/StudentLounge.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
