with open("src/components/TeacherAIAssistant.tsx", "r") as f:
    content = f.read()

import re

# Import TeacherSovereigntyManager
if "TeacherSovereigntyManager" not in content:
    content = content.replace("import TeacherActivities from \"./TeacherActivities\";", "import TeacherActivities from \"./TeacherActivities\";\nimport { TeacherSovereigntyManager } from './Sovereignty/TeacherSovereigntyManager';")

# Add to type
content = content.replace("'competitions' | 'history' | 'activities'", "'competitions' | 'history' | 'activities' | 'sovereignty'")

# Add to tools
if "id: 'sovereignty'" not in content:
    tool_str = "    { id: 'sovereignty', title: \"مدير التحديات والسيادة\", desc: \"إدارة التحديات الصفية، منح الرايات، ومراقبة ترتيب الصف.\", icon: Trophy, color: \"text-amber-400\", bg: \"bg-amber-500/10\", border: \"border-amber-500/20\" },\n"
    content = content.replace("    { id: 'questions', title: \"توليد أسئلة\"", tool_str + "    { id: 'questions', title: \"توليد أسئلة\"")

# Add render logic
if "{activeTool === 'sovereignty' ?" not in content:
    render_logic = """      {activeTool === 'sovereignty' ? (
        <div className="relative z-10 flex-1 h-auto flex flex-col">
          <div className="flex justify-end mb-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-white/50 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 w-fit cursor-pointer">
              <ChevronRight size={20} /> عودة للمساعد
            </button>
          </div>
          <div className="flex-1 relative">
            <TeacherSovereigntyManager language="ar" teacherData={teacherData} />
          </div>
        </div>
      ) : activeTool === 'activities' ? ("""
    content = content.replace("{activeTool === 'activities' ? (", render_logic)

with open("src/components/TeacherAIAssistant.tsx", "w") as f:
    f.write(content)
