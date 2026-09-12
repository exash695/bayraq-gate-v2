const fs = require('fs');
let content = fs.readFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', 'utf8');

const regex = /\{\/\* Sub-tab segmented controller \*\/\}[\s\S]*?<\/div>/;

const replacement = `{/* Sub-tab segmented controller */}
            <div className="flex w-full p-1.5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl max-w-3xl mx-auto relative z-10 shadow-2xl">
              <button
                id="subtab-knights"
                onClick={() => setExcellenceSubTab("knights")}
                className={\`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer \${
                  excellenceSubTab === "knights"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }\`}
              >
                <Trophy size={16} className="shrink-0" />
                <span className="text-center leading-tight whitespace-nowrap">سجل الشرف</span>
              </button>
              {!isTeacher && (
                <button
                  id="subtab-badges"
                  onClick={() => setExcellenceSubTab("badges")}
                  className={\`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer \${
                    excellenceSubTab === "badges"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }\`}
                >
                  <Award size={16} className="shrink-0" />
                  <span className="text-center leading-tight whitespace-nowrap">أوسمتي</span>
                </button>
              )}
              {!isTeacher && (
                <button
                  id="subtab-grades"
                  onClick={() => setExcellenceSubTab("grades")}
                  className={\`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer \${
                    excellenceSubTab === "grades"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }\`}
                >
                  <BarChart3 size={16} className="shrink-0" />
                  <span className="text-center leading-tight whitespace-nowrap">درجاتي</span>
                </button>
              )}
              <button
                id="subtab-profile"
                onClick={() => setExcellenceSubTab("profile")}
                className={\`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer \${
                  excellenceSubTab === "profile"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }\`}
              >
                <User size={16} className="shrink-0" />
                <span className="text-center leading-tight whitespace-nowrap">الملف الشخصي</span>
              </button>
            </div>`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', content);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the target block.");
}
