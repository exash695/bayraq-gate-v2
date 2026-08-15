import React, { useState, useRef, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchStudentsGlobalProps {
  savedLists: any[];
  onSelectStudent: (student: any, listId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchStudentsGlobal: React.FC<SearchStudentsGlobalProps> = ({ 
  savedLists, 
  onSelectStudent,
  searchQuery,
  setSearchQuery
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const matches: any[] = [];
    savedLists.forEach(list => {
      const students = list.students || [];
      students.forEach((s: any) => {
        if (s.name?.toLowerCase().includes(val.toLowerCase()) || 
            s.student?.toLowerCase().includes(val.toLowerCase()) ||
            s.code?.toLowerCase().includes(val.toLowerCase())) {
          matches.push({ student: s, listId: list.id, listName: list.name });
        }
      });
    });

    const uniqueMatches = Array.from(new Map(matches.map(m => [m.student.student || m.student.code, m])).values());
    setResults(uniqueMatches.slice(0, 8));
    setIsOpen(uniqueMatches.length > 0);
  };

  return (
    <div className="relative group w-full" ref={containerRef}>
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
        placeholder="ابحث عن اسم طالب للوصول السريع لقائمته..."
        className="w-full h-14 bg-[#101935] border border-white/5 rounded-2xl px-12 text-white text-sm outline-none focus:border-blue-500 transition-all font-bold placeholder:text-white/10"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#101935] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 backdrop-blur-sm max-h-[400px] overflow-y-auto no-scrollbar"
          >
            {results.map((res, i) => (
              <button
                key={`${res.student.student || res.student.code}-${i}`}
                onClick={() => {
                  onSelectStudent(res.student, res.listId);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-right group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm">{res.student.name}</h4>
                    <p className="text-white/30 text-[10px] font-bold mt-0.5">{res.student.student || res.student.code}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-blue-500/60 text-[10px] font-black uppercase tracking-widest">{res.listName}</p>
                  <p className="text-white/10 text-[9px] font-bold">انقر للانتقال</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
