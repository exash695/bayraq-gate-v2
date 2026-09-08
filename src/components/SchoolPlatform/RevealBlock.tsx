import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface RevealBlockProps {
  label: string;
  text: string;
}

export const RevealBlock: React.FC<RevealBlockProps> = ({ label, text }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setRevealed(!revealed)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 text-right text-[11px] font-black text-amber-300 transition-all cursor-pointer"
      >
        <span>{label}</span>
        <span className="text-[10px]">{revealed ? "🔼 إخفاء" : "🔽 إظهار"}</span>
      </button>
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2 bg-amber-500/[0.02] border border-amber-500/5 p-4 rounded-xl text-xs font-semibold leading-relaxed text-white/90 font-mono text-right whitespace-pre-line"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RenderTextWithTags: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@") && part.length > 1) {
          const nameToDisplay = part.substring(1).replace(/_/g, " ");
          return (
            <span
              key={i}
              className="text-blue-400 font-bold bg-blue-500/10 px-1 rounded mx-0.5 cursor-pointer hover:bg-blue-500/20 transition-colors"
            >
              @{nameToDisplay}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default RevealBlock;
