import re

with open("src/components/AuthPage.tsx", "r") as f:
    content = f.read()

# Import customAuth
content = content.replace("import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';", 
"import { sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';\nimport { customAuth } from '../services/customAuthService';")

# Replace signInWithEmailAndPassword(auth, email, password) with customAuth.loginWithEmail(email, password)
content = content.replace("await signInWithEmailAndPassword(auth, formData.email, formData.password);", 
"await customAuth.loginWithEmail(formData.email, formData.password);")

# Wait, we need to check if createUserWithEmailAndPassword is used
content = content.replace("await createUserWithEmailAndPassword(auth, formData.email, formData.password);", 
"await customAuth.registerWithEmail(formData.email, formData.password, 'مستخدم جديد', 'student', 'general');")

with open("src/components/AuthPage.tsx", "w") as f:
    f.write(content)

print("Patched AuthPage.tsx successfully.")
