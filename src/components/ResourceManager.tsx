import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Trash2, Eye, Search, Loader2, FileText, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { logActivity } from '../utils/auditLogger';

interface ContentItem {
  id: string;
  title?: string;
  name?: string;
  teacherName?: string;
  uploaderName?: string;
  subject?: string;
  grade?: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  createdAt?: any;
}

export const ResourceManager: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: ContentItem | null }>({
    isOpen: false,
    item: null
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentItem[];
      
      // Ensure unique list (safeguard against duplicate keys in UI)
      const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
      setContents(uniqueData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching content:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    const item = deleteModal.item;
    if (!item) return;

    setIsDeleting(true);
    try {
      // 1. Delete from Firebase Storage if filePath exists
      if (item.filePath) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, item.filePath);
          await deleteObject(fileRef);
        } catch (storageErr) {
          console.warn("Could not delete from storage, it may not exist:", storageErr);
        }
      } else if (item.url || item.fileUrl) {
         // Attempt to extract path from Firebase Storage URL if possible, though often complex.
         // If they didn't provide filePath, we might skip or let another function handle it.
         const urlToParse = item.url || item.fileUrl || '';
         if (urlToParse.includes('firebasestorage.googleapis.com')) {
           try {
             // Basic attempt to delete by HTTP URL reference
             const storage = getStorage();
             const fileRef = ref(storage, urlToParse);
             await deleteObject(fileRef);
           } catch (e) {
             console.warn("Storage deletion by URL failed:", e);
           }
         }
      }

      // 2. Delete firestore document
      await deleteDoc(doc(db, 'content', item.id));

      // 3. Optional: Notify teacher/log reason
      if (deleteReason.trim() !== '') {
        await addDoc(collection(db, 'notifications'), {
          title: 'تم حذف المحتوى الخاص بك',
          message: `تم حذف "${item.title || item.name || 'ملف'}" بواسطة الإدارة. السبب: ${deleteReason}`,
          type: 'system',
          targetUsers: 'teachers', // Depending on your DB structure
          teacherName: item.teacherName || item.uploaderName || 'Unknown',
          createdAt: serverTimestamp(),
          read: false
        });
      }

      logActivity({
        action: 'حذف محتوى',
        details: `تم إزالة الوثيقة "${item.title || item.name || 'بدون عنوان'}" نهائياً من النظام. ${deleteReason ? `السبب: ${deleteReason}` : ''}`,
        targetId: item.id,
        targetType: 'content'
      });

      showToast('تم الحذف النهائي بنجاح', 'success');
      setDeleteModal({ isOpen: false, item: null });
      setDeleteReason('');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredContents = contents.filter(c => {
    const searchString = `${c.title || ''} ${c.name || ''} ${c.teacherName || ''} ${c.subject || ''}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border-white/10 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={28} />
            مركز مراقبة المحتوى
          </h2>
          <p className="text-white/40 text-sm mt-1 font-bold">مراجعة والتحكم في كافة الملفات والملازم المرفوعة</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="بحث باسم الملف، الأستاذ، أو المادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <Loader2 className="text-emerald-400 animate-spin" size={40} />
            <p className="text-white/40 font-bold text-sm">جاري جلب المحتوى...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
            <FileText className="text-white/10 mb-4" size={60} />
            <p className="text-white/30 font-black text-lg">لا يوجد محتوى لعرضه</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#101935] sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="p-4 text-white/50 text-sm font-black w-14 text-center">#</th>
                  <th className="p-4 text-white/50 text-sm font-black whitespace-nowrap">اسم الملف</th>
                  <th className="p-4 text-white/50 text-sm font-black whitespace-nowrap">الأستاذ</th>
                  <th className="p-4 text-white/50 text-sm font-black whitespace-nowrap">المادة / المرحلة</th>
                  <th className="p-4 text-white/50 text-sm font-black text-center whitespace-nowrap">تاريخ الرفع</th>
                  <th className="p-4 text-white/50 text-sm font-black text-center w-32 whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.map((item, index) => {
                  const url = item.url || item.fileUrl || '#';
                  const dateStr = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('ar-IQ') : 'غير متوفر';
                  
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-center text-white/30 font-bold">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm max-w-[200px] truncate" title={item.title || item.name}>
                              {item.title || item.name || 'بدون اسم'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1 rounded-full whitespace-nowrap">
                          {item.teacherName || item.uploaderName || 'مجهول'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-bold text-sm">{item.subject || '-'}</span>
                          <span className="text-white/40 text-xs font-bold">{item.grade || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-white/60 text-xs font-bold font-mono tracking-wider">{dateStr}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => window.open(url, '_blank')}
                            className="w-9 h-9 rounded-xl bg-white/5 text-white/60 hover:bg-cyan-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                            title="معاينة الملف"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, item })}
                            className="w-9 h-9 rounded-xl bg-white/5 text-white/60 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                            title="حذف نهائي"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && deleteModal.item && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteModal({ isOpen: false, item: null })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0A0F1E] border border-rose-500/20 w-full max-w-md rounded-[40px] p-8 relative z-[201] shadow-2xl"
            >
              <button 
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                disabled={isDeleting}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6 shadow-inner shadow-rose-500/20">
                <AlertTriangle size={36} />
              </div>

              <h3 className="text-xl font-black text-center text-white mb-2">تأكيد الحذف النهائي</h3>
              <p className="text-center text-white/50 text-sm mb-6 font-bold leading-relaxed">
                هل أنت متأكد من حذف الملف "{deleteModal.item.title || deleteModal.item.name || 'هذا الملف'}"؟ <br className="hidden sm:block" />سوف يتم حذفه من قاعدة البيانات وسيرفر التخزين نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </p>

              <div className="mb-6">
                <label className="block text-white/50 text-xs font-black mb-2">سبب الحذف (اختياري - يظهر للأستاذ)</label>
                <input 
                  type="text" 
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="مثال: يحتوي على أخطاء إملائية..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-rose-500 transition-all"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
                </button>
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, item: null })}
                  disabled={isDeleting}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex justify-center w-full px-6 pointer-events-none"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-sm' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 backdrop-blur-sm'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

