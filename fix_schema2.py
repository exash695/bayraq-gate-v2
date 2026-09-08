import re
with open("src/db/schema.ts", "r") as f:
    content = f.read()

# For recorded_lessons
content = re.sub(
    r'(export const recorded_lessons = pgTable\("recorded_lessons", \{[\s\S]*?)(videoUrl: text\("video_url"\)\.notNull\(\),)',
    r'\1  subject: varchar("subject", { length: 100 }),\n  duration: varchar("duration", { length: 50 }),\n  date: varchar("date", { length: 50 }),\n  description: text("description"),\n  \2',
    content
)

with open("src/db/schema.ts", "w") as f:
    f.write(content)
