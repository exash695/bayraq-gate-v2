import React, { useState } from 'react';
import { ChevronDown, Pencil, Check, X } from 'lucide-react';

interface Props {
  selectedTime: string;
  onSelect: (time: string) => void;
}

const INITIAL_TIMES = [
    '08:00 صباحاً', '09:00 صباحاً', '10:00 صباحاً', '11:00 صباحاً', 
    '12:00 ظهراً', '01:00 ظهراً', '02:00 ظهراً', '03:00 عصراً', 
    '04:00 عصراً', '05:00 عصراً'
];

export const TimeSelector: React.FC<Props> = ({ selectedTime, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [times, setTimes] = useState(INITIAL_TIMES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (oldTime: string) => {
      setTimes(times.map(t => t === oldTime ? editValue : t));
      setEditingId(null);
  };

  return (
    <div className="relative">
      <div 
        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold cursor-pointer flex justify-between items-center transition-all hover:border-purple-500/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedTime}</span>
        <ChevronDown size={20} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#162039] border border-white/20 rounded-3xl p-3 mt-2 z-[210] shadow-2xl max-h-60 overflow-y-auto space-y-2">
          {times.map(t => (
            <div key={t} className="flex items-center gap-2 p-2 bg-black/20 rounded-xl">
                {editingId === t ? (
                    <>
                        <input className="flex-1 bg-black/40 text-white p-1 rounded outline-none" value={editValue} onChange={e => setEditValue(e.target.value)} />
                        <button onClick={() => handleEdit(t)} className="text-emerald-400"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="text-rose-400"><X size={18} /></button>
                    </>
                ) : (
                    <>
                        <span className="flex-1 text-white text-sm font-bold cursor-pointer p-2" onClick={() => { onSelect(t); setIsOpen(false); }}>{t}</span>
                        <button onClick={() => { setEditingId(t); setEditValue(t); }} className="text-cyan-400 p-2"><Pencil size={18} /></button>
                    </>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
