import os
import re

for filepath in ['src/components/SchoolPlatform/TeacherControlLiveTab.tsx', 'src/components/SchoolPlatform.tsx']:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        pattern = r"await addDoc\(collection\(db, \"notifications\"\),\s*(\{.*?\})\);"
        
        def replacer(match):
            obj_str = match.group(1)
            obj_str = re.sub(r'timestamp:\s*(new Date\(\)|serverTimestamp\(\)),?\n?', '', obj_str)
            obj_str = re.sub(r'createdAt:\s*(new Date\(\)|new Date\(\)\.toISOString\(\)),?\n?', '', obj_str)
            return f"await fetch('/api/notifications', {{ method: 'POST', headers: {{ 'Content-Type': 'application/json' }}, body: JSON.stringify({obj_str}) }});"

        new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
