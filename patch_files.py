import re

with open("src/components/SchoolPlatform/TeacherControlFilesTab.tsx", "r") as f:
    content = f.read()

# Fix school-files
content = re.sub(
    r"await fetch\('/api/school-files', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application/json' \},\s*body: JSON\.stringify\(\{.*?\}\)\s*\}\);",
    r"""await fetch('/api/school-files', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: uploadedAssetTitle.trim() || fileName.replace(/\.[^/.]+$/, ""),
                                    size: fileSize,
                                    downloads: 0,
                                    tag: uploadedAssetTag || "ملخص شامل",
                                    subject: finalSubject,
                                    grade: isTeacher ? (targetBroadcastGrade || "سادس علمي") : (grade || userProfile?.grade || "سادس علمي"),
                                    schoolId: resolvedSchoolId,
                                    fileUrl: uploadedFileUrl || "",
                                    createdAt: new Date().toISOString()
                                  })
                                });""",
    content,
    flags=re.DOTALL
)

# Fix recorded-lessons
content = re.sub(
    r"await fetch\('/api/recorded-lessons', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application/json' \},\s*body: JSON\.stringify\(\{.*?\}\)\s*\}\);",
    r"""await fetch('/api/recorded-lessons', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: uploadedVideoTitle,
                                    subject: (isTeacher && teacherData?.subject) ? teacherData.subject : uploadedVideoSubject,
                                    grade: isTeacher ? (targetBroadcastGrade || "سادس علمي") : (grade || userProfile?.grade || "سادس علمي"),
                                    duration: uploadedVideoDuration || "0:00",
                                    date: today,
                                    videoUrl: finalVideoUrl,
                                    description: uploadedVideoDesc || "محاضرة مرئية منشورة لفرسان السادس الأبطال",
                                    schoolId: resolvedSchoolId,
                                    timestamp: new Date().toISOString(),
                                    allowDownload: false
                                  })
                                });""",
    content,
    flags=re.DOTALL
)

with open("src/components/SchoolPlatform/TeacherControlFilesTab.tsx", "w") as f:
    f.write(content)
print("Patched!")
