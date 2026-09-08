import re

filepath = 'src/components/StudentSupportForm.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("const hasUnreadAlerts = allTickets.some(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)) || \n                          (displayNotifications && displayNotifications.some(n => !n.read));", 
"const unreadAlertsCount = allTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)).length + (displayNotifications ? displayNotifications.filter(n => !n.read).length : 0);\n  const unreadSocialCount = socialNotifications.filter(n => !n.read).length;")

content = content.replace("{socialNotifications.some(n => !n.read) && (\n                  <span className=\"w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0\" />\n                )}",
"{unreadSocialCount > 0 && (\n                  <span className=\"min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shrink-0\">\n                    {unreadSocialCount > 9 ? '+9' : unreadSocialCount}\n                  </span>\n                )}")

content = content.replace("{hasUnreadAlerts && (\n                  <span className=\"w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0\" />\n                )}",
"{unreadAlertsCount > 0 && (\n                  <span className=\"min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shrink-0\">\n                    {unreadAlertsCount > 9 ? '+9' : unreadAlertsCount}\n                  </span>\n                )}")

with open(filepath, 'w') as f:
    f.write(content)
