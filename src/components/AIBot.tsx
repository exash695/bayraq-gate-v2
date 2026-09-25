import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, X, MessageCircle } from 'lucide-react';
import { INITIAL_PAGES } from '../data';
import { BerqCharacter } from './BerqCharacterManager';
import { aiWorkerService } from '../services/aiWorkerService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك في مساعد بوابة بيرق الذكي. أنا هنا للإجابة على أسئلتك حول محتوى الوحدات الدراسية السبعة. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare context from unit data
      const context = INITIAL_PAGES
        .filter(p => p.unit.includes('Unit'))
        .map(p => `Unit: ${p.unit}\nTitle: ${p.title}\nContent: ${p.items.map(i => i.type === 'text' ? i.content : '').join(' ')}`)
        .join('\n\n');

      // Call our secure Cloudflare Workers AI Gateway service
      const aiResponse = await aiWorkerService.chat({
        context,
        message: userMessage,
        history: messages.slice(1)
      });

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      console.error('AI Bot Error:', error);
      let errorMessage = 'عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة مرة أخرى.';
      if (error.message && error.message.includes('429')) {
        errorMessage = 'لقد تجاوزت الحد المسموح به من الأسئلة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.';
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-theme-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-theme-primary/20 flex items-center justify-center bg-black/40 p-0.5">
            <BerqCharacter pose="pose_ai_companion" glowColor="cyan" className="w-full h-full" />
          </div>
          <div>
            <h2 className="font-bold text-lg">مساعد بوابة بيرق</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-white/40">متصل الآن</span>
            </div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-theme-primary animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            key={`${msg.role}-${idx}`}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-theme-primary text-charcoal font-medium rounded-br-none' 
                : 'bg-white/10 border border-white/10 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-40">
                {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                <span className="text-[10px] uppercase tracking-widest">
                  {msg.role === 'assistant' ? 'Bayraq AI' : 'You'}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسألني عن أي شيء في الوحدات..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 pr-14 focus:outline-none focus:border-theme-primary/50 focus:bg-white/10 transition-all text-right"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-theme-primary text-charcoal disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
