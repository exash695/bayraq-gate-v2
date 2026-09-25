import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, X, Scan, CheckCircle, Lightbulb, RefreshCw, Layers } from 'lucide-react';
import { AIQuestionAssistantModal } from './AIQuestionAssistantModal';

interface AIPaperExtractorModalProps {
  paper: any;
  onClose: () => void;
}

export const AIPaperExtractorModal: React.FC<AIPaperExtractorModalProps> = ({ paper, onClose }) => {
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => {
    extractQuestions();
  }, []);

  const extractQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `مادة الامتحان: ${paper.subject || 'عام'}\nسنة الامتحان: ${paper.year || 'غير محدد'}\nالدور: ${paper.role || 'غير محدد'}`,
          message: `قم بقراءة الورقة الامتحانية المرفقة بدقة شديدة واستخراج جميع الأسئلة الموجودة فيها بالكامل.
          مهم جداً: 
          1. لا تترك أي سؤال. استخرج جميع الأسئلة من أول سؤال إلى آخر سؤال في الورقة.
          2. استخرج كل سؤال رئيسي بكامل فروعه ونقاطه (أ، ب، ج أو 1، 2، 3) وضعه كنص واحد متكامل يمثل هذا السؤال.
          3. حافظ على الترقيم والتسلسل الهرمي للسؤال داخل النص.
          
          أرجع النتيجة حصراً بصيغة JSON كالتالي:
          {
            "questions": [
              {
                "text": "نص السؤال بالكامل متضمناً كافة فروعه ونقاطه...",
                "options": ["خيار 1", "خيار 2"] // فقط إذا كان السؤال يحتوي على خيارات
              }
            ]
          }
          يجب أن تكون النتيجة JSON صالحة 100% (بدون تنسيق ماركداون).`,
          imageUrl: paper.imageUrl,
          history: []
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("استجابة غير صالحة من السيرفر.");
      }
      
      const data = await response.json();
      
      let cleanStr = data.response.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      const parsed = JSON.parse(cleanStr);
      
      setExtractedQuestions(parsed.questions || []);
    } catch (error) {
      console.error("Failed to extract questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-6 bg-[#050B14]/95 backdrop-blur-2xl" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-gradient-to-b from-[#131B32] to-[#0A1024] rounded-[2rem] border border-fuchsia-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-transparent opacity-50" />
          <div className="relative flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                <Scan className="text-fuchsia-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  الاستخراج الذكي
                  <Sparkles size={16} className="text-amber-400 animate-pulse" />
                </h2>
                <p className="text-xs font-bold text-white/50 mt-1">تفكيك الورقة الامتحانية إلى أسئلة تفاعلية</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col md:flex-row gap-6">
          {/* Left Side: Original Image */}
          <div className="w-full md:w-1/3 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white/50 flex items-center gap-2">
              <Layers size={16} /> الورقة الأصلية
            </h3>
            <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative">
              <img src={paper.imageUrl} alt="Exam Paper" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Right Side: Extracted Questions */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white/50 flex items-center gap-2">
              <Bot size={16} /> الأسئلة المستخرجة
            </h3>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-white/40 bg-white/5 rounded-2xl border border-white/10">
                <Scan className="w-12 h-12 mb-4 animate-bounce text-fuchsia-400" />
                <p className="text-sm font-bold animate-pulse text-fuchsia-200">جاري مسح الورقة واستخراج الأسئلة...</p>
              </div>
            ) : extractedQuestions.length > 0 ? (
              <div className="space-y-4">
                {extractedQuestions.map((q, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="bg-black/20 border border-white/5 p-5 rounded-2xl hover:border-fuchsia-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-black text-sm shrink-0 group-hover:bg-fuchsia-500/20 group-hover:text-fuchsia-300 transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold leading-relaxed mb-4 text-sm">{q.text}</p>
                        
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white/70">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => setSelectedQuestion({...q, subject: paper.subject})}
                          className="py-2 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-black rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center gap-2"
                        >
                          <Sparkles size={14} className="text-amber-400" />
                          المساعد الذكي لهذا السؤال
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-white/40 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-sm font-bold text-red-400">لم يتم العثور على أسئلة واضحة في هذه الورقة.</p>
                <button
                  onClick={extractQuestions}
                  className="mt-4 py-2 px-6 bg-white/5 hover:bg-white/10 text-white text-xs font-black rounded-xl border border-white/10 transition-all"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}
          </div>
        </div>
        
        {selectedQuestion && (
          <AIQuestionAssistantModal
            question={selectedQuestion}
            onClose={() => setSelectedQuestion(null)}
          />
        )}
      </motion.div>
    </div>
  );
};
