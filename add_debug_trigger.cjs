const fs = require('fs');

// Let's add the floating debug button to App.tsx or Sidebar.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes('BerqDebugConsoleModal')) {
  // Import BerqDebugConsoleModal
  appCode = `import { BerqDebugConsoleModal } from './components/BerqCharacterManager';\n` + appCode;

  // Add state showBerqDebug and floating button
  appCode = appCode.replace(`return (`, `  const [showBerqDebug, setShowBerqDebug] = React.useState(false);\n  return (`);

  const floatingButtonHtml = `
      {/* Floating Berq Debug Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowBerqDebug(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-xl border border-amber-300/50 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <span>📡 رادار بيرق (Debug)</span>
        </button>
      </div>

      {showBerqDebug && <BerqDebugConsoleModal onClose={() => setShowBerqDebug(false)} />}
  `;

  // Insert before the last closing div of the main return
  const lastDivIdx = appCode.lastIndexOf('</div>');
  if (lastDivIdx !== -1) {
    appCode = appCode.substring(0, lastDivIdx) + floatingButtonHtml + appCode.substring(lastDivIdx);
  }

  fs.writeFileSync('src/App.tsx', appCode, 'utf8');
  console.log('Added floating Berq debug button to App.tsx');
}
