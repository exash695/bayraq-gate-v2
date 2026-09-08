import re
with open("server.ts", "r") as f:
    content = f.read()

# Find handlePatchRecordedLesson and add incrementViews support
replacement = """
      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }
"""

content = re.sub(
    r'const mapped: any = \{\};',
    'const mapped: any = {};\n' + replacement,
    content
)

with open("server.ts", "w") as f:
    f.write(content)
