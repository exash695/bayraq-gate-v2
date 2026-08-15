import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { sounds } from '../lib/sounds';

interface VoiceAssistantProps {
  textToCompare: string;
  onResult?: (isCorrect: boolean) => void;
}

export const VoiceAssistant = ({ textToCompare, onResult }: VoiceAssistantProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<'excellent' | 'good' | 'try-again' | 'not-supported' | 'blocked' | 'network-error' | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean the target text: remove Arabic, punctuation, and extra spaces
  const cleanTarget = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, "") // Remove Arabic
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  };

  const targetText = cleanTarget(textToCompare);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setFeedback('not-supported');
      return;
    }

    if (isProcessing) return;

    try {
      sounds.playStart();
      if (typeof SpeechRecognition === 'function') {
        recognitionRef.current = new SpeechRecognition();
      } else {
        console.error('SpeechRecognition is not a constructor');
        setFeedback('not-supported');
        return;
      }
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.continuous = false;

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setFeedback(null);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();
        
        setTranscript(currentTranscript);
        
        if (event.results[0].isFinal) {
          recognitionRef.current.is_final_received = true;
          processResult(currentTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        if (event.error === 'not-allowed') {
          setFeedback('blocked');
        } else if (event.error === 'network') {
          setFeedback('network-error');
          sounds.playError();
        } else if (event.error !== 'no-speech') {
          setFeedback('try-again');
          sounds.playError();
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // If we didn't get a final result but have some transcript, process it
        setTimeout(() => {
          if (!recognitionRef.current?.is_final_received && !isProcessing && !feedback) {
            if (transcript) {
              processResult(transcript);
            } else {
              // Only set try-again if no other error feedback is present
              setFeedback(prev => prev || 'try-again');
              if (!feedback) sounds.playError();
            }
          }
        }, 300);
      };

      recognitionRef.current.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
      setFeedback('not-supported');
    }
  };

  const processResult = (finalTranscript: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const cleanInput = cleanTarget(finalTranscript);
      
      // Matching Logic
      const inputWords = cleanInput.split(' ');
      const targetWords = targetText.split(' ');
      
      const matchedWords = targetWords.filter(word => inputWords.includes(word));
      const matchRatio = matchedWords.length / targetWords.length;

      let result: 'excellent' | 'good' | 'try-again';
      if (matchRatio >= 0.8 || cleanInput.includes(targetText) || targetText.includes(cleanInput)) {
        result = 'excellent';
        sounds.playSuccess();
      } else if (matchRatio >= 0.4) {
        result = 'good';
        sounds.playPop();
      } else {
        result = 'try-again';
        sounds.playError();
      }

      setFeedback(result);
      setIsProcessing(false);
      onResult?.(result === 'excellent');
    }, 600);
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      setIsRecording(false);
    }
  };

  const getFeedbackMessage = () => {
    switch (feedback) {
      case 'excellent': return 'نطق مثالي! أحسنتِ';
      case 'good': return 'جيد جداً، اقتربتِ';
      case 'try-again': return 'حاولي مرة أخرى بوضوح';
      case 'not-supported': return 'المتصفح لا يدعم الصوت';
      case 'blocked': return 'الميكروفون محظور';
      case 'network-error': return 'خطأ في الاتصال بالإنترنت';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 relative z-10 ${
              isRecording 
                ? 'bg-red-500/20 border-red-500/50 text-red-500' 
                : feedback === 'not-supported' || feedback === 'blocked' || feedback === 'network-error'
                ? 'bg-gray-500/10 border-gray-500/30 text-gray-500'
                : 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue'
            }`}
          >
            {isProcessing ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isRecording ? (
              <MicOff size={28} />
            ) : (
              <Mic size={28} />
            )}
          </motion.button>

          {/* Wave Animation */}
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.3 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-red-500 rounded-2xl -z-0"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0.1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 bg-red-500 rounded-2xl -z-0"
                />
              </>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 text-sm font-black shadow-lg ${
                feedback === 'excellent'
                  ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-green-500/10'
                  : feedback === 'good'
                  ? 'bg-gold/10 border-gold/40 text-gold shadow-gold/10'
                  : feedback === 'not-supported' || feedback === 'blocked' || feedback === 'network-error'
                  ? 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400 shadow-red-500/10'
              }`}
            >
              {feedback === 'excellent' ? (
                <CheckCircle2 size={20} className="shrink-0" />
              ) : feedback === 'good' ? (
                <Sparkles size={20} className="shrink-0" />
              ) : feedback === 'not-supported' || feedback === 'blocked' || feedback === 'network-error' ? (
                <MicOff size={20} className="shrink-0" />
              ) : (
                <XCircle size={20} className="shrink-0" />
              )}
              <span className="whitespace-nowrap">{getFeedbackMessage()}</span>
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-red-400 font-black text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                جاري الاستماع...
              </div>
              {transcript && (
                <p className="text-xs text-pearl-white/60 font-medium italic truncate max-w-[200px]">
                  "{transcript}"
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Sparkles = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
