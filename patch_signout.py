import os

files_to_patch = [
    "src/components/ProfileDashboard.tsx",
    "src/components/Sidebar.tsx"
]

for filepath in files_to_patch:
    with open(filepath, "r") as f:
        content = f.read()
        
    content = content.replace("import { signOut } from 'firebase/auth';", "import { customAuth } from '../services/customAuthService';")
    content = content.replace("import { signOut, deleteUser } from 'firebase/auth';", "import { deleteUser } from 'firebase/auth';\nimport { customAuth } from '../services/customAuthService';")
    content = content.replace("signOut(auth)", "customAuth.logout()")
    
    with open(filepath, "w") as f:
        f.write(content)

print("Patched signOut everywhere.")
