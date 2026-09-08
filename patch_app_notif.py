import os

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

start_str = "    const q = query(\n      collection(db, \"notifications\"),"
end_str = "      (error) => {\n        console.error(\"Error fetching notifications:\", error);\n      },\n    );\n\n    return () => unsubscribe();"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str)

new_code = """    let isMounted = true;
    const fetchAppNotifs = async () => {
       try {
         const targetId = possibleIds[0] || 'unknown';
         const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(targetId)}`);
         const data = await res.json();
         if (!isMounted || !data.success) return;
         
         const notifs = data.notifications
          .filter((d: any) => d.read === false || d.isRead === false)
          .filter((d: any) => !(portalType === "teacher" && d.type === "alarm"))
          .filter((d: any) => d.type !== "reminder")
          .filter((d: any) => {
            if (d.recipientRole) return d.recipientRole === portalType;
            return portalType === "student";
          });

         const allNotifs: any[] = [];
         notifs.forEach((d: any) => {
           const nData = {
              id: d.id,
              userId: d.recipientId,
              title: d.title,
              message: d.body,
              type: d.type,
              read: d.read,
              isRead: d.read,
              recipientRole: d.type,
              timestamp: d.createdAt
           };
           allNotifs.push(nData as AppNotification);
         });

         setNotifications(prev => {
            const map = new Map();
            prev.forEach(n => map.set(n.id, n));
            allNotifs.forEach(n => map.set(n.id, n));
            return Array.from(map.values()).sort((a: any, b: any) => {
               const ta = new Date(a.timestamp).getTime();
               const tb = new Date(b.timestamp).getTime();
               return tb - ta;
            }).slice(0, 40);
         });
       } catch (err) {
         console.error("Error fetching app notifs:", err);
       }
    };
    
    fetchAppNotifs();
    import('./services/realtimeManager').then(({ realtimeManager }) => {
       realtimeManager.on('notifications_updated', fetchAppNotifs);
    });

    return () => {
       isMounted = false;
       import('./services/realtimeManager').then(({ realtimeManager }) => {
          realtimeManager.off('notifications_updated', fetchAppNotifs);
       });
    };"""

if start_idx != -1 and end_idx != -1 + len(end_str):
    content = content[:start_idx] + new_code + content[end_idx:]
    with open(filepath, 'w') as f:
        f.write(content)
    print("Updated App.tsx")
else:
    print("Could not find block in App.tsx")

