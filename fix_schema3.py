import re
with open("src/db/schema.ts", "r") as f:
    content = f.read()

bad_block = r'\s*title: text\("title"\),\s*size: varchar\("size", \{ length: 50 \}\),\s*downloads: integer\("downloads"\)\.default\(0\),\s*tag: varchar\("tag", \{ length: 100 \}\),\s*subject: varchar\("subject", \{ length: 100 \}\),\s*grade: varchar\("grade", \{ length: 50 \}\),'

content = re.sub(bad_block, '', content)

content = re.sub(
    r'(export const school_files = pgTable\("school_files", \{[\s\S]*?)(fileType: varchar\("file_type", \{ length: 50 \}\),)',
    r'\1  title: text("title"),\n  size: varchar("size", { length: 50 }),\n  downloads: integer("downloads").default(0),\n  tag: varchar("tag", { length: 100 }),\n  subject: varchar("subject", { length: 100 }),\n  grade: varchar("grade", { length: 50 }),\n  \2',
    content
)

with open("src/db/schema.ts", "w") as f:
    f.write(content)
