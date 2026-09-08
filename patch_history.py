import os

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = """      const historyRecords = [...filtered]
        .filter(r => r.issueType !== 'تبليغ إداري' && r.issueType !== 'رد على تبليغ إداري')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());"""

replacement = """      const historyRecords = [...filtered]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());"""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
