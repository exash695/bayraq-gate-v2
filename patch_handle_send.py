import os

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_func = """  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      if (isBroadcastMode) {
        // Use correct filtered list based on activeRole
        const targetUsers = activeRole === 'cadre' 
          ? filteredCadreStaff 
          : (activeRole === 'parent' ? filteredParents : filteredStudents);
        
        if (targetUsers.length === 0) {
          showToast('لا يوجد مستخدمون لإرسال التبليغ إليهم', 'error');
          return;
        }
        const batch = writeBatch(db);
        let count = 0;
        const refIds: { id: string, collection: string }[] = [];
        const outboxRef = doc(collection(db, 'admin_outbox'));
        const broadcastId = outboxRef.id;
        
        const processedTargetIds = new Set<string>();
        
        for (const user of targetUsers) {
           // Skip unactivated accounts for broadcasts to avoid inflating counts incorrectly
           if (user.subscriptionStatus === 'pending') continue;
           let targetId = (user as any).uid || user.id;
           if (activeRole === 'student') {
             const sCode = (user.studentCode || user.code || '').trim().toUpperCase();
             targetId = sCode ? `scode_${sCode}` : targetId;
           } else if (activeRole === 'parent') {
             const pCode = (user.parentCode || user.code || '').trim().toUpperCase();
             targetId = pCode ? `pcode_${pCode}` : targetId;
           } else if (activeRole === 'cadre') {
             const tCode = (user.code || user.studentCode || '').trim().toUpperCase();
             targetId = tCode ? `tcode_${tCode}` : targetId;
           }
           
           if (processedTargetIds.has(targetId)) {
             continue; // Skip duplicate target IDs
           }
           processedTargetIds.add(targetId);
           const notifRef = doc(collection(db, 'notifications'));
           refIds.push({ id: notifRef.id, collection: 'notifications' });
           
           let notifTitle = 'تبليغ إداري عام';
           let recRole = 'student';
           
           if (activeRole === 'parent') {
             notifTitle = 'تبليغ لولي الأمر';
             recRole = 'parent';
           } else if (activeRole === 'cadre') {
             notifTitle = 'تبليغ الكادر التدريسي';
             recRole = 'teacher';
           } else if (activeRole === 'staff') {
             notifTitle = 'تبليغ الكادر الإداري والموظفين';
             recRole = 'staff';
           } else if (activeRole === 'student') {
             notifTitle = 'تبليغ عام للطلاب';
             recRole = 'student';
           }
           batch.set(notifRef, {
             title: notifTitle,
             message: messageText,
             type: 'broadcast',
             userId: targetId,
             isRead: false,
             read: false, 
             status: 'unread',
             recipientRole: recRole,
             timestamp: serverTimestamp(),
             createdAt: new Date().toISOString(),
             broadcastId: broadcastId
           });
           
           count++;
           if (count >= 490) break;
        }
        
        if (count === 0) {
          showToast('لا يوجد مستخدمون نشطون لإرسال التبليغ إليهم', 'error');
          return;
        }
        batch.set(outboxRef, {
           title: `رسالة جماعية - ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}`,
           message: messageText,
           type: 'broadcast',
           targetRole: activeRole,
           count,
           refIds,
           timestamp: serverTimestamp(),
           createdAt: new Date().toISOString(),
           broadcastId: broadcastId
        });
        
        await batch.commit();
        
        try {
          const { broadcastService } = await import('../services/broadcastService');
          if (activeRole === 'student' || activeRole === 'cadre' || activeRole === 'parent') {
            await broadcastService.sendBroadcast({
              schoolId: schoolId || 'school_awail_ghamas',
              message: messageText,
              targetGrades: activeRole === 'student' ? ['الجميع'] : activeRole === 'cadre' ? ['teacher_only'] : ['parent_only'],
              durationHours: 24,
              author: 'الإدارة',
              targetLocation: 'ticker'
            });
          }
        } catch (e) {
          console.error("Failed to add to broadcast ticker:", e);
        }
        
        await logActivity({
          action: 'إرسال تبليغ جماعي',
          details: `تم إرسال رسالة جماعية لـ ${count} من ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}.`,
          targetType: 'broadcast_message'
        });
        
        showToast(`تم إرسال التبليغ لـ ${count} مستخدم`, 'success');
      } else {
        if (!selectedUser) return;
        
        let outboxRefId = '';
        let outboxCollection = '';
        const realAuthUserId = await resolveActualId(selectedUser);
        if (activeRole === 'cadre') {
          const tCode = (selectedUser.code || selectedUser.studentCode || '').trim().toUpperCase();
          const targetUserId = tCode ? `tcode_${tCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,
            role: 'teacher',
            studentName: selectedUser.fullName || selectedUser.name || 'أستاذ',
            grade: 'General',
            issueType: 'تبليغ إداري',
            message: 'رسالة إدارية',
            
            status: 'resolved',
            adminReply: messageText,
            readByStudent: false,
            senderType: 'teacher'
          })
          });
          const resJson = await response.json();
          const docRef = { id: resJson.ticket?.id || '' };
          await addDoc(collection(db, 'notifications'), {
            title: 'رسالة إدارية هامة',
            message: messageText,
            type: 'general',
            userId: targetUserId,
            read: false,
            isRead: false,
            status: 'unread',
            recipientRole: 'teacher',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
          });
          outboxRefId = docRef.id;
          outboxCollection = 'support_tickets';
        } else if (activeRole === 'staff') {
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: realAuthUserId,
            role: 'staff',
            studentName: selectedUser.fullName || selectedUser.name || 'موظف',
            grade: 'General',
            issueType: 'تبليغ إداري',
            message: 'رسالة إدارية',
            
            status: 'resolved',
            adminReply: messageText,
            readByStudent: false,
            senderType: 'staff'
          })
          });
          const resJson = await response.json();
          const docRef = { id: resJson.ticket?.id || '' };
          await addDoc(collection(db, 'notifications'), {
            title: 'رسالة إدارية هامة',
            message: messageText,
            type: 'broadcast',
            userId: realAuthUserId,
            read: false,
            isRead: false,
            status: 'unread',
            recipientRole: 'staff',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
          });
          outboxRefId = docRef.id;
          outboxCollection = 'support_tickets';
        } else if (activeRole === 'parent') {
          const pCode = (selectedUser.parentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = pCode ? `pcode_${pCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,
            role: 'parent',
            studentName: selectedUser.fullName || selectedUser.name || 'ولي أمر',
            grade: 'General',
            issueType: 'تبليغ إداري',
            message: 'رسالة إدارية',
            
            status: 'resolved',
            adminReply: messageText,
            readByStudent: false,
            senderType: 'parent'
          })
          });
          const resJson = await response.json();
          const docRef = { id: resJson.ticket?.id || '' };
          await addDoc(collection(db, 'notifications'), {
            title: 'رسالة إدارية هامة',
            message: messageText,
            type: 'general',
            userId: targetUserId,
            read: false,
            isRead: false,
            status: 'unread',
            recipientRole: 'parent',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
          });
          outboxRefId = docRef.id;
          outboxCollection = 'support_tickets';
        } else {
          const sCode = (selectedUser.studentCode || selectedUser.code || '').trim().toUpperCase();
          const targetUserId = sCode ? `scode_${sCode}` : realAuthUserId;
          const response = await fetch('/api/support-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            userId: targetUserId,
            role: 'student',
            studentName: selectedUser.fullName || selectedUser.name || 'طالب',
            grade: selectedUser.grade || selectedUser.stage || 'General',
            issueType: 'تبليغ إداري',
            message: 'رسالة إدارية',
            
            status: 'resolved',
            adminReply: messageText,
            readByStudent: false,
            senderType: 'student'
          })
          });
          const resJson = await response.json();
          const docRef = { id: resJson.ticket?.id || '' };
          await addDoc(collection(db, 'notifications'), {
            title: 'رسالة إدارية هامة',
            message: messageText,
            type: 'general',
            userId: targetUserId,
            read: false,
            isRead: false,
            status: 'unread',
            recipientRole: 'student',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
          });
          outboxRefId = docRef.id;
          outboxCollection = 'support_tickets';
        }
        
        await addDoc(collection(db, 'admin_outbox'), {
           title: `رسالة فردية - ${(selectedUser as any).fullName || (selectedUser as any).name}`,
           message: messageText,
           type: 'single',
           targetRole: activeRole,
           count: 1,
           refIds: [{ id: outboxRefId, collection: outboxCollection }],
           timestamp: serverTimestamp(),
           createdAt: new Date().toISOString()
        });
        
        try {
          const { broadcastService } = await import('../services/broadcastService');
          if (activeRole === 'student' || activeRole === 'cadre' || activeRole === 'parent') {
            await broadcastService.sendBroadcast({
              schoolId: schoolId || 'school_awail_ghamas',
              message: messageText,
              targetGrades: activeRole === 'student' ? ['الجميع'] : activeRole === 'cadre' ? ['teacher_only'] : ['parent_only'],
              durationHours: 24,
              author: 'الإدارة',
              targetLocation: 'ticker'
            });
          }
        } catch (e) {
          console.error("Failed to add to broadcast ticker:", e);
        }
        
        await logActivity({
          action: 'إرسال تبليغ فردي',
          details: `تم إرسال رسالة فردية إلى ${(selectedUser as any).fullName || (selectedUser as any).name} (${activeRole})`,
          targetType: 'single_message'
        });
        
        showToast('تم إرسال التبليغ الفردي بنجاح', 'success');
      }
      
      setMessageText('');
      if (!isBroadcastMode) setSelectedUser(null);
    } catch (error) {
      console.error("Error sending message:", error);
      showToast('حدث خطأ أثناء إرسال التبليغ', 'error');
    }
  };"""

new_func = """  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      const targetUsers = isBroadcastMode 
        ? (activeRole === 'cadre' ? filteredCadreStaff : (activeRole === 'parent' ? filteredParents : filteredStudents))
        : null;

      if (isBroadcastMode && (!targetUsers || targetUsers.length === 0)) {
        showToast('لا يوجد مستخدمون لإرسال التبليغ إليهم', 'error');
        return;
      }
      if (!isBroadcastMode && !selectedUser) return;

      const response = await fetch('/api/admin-outbox/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: schoolId || 'school_awail_ghamas',
          messageText,
          activeRole,
          targetUsers: isBroadcastMode ? targetUsers : null,
          isBroadcastMode,
          selectedUser: isBroadcastMode ? null : selectedUser
        })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'فشل إرسال التبليغ');
      }
      
      try {
        const { broadcastService } = await import('../services/broadcastService');
        if (activeRole === 'student' || activeRole === 'cadre' || activeRole === 'parent') {
          await broadcastService.sendBroadcast({
            schoolId: schoolId || 'school_awail_ghamas',
            message: messageText,
            targetGrades: activeRole === 'student' ? ['الجميع'] : activeRole === 'cadre' ? ['teacher_only'] : ['parent_only'],
            durationHours: 24,
            author: 'الإدارة',
            targetLocation: 'ticker'
          });
        }
      } catch (e) {
        console.error("Failed to add to broadcast ticker:", e);
      }
      
      await logActivity({
        action: isBroadcastMode ? 'إرسال تبليغ جماعي' : 'إرسال تبليغ فردي',
        details: isBroadcastMode ? `تم إرسال رسالة جماعية لـ ${resData.count} من ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}.` : `تم إرسال رسالة فردية إلى ${(selectedUser as any).fullName || (selectedUser as any).name} (${activeRole})`,
        targetType: isBroadcastMode ? 'broadcast_message' : 'single_message'
      });
      
      showToast(`تم إرسال التبليغ بنجاح`, 'success');
      setMessageText('');
      if (!isBroadcastMode) setSelectedUser(null);
    } catch (error) {
      console.error("Error sending message:", error);
      showToast('حدث خطأ أثناء إرسال التبليغ', 'error');
    }
  };"""

content = content.replace(old_func, new_func)

with open(filepath, 'w') as f:
    f.write(content)
print("handleSendMessage updated")
