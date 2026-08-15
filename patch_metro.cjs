const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/MetroTransitViewer.tsx', 'utf8');

code = code.replace(/<div \n      onClick=\{onClick\}\n      className=\{\`relative w-full max-w-5xl h-\[90px\] flex items-center justify-between px-4 md:px-6 bg-\[\#0a0d1c\]\/80 backdrop-blur-xl border rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 \$\{isSelected \? 'border-white\/20 shadow-\[0_0_30px_rgba\(255,255,255,0\.05\)\] bg-\[\#0f142b\]\/90' : 'border-white\/5 hover:border-white\/10 hover:bg-\[\#0c1024\]\/90'\}\`\}\n      dir="rtl"\n    >/g, 
`<div 
      onClick={onClick}
      className={\`relative w-full max-w-5xl h-[90px] flex items-center justify-between px-4 md:px-6 bg-[#0a0d1c]/80 backdrop-blur-xl border rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 \${isSelected ? 'border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-[#0f142b]/90' : 'border-white/5 hover:border-white/10 hover:bg-[#0c1024]/90'}\`}
      dir="ltr"
    >`);

// Fix the Left Info dir
code = code.replace(/\{.*?Left: Info.*?\}/, `\{/* Left: Info */\}
      <div className="flex flex-col justify-center items-end w-32 md:w-44 z-10 shrink-0 border-r border-white/5 pr-4 mr-4" dir="rtl">`);

// Fix the Right Destination dir
code = code.replace(/\{.*?Right: Destination.*?School.*?\}/, `\{/* Right: Destination (School) */\}
      <div className="flex flex-col justify-center items-start w-32 md:w-40 z-10 shrink-0 border-l border-white/5 pl-4 ml-4" dir="rtl">`);

code = code.replace(/style=\{\{ right: \`calc\(\$\{lineProgress \* 100\}\% - 14px\)\` \}\}/g, 
`style={{ left: \`calc(\${lineProgress * 100}% - 14px)\` }}`);

code = code.replace(/right: 0,/g, `left: 0,`);

fs.writeFileSync('src/components/Transport/MetroTransitViewer.tsx', code);
