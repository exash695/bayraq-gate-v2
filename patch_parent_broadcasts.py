import os

filepath = 'src/components/ParentPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target1 = "  const [unreadIdeasCount, setUnreadIdeasCount] = useState(0);"
replacement1 = """  const [unreadIdeasCount, setUnreadIdeasCount] = useState(0);
  const [parentBroadcasts, setParentBroadcasts] = useState<any[]>([]);"""

if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """    const unsub = onSnapshot(q1, (snap) => {"""
replacement2 = """    import('../services/broadcastService').then(({ broadcastService }) => {
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

    const unsub = onSnapshot(q1, (snap) => {"""

if target2 in content:
    content = content.replace(target2, replacement2)

target3 = """const broadcastNotifs = parentNotifications.filter(n => n.type === 'broadcast' || n.title?.includes('تبليغ'));"""
replacement3 = """const broadcastNotifs = [...parentBroadcasts, ...parentNotifications.filter(n => n.type === 'broadcast' || n.title?.includes('تبليغ'))];"""

if target3 in content:
    content = content.replace(target3, replacement3)

with open(filepath, 'w') as f:
    f.write(content)
print("Patched ParentPortal")
