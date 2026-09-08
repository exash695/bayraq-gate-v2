import os

filepath = 'src/components/ParentPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

start_str = "    // We use two possible identifiers: the parent's UID (if logged in) or their code"
end_str = "      unsubTickets();\n    };"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str)

new_code = """    let isMounted = true;
    
    import('../services/broadcastService').then(({ broadcastService }) => {
      broadcastService.subscribeToBroadcasts(schoolId || 'school_awail_ghamas', (allData) => {
        if (!isMounted) return;
        const pBroadcasts = (allData || [])
          .filter((b: any) => {
            let grades: string[] = [];
            if (Array.isArray(b.targetGrades)) grades = b.targetGrades;
            else if (typeof b.targetGrades === 'string') grades = [b.targetGrades];
            return grades.includes('parent_only');
          })
          .sort((a: any, b: any) => (b.timestampMs || 0) - (a.timestampMs || 0))
          .slice(0, 5);
        setParentBroadcasts(pBroadcasts);
      });
    }).catch(console.warn);

    const fetchNotifsAndTickets = async () => {
       try {
         const { supportService } = await import('../services/supportService');
         const possibleTicketIds = [...filterIds];
         let unread = 0;
         if (possibleTicketIds.length > 0) {
            const tickets = await supportService.fetchTickets(schoolId, possibleTicketIds[0], possibleTicketIds);
            const pTickets = tickets.filter(t => t.role === 'parent');
            unread = pTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)).length;
         }
         if (isMounted) setUnreadSupportCount(unread);
         
         const targetId = possibleTicketIds[0] || 'unknown';
         const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(targetId)}`);
         const data = await res.json();
         if (isMounted && data.success) {
            setParentNotifications(data.notifications || []);
         }
       } catch (err) {
         console.warn("Error fetching tickets or notifications:", err);
       }
    };
    
    fetchNotifsAndTickets();
    
    import('../services/realtimeManager').then(({ realtimeManager }) => {
      realtimeManager.on('notifications_updated', fetchNotifsAndTickets);
      realtimeManager.on('support_tickets_updated', fetchNotifsAndTickets);
    }).catch(console.warn);

    return () => {
      isMounted = false;
      import('../services/realtimeManager').then(({ realtimeManager }) => {
        realtimeManager.off('notifications_updated', fetchNotifsAndTickets);
        realtimeManager.off('support_tickets_updated', fetchNotifsAndTickets);
      }).catch(console.warn);
    };"""

content = content[:start_idx] + new_code + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)
print("Updated ParentPortal correctly")
