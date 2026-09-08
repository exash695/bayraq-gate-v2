import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { FileText, Plus, Trash2, Calendar, Save, X, Image as ImageIcon, CheckCircle, Loader, Filter, Maximize2, ArrowRight } from 'lucide-react';
import { uploadFileToR2 } from '../services/uploadService';

interface TeacherExamPapersProps {
  schoolId: string;
  teacherData?: any;
  onBack?: () => void;
  selectedClass?: string;
}

export const TeacherExamPapers: React.FC<TeacherExamPapersProps> = ({ schoolId, teacherData, onBack, selectedClass }) => {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [role, setRole] = useState('الدور الأول');
  const [paperImage, setPaperImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [filterYear, setFilterYear] = useState('الكل');
  const [filterRole, setFilterRole] = useState('الكل');
  const [viewImage, setViewImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    const subject = teacherData?.subject || "اللغة الإنجليزية";
    
    const q = query(
      collection(db, 'exam_papers'),
      where('schoolId', '==', schoolId)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = data.filter(d => (d as any).subject === subject);
      filtered.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPapers(filtered);
      setLoading(false);
    });
    
    return () => unsub();
  }, [schoolId, teacherData]);

  const handleAddPaper = async () => {
    if (!paperImage) return alert("يرجى اختيار صورة الورقة الامتحانية");
    if (!year || !role) return alert("يرجى تحديد السنة والدور");
    
    setIsUploading(true);
    try {
      let finalUrl: string;
      try {
        finalUrl = await uploadFileToR2(paperImage);
      } catch (error: any) {
        const errMsg = String(error?.message || '');
        if (errMsg.includes('413') || errMsg.includes('<!doctype html>')) {
          throw new Error('الخادم أرجع استجابة غير صالحة (قد يكون الملف كبيراً جداً)');
        }
        throw new Error(errMsg || 'فشل رفع الصورة');
      }

      await addDoc(collection(db, 'exam_papers'), {
        schoolId,
        teacherId: teacherData?.id || teacherData?.code || 'unknown',
        subject: teacherData?.subject || "اللغة الإنجليزية",
        year,
        role,
        imageUrl: finalUrl,
        createdAt: serverTimestamp()
      });
      
      setShowAddModal(false);
      setPaperImage(null);
      setYear(new Date().getFullYear().toString());
      setRole('الدور الأول');
      
      // Auto open the uploaded image
      setViewImage(finalUrl);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "حدث خطأ أثناء رفع الورقة");
    } finally {
      setIsUploading(false);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(doc(db, 'exam_papers', itemToDelete));
        setItemToDelete(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const confirmDeleteAll = async () => {
    try {
      setLoading(true);
      for (const p of filteredPapers) {
        await deleteDoc(doc(db, 'exam_papers', p.id));
      }
      setShowDeleteAllConfirm(false);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const yearsList = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => (2010 + i).toString()).reverse();
  const uniqueYears = ['الكل', ...yearsList];
  
  const rolesList = ['الدور الأول', 'الدور الثاني', 'الدور الثالث', 'تمهيدي', 'خارجي', 'شهري', 'فصلي', 'اخر السنة', 'اخرى'];
  const uniqueRoles = ['الكل', ...rolesList];

  const filteredPapers = papers.filter(p => {
    if (filterYear !== 'الكل' && p.year !== filterYear) return false;
    if (filterRole !== 'الكل' && p.role !== filterRole) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden relative" dir="rtl">
      <div className="flex flex-col gap-4 mb-6 shrink-0 border-b border-white/10 pb-4 mt-12 md:mt-0">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 shrink-0">
              <FileText size={20} className="text-fuchsia-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight whitespace-nowrap">الأوراق الامتحانية</h2>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">إضافة ورقة</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold"
            >
              <ArrowRight size={16} />
              <span>العودة للأقسام</span>
            </button>
          )}
          
          {filteredPapers.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20"
            >
              <Trash2 size={16} />
              <span>حذف الكل</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 px-2">
          <Filter size={16} className="text-white/40" />
          <span className="text-sm font-bold text-white/70">تصفية:</span>
        </div>
        
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none focus:border-fuchsia-500"
        >
          {uniqueYears.map(y => (
            <option key={y} value={y} className="bg-[#0A1024]">{y === 'الكل' ? 'كل السنوات' : y}</option>
          ))}
        </select>
        
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none focus:border-fuchsia-500"
        >
          {uniqueRoles.map(r => (
            <option key={r} value={r} className="bg-[#0A1024]">{r === 'الكل' ? 'كل الأدوار' : r}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-20">
            <FileText size={64} className="text-white/20 mb-6" />
            <p className="text-white text-xl font-bold mb-2">لا توجد أوراق امتحانية</p>
            <p className="text-white/60">لم يتم العثور على أوراق تطابق الفلتر المحدد.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {filteredPapers.map((paper) => (
              <div 
                key={paper.id} 
                className="w-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex gap-2">
                    <span className="px-4 py-1.5 rounded-xl text-sm font-black bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                      {paper.year}
                    </span>
                    <span className="px-4 py-1.5 rounded-xl text-sm font-black bg-white/10 text-white border border-white/10">
                      {paper.role}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(paper.id, e)} 
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-500/30" 
                    title="حذف الورقة"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div 
                  className="w-full h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-fuchsia-500/50 transition-all relative group shadow-sm"
                  onClick={() => setViewImage(paper.imageUrl)}
                >
                  <img src={paper.imageUrl} alt="Exam Paper" className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-3 opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-white/90 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10">
                      <Maximize2 size={14} />
                      <span>انقر لعرض الورقة كاملة</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#050B14]/90 backdrop-blur-xl">
          <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-fuchsia-500/20 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">إضافة ورقة امتحانية</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-white/70 font-bold text-sm mb-2">السنة الدراسية</label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-fuchsia-500"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y} className="bg-[#0A1024]">{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/70 font-bold text-sm mb-2">الدور / الفصل</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-fuchsia-500"
                >
                  {rolesList.map(r => (
                    <option key={r} value={r} className="bg-[#0A1024]">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/70 font-bold text-sm mb-2">صورة الورقة</label>
                <div 
                  className="w-full border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5"
                  onClick={() => document.getElementById('examPaperInput')?.click()}
                >
                  {paperImage ? (
                    <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPaperImage(null); }}
                        className="absolute -top-4 -right-4 w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                        title="إزالة الصورة"
                      >
                        <X size={16} />
                      </button>
                      <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3" />
                      <p className="text-white text-sm font-bold truncate max-w-[200px]">{paperImage.name}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4 border border-fuchsia-500/20">
                        <ImageIcon size={32} className="text-fuchsia-400" />
                      </div>
                      <p className="text-white/80 font-bold text-base mb-1">انقر لاختيار صورة الورقة</p>
                      <p className="text-white/40 text-xs">JPG, PNG, WEBP (الحد الأقصى 5MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="examPaperInput"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setPaperImage(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleAddPaper}
                disabled={isUploading}
                className="w-full mt-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.4)] flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    حفظ الورقة الامتحانية
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {itemToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-red-500/30 rounded-[2rem] w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6">
              <Trash2 size={32} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">تأكيد الحذف</h3>
            <p className="text-white/60 mb-8">هل أنت متأكد من حذف هذه الورقة الامتحانية؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors border border-white/10">
                إلغاء
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-red-500/30 rounded-[2rem] w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6">
              <Trash2 size={32} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">حذف جميع الأوراق</h3>
            <p className="text-white/60 mb-8">هل أنت متأكد من حذف جميع الأوراق المعروضة ({filteredPapers.length})؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteAllConfirm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors border border-white/10">
                إلغاء
              </button>
              <button onClick={confirmDeleteAll} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      
      {viewImage && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-zoom-out overflow-auto no-scrollbar"
          onClick={() => setViewImage(null)}
        >
          <button 
            className="fixed top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-[160]"
            onClick={(e) => {
              e.stopPropagation();
              setViewImage(null);
            }}
          >
            <X size={24} />
          </button>
          
          <img 
            src={viewImage} 
            alt="Exam Paper Full" 
            className="w-full h-auto object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

