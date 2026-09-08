import os

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

start_str = "    const q = query(\n      collection(db, \"notifications\"),"
end_str = "    settings.sovereigntyNotifications,\n  ]);"

start_idx = content.find(start_str)
end_idx = content.find(end_str) + len(end_str)

new_code = """    let isMounted = true;
    let isInitialLoad = processedFirestoreNotifs.current.size === 0;
    
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
          
         if (notifs.length > 0) {
           const specialDoc = notifs.find((d: any) => d.type === 'challenge' || d.type === 'reward' || d.type === 'sovereignty' || d.type === 'level_up');
           if (specialDoc) {
             setNotification(specialDoc);
           } else {
             setNotification(null);
           }
           
           notifs.forEach((doc: any) => {
             if (!processedFirestoreNotifs.current.has(doc.id)) {
               let title = doc.title || (settings.language === "ar" ? "إشعار جديد" : "New Notification");
               let message = doc.body || doc.message || "";
               let type = doc.type || "general";
               
               if (doc.type === "challenge") {
                 title = settings.language === "ar" ? "تحدي الـ 60 ثانية!" : "60 Second Challenge!";
               } else if (doc.type === "level_up") {
                 title = settings.language === "ar" ? "ترقية المستوى! 🏆" : "Level Up! 🏆";
               } else if (doc.type === "siege") {
                 title = settings.language === "ar" ? "تحدي الحصار! 🏰" : "Siege Challenge! 🏰";
               }
               
               let showToast = !isInitialLoad && Date.now() - lastProfileSwitchTime.current > 3000;
               if (doc.createdAt) {
                 const notifTime = new Date(doc.createdAt).getTime();
                 if (Date.now() - notifTime > 60000) showToast = false;
               }
               if (portalType === "parent") showToast = false;
               
               addNotification(title, message, type as any, doc.id, doc.recipientRole || doc.type, showToast);
               processedFirestoreNotifs.current.add(doc.id);
             }
           });
         } else {
           setNotification(null);
         }
         isInitialLoad = false;
       } catch (err) {
         console.error("Error fetching app notifs:", err);
       }
    };
    
    fetchAppNotifs();
    
    // Fast sync when coming back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    import('./services/realtimeManager').then(({ realtimeManager }) => {
       realtimeManager.on('notifications_updated', fetchAppNotifs);
    });

    return () => {
       isMounted = false;
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       import('./services/realtimeManager').then(({ realtimeManager }) => {
          realtimeManager.off('notifications_updated', fetchAppNotifs);
       });
    };
  }, [
    user?.uid,
    userProfile?.studentCode,
    verifiedStudentInfo?.code,
    verifiedStudentInfo?.studentCode,
    userProfile?.parentCode,
    verifiedStudentInfo?.parentCode,
    loggedInTeacher?.code,
    portalType,
    selectedStudentGrade,
    selectedSchoolId,
    settings.sovereigntyNotifications,
  ]);"""

if start_idx != -1 and end_idx != -1 + len(end_str):
    content = content[:start_idx] + new_code + content[end_idx:]
    with open(filepath, 'w') as f:
        f.write(content)
    print("Updated App.tsx successfully")
else:
    print("Could not find block in App.tsx")

