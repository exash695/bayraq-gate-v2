import re
with open("src/db/schema.ts", "r") as f:
    content = f.read()

# Replace the specific duplicate blocks for support_tickets or other tables that were corrupted
# The block added was:
#  subject: varchar("subject", { length: 100 }),
#  duration: varchar("duration", { length: 50 }),
#  date: varchar("date", { length: 50 }),
#  description: text("description"),

bad_block = r'\s*subject: varchar\("subject", \{ length: 100 \}\),\s*duration: varchar\("duration", \{ length: 50 \}\),\s*date: varchar\("date", \{ length: 50 \}\),\s*description: text\("description"\),'

def replacer(match):
    # If the table is recorded_lessons, keep it, else remove
    # we can't easily know the table context in a simple regex, so we'll just fix the corrupted ones manually
    pass

# Let's just find and replace the bad blocks, then add them back properly to recorded_lessons.
content = re.sub(bad_block, '', content)

with open("src/db/schema.ts", "w") as f:
    f.write(content)
print("Cleaned schema.ts")
