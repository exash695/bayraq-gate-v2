with open('src/components/StudentSupportForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update loadTickets
old_load_tickets = """  const loadTickets = async () => {
    if (!isOpen || (!userId && !studentCode && !parentCode)) return;
    try {
      const altIds = [userId, studentCode, parentCode].filter(Boolean) as string[];
      const tickets = await supportService.fetchTickets(schoolId || undefined, userId || studentCode || parentCode, altIds);
      const filtered = tickets.filter(t => t.role === role);
      
      setAllTickets(filtered);
      
      const historyRecords = [...filtered]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setHistory(historyRecords);
    } catch (err) {
      console.warn("Error fetching tickets:", err);
    }
  };"""

new_load_tickets = """  const loadTickets = async () => {
    if (!isOpen || (!userId && !studentCode && !parentCode)) return;
    try {
      const altIds = [userId, studentCode, parentCode].filter(Boolean) as string[];
      const tickets = await supportService.fetchTickets(schoolId || undefined, userId || studentCode || parentCode, altIds);
      const filtered = tickets.filter(t => {
        if (!role || role === 'student') return !t.role || t.role === 'student';
        if (role === 'teacher' || isTeacher) return t.role === 'teacher' || t.role === 'cadre' || t.role === 'staff';
        if (role === 'parent') return t.role === 'parent';
        return t.role === role;
      });
      
      setAllTickets(filtered);
      
      const historyRecords = [...filtered]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setHistory(historyRecords);
    } catch (err) {
      console.warn("Error fetching tickets:", err);
    }
  };"""

if old_load_tickets in content:
    content = content.replace(old_load_tickets, new_load_tickets)
    print("Replaced loadTickets")
else:
    print("Could not find old_load_tickets")

# 2. Update fetchNotifs
old_fetch_notifs = """      const fetchNotifs = async () => {
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

new_fetch_notifs = """      const fetchNotifs = async () => {
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

if old_fetch_notifs in content:
    content = content.replace(old_fetch_notifs, new_fetch_notifs)
    print("Replaced fetchNotifs")
else:
    print("Could not find old_fetch_notifs")

# 3. Update handleDeleteHistory and handleDeleteAllHistory
old_delete_history = """  const handleDeleteHistory = async (id: string) => {
    if (!id) return;
    setTargetDeleteHistoryId(null);
    try {
      await supportService.deleteTicket(id);
      loadTickets();
    } catch (err) {
      console.warn("Delete history failed:", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!history.length) return;
    const idsToDelete = history.map(h => h.id);
    setConfirmDeleteAllHistory(false);
    try {
      const promises = idsToDelete.map(id => supportService.deleteTicket(id).catch(() => {}));
      await Promise.all(promises);
      loadTickets();
    } catch (err) {
      console.error("Delete all history error:", err);
    }
  };"""

new_delete_history = """  const handleDeleteHistory = async (id: string) => {
    if (!id) return;
    setTargetDeleteHistoryId(null);
    setHistory(prev => prev.filter(h => h.id !== id));
    setAllTickets(prev => prev.filter(t => t.id !== id));
    try {
      await supportService.deleteTicket(id);
      loadTickets();
    } catch (err) {
      console.warn("Delete history failed:", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!history.length) return;
    const idsToDelete = history.map(h => h.id);
    setConfirmDeleteAllHistory(false);
    setHistory([]);
    setAllTickets([]);
    try {
      const promises = idsToDelete.map(id => supportService.deleteTicket(id).catch(() => {}));
      await Promise.all(promises);
      loadTickets();
    } catch (err) {
      console.error("Delete all history error:", err);
    }
  };"""

if old_delete_history in content:
    content = content.replace(old_delete_history, new_delete_history)
    print("Replaced delete history")
else:
    print("Could not find old_delete_history")

with open('src/components/StudentSupportForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
