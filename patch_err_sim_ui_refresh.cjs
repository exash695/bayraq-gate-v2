const fs = require('fs');
let content = fs.readFileSync('src/components/dev/ErrorMonitoringSection.tsx', 'utf8');

const refreshBtn = `
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              تحديث
            </button>
            <button
              onClick={handleTriggerTestError}
`;

content = content.replace(/<button\s*onClick=\{handleTriggerTestError\}/g, refreshBtn);

fs.writeFileSync('src/components/dev/ErrorMonitoringSection.tsx', content);
