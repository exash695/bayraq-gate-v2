with open('src/components/PortalPulseDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'const toggleExpand = async () => {' in line:
        # Check inside this function
        for j in range(idx, idx + 10):
            if 'if (unreadReplies.length > 0) {' in lines[j]:
                lines.insert(j + 1, '                        setAllTickets(prev => prev.map(t => unreadReplies.some(u => u.id === t.id) ? { ...t, readByAdmin: true } : t));\n')
                break
        break

with open('src/components/PortalPulseDashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Updated toggleExpand in PortalPulseDashboard.tsx")
