import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

start_str = "  useEffect(() => {\n     if (!isOpen) return;\n     try {\n      const unsubs: any[] = [];"
end_str = "     } catch (e) {\n       console.warn(\"Social notifications error:\", e);\n     }\n  }, [isOpen, userId, studentName]);"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str)

new_effect = """  useEffect(() => {
     if (!isOpen) return;
     let isMounted = true;
     const fetchNotifs = async () => {
       try {
         const targetId = userId || studentName || studentCode || parentCode || 'unknown';
         const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(targetId)}`);
         const data = await res.json();
         if (isMounted && data.success) {
           setSocialNotifications(data.notifications || []);
         }
       } catch (e) {
         console.warn("Notifications error:", e);
       }
     };
     fetchNotifs();
     return () => { isMounted = false; };
  }, [isOpen, userId, studentName, studentCode, parentCode]);"""

content = content[:start_idx] + new_effect + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)
print("Updated useEffect successfully")
