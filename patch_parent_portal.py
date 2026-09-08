import os

filepath = 'src/components/ParentPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """    // We use two possible identifiers: the parent's UID (if logged in) or their code
    const q1 = query(
      collection(db, 'notifications'), 
      where('userId', 'in', filterIds),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    import('../services/broadcastService').then(({ broadcastService }) => {
      broadcastService.subscribeToBroadcasts(schoolId || 'school_awail_ghamas', (allData) => {
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

    const unsub = onSnapshot(q1, (snap) => {
      const uniqueMessages = new Set<string>();
      const notifs = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
        .filter(n => n.type !== 'payment_rejected')
        .filter((n: any) => {
          if (n.recipientRole) {
            return n.recipientRole === 'parent';
          }
          if (pCode) {
            const pUpper = pCode.toUpperCase();
            const pLower = pCode.toLowerCase();
            if (n.userId === pCode || n.userId === pUpper || n.userId === pLower || 
                n.userId === `pcode_${pCode}` || n.userId === `pcode_${pUpper}` || n.userId === `pcode_${pLower}`) {
              return true;
            }
          }
          return false;
        })
        .filter((n: any) => {
          // Deduplicate by message to prevent multi-child spam
          if (n.message && uniqueMessages.has(n.message)) {
            return false;
          }
          if (n.message) uniqueMessages.add(n.message);
          return true;
        });

      setParentNotifications(notifs);
      setError(null);
    }, (error) => {
      console.warn("Notifications listener error:", error);
      setError("حدث خطأ أثناء مزامنة التنبيهات. نعرض البيانات المحفوظة.");
    });

    const possibleTicketIds = [...filterIds];
    const qTickets = query(
      collection(db, 'support_tickets'),
      where('userId', 'in', possibleTicketIds.slice(0, 10)),
      where('role', '==', 'parent'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      let unread = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'resolved' && (data.readByStudent === false || data.readByStudent === undefined) ) {
          unread++;
        }
      });
      setUnreadSupportCount(unread);
    }, (error) => {
      console.warn("Support tickets listener error:", error);
    });

    return () => {
      unsub();
      unsubTickets();
    };"""

new_block = """    let isMounted = true;
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
         // Fetch Tickets using supportService to avoid duplication
         const { supportService } = await import('../services/supportService');
         const possibleTicketIds = [...filterIds];
         let unread = 0;
         if (possibleTicketIds.length > 0) {
            const tickets = await supportService.fetchTickets(schoolId, possibleTicketIds[0], possibleTicketIds);
            const pTickets = tickets.filter(t => t.role === 'parent');
            unread = pTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)).length;
         }
         if (isMounted) setUnreadSupportCount(unread);
         
         // Fetch Notifications
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
    
    // Add realtime listener
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

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
print("ParentPortal updated")
