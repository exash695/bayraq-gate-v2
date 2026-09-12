const fs = require('fs');
let content = fs.readFileSync('src/components/StudentLounge.tsx', 'utf8');

if (!content.includes('import { staffService }')) {
    content = content.replace("import { realtimeManager } from '../lib/realtimeManager';", "import { realtimeManager } from '../lib/realtimeManager';\nimport { staffService } from '../services/staffService';");
}

content = content.replace("const [activeTab, setActiveTab] = useState<'chat' | 'knights'>(initialSelectedUser ? 'chat' : 'knights');", 
`const [teachersList, setTeachersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'knights' | 'teachers'>(initialSelectedUser ? 'chat' : 'knights');`);

const useEffectKnights = `  // Load knights
  useEffect(() => {
    if (!schoolId) return;`;

const useEffectTeachers = `  // Load teachers
  useEffect(() => {
    if (!schoolId) return;
    const unsub = staffService.subscribeToTeachers(schoolId, (teachers) => {
      setTeachersList(teachers || []);
    });
    return () => unsub();
  }, [schoolId]);

  // Load knights
  useEffect(() => {
    if (!schoolId) return;`;

content = content.replace(useEffectKnights, useEffectTeachers);

const tabsHtml = `      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#0D142A] shrink-0">
        <button 
          onClick={() => setActiveTab('knights')}
          className={\`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors \${activeTab === 'knights' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          الفرسان النشطين
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={\`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors \${activeTab === 'chat' ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          الدردشة
        </button>
      </div>`;

const newTabsHtml = `      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#0D142A] shrink-0">
        <button 
          onClick={() => setActiveTab('knights')}
          className={\`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors \${activeTab === 'knights' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          الفرسان
        </button>
        {!isTeacher && (
          <button 
            onClick={() => setActiveTab('teachers')}
            className={\`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors \${activeTab === 'teachers' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-white/50 hover:text-white/80'}\`}
          >
            أساتذتي
          </button>
        )}
        <button 
          onClick={() => setActiveTab('chat')}
          className={\`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors \${activeTab === 'chat' ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-white/50 hover:text-white/80'}\`}
        >
          الدردشة
        </button>
      </div>`;

content = content.replace(tabsHtml, newTabsHtml);

const teacherTabHtml = `      {activeTab === 'teachers' && !isTeacher && (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#050A18] flex flex-col gap-2">
              <div className="mb-4 relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن أستاذ..." 
                    className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-emerald-400 focus:bg-[#0D142A] transition-all"
                 />
                 <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
              </div>
              
              {(() => {
                const filteredTeachers = teachersList.filter(t => t.name?.includes(searchQuery) && t.role === 'TEACHER');

                return filteredTeachers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                        <User size={48} className="text-white/20 mb-4" />
                        <p className="text-white/40 text-sm font-bold">لا يوجد أساتذة حالياً</p>
                    </div>
                ) : (
                    filteredTeachers.map((teacher) => (
                        <div 
                          key={teacher.id} 
                        onClick={() => {
                          setSelectedChatUser({...teacher, role: 'teacher'});
                          setActiveTab('chat');
                        }}
                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden ring-1 ring-emerald-400/50">
                                      {teacher.photo || teacher.photoURL ? (
                                         <img src={teacher.photo || teacher.photoURL} alt={teacher.name} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                             <User size={18} className="text-white/30" />
                                         </div>
                                      )}
                                  </div>
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050A18] rounded-full"></div>
                                  {unreadCounts[teacher.id] > 0 && (
                                     <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center shadow-lg border-2 border-[#050A18]">
                                        <span className="text-[9px] font-black text-white">{unreadCounts[teacher.id]}</span>
                                     </div>
                                  )}
                              </div>
                              <div className="flex flex-col text-right">
                                  <span className="text-[13px] text-white/90 font-bold">{teacher.name}</span>
                                  <span className="text-[9px] font-bold text-emerald-400">
                                      {teacher.subject || 'مدرس'}
                                  </span>
                              </div>
                          </div>
                          <button 
                            className="w-10 h-10 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 ml-1"
                          >
                            <MessageCircle size={18} />
                          </button>
                      </div>
                  ))
              );
              })()}
          </div>
      )}`;

const knightsContentEnd = `      {activeTab === 'chat' && (`;

content = content.replace(knightsContentEnd, teacherTabHtml + '\n\n' + knightsContentEnd);

fs.writeFileSync('src/components/StudentLounge.tsx', content);
