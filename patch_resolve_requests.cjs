const fs = require('fs');

// 1. Add API route in server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');

const apiCode = `
  // Resolve requests when paid cash
  app.post('/api/finance/resolve-installment-requests', async (req, res) => {
    try {
      const { studentId, studentCode, installmentId } = req.body;
      if (!studentId && !studentCode) {
        return res.json({ success: true, count: 0 });
      }

      // Find pending requests for this student
      const pendingReqs = await db.select().from(payment_requests)
        .where(eq(payment_requests.status, 'pending'));

      let resolvedCount = 0;
      for (const req of pendingReqs) {
        let meta = {};
        try {
          if (req.description && req.description.startsWith('{')) {
            meta = JSON.parse(req.description);
          }
        } catch (e) {}

        const matchStudent = req.requesterId === studentId || req.requesterId === studentCode || meta.studentId === studentId || meta.studentCode === studentCode;
        const matchInstallment = meta.installmentId === installmentId || (!meta.installmentId); // If no installmentId, maybe it's general, but let's be safe

        if (matchStudent && matchInstallment) {
          meta.rejectReason = 'تم التسديد نقدياً';
          await db.update(payment_requests)
            .set({ 
              status: 'rejected',
              description: JSON.stringify(meta)
            })
            .where(eq(payment_requests.id, req.id));
            
          realtimeServerInstance?.broadcastManual('payment_requests', req.id, 'UPDATE', { ...req, status: 'rejected' });
          resolvedCount++;
        }
      }
      
      res.json({ success: true, count: resolvedCount });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // الحصول على طلبات الدفع المعلقة`;

if (serverCode.includes('// الحصول على طلبات الدفع المعلقة')) {
  serverCode = serverCode.replace('// الحصول على طلبات الدفع المعلقة', apiCode);
  fs.writeFileSync('server.ts', serverCode);
  console.log("Added resolve-installment-requests API");
}
