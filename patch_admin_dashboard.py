import os

filepath = 'src/components/AdminDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """  useEffect(() => {
    if (!db || !auth.currentUser) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const activeTickets = snapshot.docs.map(doc => doc.data())
          .filter(t => !t.broadcastId && t.issueType !== 'تبليغ إداري' && !t.readByAdmin);
        setPendingSupportCount(activeTickets.length);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'support_tickets', false);
        }
      }
    );

    return () => unsub();
  }, []);"""

new_block = """  useEffect(() => {
    if (!auth.currentUser) return;
    let isMounted = true;
    
    const fetchTicketsCount = async () => {
      try {
        const { supportService } = await import('../services/supportService');
        const tickets = await supportService.fetchTickets();
        const activeTickets = tickets.filter(t => t.status === 'pending' && !t.broadcastId && t.issueType !== 'تبليغ إداري' && !t.readByAdmin);
        if (isMounted) setPendingSupportCount(activeTickets.length);
      } catch (err) {
        console.warn("Failed to fetch tickets", err);
      }
    };
    
    fetchTicketsCount();
    
    import('../services/realtimeManager').then(({ realtimeManager }) => {
      realtimeManager.on('support_tickets_updated', fetchTicketsCount);
    });

    return () => {
      isMounted = false;
      import('../services/realtimeManager').then(({ realtimeManager }) => {
        realtimeManager.off('support_tickets_updated', fetchTicketsCount);
      });
    };
  }, []);"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
print("AdminDashboard updated")
