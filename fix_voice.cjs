const fs = require('fs');
const file = 'src/components/StudentLounge.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import Mic
content = content.replace(
  "import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock, Paperclip, FileText, Video, Headphones, Loader2 } from 'lucide-react';",
  "import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock, Paperclip, FileText, Video, Headphones, Loader2, Mic } from 'lucide-react';"
);

// 2. Add state
const statePattern = `  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);`;
const newState = `  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);`;
content = content.replace(statePattern, newState);

// 3. Add recording logic
const handlerPattern = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {`;
const recordingLogic = `
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           const audioFile = new File([audioBlob], 'voice_message.webm', { type: audioBlob.type || 'audio/webm' });
           await uploadVoiceMessage(audioFile);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.onstop = () => {
           mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
           audioChunksRef.current = [];
       };
       mediaRecorderRef.current.stop();
       setIsRecording(false);
     }
  };

  const uploadVoiceMessage = async (file: File) => {
    if (!auth.currentUser || !currentChatRoomId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload');
      
      const fileUrl = uploadData.publicUrl || uploadData.url;
      const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || 'طالب');
      const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
      const currentRole = isTeacher ? 'teacher' : (userProfile?.role === 'admin' ? 'admin' : 'student');
      
      await fetch('/api/lounge-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        text: 'بصمة صوتية',
        userId: auth.currentUser.uid,
        userName: currentName || 'مستخدم',
        userPhoto: currentPhoto || null,
        userRole: currentRole,
        schoolId: currentChatRoomId,
        realSchoolId: schoolId,
        recipientId: isGeneralChat ? 'all' : selectedChatUser?.id,
        imageUrl: fileUrl, 
        read: false,
        grade: grade || 'all',
      }) });
    } catch (err) {
      console.error("Upload error", err);
      alert("فشل إرسال البصمة الصوتية.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {`;
content = content.replace(handlerPattern, recordingLogic);

// 4. Update UI form
const formStart = `<input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0 mb-0.5"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            dir="auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="اكتب رسالتك..."
                            className="w-full bg-transparent border-none outline-none text-white text-sm py-2.5 max-h-32 min-h-[40px] resize-none no-scrollbar font-sans"
                            rows={1}
                        />
                        
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5"
                        >
                            <div dir="ltr" className="flex items-center justify-center mr-0.5 mt-0.5" style={{ transform: 'rotate(225deg)' }}>
                                <Send size={18} />
                            </div>
                        </button>`;

const newFormStart = `<input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isRecording}
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0 mb-0.5"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        
                        {isRecording ? (
                             <div className="flex-1 flex items-center gap-3 bg-red-500/10 px-4 rounded-xl py-2 animate-pulse border border-red-500/20 max-h-12">
                                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                 <span className="text-red-400 text-sm font-bold flex-1">جاري التسجيل...</span>
                                 <button type="button" onClick={cancelRecording} className="text-white/50 hover:text-red-400 p-1">
                                    <X size={18} />
                                 </button>
                             </div>
                        ) : (
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                dir="auto"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="اكتب رسالتك..."
                                className="w-full bg-transparent border-none outline-none text-white text-sm py-2.5 max-h-32 min-h-[40px] resize-none no-scrollbar font-sans"
                                rows={1}
                            />
                        )}
                        
                        {newMessage.trim() || isUploading ? (
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isUploading}
                                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5"
                            >
                                <div dir="ltr" className="flex items-center justify-center mr-0.5 mt-0.5" style={{ transform: 'rotate(225deg)' }}>
                                    <Send size={18} />
                                </div>
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isUploading}
                                className={\`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5 \${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'}\`}
                            >
                                {isRecording ? <Send size={18} /> : <Mic size={18} />}
                            </button>
                        )}`;

content = content.replace(formStart, newFormStart);
fs.writeFileSync(file, content);
console.log("Patched voice recorder in Lounge");
