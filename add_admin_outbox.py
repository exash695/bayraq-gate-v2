import os

filepath = 'src/db/schema.ts'
with open(filepath, 'r') as f:
    content = f.read()

outbox_schema = """
export const admin_outbox = pgTable("admin_outbox", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  title: text("title"),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  targetRole: varchar("target_role", { length: 50 }),
  count: integer("count").default(0),
  refIds: json("ref_ids"),
  broadcastId: varchar("broadcast_id", { length: 128 }),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
"""

if "export const admin_outbox" not in content:
    content += outbox_schema
    with open(filepath, 'w') as f:
        f.write(content)
