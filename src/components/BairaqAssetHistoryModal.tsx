import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { History, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { POSE_ALIASES_MAP, updateGlobalPoses } from '../components/BerqCharacterManager';

interface HistoryRecord {
  id: string;
  assetId: string;
  fileName: string;
  downloadUrl: string;
  assetType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
}

interface BairaqAssetHistoryModalProps {
  assetId: string;
  assetTitle: string;
  onClose: () => void;
  onRestored: (url: string) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BairaqAssetHistoryModal: React.FC<BairaqAssetHistoryModalProps> = ({ assetId, assetTitle, onClose, onRestored, triggerToast }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // 1. Primary: Server-side API with full admin privileges
        const res = await fetch(`/api/bairaq/history/${encodeURIComponent(assetId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.records && Array.isArray(json.records) && json.records.length > 0) {
            if (isMounted) {
              setHistory(json.records);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("API history fetch fallback to Firestore:", e);
      }

      // 2. Fallback: Direct Firestore fetch from system_config and system_settings
      try {
        const snapConfig = await getDoc(doc(db, "system_config", `history_${assetId}`)).catch(() => null);
        if (snapConfig && snapConfig.exists()) {
          const data = snapConfig.data();
          const records: HistoryRecord[] = data.records || [];
          records.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          if (isMounted) {
            setHistory(records);
            setLoading(false);
            return;
          }
        }

        const snapSettings = await getDoc(doc(db, "system_settings", `history_${assetId}`)).catch(() => null);
        if (snapSettings && snapSettings.exists()) {
          const data = snapSettings.data();
          const records: HistoryRecord[] = data.records || [];
          records.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          if (isMounted) {
            setHistory(records);
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          setHistory([]);
        }
      } catch (err) {
        console.error("Failed to fetch history from all sources", err);
        if (isMounted) {
          triggerToast("تعذر جلب السجل", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [assetId]);

  const handleRestore = async (record: HistoryRecord) => {
    setRestoringId(record.id);
    try {
      // 1. Verify URL is still accessible before restoring
      const isVideo = record.assetType?.startsWith('video/');
      const isValid = await new Promise((resolve) => {
        if (isVideo) {
          const video = document.createElement('video');
          video.onloadedmetadata = () => resolve(true);
          video.onerror = () => resolve(false);
          video.src = record.downloadUrl;
        } else {
          const imgCheck = new Image();
          imgCheck.onload = () => resolve(true);
          imgCheck.onerror = () => resolve(false);
          imgCheck.src = record.downloadUrl;
        }
      });

      if (!isValid) {
        triggerToast("الملف لم يعد متاحاً أو تالف في التخزين الدائم.", "error");
        setRestoringId(null);
        return;
      }

      // 2. Perform Atomic Server-side Restore
      console.log(`[ASSET OVERRIDE] Restoring asset ${assetId} to version ${record.downloadUrl}`);
      try {
        const restoreRes = await fetch('/api/bairaq/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId,
            downloadUrl: record.downloadUrl
          })
        });
        if (restoreRes.ok) {
          const resData = await restoreRes.json();
          console.log(`[DATABASE WRITE] [RESTORE] Server confirmed restore:`, resData);
          if (resData.poses) {
            updateGlobalPoses(resData.poses);
          }
        }
      } catch(e) {
        console.warn("Server restore warning:", e);
      }

      // 3. Fallback client-side Firestore writes and global state sync
      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const keysToSave = Array.from(new Set([assetId, ...aliases]));
      const savePayload: Record<string, string> = {};
      keysToSave.forEach(k => {
        savePayload[k] = record.downloadUrl;
      });

      updateGlobalPoses(savePayload);
      
      await setDoc(doc(db, "system_config", "bairaq_poses"), savePayload, { merge: true }).catch(() => {});
      await setDoc(doc(db, "system_settings", "bairaq_poses"), savePayload, { merge: true }).catch(() => {});
      
      triggerToast("تم استعادة النسخة السابقة بنجاح!", "success");
      onRestored(record.downloadUrl);
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast("حدث خطأ أثناء الاستعادة", "error");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="text-emerald-400" />
            <div>
              <h3 className="text-white font-black text-lg">سجل الإصدارات</h3>
              <p className="text-white/50 text-xs">{assetTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕ إغلاق</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12 text-white/50">جاري تحميل السجل...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
              لا توجد إصدارات سابقة لهذه الوضعية.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record, index) => (
                <div key={record.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/5 flex items-center justify-center">
                    {record.assetType?.startsWith('video/') ? (
                      <video src={record.downloadUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={record.downloadUrl} className="w-full h-full object-cover" alt="History preview" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold truncate">{record.fileName || 'بدون اسم'}</span>
                      {index === 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">الأحدث</span>}
                    </div>
                    <div className="text-white/50 text-xs space-y-1">
                      <p>تاريخ الرفع: {new Date(record.uploadedAt).toLocaleString('ar-SA')}</p>
                      <p>الحجم: {(record.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleRestore(record)}
                      disabled={restoringId === record.id}
                      className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {restoringId === record.id ? 'جاري الاستعادة...' : <><RotateCcw size={16} /> استعادة هذه النسخة</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
