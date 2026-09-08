import re

with open("server.ts", "r") as f:
    content = f.read()

# Patch handlePostSchoolFile
school_file_replacement = """
      const newFile = {
        id,
        schoolId,
        uploaderId,
        fileName,
        fileUrl,
        fileType,
        title: body.title,
        size: body.size,
        downloads: body.downloads || 0,
        tag: body.tag,
        subject: body.subject,
        grade: body.grade,
        createdAt: new Date()
      };
      await db.insert(school_files).values(newFile).onConflictDoUpdate({
        target: school_files.id,
        set: { fileName, fileUrl, fileType, schoolId, uploaderId, title: body.title, size: body.size, downloads: body.downloads || 0, tag: body.tag, subject: body.subject, grade: body.grade }
      });
"""
content = re.sub(r'const newFile = \{[^\}]+createdAt: new Date\(\)\s*\};\s*await db\.insert\(school_files\)\.values\(newFile\)\.onConflictDoUpdate\(\{\s*target: school_files\.id,\s*set: \{[^}]+\}\s*\}\);', school_file_replacement.strip(), content)

# Patch handlePostRecordedLesson
lesson_replacement = """
      const newLesson = {
        id,
        schoolId,
        teacherId,
        title,
        grade,
        videoUrl,
        subject: body.subject,
        duration: body.duration,
        date: body.date,
        description: body.description,
        createdAt: new Date()
      };
      await db.insert(recorded_lessons).values(newLesson).onConflictDoUpdate({
        target: recorded_lessons.id,
        set: { title, videoUrl, schoolId, teacherId, grade, subject: body.subject, duration: body.duration, date: body.date, description: body.description }
      });
"""
content = re.sub(r'const newLesson = \{[^\}]+createdAt: new Date\(\)\s*\};\s*await db\.insert\(recorded_lessons\)\.values\(newLesson\)\.onConflictDoUpdate\(\{\s*target: recorded_lessons\.id,\s*set: \{[^}]+\}\s*\}\);', lesson_replacement.strip(), content)

with open("server.ts", "w") as f:
    f.write(content)
print("Patched server.ts")
