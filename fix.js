const fs = require('fs');
let content = fs.readFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', 'utf8');

content = content.replace(/className=\{\}/g, "className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedGradePeriod === p.id ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white'}`}");

content = content.replace(/key=\{\}/, "key={`${sub.id}_${idx}_grade`}");

content = content.replace(/className=\{\} \/>/, "className={`w-2 h-2 rounded-full ${isFailed ? 'bg-rose-500' : isExcellent ? 'bg-emerald-500' : 'bg-blue-500'}`} />");

content = content.replace(/className=\{\}>/, "className={`text-xl font-black ${isFailed ? 'text-rose-500' : isExcellent ? 'text-emerald-400' : 'text-blue-400'}`}>");

fs.writeFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', content);
