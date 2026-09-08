import os
filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_1 = """  const totalUnreadBroadcastReplies = getUnreadRepliesCount(adminNotifs);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">"""

new_1 = """  const totalUnreadBroadcastReplies = getUnreadRepliesCount(adminNotifs);

  useEffect(() => {
    if (activeTab === 'notifications' && totalUnreadBroadcastReplies > 0) {
      const markAsRead = async () => {
        const repliesToMark = [];
        adminNotifs.forEach(n => {
          const replies = allTickets.filter(t => {
            if (t.broadcastId && n.broadcastId && t.broadcastId === n.broadcastId) return true;
            if (t.replyToTicketId && n.refIds && n.refIds.some((ref: any) => ref.id === t.replyToTicketId)) return true;
            if (t.message && t.message.includes(`(تعقيباً على: "`) && n.message && t.message.includes(n.message.slice(0, 30))) {
              return true;
            }
            return false;
          });
          const unreadReplies = replies.filter(t => !t.readByAdmin);
          repliesToMark.push(...unreadReplies);
        });

        for (const reply of repliesToMark) {
          await fetch(`/api/support-tickets/${reply.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readByAdmin: true })
          }).catch(e => console.warn("Failed to mark reply as read:", e));
        }
      };
      markAsRead();
    }
  }, [activeTab, totalUnreadBroadcastReplies, adminNotifs, allTickets]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">"""

content = content.replace(old_1, new_1)
with open(filepath, 'w') as f:
    f.write(content)
