import * as FirebaseMock from "../lib/firebase"; const { db, auth, storage, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, terminate, clearIndexedDbPersistence } = FirebaseMock;
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Crown, Plus, Sword, MessageSquare, Target, Trophy, LogOut, ChevronRight, Send, UserPlus, Search, X } from 'lucide-react';

const BattalionChat = ({ battalionId, userProfile, language }: { battalionId: string, userProfile: any, language: 'ar' | 'en' }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'battalions', battalionId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [battalionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return;
    try {
      await addDoc(collection(db, 'battalions', battalionId, 'messages'), {
        text: newMessage,
        senderId: userProfile?.uid,
        senderName: userProfile?.fullName,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-theme-primary/5 flex items-center gap-3">
        <MessageSquare size={20} className="text-theme-primary" />
        <h3 className="font-black text-white">{language === 'ar' ? 'جدار الكتيبة' : 'Battalion Wall'}</h3>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === userProfile?.uid ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.senderId === userProfile?.uid 
                ? 'bg-theme-primary text-black rounded-tr-none font-bold' 
                : 'bg-white/10 text-white rounded-tl-none'
            }`}>
              <p className="text-[10px] opacity-50 mb-1">{msg.senderName}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-theme-primary transition-all"
        />
        <button 
          onClick={sendMessage}
          className="p-3 bg-theme-primary text-black rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_var(--theme-glow)]"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export const Battalion = ({ userProfile, language }: { userProfile: any, language: 'ar' | 'en' }) => {
  const [activeTab, setActiveTab] = useState<'found' | 'joined' | 'others'>('found');
  const [battalions, setBattalions] = useState<any[]>([]);
  const [myBattalion, setMyBattalion] = useState<any>(null);
  const [battalionMembers, setBattalionMembers] = useState<any[]>([]);
  const [newBattalionName, setNewBattalionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [schoolKnights, setSchoolKnights] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribeAll = onSnapshot(collection(db, 'battalions'), (snapshot) => {
      setBattalions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Battalion list error:", error);
    });
    return () => unsubscribeAll();
  }, []);

  useEffect(() => {
    if (userProfile?.battalionId) {
      let unsubMembers: (() => void) | null = null;
      const unsubscribeMy = onSnapshot(doc(db, 'battalions', userProfile?.battalionId), (docSnap) => {
        if (docSnap.exists()) {
          setMyBattalion({ id: docSnap.id, ...docSnap.data() });
          const members = docSnap.data().members || [];
          if (unsubMembers) {
            unsubMembers();
            unsubMembers = null;
          }
          if (members.length > 0) {
            const q = query(collection(db, 'users'), where('uid', 'in', members.slice(0, 10)));
            unsubMembers = onSnapshot(q, (memberSnap) => {
              setBattalionMembers(memberSnap.docs.map(d => d.data()));
            }, (err) => console.warn("Battalion members error", err));
          } else {
            setBattalionMembers([]);
          }
        } else {
          setMyBattalion(null);
          setBattalionMembers([]);
        }
      }, (error) => {
        console.warn("My Battalion error:", error);
      });
      return () => {
        unsubscribeMy();
        if (unsubMembers) unsubMembers();
      };
    } else {
      setMyBattalion(null);
      setBattalionMembers([]);
    }
  }, [userProfile?.battalionId]);

  const fetchSchoolKnights = async () => {
    if (!userProfile?.schoolName) return;
    const q = query(
      collection(db, 'users'), 
      where('schoolName', '==', userProfile?.schoolName || 'unassigned'),
      limit(20)
    );
    const snap = await getDocs(q);
    setSchoolKnights(snap.docs.map(d => d.data()).filter(u => u.uid !== userProfile?.uid && !u.battalionId));
    setShowInviteModal(true);
  };

  const inviteKnight = async (knight: any) => {
    if (!myBattalion) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        userId: knight.uid,
        type: 'battalion_invite',
        battalionId: myBattalion.id,
        battalionName: myBattalion.name,
        inviterName: userProfile?.fullName,
        
        read: false
      })
      });
      alert(language === 'ar' ? `تم إرسال دعوة لـ ${knight.fullName}` : `Invite sent to ${knight.fullName}`);
    } catch (error) {
      console.error("Error inviting:", error);
    }
  };

  const requestJoin = async (battalion: any) => {
    if (!userProfile?.uid) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        userId: battalion.leaderUid,
        type: 'battalion_join_request',
        battalionId: battalion.id,
        battalionName: battalion.name,
        requesterId: userProfile?.uid,
        requesterName: userProfile?.fullName,
        requesterScore: userProfile?.totalScore || 0,
        requesterLevel: userProfile?.rank || 'Squire',
        
        read: false
      })
      });
      alert(language === 'ar' ? 'تم إرسال طلب الانضمام للقائد' : 'Join request sent to leader');
    } catch (error) {
      console.error("Error requesting join:", error);
    }
  };

  const leaveBattalion = async () => {
    if (!userProfile?.uid || !userProfile?.battalionId) return;
    try {
      await updateDoc(doc(db, 'battalions', userProfile?.battalionId), {
        members: arrayRemove(userProfile?.uid)
      });
      await updateDoc(doc(db, 'users', userProfile?.uid), {
        battalionId: null,
        battalionName: null
      });
      setShowLeaveConfirm(false);
    } catch (error) {
      console.error("Error leaving:", error);
    }
  };

  const createBattalion = async () => {
    const uid = userProfile?.uid || auth.currentUser?.uid;
    if (!newBattalionName.trim() || !uid) return;
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'battalions'), {
        name: newBattalionName,
        leaderUid: uid,
        members: [uid],
        level: 1,
        exp: 0,
        schoolName: userProfile?.schoolName || '',
        missions: [
          { id: 1, title: language === 'ar' ? 'إكمال الوحدة الأولى' : 'Complete Unit 1', progress: 0, target: 100 },
          { id: 2, title: language === 'ar' ? 'تحدي 10 فرسان' : 'Challenge 10 Knights', progress: 0, target: 10 }
        ],
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', uid), { 
        battalionId: docRef.id,
        battalionName: newBattalionName 
      });
      setNewBattalionName('');
    } catch (error) {
      console.error("Error creating:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-theme-primary/40 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield size={120} className="text-theme-primary -rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-theme-primary/20 flex items-center justify-center text-theme-primary border border-theme-primary/30 shadow-[0_0_30px_var(--theme-glow)]">
              <Shield size={40} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white">{myBattalion.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 bg-theme-primary/20 text-theme-primary rounded-full text-xs font-black border border-theme-primary/30">
                  {language === 'ar' ? 'المستوى' : 'Level'} {myBattalion.level || 1}
                </span>
                <span className="text-white/40 text-xs font-bold flex items-center gap-1">
                  <Trophy size={14} /> {myBattalion.exp || 0} EXP
                </span>
              </div>
            </div>
          </div>
          
          {myBattalion.leaderUid === userProfile?.uid && (
            <button 
              onClick={fetchSchoolKnights}
              className="px-6 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_var(--theme-glow)]"
            >
              <UserPlus size={20} />
              {language === 'ar' ? 'ضم فرسان مدرستك' : 'Invite School Knights'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BattalionChat battalionId={myBattalion.id} userProfile={userProfile} language={language} />
          
          <div className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-3 border-b border-white/10 pb-4">
              <Target size={20} className="text-rose-500" />
              {language === 'ar' ? 'المهام الجماعية' : 'Group Missions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(myBattalion.missions || []).map((m: any, idx: number) => (
                <div key={m.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white/80">{m.title}</span>
                    <span className="text-theme-primary">{m.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.progress}%` }}
                      className="h-full bg-theme-primary shadow-[0_0_10px_var(--theme-glow)]" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-3 border-b border-white/10 pb-4">
              <Users size={20} className="text-theme-primary" />
              {language === 'ar' ? 'فرسان الكتيبة' : 'Battalion Knights'}
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {battalionMembers.map((member, idx) => (
                <div key={`member_${member.uid || member.id}_${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary font-black">
                      {member.fullName?.[0] || 'K'}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{member.fullName}</p>
                      <p className="text-[10px] text-white/40 uppercase font-black">{member.rank || 'Squire'}</p>
                    </div>
                  </div>
                  {member.uid === myBattalion.leaderUid && <Crown size={16} className="text-yellow-400" />}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-4 flex items-center justify-center gap-3 text-rose-500 font-black hover:bg-rose-500/10 rounded-2xl border border-rose-500/20 transition-all"
          >
            <LogOut size={20} />
            {language === 'ar' ? 'مغادرة الكتيبة' : 'Leave Battalion'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div id="battalion-section" className="space-y-8 border border-transparent">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto">
        {[
          { id: 'found', label: language === 'ar' ? 'تأسيس كتيبة' : 'Found Battalion', icon: Plus },
          { id: 'joined', label: language === 'ar' ? 'المنظم إليها' : 'Joined Battalions', icon: Shield },
          { id: 'others', label: language === 'ar' ? 'الكتائب الأخرى' : 'Other Battalions', icon: Search }
        ].map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all duration-300 border-2 ${
              activeTab === tab.id 
                ? 'bg-theme-primary text-black border-theme-primary shadow-[0_0_20px_var(--theme-glow)]' 
                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {activeTab === 'found' && (
          myBattalion && myBattalion.leaderUid === userProfile?.uid ? renderDashboard() : (
            <div className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-theme-primary/30 bg-gradient-to-br from-theme-primary/10 to-transparent relative overflow-hidden max-w-4xl mx-auto rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-10">
              <div className="absolute -right-10 -top-10 opacity-10"><Plus size={200} className="text-theme-primary" /></div>
              <div className="relative z-10 space-y-8 text-center">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-theme-primary">{language === 'ar' ? 'أسس إمبراطوريتك الخاصة' : 'Found Your Empire'}</h3>
                  <p className="text-white/60 text-lg">{language === 'ar' ? 'كن قائداً لكتيبة من الفرسان واعتلوا القمة معاً!' : 'Become a leader and claim the top together!'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={newBattalionName}
                    onChange={(e) => setNewBattalionName(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل اسماً مهيباً لكتيبتك..' : 'Enter a majestic name..'}
                    className="flex-1 bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 text-white focus:border-theme-primary outline-none transition-all text-lg"
                  />
                  <button
                    onClick={createBattalion}
                    disabled={isCreating || !newBattalionName.trim()}
                    className="px-10 py-4 bg-theme-primary text-black font-black rounded-2xl hover:scale-105 transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_var(--theme-glow)]"
                  >
                    {isCreating ? '...' : (language === 'ar' ? 'تأسيس الآن' : 'Found Now')}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'joined' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {myBattalion ? renderDashboard() : (
              <div className="text-center py-20 glass-card border-white/10">
                <Shield size={60} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/40 font-bold text-xl">{language === 'ar' ? 'أنت لست عضواً في أي كتيبة حالياً' : 'You are not a member of any battalion'}</p>
                <button onClick={() => setActiveTab('others')} className="mt-4 text-theme-primary font-black hover:underline">{language === 'ar' ? 'تصفح الكتائب المتاحة' : 'Browse available battalions'}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'others' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {battalions.filter(b => b.id !== userProfile?.battalionId).map((b, idx) => (
              <div key={`battalion_${b.id}_${idx}`} className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 p-6 space-y-4 group transition-all hover:border-theme-primary/50 shadow-2xl">
                <div className="flex justify-between items-start">
                  <h4 className="text-xl font-black text-white group-hover:text-theme-primary transition-colors">{b.name}</h4>
                  <div className="px-2 py-1 bg-theme-primary/10 text-theme-primary rounded text-[10px] font-black">LVL {b.level || 1}</div>
                </div>
                <div className="flex items-center gap-4 py-3 border-y border-white/5">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-white/40 font-black uppercase mb-1">{language === 'ar' ? 'الفرسان' : 'Knights'}</p>
                    <p className="text-lg font-black text-white">{b.members?.length || 0}</p>
                  </div>
                  <div className="flex-1 text-center border-l border-white/10">
                    <p className="text-[10px] text-white/40 font-black uppercase mb-1">{language === 'ar' ? 'الخبرة' : 'EXP'}</p>
                    <p className="text-lg font-black text-theme-primary">{b.exp || 0}</p>
                  </div>
                </div>
                <button 
                  onClick={() => requestJoin(b)}
                  className="w-full py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-theme-primary hover:text-black transition-all font-black"
                >
                  {language === 'ar' ? 'طلب انضمام' : 'Request Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full border-theme-primary/40 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">{language === 'ar' ? 'فرسان مدرستك' : 'School Knights'}</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {schoolKnights.map((knight, idx) => (
                  <div key={`knight_${knight.uid || knight.id}_${idx}`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-white">{knight.fullName}</p>
                      <p className="text-xs text-theme-primary font-black">{knight.totalScore || 0} XP</p>
                    </div>
                    <button 
                      onClick={() => inviteKnight(knight)}
                      className="p-2 bg-theme-primary text-black rounded-lg hover:scale-110 transition-all"
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                ))}
                {schoolKnights.length === 0 && (
                  <p className="text-center text-white/40 italic py-10">{language === 'ar' ? 'لا يوجد فرسان متاحون حالياً من مدرستك' : 'No available knights from your school'}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full border-rose-500/40 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                <LogOut size={40} />
              </div>
              <h3 className="text-2xl font-black text-white">{language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}</h3>
              <p className="text-white/60">{language === 'ar' ? 'مغادرة الكتيبة ستفقدك الوصول لجدارها ومهامها الجماعية.' : 'Leaving will lose access to the wall and missions.'}</p>
              <div className="flex gap-4">
                <button onClick={leaveBattalion} className="flex-1 py-3 bg-rose-500 text-white font-black rounded-xl">{language === 'ar' ? 'نعم، مغادرة' : 'Yes, Leave'}</button>
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 bg-white/5 text-white font-black rounded-xl">{language === 'ar' ? 'تراجع' : 'Cancel'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
