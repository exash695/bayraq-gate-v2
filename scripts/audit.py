import os
import re

cols = [
    "academic_lists", "academy_pages", "activation_codes", "admin_outbox", "admins",
    "bairaq_pose_chunks", "battalions", "broadcasts", "bus_drivers", "class_schedules",
    "codes", "community_posts", "community_stories", "content", "curriculum_questions",
    "developer_logs", "exam_papers", "global_announcements", "idea_bank", "live_sessions",
    "lounge_messages", "notifications", "parent_receipts", "payment_requests", "provinces",
    "question_bank", "receipts", "recorded_lessons", "school_archives", "school_configs",
    "school_files", "school_settings", "school_students", "schools", "settings",
    "social_notifications", "student_live_notes", "support_tickets", "system_announcements",
    "system_config", "system_errors", "system_settings", "system_stats", "teachers",
    "transport_drivers", "transport_fees", "transport_routes", "transport_students_status",
    "users", "video_comments"
]

with open("src/lib/firestoreSqlAdapter.ts", "r", encoding="utf-8") as f:
    adapter_text = f.read()

with open("server.ts", "r", encoding="utf-8") as f:
    server_text = f.read()

print(f"{'Collection':<30} | {'Adapter Mapped':<15} | {'Server Route':<15}")
print("-" * 65)

unmapped = []
missing_route = []

for c in sorted(cols):
    c_dash = c.replace('_', '-')
    mapped = (f"'{c}':" in adapter_text) or (f'"{c}":' in adapter_text)
    server_has = (f"/api/{c}" in server_text) or (f"/api/{c_dash}" in server_text)
    
    status_map = "YES" if mapped else "NO"
    status_srv = "YES" if server_has else "NO"
    
    print(f"{c:<30} | {status_map:<15} | {status_srv:<15}")
    if not mapped:
        unmapped.append(c)
    if not server_has:
        missing_route.append(c)

print("\n=== NOT IN ADAPTER MAPPING ===")
for u in unmapped:
    print(f" - {u}")

print("\n=== NO DIRECT ROUTE IN SERVER.TS ===")
for m in missing_route:
    print(f" - {m}")
