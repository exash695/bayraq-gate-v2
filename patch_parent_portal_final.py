with open('src/components/ParentPortal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const targetId = possibleTicketIds[0] || 'unknown';" in line:
        lines[idx] = "         const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(filterIds.join(','))}`);\n"
        lines[idx+1] = ""
        break

with open('src/components/ParentPortal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Updated ParentPortal.tsx")
