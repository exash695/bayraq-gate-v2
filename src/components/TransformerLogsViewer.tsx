import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Download, X, AlertTriangle, Monitor, Cpu } from 'lucide-react';
import { getTransformerLogs, TransformerLog, clearTransformerLogs } from '../utils/transformerLogger';

export const TransformerLogsViewer = ({ onClose }: { onClose: () => void }) => {
  const [logs, setLogs] = useState<TransformerLog[]>([]);

  useEffect(() => {
    const updateLogs = () => {
      setLogs([...getTransformerLogs()]);
    };
    
    // Initial fetch
    updateLogs();

    // Listen to custom event
    window.addEventListener('transformer-log-updated', updateLogs);
    return () => window.removeEventListener('transformer-log-updated', updateLogs);
  }, []);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dt = new Date().toISOString().replace(/[:.]/g, '-');
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `transformer-logs-${dt}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono" dir="ltr">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <Terminal className="text-zinc-400" size={20} />
            <h2 className="text-zinc-200 font-bold tracking-tight">Transformer Debug Engine Logs</h2>
            <span className="text-zinc-500 text-xs bg-zinc-800 px-2 py-1 rounded">
              {logs.length} / 500 records
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded uppercase tracking-wider transition-colors"
            >
              <Download size={14} /> Export Logs
            </button>
            <button 
              onClick={() => {
                clearTransformerLogs();
                setLogs([]);
              }}
              className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/30 hover:bg-red-900/50 px-3 py-1.5 rounded shadow-sm transition-colors"
            >
              Clear
            </button>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2 relative bg-[#050505]">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <Monitor size={48} className="mb-4 opacity-20" />
              <p>No transformer logs recorded yet.</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  log.isError 
                    ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2 pb-2 border-b border-white/5 opacity-80">
                  <span className="font-bold shrink-0">{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    log.isError ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/30 text-blue-300'
                  }`}>
                    {log.stage}
                  </span>
                  {log.pageInfo && (
                    <span className="text-amber-400 font-bold bg-amber-900/20 px-2 py-0.5 rounded">
                      {log.pageInfo}
                    </span>
                  )}
                  {log.timeSpentMs !== undefined && (
                    <span className="text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded">
                      ~{log.timeSpentMs}ms
                    </span>
                  )}
                  {log.memory && (
                    <span className="flex items-center gap-1 text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">
                      <Cpu size={10} /> Heap: {log.memory}
                    </span>
                  )}
                </div>
                
                <div className="whitespace-pre-wrap font-mono">{log.message}</div>
                
                {log.stackTrace && (
                  <details className="mt-3 group cursor-pointer">
                    <summary className="text-zinc-500 hover:text-zinc-300 transition-colors select-none font-bold text-[10px] uppercase flex items-center gap-2">
                      <AlertTriangle size={12} className="text-red-500/50" />
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-black/60 rounded text-[9px] text-zinc-400 overflow-x-auto">
                      {log.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
          <div className="h-4" /> {/* bottom padding */}
        </div>
      </motion.div>
    </div>
  );
};
