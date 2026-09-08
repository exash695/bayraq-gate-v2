import os
import re

filepath = 'src/components/FinanceSection.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = re.sub(
    r"await addDoc\(collection\(db, 'notifications'\), ({[^}]+})\);",
    r"await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(\1) });",
    content
)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated FinanceSection")
