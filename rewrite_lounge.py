import re

with open("src/components/StudentLounge.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace unread counts
content = re.sub(r"  useEffect\(\(\) => \{\n    if \(!currentUserUid\) return;\n    const q = query\(\n      collection\(db, 'lounge_messages'\),\n      where\('recipientId', '==', currentUserUid\)\n    \);\n    const unsub = onSnapshot\(q, \(snap\) => \{[^\}]+\}\);\n      setUnreadCounts\(counts\);\n    \}\);\n    return \(\) => unsub\(\);\n  \}, \[currentUserUid\]\);", 
"""  // Track unread messages per user (PostgreSQL)
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
  }, [currentUserUid]);""", content, flags=re.MULTILINE|re.DOTALL)


with open("src/components/StudentLounge.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
