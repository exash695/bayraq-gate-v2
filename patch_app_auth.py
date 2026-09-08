import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace Firebase Auth imports with customAuth
content = content.replace("import {\n  onAuthStateChanged,\n  signInWithEmailAndPassword,\n  createUserWithEmailAndPassword,\n} from \"firebase/auth\";", 
"import { customAuth } from \"./services/customAuthService\";")

content = content.replace("import { auth, db, purgeFirestore } from \"./lib/firebase\";", 
"import { auth, db, purgeFirestore } from \"./lib/firebase\";\nimport { customAuth } from \"./services/customAuthService\";")

content = content.replace("const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {", 
"const unsubscribeAuth = customAuth.onAuthStateChanged((currentUser: any) => {")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patched App.tsx successfully.")
