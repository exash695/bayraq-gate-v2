import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const ConfettiReward: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 50 }, (_, i) => i));
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {particles.map((i) => (
        <motion.div
          key={`confetti-${i}`}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 500,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute w-4 h-4 bg-[#D4AF37] rounded-sm"
        />
      ))}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-[#050505] border-2 border-[#D4AF37] p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(212,175,55,0.3)]"
      >
        <h2 className="text-3xl font-black text-[#D4AF37] mb-4">أحسنت أيها الفارس!</h2>
        <p className="text-white font-bold">لقد اجتزت هذه المرحلة بنجاح</p>
      </motion.div>
    </div>
  );
};
