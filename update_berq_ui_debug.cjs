const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

// Add a global or exported debug event array and listener setter
const debugStoreCode = `
// Berq Debug Store for UI Inspection
type BerqDebugLog = {
  timestamp: string;
  pose: string;
  imageUrl: string;
  srcPath: string;
  fetchStatus: string;
  imgSrc: string;
  currentSrc: string;
  complete: boolean;
  naturalWidth: number;
  hasError: boolean;
};

let globalBerqLogs: BerqDebugLog[] = [];
let logListeners: ((logs: BerqDebugLog[]) => void)[] = [];

export function addBerqDebugLog(log: BerqDebugLog) {
  globalBerqLogs = [log, ...globalBerqLogs.slice(0, 49)];
  logListeners.forEach(cb => cb(globalBerqLogs));
}

export function subscribeBerqLogs(cb: (logs: BerqDebugLog[]) => void) {
  logListeners.push(cb);
  cb(globalBerqLogs);
  return () => {
    logListeners = logListeners.filter(l => l !== cb);
  };
}
`;

if (!code.includes('Berq Debug Store')) {
  code = debugStoreCode + '\n' + code;
}

// Update the tracing inside BerqCharacter to call addBerqDebugLog
const oldEffect = `  React.useEffect(() => {
    const p = imgSrc || fallbackPng || fallbackJpg || defaultJpg || defaultPng;
    console.log('[BERQ TRACE] --- FETCH CHECK --- pose:', pose, 'path:', p);
    fetch(p, { method: 'HEAD' })
      .then(res => console.log('[BERQ TRACE] 4. Result of fetch for path', p, ':', res.status, res.statusText))
      .catch(err => console.log('[BERQ TRACE] 4. Result of fetch FAILED for path', p, ':', err));
  }, [pose, imgSrc, fallbackPng, fallbackJpg]);`;

const newEffect = `  React.useEffect(() => {
    const p = imgSrc || fallbackPng || fallbackJpg || defaultJpg || defaultPng;
    console.log('[BERQ TRACE] --- FETCH CHECK --- pose:', pose, 'path:', p);
    fetch(p, { method: 'HEAD' })
      .then(res => {
        console.log('[BERQ TRACE] 4. Result of fetch for path', p, ':', res.status, res.statusText);
        addBerqDebugLog({
          timestamp: new Date().toLocaleTimeString(),
          pose: String(pose),
          imageUrl: String(imageUrl),
          srcPath: String(p),
          fetchStatus: \`\${res.status} \${res.statusText}\`,
          imgSrc: String(p),
          currentSrc: '',
          complete: false,
          naturalWidth: 0,
          hasError: !res.ok
        });
      })
      .catch(err => {
        console.log('[BERQ TRACE] 4. Result of fetch FAILED for path', p, ':', err);
        addBerqDebugLog({
          timestamp: new Date().toLocaleTimeString(),
          pose: String(pose),
          imageUrl: String(imageUrl),
          srcPath: String(p),
          fetchStatus: \`FAILED: \${err.message}\`,
          imgSrc: String(p),
          currentSrc: '',
          complete: false,
          naturalWidth: 0,
          hasError: true
        });
      });
  }, [pose, imgSrc, fallbackPng, fallbackJpg, imageUrl]);`;

code = code.replace(oldEffect, newEffect);

// Also update the ref callback for <img> to log and push debug
const oldRef = `          ref={(el) => {
            if (el) {
              console.log('[BERQ TRACE] --- <img> element mounted ---');
              console.log('[BERQ TRACE] 1. Requested pose name:', pose);
              console.log('[BERQ TRACE] 2. Final filename / URL:', imageUrl);
              console.log('[BERQ TRACE] 3. Final path passed to src:', imgSrc || fallbackPng || fallbackJpg);
              console.log('[BERQ TRACE] 5. img.src:', el.src);
              console.log('[BERQ TRACE] 6. img.currentSrc:', el.currentSrc);
              console.log('[BERQ TRACE] 7. img.complete:', el.complete);
              console.log('[BERQ TRACE] 8. img.naturalWidth:', el.naturalWidth);
              console.log('[BERQ TRACE] 10. Cache/Registry check: imageMapping contains:', imageUrl, 'fallbackJpg:', fallbackJpg);
            }
          }}`;

const newRef = `          ref={(el) => {
            if (el) {
              console.log('[BERQ TRACE] --- <img> element mounted ---');
              console.log('[BERQ TRACE] 1. Requested pose name:', pose);
              console.log('[BERQ TRACE] 2. Final filename / URL:', imageUrl);
              console.log('[BERQ TRACE] 3. Final path passed to src:', imgSrc || fallbackPng || fallbackJpg);
              console.log('[BERQ TRACE] 5. img.src:', el.src);
              console.log('[BERQ TRACE] 6. img.currentSrc:', el.currentSrc);
              console.log('[BERQ TRACE] 7. img.complete:', el.complete);
              console.log('[BERQ TRACE] 8. img.naturalWidth:', el.naturalWidth);
              console.log('[BERQ TRACE] 10. Cache/Registry check: imageMapping contains:', imageUrl, 'fallbackJpg:', fallbackJpg);

              addBerqDebugLog({
                timestamp: new Date().toLocaleTimeString(),
                pose: String(pose),
                imageUrl: String(imageUrl),
                srcPath: String(imgSrc || fallbackPng || fallbackJpg),
                fetchStatus: 'Mounted (complete: ' + el.complete + ', naturalWidth: ' + el.naturalWidth + ')',
                imgSrc: el.src,
                currentSrc: el.currentSrc,
                complete: el.complete,
                naturalWidth: el.naturalWidth,
                hasError: el.naturalWidth === 0
              });
            }
          }}`;

code = code.replace(oldRef, newRef);

// Add a floating UI component for viewing Berq logs
const debugWidgetCode = `
export const BerqDebugConsoleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<BerqDebugLog[]>([]);

  React.useEffect(() => {
    return subscribeBerqLogs(setLogs);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text" dir="rtl">
      <div className="bg-[#121620] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-white font-black text-lg">📡 رادار تتبع شخصية بيرق (Berq Trace Console)</h3>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold text-sm transition-colors"
          >
            إغلاق النافذة ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-white/50">جاري جمع بيانات التتبع... انقر أو تفاعل مع الشاشة لتشغيل الشخصيات.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={\`p-4 rounded-xl border \${log.hasError ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-white/5 border-white/10 text-emerald-200'} space-y-1.5\`}>
                <div className="flex justify-between items-center text-white/70 border-b border-white/10 pb-1 mb-2">
                  <span className="font-bold text-amber-400">#{(logs.length - idx)} [{log.timestamp}]</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white">الوضعيات: {log.pose}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><span className="text-white/50">اسم الملف النهائي (URL):</span> <span className="text-white break-all">{log.imageUrl}</span></div>
                  <div><span className="text-white/50">المسار الفعلي للـ src:</span> <span className="text-white break-all">{log.srcPath}</span></div>
                  <div><span className="text-white/50">نتيجة الـ Fetch:</span> <span className={log.hasError ? 'text-red-400 font-bold' : 'text-emerald-400'}>{log.fetchStatus}</span></div>
                  <div><span className="text-white/50">img.src:</span> <span className="text-white break-all">{log.imgSrc}</span></div>
                  <div><span className="text-white/50">img.currentSrc:</span> <span className="text-white break-all">{log.currentSrc || 'غير متوفر'}</span></div>
                  <div><span className="text-white/50">الأبعاد (Natural Width):</span> <span className={log.naturalWidth > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{log.naturalWidth}px</span></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-white/60 text-xs">
          <span>إجمالي السجلات: {logs.length}</span>
          <button 
            onClick={() => { globalBerqLogs = []; setLogs([]); }}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold"
          >
            مسح السجلات
          </button>
        </div>
      </div>
    </div>
  );
};
`;

if (!code.includes('BerqDebugConsoleModal')) {
  code = code + '\n' + debugWidgetCode;
}

fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
console.log('Berq Character Manager updated with UI debug console modal.');
