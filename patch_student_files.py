import re
with open("src/components/SchoolPlatform/StudentFilesTab.tsx", "r") as f:
    content = f.read()

# Replace deleteDoc for school_files
content = re.sub(
    r'await deleteDoc\(doc\(db, "school_files", docItem\.id\)\);',
    r'await fetch(`/api/school-files/${docItem.id}`, { method: "DELETE" });',
    content
)

# Replace updateDoc for recorded_lessons views increment
# await updateDoc(doc(db, "recorded_lessons", vidItem.id), { views: increment(1) });
content = re.sub(
    r'await updateDoc\(doc\(db, "recorded_lessons", vidItem\.id\), \{\s*views: increment\(1\)\s*\}\);',
    r'await fetch(`/api/recorded-lessons/${vidItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incrementViews: true }) });',
    content
)

with open("src/components/SchoolPlatform/StudentFilesTab.tsx", "w") as f:
    f.write(content)
