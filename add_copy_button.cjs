const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

const oldFooter = `        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-white/60 text-xs">
          <span>إجمالي السجلات: {logs.length}</span>
          <button 
            onClick={() => { globalBerqLogs = []; setLogs([]); }}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold"
          >
            مسح السجلات
          </button>
        </div>`;

const newFooter = `        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-white/60 text-xs gap-2 flex-wrap">
          <span>إجمالي السجلات: {logs.length}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const text = logs.map((l, i) => \`[\${l.timestamp}] Pose: \${l.pose} | URL: \${l.imageUrl} | Src: \${l.srcPath} | Status: \${l.fetchStatus} | NaturalWidth: \${l.naturalWidth}\`).join('\\n');
                navigator.clipboard.writeText(text);
                alert('تم نسخ جميع السجلات بنجاح! يمكنك الآن لصقها هنا في المحادثة.');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold shadow transition-all flex items-center gap-1"
            >
              📋 نسخ محتوى السجلات (Copy Logs)
            </button>
            <button 
              onClick={() => { globalBerqLogs = []; setLogs([]); }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              مسح السجلات
            </button>
          </div>
        </div>`;

if (code.includes('إجمالي السجلات')) {
  code = code.replace(oldFooter, newFooter);
  fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
  console.log('Successfully added Copy Logs button.');
} else {
  console.log('Could not find footer exact match.');
}
