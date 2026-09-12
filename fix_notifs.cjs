const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFetch = `    const fetchAppNotifs = async () => {
       try {
         const res = await fetch(\`/api/notifications?recipientIds=\${encodeURIComponent(possibleIds.filter(id => id && id !== 'undefined').join(','))}\`);`;

const newFetch = `    const fetchAppNotifs = async (signal?: AbortSignal) => {
       try {
         const res = await fetch(\`/api/notifications?recipientIds=\${encodeURIComponent(possibleIds.filter(id => id && id !== 'undefined').join(','))}\`, { signal });`;

content = content.replace(oldFetch, newFetch);

const oldCatch = `       } catch (err) {
         console.error("Error fetching app notifs:", err);
       }`;

const newCatch = `       } catch (err: any) {
         if (err.name === 'AbortError') return;
         if (err.message?.includes('Failed to fetch')) {
             console.warn("Network drop while fetching app notifs");
             return;
         }
         console.error("Error fetching app notifs:", err);
       }`;

content = content.replace(oldCatch, newCatch);

const oldCall = `    fetchAppNotifs();
    
    // Fast sync when coming back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    import('./lib/realtimeManager').then(({ realtimeManager }) => {
       realtimeManager.on('notifications_updated', fetchAppNotifs);
    });

    return () => {
       isMounted = false;
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       import('./lib/realtimeManager').then(({ realtimeManager }) => {
          realtimeManager.off('notifications_updated', fetchAppNotifs);
       });
    };`;

const newCall = `    const abortController = new AbortController();
    fetchAppNotifs(abortController.signal);
    
    // Fast sync when coming back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    import('./lib/realtimeManager').then(({ realtimeManager }) => {
       realtimeManager.on('notifications_updated', fetchAppNotifs);
    });

    return () => {
       isMounted = false;
       abortController.abort();
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       import('./lib/realtimeManager').then(({ realtimeManager }) => {
          realtimeManager.off('notifications_updated', fetchAppNotifs);
       });
    };`;

content = content.replace(oldCall, newCall);

fs.writeFileSync(file, content);
console.log("Patched fetchAppNotifs in App.tsx");
