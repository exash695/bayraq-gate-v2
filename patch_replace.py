import os
import re

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Find the exact start and end
start_str = "  const handleSendMessage = async () => {"
end_str = "  const normalizeArabic = (str: string) => {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

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
          schoolId: selectedSchoolId || 'school_awail_ghamas',
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
            schoolId: selectedSchoolId || 'school_awail_ghamas',
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
      
      showToast('تمت العملية بنجاح', 'success');
      setIsMessageModalOpen(false);
      setIsBroadcastMode(false);
      setMessageText('');
      setSelectedUser(null);
    } catch (error) {
      console.error("Error sending message:", error);
      showToast('حدث خطأ أثناء إرسال التبليغ', 'error');
    }
  };

"""

content = content[:start_idx] + new_func + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)
print("Replaced handleSendMessage successfully")
