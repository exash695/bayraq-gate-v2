with open('src/components/StudentSupportForm.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """     const fetchNotifs = async () => {
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
      };"""

new_str = """     const fetchNotifs = async () => {
        try {
          const candidateIds = [userId, studentName, studentCode, parentCode].filter(Boolean) as string[];
          const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(candidateIds.join(','))}`);
          const data = await res.json();
          if (isMounted && data.success) {
            setSocialNotifications(data.notifications || []);
          }
        } catch (e) {
          console.warn("Notifications error:", e);
        }
      };"""

text = text.replace(old_str, new_str)
with open('src/components/StudentSupportForm.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated fetchNotifs in StudentSupportForm.tsx")
