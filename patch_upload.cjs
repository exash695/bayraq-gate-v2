const fs = require('fs');
const file = 'src/components/StudentLounge.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add handleFileUpload
const handleFileUploadCode = `
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser || !currentChatRoomId) return;

    if (isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') {
      alert("الدردشة مقفلة حالياً من قبل الإدارة.");
      return;
    }

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
      
      // Determine type
      let typeText = 'مرفق';
      const type = file.type;
      if (type.startsWith('image/')) typeText = 'صورة';
      else if (type.startsWith('video/')) typeText = 'فيديو';
      else if (type.startsWith('audio/')) typeText = 'مقطع صوتي';
      else typeText = 'ملف';

      const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || 'طالب');
      const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
      const currentRole = isTeacher ? 'teacher' : (userProfile?.role === 'admin' ? 'admin' : 'student');
      
      await fetch('/api/lounge-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        text: typeText,
        userId: auth.currentUser.uid,
        userName: currentName || 'مستخدم',
        userPhoto: currentPhoto || null,
        userRole: currentRole,
        schoolId: currentChatRoomId,
        realSchoolId: schoolId,
        recipientId: isGeneralChat ? 'all' : selectedChatUser?.id,
        imageUrl: fileUrl, // using imageUrl to store the file url
        read: false
      }) });
    } catch (err) {
      console.error("Upload error", err);
      alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {`;

content = content.replace("  const handleSendMessage = async (e?: React.FormEvent) => {", handleFileUploadCode);

fs.writeFileSync(file, content);
console.log("Patched file upload handler");
