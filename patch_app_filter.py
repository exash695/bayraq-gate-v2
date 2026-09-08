with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'if (d.recipientRole) return d.recipientRole === portalType;' in line:
        lines[idx] = """            if (d.recipientRole) {
              if (portalType === "teacher") return d.recipientRole === "teacher" || d.recipientRole === "cadre" || d.recipientRole === "staff";
              if (portalType === "parent") return d.recipientRole === "parent";
              return d.recipientRole === "student";
            }
            if (d.recipientId && d.recipientId !== 'all') return true;
"""
        break

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Updated recipientRole filter in App.tsx")
