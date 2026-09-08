import re

with open("src/db/schema.ts", "r", encoding="utf-8") as f:
    content = f.read()

lounge_table = """
// رسائل المحادثات
export const lounge_messages = pgTable("lounge_messages", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  userName: text("user_name"),
  userRole: varchar("user_role", { length: 50 }),
  recipientId: varchar("recipient_id", { length: 128 }),
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});
"""

if "lounge_messages" not in content:
    content += lounge_table
    with open("src/db/schema.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added lounge_messages schema")
else:
    print("Already exists")
