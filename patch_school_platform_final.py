with open('src/components/SchoolPlatform.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add realtimeManager import
if 'import { realtimeManager }' not in content:
    content = "import { realtimeManager } from '../lib/realtimeManager';\n" + content
    print("Added realtimeManager import")

# 2. Update support tickets effect
old_effect = """    const q = query(
      collection(db, "support_tickets"),
      where("userId", "in", possibleIds),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          "SchoolPlatform ALL tickets DEBUG:",
          tickets,
          "for possibleIds:",
          possibleIds,
        );
        // A ticket is considered new/relevant if it's from admin to student/teacher (checking matching role)
        // and it hasn't been read by the student.
        const filteredTickets = tickets.filter(
          (t) =>
            (t as any).status === "resolved" &&
            ((t as any).readByStudent === false ||
              (t as any).readByStudent === undefined) &&
            (t as any).role === (isTeacher ? "teacher" : "student"),
        );
        setResolvedTicketCount(filteredTickets.length);
      },
      (error) => console.warn("SchoolPlatform support_tickets error:", error),
    );
    return () => unsubscribe();"""

new_effect = """    const fetchApiTickets = async () => {
      try {
        const res = await fetch(`/api/support-tickets?userIds=${encodeURIComponent(possibleIds.join(','))}`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tickets)) {
          const filteredTickets = data.tickets.filter(
            (t: any) =>
              t.status === "resolved" &&
              (t.readByStudent === false || t.readByStudent === undefined) &&
              (isTeacher ? (t.role === "teacher" || t.role === "cadre" || t.role === "staff") : (!t.role || t.role === "student")),
          );
          setResolvedTicketCount(filteredTickets.length);
        }
      } catch (err) {
        console.warn("Error fetching api tickets:", err);
      }
    };
    fetchApiTickets();

    const unsubRealtime = realtimeManager.on('support_tickets_updated', () => {
      fetchApiTickets();
    });

    const q = query(
      collection(db, "support_tickets"),
      where("userId", "in", possibleIds),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filteredTickets = tickets.filter(
          (t) =>
            (t as any).status === "resolved" &&
            ((t as any).readByStudent === false ||
              (t as any).readByStudent === undefined) &&
            (isTeacher ? ((t as any).role === "teacher" || (t as any).role === "cadre" || (t as any).role === "staff") : (!(t as any).role || (t as any).role === "student")),
        );
        if (filteredTickets.length > 0) {
          setResolvedTicketCount(filteredTickets.length);
        }
      },
      (error) => console.warn("SchoolPlatform support_tickets error:", error),
    );
    return () => {
      unsubscribe();
      unsubRealtime();
    };"""

if old_effect in content:
    content = content.replace(old_effect, new_effect)
    print("Replaced support_tickets effect in SchoolPlatform.tsx")
else:
    print("Could not find old_effect in SchoolPlatform.tsx")

with open('src/components/SchoolPlatform.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
