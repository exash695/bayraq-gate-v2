import re

filepath = 'src/components/PortalPulseDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

broadcast_addition = """
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
"""

content = content.replace("        await batch.commit();\n        \n        await logActivity({", broadcast_addition + "\n        await logActivity({")

with open(filepath, 'w') as f:
    f.write(content)
