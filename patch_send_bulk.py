import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

send_bulk_pattern = r"app\.post\('/api/admin-outbox/send-bulk', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, count, outboxId \}\);[\s\S]*?\}\);"

new_send_bulk = """app.post('/api/admin-outbox/send-bulk', async (req, res) => {
    try {
      const { schoolId, messageText, activeRole, targetUsers, isBroadcastMode, selectedUser } = req.body;
      const outboxId = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let count = 0;
      const refIds: { id: string, collection: string }[] = [];
      const processedTargetIds = new Set<string>();
      
      const insertNotifications = [];
      const insertTickets = [];
      
      if (isBroadcastMode) {
        for (const user of targetUsers) {
           if (user.subscriptionStatus === 'pending') continue;
           let targetId = user.uid || user.id;
           if (activeRole === 'student') {
             const sCode = (user.studentCode || user.code || '').trim().toUpperCase();
             targetId = sCode ? `scode_${sCode}` : targetId;
           } else if (activeRole === 'parent') {
             const pCode = (user.parentCode || user.code || '').trim().toUpperCase();
             targetId = pCode ? `pcode_${pCode}` : targetId;
           } else if (activeRole === 'cadre' || activeRole === 'teacher' || activeRole === 'staff') {
             const tCode = (user.code || user.studentCode || '').trim().toUpperCase();
             targetId = tCode ? `tcode_${tCode}` : targetId;
           }
           
           if (processedTargetIds.has(targetId)) continue;
           processedTargetIds.add(targetId);
           
           const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
           refIds.push({ id: notifId, collection: 'notifications' });
           
           let notifTitle = 'تبليغ إداري عام';
           let recRole = 'student';
           if (activeRole === 'parent') { notifTitle = 'تبليغ لولي الأمر'; recRole = 'parent'; }
           else if (activeRole === 'cadre' || activeRole === 'teacher') { notifTitle = 'تبليغ الكادر التدريسي'; recRole = 'teacher'; }
           else if (activeRole === 'staff') { notifTitle = 'تبليغ الكادر الإداري والموظفين'; recRole = 'staff'; }
           
           insertNotifications.push({
             id: notifId,
             schoolId: schoolId || null,
             recipientId: targetId,
             title: notifTitle,
             body: messageText,
             type: 'broadcast',
             recipientRole: recRole,
             read: false,
             metadata: { broadcastId: outboxId },
             createdAt: new Date()
           });
           count++;
           if (count >= 490) break;
        }
      } else {
        if (!selectedUser) return res.status(400).json({ success: false, message: 'No selected user' });
        let targetId = selectedUser.uid || selectedUser.id;
        if (activeRole === 'student') {
           const sCode = (selectedUser.studentCode || selectedUser.code || '').trim().toUpperCase();
           targetId = sCode ? `scode_${sCode}` : targetId;
        } else if (activeRole === 'parent') {
           const pCode = (selectedUser.parentCode || selectedUser.code || '').trim().toUpperCase();
           targetId = pCode ? `pcode_${pCode}` : targetId;
        } else if (activeRole === 'cadre' || activeRole === 'teacher' || activeRole === 'staff') {
           const tCode = (selectedUser.code || selectedUser.studentCode || '').trim().toUpperCase();
           targetId = tCode ? `tcode_${tCode}` : targetId;
        }

        const effectiveRole = (activeRole === 'cadre' || activeRole === 'staff') ? 'teacher' : activeRole;

        const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertTickets.push({
          id: ticketId,
          schoolId: schoolId || null,
          userId: targetId,
          role: effectiveRole,
          studentName: selectedUser.fullName || selectedUser.name || 'مستخدم',
          grade: 'General',
          issueType: 'تبليغ إداري',
          message: 'رسالة إدارية',
          status: 'resolved',
          adminReply: messageText,
          senderType: effectiveRole,
          timestamp: new Date(),
          readByStudent: false
        });
        refIds.push({ id: ticketId, collection: 'support_tickets' });
        
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let notifTitle = 'رسالة إدارية هامة';
        if (activeRole === 'parent') notifTitle = 'رسالة لولي الأمر';
        else if (activeRole === 'cadre' || activeRole === 'teacher') notifTitle = 'رسالة خاصة بالأستاذ';
        else if (activeRole === 'staff') notifTitle = 'رسالة خاصة بالموظف';

        insertNotifications.push({
          id: notifId,
          schoolId: schoolId || null,
          recipientId: targetId,
          title: notifTitle,
          body: messageText,
          type: 'general',
          recipientRole: effectiveRole,
          read: false,
          metadata: { broadcastId: outboxId },
          createdAt: new Date()
        });
        count = 1;
      }
      
      if (insertNotifications.length > 0) {
        await db.insert(notifications).values(insertNotifications);
      }
      if (insertTickets.length > 0) {
        await db.insert(support_tickets).values(insertTickets);
      }
      
      const outboxRecord = {
        id: outboxId,
        schoolId: schoolId || null,
        title: isBroadcastMode ? `رسالة جماعية - ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}` : `رسالة فردية - ${selectedUser?.fullName || selectedUser?.name}`,
        message: messageText,
        type: isBroadcastMode ? 'broadcast' : 'single',
        targetRole: activeRole,
        count,
        refIds,
        broadcastId: outboxId,
        timestamp: new Date(),
        createdAt: new Date()
      };
      await db.insert(admin_outbox).values(outboxRecord);
      
      // Emit realtime events
      realtimeServerInstance?.broadcastManual('notifications_updated', undefined, 'UPDATE', {});
      realtimeServerInstance?.broadcastManual('support_tickets_updated', undefined, 'UPDATE', {});
      realtimeServerInstance?.broadcastManual('admin_outbox_updated', undefined, 'UPDATE', {});
      
      res.json({ success: true, count, outboxId });
    } catch (error: any) {
      console.error('Error in send-bulk:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });"""

content, count = re.subn(send_bulk_pattern, new_send_bulk, content, count=1)
print(f"Patched send-bulk: {count}")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
