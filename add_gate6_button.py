import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

button_html = """              {/* Gate 6 Button */}
              <div 
                onClick={() => setActiveSection("gate-6")}
                className="col-span-2 bg-[#0A0F1D] border border-yellow-500/30 hover:border-yellow-500/60 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    النظام الجديد
                  </span>
                  <span className="block text-sm sm:text-base font-black text-yellow-400 truncate">
                    بوابة بيرق (Gate 6)
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Zap size={20} strokeWidth={1.5} className="text-yellow-400 animate-pulse" />
                </div>
              </div>"""

# Replace {/* 3. Sovereignty Platform / تتويجات الصف */} to just add the Gate 6 button before it
target_str = '{/* 3. Sovereignty Platform / تتويجات الصف */}'
if target_str in content:
    content = content.replace(target_str, button_html + "\n              " + target_str)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added before 3.")
else:
    print("Could not find target")
