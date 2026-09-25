import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, X, Brain, CheckCircle, Lightbulb, MessageCircle, RefreshCw } from 'lucide-react';
import { BerqCharacter } from './BerqCharacterManager';

interface AIQuestionAssistantModalProps {
  question: any;
  onClose: () => void;
}

export const AIQuestionAssistantModal: React.FC<AIQuestionAssistantModalProps> = ({ question, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hint' | 'evaluate' | 'similar'>('hint');
  const [isLoading, setIsLoading] = useState(false);
  
  // Hint State
  const [hintContent, setHintContent] = useState('');
  
  // Evaluate State
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  
  // Similar State
  const [similarQuestion, setSimilarQuestion] = useState<any>(null);

  const fetchAI = async (prompt: string, expectJson: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `السؤال الحالي هو: ${question.text}\nالخيارات (إن وجدت): ${question.options?.join('، ') || 'لا توجد خيارات'}\nالمادة: ${question.subject || 'عام'}`,
          message: prompt + (expectJson ? '\n\n**يجب أن تعود بصيغة JSON صالحة 100% حسب المطلوب ولا تضف أي نص آخر أو تنسيق ماركداون إضافي (بدون ```json).**' : ''),
          history: [],
          imageUrl: question.imageUrl
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("استجابة غير صالحة من السيرفر.");
      }
      
      const data = await response.json();
      
      setIsLoading(false);
      return data.response;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return null;
    }
  };

  const getHint = async () => {
    if (hintContent) return;
    const prompt = 'قدم تلميحاً ذكياً وشرحاً مبسطاً لمساعدة الطالب على فهم فكرة هذا السؤال وكيفية البدء بحله، دون إعطاء الإجابة النهائية المباشرة.';
    const res = await fetchAI(prompt);
    if (res) setHintContent(res);
  };

  const evaluateAnswer = async () => {
    if (!studentAnswer.trim()) return;
    const prompt = `إجابة الطالب على السؤال أعلاه هي: "${studentAnswer}". 
    قيم هذه الإجابة. هل هي صحيحة، خاطئة، أم تحتاج لتعديل؟ قدم التقييم والتفسير.
    أرجع النتيجة حصراً بصيغة JSON كالتالي:
    {
      "isCorrect": boolean (true or false),
      "feedback": "رسالة تقييم وشرح للطالب"
    }`;
    
    const res = await fetchAI(prompt, true);
    if (res) {
      try {
        let cleanStr = res.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        const parsed = JSON.parse(cleanStr);
        setEvaluation(parsed);
      } catch (e) {
        setEvaluation({ isCorrect: false, feedback: res });
      }
    }
  };

  const getSimilar = async () => {
    const prompt = `استنتج سؤالاً مشابهاً جداً لهذا السؤال بنفس الفكرة ولكن بمعطيات أو صيغة مختلفة، لكي يتدرب عليه الطالب.
    أرجع النتيجة حصراً بصيغة JSON كالتالي:
    {
      "text": "نص السؤال الجديد...",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"] // فقط إذا كان السؤال الأصلي يحتوي على خيارات
    }`;
    
    const res = await fetchAI(prompt, true);
    if (res) {
      try {
        let cleanStr = res.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        const parsed = JSON.parse(cleanStr);
        setSimilarQuestion(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'hint') getHint();
    if (activeTab === 'similar' && !similarQuestion) getSimilar();
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-6 bg-[#050B14]/95 backdrop-blur-2xl" dir="rtl">
      <motion.div layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="w-full max-w-5xl bg-gradient-to-b from-[#131B32] to-[#0A1024] rounded-[2rem] border border-indigo-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/5 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent opacity-50" />
          <div className="relative flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 overflow-hidden relative shrink-0">
                <BerqCharacter pose="pose_ai_companion" glowColor="cyan" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  المساعد الذكي
                  <Sparkles size={16} className="text-amber-400 animate-pulse" />
                </h2>
                <p className="text-xs font-bold text-white/50 mt-1">تلميحات، تقييم، وتدريب ذكي</p>
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

        {/* Question View */}
        <div className="p-4 md:p-6 bg-black/20 border-b border-white/5 shrink-0 max-h-[150px] md:max-h-[250px] overflow-y-auto no-scrollbar relative">
          <h3 className="text-sm font-bold text-white/40 mb-2">السؤال الأصلي:</h3>
          <p className="text-base md:text-lg font-bold text-white leading-relaxed">{question.text}</p>
          {question.options && question.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {question.options.map((opt: string, i: number) => (
                <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white/70">
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('hint')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shrink-0 ${
              activeTab === 'hint' 
                ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Lightbulb size={16} />
            شرح وتلميح
          </button>
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shrink-0 ${
              activeTab === 'evaluate' 
                ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <CheckCircle size={16} />
            تقييم إجابتي
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shrink-0 ${
              activeTab === 'similar' 
                ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <RefreshCw size={16} />
            سؤال مشابه
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 overflow-y-auto no-scrollbar flex-1 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <Bot className="w-12 h-12 mb-4 animate-bounce text-indigo-400" />
              <p className="text-sm font-bold animate-pulse">الذكاء الاصطناعي يفكر...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'hint' && (
                <motion.div layout
                  key="hint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 md:p-6 text-base md:text-lg leading-relaxed text-indigo-50 font-medium whitespace-pre-wrap shadow-inner">
                    {hintContent || 'تعذر جلب التلميح.'}
                  </div>
                </motion.div>
              )}

              {activeTab === 'evaluate' && (
                <motion.div layout
                  key="evaluate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                    <label className="block text-xs font-bold text-white/40 mb-3">ما هي إجابتك أو طريقتك في الحل؟</label>
                    <textarea
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="اكتب إجابتك هنا ليقوم الذكاء الاصطناعي بتقييمها وتصحيحها..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-medium focus:outline-none focus:border-emerald-500/50 min-h-[100px] resize-none"
                    />
                    <button
                      onClick={evaluateAnswer}
                      disabled={!studentAnswer.trim() || isLoading}
                      className="mt-3 w-full py-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30 hover:border-emerald-500"
                    >
                      تقييم الإجابة
                    </button>
                  </div>
                  
                  {evaluation && (
                    <div className={`rounded-2xl p-5 border ${
                      evaluation.isCorrect 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' 
                        : 'bg-red-500/10 border-red-500/30 text-red-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {evaluation.isCorrect ? <CheckCircle className="text-emerald-400" /> : <X className="text-red-400" />}
                        <h4 className="font-black text-lg">
                          {evaluation.isCorrect ? 'إجابة صحيحة أو قريبة جداً!' : 'تحتاج إلى مراجعة وتعديل'}
                        </h4>
                      </div>
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap opacity-90">
                        {evaluation.feedback}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'similar' && (
                <motion.div layout
                  key="similar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {similarQuestion ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <RefreshCw className="text-purple-400" size={20} />
                        <h4 className="font-black text-purple-200">سؤال تدريبي مشابه</h4>
                      </div>
                      <p className="text-purple-100 font-bold leading-relaxed mb-4">
                        {similarQuestion.text}
                      </p>
                      
                      {similarQuestion.options && similarQuestion.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                          {similarQuestion.options.map((opt: string, i: number) => (
                            <div key={i} className="bg-black/20 border border-white/5 p-3 rounded-xl text-sm text-white/70 font-medium">
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-white/40 font-bold py-10">
                      جاري إنشاء سؤال مشابه...
                    </div>
                  )}
                  
                  {similarQuestion && (
                    <button
                      onClick={getSimilar}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-sm transition-all border border-white/10"
                    >
                      توليد سؤال آخر
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};
