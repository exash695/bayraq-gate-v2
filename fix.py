with open("src/components/Transport/DriverDashboard.tsx", "r") as f:
    content = f.read()

import re
content = re.sub(r"  return \(\n    <div className=\{`flex-1 bg-\[#0A0D1A\] min-h-\[500px\] w-full \$\{forcedTab \? \"pb-8\" : \"pb-24 md:pb-0\"}`\}>\n      <AnimatePresence mode=\"wait\">\n    <div className=\{`flex-1 bg-\[#0A0D1A\] min-h-\[500px\] \$\{forcedTab \? 'pb-8' : 'pb-24 md:pb-0'\}`\}>\n      <AnimatePresence mode=\"wait\">",
"  return (\n    <div className={`flex-1 w-full bg-[#0A0D1A] min-h-[500px] ${forcedTab ? 'pb-8' : 'pb-24 md:pb-0'}`}>\n      <AnimatePresence mode=\"wait\">", content)

# Check if AnimatePresence is closed. 
if "</AnimatePresence>" not in content[content.find("{/* TAB 1: STUDENT MANIFEST */}"):]:
    # Need to add closing tags at the very end before Toast
    idx = content.find("{/* TOAST SYSTEM FEEDBACK */}")
    if idx != -1:
        content = content[:idx] + "      </AnimatePresence>\n" + content[idx:]
        
with open("src/components/Transport/DriverDashboard.tsx", "w") as f:
    f.write(content)
