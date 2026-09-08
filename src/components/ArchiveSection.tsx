import React, { useState } from 'react';
import { Database, Trash2, ChevronLeft } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { logActivity } from '../utils/auditLogger';

interface ArchiveSectionProps {
  savedLists: any[];
  setSavedLists: (lists: any[]) => void;
  setSelectedArchiveList: (list: any) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onDelete?: (id: string) => void;
}

export const ArchiveSection: React.FC<ArchiveSectionProps> = ({
  savedLists,
  setSavedLists,
  setSelectedArchiveList,
  showToast,
  onDelete
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);

  return (
    <div className="space-y-6 pt-6 animate-in slide-in-from-bottom-5 duration-700">
      <ConfirmDialog 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          const originalLists = [...savedLists];
          setSavedLists(savedLists.filter(l => l.id !== confirmDelete.id));
          try {
            const listName = confirmDelete.name;
            const listId = confirmDelete.id;
            
            if (onDelete) {
              await onDelete(confirmDelete.id);
            }
            
            logActivity({
              action: 'حذف قائمة من الأرشيف',
              details: `تم حذف القائمة المؤرشفة: ${listName} نهائياً`,
              targetId: listId,
              targetType: 'academic_list',
              targetName: listName
            });
          } catch (e: any) {
            setSavedLists(originalLists);
            console.error('Delete Error:', e);
            alert('فشل الحذف: ' + (e.message || 'خطأ غير معروف'));
          } finally {
            setConfirmDelete(null);
          }
        }}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف القائمة "${confirmDelete?.name}"؟`}
      />
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Database size={20} className="text-purple-400" />
          </div>
          <h4 className="text-white font-black text-xl tracking-tight">الأرشيف الرقمي والقوائم</h4>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-white/20 text-[9px] font-black uppercase">إجمالي الوجبات</span>
            <span className="text-purple-400 text-base font-black leading-none mt-0.5">{savedLists.length}</span>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-white/20 text-[9px] font-black uppercase">إجمالي الطلاب</span>
            <span className="text-emerald-400 text-base font-black leading-none mt-0.5">
              {savedLists.reduce((acc, list) => acc + (list.students?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {savedLists.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-white/5 rounded-none md:rounded-[50px] -mx-4 md:mx-0 text-center flex flex-col items-center gap-4 bg-white/[0.01]">
          <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center text-white/5">
            <Database size={40} />
          </div>
          <div>
            <p className="text-white/20 text-md font-black tracking-tight">لا توجد قوائم مؤرشفة</p>
            <p className="text-white/10 text-[10px] font-bold mt-1">ابدأ بإصدار أكواد الطلاب لملء الأرشيف</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(savedLists || []).slice().sort((a,b) => (a.name || '').localeCompare((b.name || ''), 'ar')).map((list, idx) => (
            <div 
              key={`${list.id}_${idx}_archive_list`} 
              onClick={() => setSelectedArchiveList(list)}
              className="bg-[#101935] border-y md:border border-white/5 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-6 hover:border-purple-500/40 transition-all cursor-pointer group hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)] relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <Database size={28} />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg group-hover:text-purple-400 transition-colors tracking-tight">{list.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></span>
                        <span className="text-white/30 text-[11px] font-bold">{list.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></span>
                        <span className="text-emerald-500/60 text-[11px] font-black">{list.students.length} طالباً</span>
                      </div>
                    </div>
                  </div>
                </div>
                 <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: list.id, name: list.name });
                    }}
                    className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/20"
                    title="حذف القائمة"
                  >
                    <Trash2 size={24} />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/10 group-hover:bg-white/10 group-hover:text-white transition-all">
                    <ChevronLeft size={24} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
