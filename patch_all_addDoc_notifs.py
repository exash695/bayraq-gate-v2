import os
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "collection(db, 'notifications')" not in content and "collection(db, \"notifications\")" not in content:
        return
        
    print(f"Processing {filepath}...")
    import re

    # Replace addDoc(collection(db, 'notifications'), { ... })
    # We will use regex to find addDoc(collection(db, 'notifications'), { ... })
    # and replace with fetch('/api/notifications', { method: 'POST', ... })

    pattern = re.compile(r"await addDoc\(collection\(db,\s*['\"]notifications['\"]\),\s*({[^}]*})\);", re.DOTALL)
    
    def replacer(match):
        obj_str = match.group(1)
        # Convert timestamp: serverTimestamp() or similar if any
        obj_str = re.sub(r'timestamp:\s*serverTimestamp\(\),?', '', obj_str)
        obj_str = re.sub(r'createdAt:\s*new Date\(\)\.toISOString\(\),?', '', obj_str)
        
        # We assume body has what we need
        return f"await fetch('/api/notifications', {{\n        method: 'POST',\n        headers: {{ 'Content-Type': 'application/json' }},\n        body: JSON.stringify({obj_str})\n      }});"

    new_content = pattern.sub(replacer, content)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

