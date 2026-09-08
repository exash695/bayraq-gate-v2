import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    pattern = r"await addDoc\(collection\(db, 'notifications'\),\s*(\{.*?\})\);"
    
    def replacer(match):
        obj_str = match.group(1)
        # Remove timestamp fields
        obj_str = re.sub(r'timestamp:\s*(new Date\(\)|serverTimestamp\(\)),?\n?', '', obj_str)
        obj_str = re.sub(r'createdAt:\s*(new Date\(\)|new Date\(\)\.toISOString\(\)),?\n?', '', obj_str)
        # Check if recipientId needs to be added (by default the endpoint uses recipientId)
        # We'll just pass the object directly, the endpoint handles it (userId or recipientId)
        return f"await fetch('/api/notifications', {{ method: 'POST', headers: {{ 'Content-Type': 'application/json' }}, body: JSON.stringify({obj_str}) }});"

    new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

