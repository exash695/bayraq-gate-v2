import os

filepath = '/app/applet/src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = """    unsubscribeProfile = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          if (activeSection !== "profile-setup")
            setActiveSection("profile-setup");
          initializedProfile.current = true;
          return;
        }

        const profileData = docSnap.data();"""

replacement = """    unsubscribeProfile = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // Auto create profile silently
          setDoc(
            docRef,
            {
              fullName: user.displayName || (user.email ? user.email.split("@")[0] : "فارس جديد"),
              governorate: "غير محدد",
              profileCompleted: true,
              status: "online",
              role: "student",
              lastActive: new Date().toISOString(),
            },
            { merge: true }
          ).catch(console.error);
          return;
        }

        const profileData = docSnap.data();"""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
