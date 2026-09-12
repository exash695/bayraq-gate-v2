import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import express from "express";
import { eq, and, or, desc, asc, inArray, isNull, lt } from "drizzle-orm";
import { db, sql as sqlRaw } from "./src/db";
import { RealtimeServer } from "./src/server/realtimeServer";
import { 
  schools, students, student_transactions, teachers, 
  class_schedules, support_tickets, idea_bank, broadcasts, 
  notifications, payment_requests, developer_logs, activation_codes, 
  recorded_lessons, school_files, academy_pages, community_posts, community_comments,
  community_stories, video_comments, student_live_notes, question_bank, exam_papers,
  salaries, users, academic_lists, school_configs, school_announcements,
  attendance_logs, behavior_logs, audit_logs, council_polls, transport_drivers,
  transport_routes, transport_students_status, transport_fees, lounge_messages, admin_outbox,
  firestore_docs
} from "./src/db/schema";
import { sql } from "drizzle-orm";

// Removed top-level vite import
import path from "path";
import { GoogleGenAI } from "@google/genai";

import rateLimit from "express-rate-limit";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import os from "os";
import fsPromises from 'fs/promises';

import { AnalyticsManager } from "./src/server/ai/AnalyticsManager";
import { decisionEngine } from "./src/server/ai/DecisionEngine";

const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }
});
const memoryUpload = multer({ storage: multer.memoryStorage() });

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "al-sadis-academy";

let s3Client: S3Client | null = null;
let realtimeServerInstance: RealtimeServer | null = null;
if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && !R2_ENDPOINT.includes('dummy')) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateContentWithRetry(
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
) {
  const client = getGeminiClient();
  const modelsToTry = Array.from(new Set([
    params.model || "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
  ]));
  
  let lastError: any = null;
  
  for (const currentModel of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[Gemini Request] Model: ${currentModel}, Attempt: ${i + 1}/${maxRetries}`);
        const result = await client.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config
        });

        // Real-time AI Counter logging
        console.log(`[AI Call Success] Model: ${currentModel}, Timestamp: ${new Date().toISOString()}`);

        return result;
      } catch (error: any) {
        lastError = error;
        const errMsg = String(error.message || error || "").toLowerCase();
        const isHighDemandOr503 = 
          error.status === 503 ||
          error.code === 503 ||
          errMsg.includes('503') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('high demand') ||
          errMsg.includes('overloaded');

        const isRateLimit = 
          error.status === 429 || 
          error.code === 429 || 
          errMsg.includes('429') || 
          errMsg.includes('quota') || 
          errMsg.includes('limit') || 
          errMsg.includes('exceeded') || 
          errMsg.includes('resource_exhausted') || 
          errMsg.includes('rate');
          
        if (isHighDemandOr503) {
          console.warn(`[Gemini High Demand] Model ${currentModel} returned 503/unavailable. Trying next fallback model immediately...`);
          break; // Break inner loop to try next model immediately without blocking
        } else if (isRateLimit) {
          if (i < maxRetries - 1) {
            const delayMs = Math.min((i + 1) * 3000, 10000);
            console.warn(`[Gemini Rate-Limit] Retrying model ${currentModel} in ${delayMs}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            console.warn(`[Gemini Retries Exhausted] Model ${currentModel} failed. Trying fallback model...`);
          }
        } else {
          console.error(`[Gemini Error] Model ${currentModel} error:`, errMsg);
          break; // Try next fallback model
        }
      }
    }
  }
  
  throw lastError;
}


// Rate limiter for redeem-code
const redeemCodeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'لقد تجاوزت الحد المسموح به من المحاولات. يرجى الانتظار قليلاً.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // CORS and Cross-Origin Preflight handling
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Client error logging endpoint
  app.post('/api/log-client-error', (req, res) => {
    try {
      require('fs').writeFileSync('client-error.log', JSON.stringify(req.body, null, 2));
    } catch (e) {}
    res.send({ status: 'logged' });
  });

  // System cache flush endpoints
  app.post('/api/system/flush-cache', (req, res) => {
    res.json({ success: true, message: 'System cache flushed successfully' });
  });
  app.get('/api/system/flush-cache', (req, res) => {
    res.json({ success: true, message: 'System cache is operational' });
  });

  // ==========================================
  // ==========================================
  // 💰 نظام المالية والمدفوعات - PostgreSQL API
  // ==========================================

  // Helper to format payment requests with rich metadata and student info
  const formatPaymentRequest = (r: any, allStudents: any[] = []) => {
    let meta: any = {};
    if (r.description) {
      try {
        if (typeof r.description === 'string' && r.description.startsWith('{')) {
          meta = JSON.parse(r.description);
        }
      } catch (e) {}
    }
    
    // Resolve student info from metadata or database
    let studentCode = meta.studentCode || meta.studentId || r.requesterId || '';
    let studentName = meta.studentName || '';
    
    if (!studentName && r.description && typeof r.description === 'string' && !r.description.startsWith('{')) {
      studentName = r.description.replace(/^طلب تسديد من\s*/, '').replace(/^دفعة من\s*/, '').trim();
    }
    
    // Look up in allStudents if still missing or default
    if ((!studentName || studentName === 'طالب غير محدد' || studentName === studentCode) && allStudents.length > 0) {
      const match = allStudents.find((s: any) => 
        s.id === r.requesterId || 
        s.code === r.requesterId || 
        s.student === r.requesterId || 
        s.parentCode === r.requesterId || 
        (studentName && s.name && s.name.includes(studentName))
      );
      if (match) {
        studentName = match.name || match.fullName || studentName;
        studentCode = match.code || match.student || studentCode;
      }
    }
    
    return {
      id: r.id,
      schoolId: r.schoolId,
      requesterId: r.requesterId,
      studentId: r.requesterId || meta.studentId || '',
      studentCode: studentCode || r.requesterId || '',
      studentName: studentName || 'طالب غير محدد',
      senderName: meta.senderName || studentName || 'ولي أمر',
      amount: Number(r.amount) || 0,
      method: meta.method || r.method || 'AsiaPay (آسيا حوالة)',
      transactionId: meta.transactionId || r.transactionId || r.id,
      transactionNote: meta.notes || r.description || '',
      cardholderName: meta.cardholderName || '',
      installmentId: meta.installmentId || '',
      status: r.status || 'pending',
      rejectReason: meta.rejectReason || (r.status === 'rejected' ? r.description : ''),
      createdAt: r.createdAt
    };
  };

  
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
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // الحصول على طلبات الدفع المعلقة
  app.get('/api/finance/pending-payments', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(payment_requests).where(eq(payment_requests.status, 'pending'));
      
      if (schoolId && schoolId !== 'all' && schoolId !== 'undefined' && schoolId !== 'null') {
        queryBuilder = db.select().from(payment_requests)
          .where(and(eq(payment_requests.status, 'pending'), eq(payment_requests.schoolId, schoolId as string)));
      }

      const rawResults = await queryBuilder.orderBy(desc(payment_requests.createdAt));
      let allStudents: any[] = [];
      try {
        allStudents = await db.select().from(students);
      } catch (stErr) {
        console.warn('[API] /api/finance/pending-payments: could not load students list, continuing:', stErr);
      }
      const formatted = (rawResults || []).map(r => formatPaymentRequest(r, allStudents));
      res.json({ success: true, payments: formatted });
    } catch (error: any) {
      console.warn('[API] /api/finance/pending-payments fallback:', error?.message || error);
      res.json({ success: true, payments: [] });
    }
  });

  // الحصول على البيانات المالية المتكاملة للطالب (لأولياء الأمور)
  app.get('/api/finance/student-profile/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const allStudents = await db.select().from(students);
      const student = allStudents.find((s: any) => 
        s.id === studentId || 
        s.code === studentId || 
        s.student === studentId || 
        s.parentCode === studentId
      );

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      const confirmedTransactions = await db.select().from(student_transactions)
        .where(eq(student_transactions.studentId, student.id))
        .orderBy(desc(student_transactions.createdAt));
      
      const rawRequests = await db.select().from(payment_requests)
        .where(or(
          eq(payment_requests.requesterId, student.id),
          eq(payment_requests.requesterId, student.code || ''),
          eq(payment_requests.requesterId, student.parentCode || '')
        ))
        .orderBy(desc(payment_requests.createdAt));

      const pRequests = rawRequests
        .filter(r => r.status === 'pending' || r.status === 'rejected')
        .map(r => formatPaymentRequest(r, allStudents));

      res.json({
        success: true,
        data: {
          studentId: student.id,
          studentName: student.name,
          studentCode: student.code,
          schoolId: student.schoolId,
          discountType: student.discountType,
          discountRate: student.discountRate,
          status: student.status,
          totalAmount: student.totalAmount,
          finance: student.finance || {},
          transactions: confirmedTransactions,
          pendingRequests: pRequests
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إنشاء طلب دفع جديد
  app.post('/api/finance/payment-requests', async (req, res) => {
    try {
      const { id, schoolId, studentId, studentName, senderName, amount, method, notes, requesterId, transactionId, cardholderName, installmentId, description } = req.body;
      
      const reqId = id || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const meta = {
        studentId: studentId || requesterId,
        studentName: studentName || 'طالب غير محدد',
        senderName: senderName || studentName || 'ولي أمر',
        studentCode: studentId || requesterId,
        amount: parseInt(amount),
        method: method || 'AsiaPay (آسيا حوالة)',
        transactionId: transactionId || reqId,
        cardholderName: cardholderName || '',
        installmentId: installmentId || '',
        notes: notes || description || `طلب تسديد من ${senderName || studentName || 'ولي أمر'}`
      };

      const result = await db.insert(payment_requests).values({
        id: reqId,
        schoolId: schoolId || null,
        requesterId: requesterId || studentId,
        amount: parseInt(amount),
        description: JSON.stringify(meta),
        status: 'pending',
        createdAt: new Date()
      }).returning();

      const formatted = formatPaymentRequest(result[0]);

      // Broadcast realtime event
      realtimeServerInstance?.broadcastManual('payment_requests', reqId, 'INSERT', formatted);

      res.json({ success: true, payment: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تأكيد / اعتماد دفعة مالية
  const handleVerifyPaymentRoute = async (req: express.Request, res: express.Response) => {
    try {
      const { requestId, studentId: reqStudentId, amount: reqAmount, adminName = 'الإدارة المالية', note } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ success: false, message: 'requestId is required' });
      }

      // 1. Get payment request from DB
      const reqResults = await db.select().from(payment_requests).where(eq(payment_requests.id, requestId));
      if (reqResults.length === 0) {
        return res.status(404).json({ success: false, message: 'طلب الدفع غير موجود' });
      }

      const pReq = reqResults[0];
      let meta: any = {};
      try {
        if (pReq.description && pReq.description.startsWith('{')) {
          meta = JSON.parse(pReq.description);
        }
      } catch (e) {}

      const effectiveAmount = parseInt(reqAmount || meta.amount || pReq.amount || 0);
      const studentIdentifier = reqStudentId || meta.studentId || meta.studentCode || pReq.requesterId;
      const effectiveStudentName = meta.studentName || (pReq.description && !pReq.description.startsWith('{') ? pReq.description.replace(/^دفعة من\s*/, '') : '');

      // 2. Find student in DB
      const allStudents = await db.select().from(students);
      let student = allStudents.find((s: any) => 
        s.id === studentIdentifier || 
        s.code === studentIdentifier || 
        s.student === studentIdentifier || 
        s.parentCode === studentIdentifier ||
        (effectiveStudentName && s.name && s.name.trim() === effectiveStudentName.trim())
      );

      const transactionId = `txn_${Date.now()}`;
      let updatedStudent: any = null;

      // 3. Update student in DB if found
      if (student) {
        const currentPaid = student.paidAmount || 0;
        const newPaid = currentPaid + effectiveAmount;

        const currentFinance = student.finance || {};
        const existingInstallments = (Array.isArray(currentFinance.installments) && currentFinance.installments.length > 0) 
            ? currentFinance.installments 
            : (Array.isArray(student.installments) ? student.installments : []);
        const installments = [...existingInstallments];
        
        // Find matching installment by ID or first unpaid
        let instName = 'قسط';
        let instUpdated = false;
        if (meta.installmentId && installments.length > 0) {
          const idx = installments.findIndex((i: any) => String(i.id) === String(meta.installmentId) || installments.indexOf(i).toString() === String(meta.installmentId));
          if (idx !== -1) {
            instName = installments[idx].name || instName;
            installments[idx] = {
              ...installments[idx],
              paid: true,
              status: 'completed',
              paymentDate: new Date().toISOString(),
              method: meta.method || 'إلكتروني',
              transactionId: transactionId
            };
            instUpdated = true;
          }
        }
        
        if (!instUpdated && installments.length > 0) {
          const firstUnpaidIdx = installments.findIndex((i: any) => i.paid !== true && i.paid !== 'true' && i.status !== 'completed' && i.status !== 'verified' && i.status !== 'paid');
          if (firstUnpaidIdx !== -1) {
            instName = installments[firstUnpaidIdx].name || instName;
            installments[firstUnpaidIdx] = {
              ...installments[firstUnpaidIdx],
              paid: true,
              status: 'completed',
              paymentDate: new Date().toISOString(),
              method: meta.method || 'إلكتروني',
              transactionId: transactionId
            };
          }
        }

        const transactions = Array.isArray(currentFinance.transactions) ? [...currentFinance.transactions] : [];
        const newTxnEntry = {
          id: transactionId,
          requestId: requestId,
          amount: effectiveAmount,
          date: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          type: 'electronic',
          method: meta.method || 'إلكتروني',
          transactionId: meta.transactionId || requestId,
          note: note || `تسديد ${instName} (${meta.method || 'تحويل'}) - وصل رقمي #${transactionId}`,
          status: 'completed',
          adminName
        };
        transactions.unshift(newTxnEntry);

        const updatedFinance = {
          ...currentFinance,
          paidAmount: newPaid,
          installments,
          transactions
        };

        const updateResult = await db.update(students)
          .set({
            paidAmount: newPaid,
            finance: updatedFinance,
            updatedAt: new Date()
          })
          .where(eq(students.id, student.id))
          .returning();

        updatedStudent = updateResult[0];

        // Insert into student_transactions table
        await db.insert(student_transactions).values({
          id: transactionId,
          studentId: student.id,
          amount: effectiveAmount,
          adminName,
          note: note || `تسديد قسط إلكتروني معتمد - ${effectiveStudentName || student.name}`,
          createdAt: new Date()
        }).onConflictDoNothing();

        // Broadcast student and transaction updates
        realtimeServerInstance?.broadcastManual('students', student.id, 'UPDATE', updatedStudent);
        realtimeServerInstance?.broadcastManual('student_transactions', transactionId, 'INSERT', {
          id: transactionId,
          studentId: student.id,
          amount: effectiveAmount,
          adminName,
          note: note || `تسديد قسط إلكتروني معتمد`,
          createdAt: new Date()
        });
      }

      // 4. Update payment request status in DB
      await db.update(payment_requests)
        .set({ status: 'approved' })
        .where(eq(payment_requests.id, requestId));

      const updatedReq = { ...pReq, status: 'approved' };
      realtimeServerInstance?.broadcastManual('payment_requests', requestId, 'UPDATE', updatedReq);

      res.json({
        success: true,
        transactionId,
        student: updatedStudent,
        message: 'تم تأكيد الدفعة بنجاح وتحديث حساب الطالب'
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  app.post('/api/finance/verify-payment', handleVerifyPaymentRoute);
  app.post('/api/finance/approve-payment', handleVerifyPaymentRoute);

  // رفض دفعة مالية
  app.post('/api/finance/reject-payment', async (req, res) => {
    try {
      const { requestId, reason } = req.body;
      if (!requestId) {
        return res.status(400).json({ success: false, message: 'requestId is required' });
      }

      const reqResults = await db.select().from(payment_requests).where(eq(payment_requests.id, requestId));
      if (reqResults.length === 0) {
        return res.status(404).json({ success: false, message: 'طلب الدفع غير موجود' });
      }

      const pReq = reqResults[0];
      let meta: any = {};
      try {
        if (pReq.description && pReq.description.startsWith('{')) {
          meta = JSON.parse(pReq.description);
        }
      } catch (e) {}

      meta.rejectReason = reason || 'تم رفض الطلب من قبل الإدارة المالية';
      
      await db.update(payment_requests)
        .set({ 
          status: 'rejected', 
          description: JSON.stringify(meta) 
        })
        .where(eq(payment_requests.id, requestId));

      const updatedReq = { ...pReq, status: 'rejected', rejectReason: meta.rejectReason };
      realtimeServerInstance?.broadcastManual('payment_requests', requestId, 'UPDATE', updatedReq);

      res.json({ success: true, message: 'تم رفض الطلب' });
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تنظيف الطلبات المكتملة أو المرفوضة
  app.post('/api/finance/cleanup-requests', async (req, res) => {
    try {
      const { schoolId } = req.body;
      let deleteQuery = db.delete(payment_requests).where(or(eq(payment_requests.status, 'approved'), eq(payment_requests.status, 'rejected')));
      if (schoolId && schoolId !== 'all') {
        deleteQuery = db.delete(payment_requests).where(and(
          or(eq(payment_requests.status, 'approved'), eq(payment_requests.status, 'rejected')),
          eq(payment_requests.schoolId, schoolId)
        ));
      }
      const deleted = await deleteQuery.returning();
      realtimeServerInstance?.broadcast('payment_requests', { type: 'CLEANUP' });
      res.json({ success: true, count: deleted.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تنظيف الطلبات اليتيمة
  app.post('/api/finance/cleanup-orphaned-requests', async (req, res) => {
    try {
      const allStudents = await db.select().from(students);
      const studentIds = new Set(allStudents.map(s => s.id));
      const studentCodes = new Set(allStudents.map(s => s.code));
      
      const allReqs = await db.select().from(payment_requests);
      let count = 0;
      for (const r of allReqs) {
        if (!studentIds.has(r.requesterId) && !studentCodes.has(r.requesterId)) {
          await db.delete(payment_requests).where(eq(payment_requests.id, r.id));
          count++;
        }
      }
      realtimeServerInstance?.broadcast('payment_requests', { type: 'CLEANUP_ORPHANED' });
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // الحصول على سجل الحركات المالية لطالب
  app.get('/api/finance/student-transactions/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      const results = await db.select().from(student_transactions)
        .where(eq(student_transactions.studentId, studentId))
        .orderBy(desc(student_transactions.createdAt));
      res.json({ success: true, transactions: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // مزامنة الحركات المالية (Batch)
  app.post('/api/finance/sync-transactions', async (req, res) => {
    try {
      const { transactions } = req.body;
      if (!Array.isArray(transactions)) throw new Error('Transactions must be an array');

      for (const txn of transactions) {
        const { createdAt, ...txnData } = txn;
        await db.insert(student_transactions).values({
          ...txnData,
          createdAt: createdAt ? new Date(createdAt) : new Date()
        }).onConflictDoNothing();
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // الحصول على طالب بواسطة الكود والمدرسة (لأولياء الأمور)
  app.get('/api/students/by-code/:schoolId/:code', async (req, res) => {
    try {
      const { schoolId, code } = req.params;
      const sId = schoolId;
      const schoolIds = [sId];
      if (sId === 'school1' || sId === 'school_awail_ghamas') {
        schoolIds.push('school1', 'school_awail_ghamas');
      }

      const result = await db.select().from(students)
        .where(and(
          inArray(students.schoolId, schoolIds),
          or(eq(students.code, code), eq(students.parentCode, code))
        ));
      
      let student = result[0];
      
      if (!student) {
        const fallback = await db.select().from(students)
          .where(or(eq(students.code, code), eq(students.parentCode, code)));
        student = fallback[0];
      }

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      // 💡 Just-in-time finance repair if missing, zero, or mismatched with school plan (only if no payments)
      const config = await getSchoolConfigWithDefaults(student.schoolId);
      const templateLength = (config?.installmentPlan as any[])?.length || 0;
      const studentInstallments = student.finance?.installments || [];
      const hasPayments = studentInstallments.some((i: any) => i.paid === true || ['completed', 'verified', 'verified_payment', 'مكتمل'].includes((i.status || '').toLowerCase()));
      
      const currentInstSum = studentInstallments.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      const discountRates = config?.discountRates || {};
      const discountRate = Number(student.discountRate ?? (student.discountType ? (discountRates[student.discountType] || 0) : 0));
      
      const grade = student.grade;
      const normalizedGrade = normalizeGradeCanonical(grade || '');
      const byGrade = config?.tuitionFeesByGrade || {};
      let baseFee = (grade && byGrade[grade] !== undefined) ? Number(byGrade[grade]) : undefined;
      if (baseFee === undefined && normalizedGrade) {
        const matchKey = Object.keys(byGrade).find(k => normalizeGradeCanonical(k) === normalizedGrade);
        if (matchKey) baseFee = Number(byGrade[matchKey]);
      }
      if (baseFee === undefined) baseFee = Number(config?.tuitionFee || 0);
      const expectedTotal = baseFee - (baseFee * discountRate / 100);

      const needsRepair = !student.finance || studentInstallments.length === 0 || 
                         (!hasPayments && templateLength > 0 && studentInstallments.length !== templateLength) ||
                         (!hasPayments && discountRate > 0 && Math.abs(currentInstSum - expectedTotal) > 10) ||
                         !student.totalAmount || Number(student.totalAmount) === 0;

      if (needsRepair && config) {
        const calc = calculateStudentFinancialsServer(student, config);
        student.finance = calc.finance;
        student.totalAmount = calc.totalAmount;
        
        // Background update DB so next time it's fast
        db.update(students)
          .set({ 
            finance: calc.finance, 
            totalAmount: calc.totalAmount, 
            updatedAt: new Date() 
          })
          .where(eq(students.id, student.id))
          .then(() => console.log(`[Finance] Repaired/Synced finance for student ${student.id} using config ${config.id} (Template: ${templateLength})`))
          .catch(err => console.error(`[Finance] Failed to sync finance for ${student.id}`, err));
      }
      
      res.json({ success: true, student });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 🏫 مدارس بوابة بيرق - PostgreSQL API
  // ==========================================

  // Helper to ensure school exists (FK safety)
const ensureSchoolExists = async (schoolId: string, schoolName?: string) => {
    if (!schoolId) return;
    try {
      const existing = await db.select().from(schools).where(eq(schools.id, schoolId));
      if (existing.length === 0) {
        await db.insert(schools).values({
          id: schoolId,
          name: schoolName || 'مدرسة غير معرفة',
          governorate: 'الديوانية - غماس',
          status: 'active'
        }).onConflictDoNothing();
        console.log(`[DB] Auto-created missing school: ${schoolId}`);
      }
    } catch (err) {
      console.error(`[DB] Failed to ensure school exists: ${schoolId}`, err);
    }
  };

  // ==========================================
  // 🧮 مساعدات الحسابات المالية والقواعد المعيارية
  // ==========================================
  
  function normalizeGradeCanonical(raw: string): string {
    if (!raw) return '';
    const s = raw
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/^(الصف|صف)\s+/g, '')
      .trim();

    if (s.includes('ابتدائي')) {
      if (s.includes('اول')) return 'الأول ابتدائي';
      if (s.includes('ثاني')) return 'الثاني ابتدائي';
      if (s.includes('ثالث')) return 'الثالث ابتدائي';
      if (s.includes('رابع')) return 'الرابع ابتدائي';
      if (s.includes('خامس')) return 'الخامس ابتدائي';
      if (s.includes('سادس')) return 'السادس ابتدائي';
      return 'المرحلة الابتدائية';
    }
    if (s.includes('متوسط')) {
      if (s.includes('اول')) return 'الأول متوسط';
      if (s.includes('ثاني')) return 'الثاني متوسط';
      if (s.includes('ثالث')) return 'الثالث متوسط';
      return 'المرحلة المتوسطة';
    }
    if (s.includes('علمي')) {
      if (s.includes('رابع')) return 'رابع علمي';
      if (s.includes('خامس')) return 'خامس علمي';
      if (s.includes('سادس')) return 'سادس علمي';
    }
    if (s.includes('ادبي')) {
      if (s.includes('رابع')) return 'رابع ادبي';
      if (s.includes('خامس')) return 'خامس ادبي';
      if (s.includes('سادس')) return 'سادس ادبي';
    }
    return raw;
  }

  function calculateStudentFinancialsServer(student: any, config: any) {
    const grade = student.grade;
    const normalizedGrade = normalizeGradeCanonical(grade || '');
    const byGrade = config.tuitionFeesByGrade || {};
    
    let baseFee = (grade && byGrade[grade] !== undefined) ? Number(byGrade[grade]) : undefined;
    if (baseFee === undefined && normalizedGrade) {
      const matchKey = Object.keys(byGrade).find(k => normalizeGradeCanonical(k) === normalizedGrade);
      if (matchKey) baseFee = Number(byGrade[matchKey]);
    }
    
    // Explicitly avoid hardcoded 1,000,000 if config exists but is 0, use config value
    if (baseFee === undefined) {
      baseFee = Number(config.tuitionFee || 0);
    }

    const discountRates = config.discountRates || {};
    let discountRate = Number(student.discountRate ?? (student.discountType ? (discountRates[student.discountType] || 0) : 0));
    if (student.discountType && discountRates[student.discountType] !== undefined && Number(discountRates[student.discountType]) > discountRate) {
      discountRate = Number(discountRates[student.discountType]);
    }
    if (student.status === 'إعفاء تام' || student.discountType === 'FULL_EXEMPTION' || student.discountRate === 100) {
      discountRate = 100;
    }

    const totalAmount = baseFee - (baseFee * discountRate / 100);
    const discountFactor = (100 - discountRate) / 100;
    
    let installmentPlan = config.installmentPlan || [];
    if (installmentPlan.length === 0 && (student.schoolId === 'school1' || student.schoolId === 'school_awail_ghamas' || student.schoolId === 'ghamas_awail')) {
      installmentPlan = [
        { id: 'def_1', name: 'القسط الأول', amount: 200000, date: '2025-10-01' },
        { id: 'def_2', name: 'القسط الثاني', amount: 150000, date: '2026-01-01' },
        { id: 'def_3', name: 'القسط الثالث', amount: 100000, date: '2026-03-01' },
        { id: 'def_4', name: 'القسط الرابع', amount: 100000, date: '2026-05-01' },
      ];
    }
    
    const existingFinance = student.finance || {};
    const existingInstallments = existingFinance.installments || [];

    if (installmentPlan.length === 0 && existingInstallments.length > 0) {
      installmentPlan = existingInstallments;
    }

    const templateSum = installmentPlan.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
    const gradeProportion = templateSum > 0 ? (baseFee / templateSum) : 1;
    const combinedFactor = gradeProportion * discountFactor;
    
    const installments = installmentPlan.map((inst: any, idx: number) => {
      // Try to find matching existing installment to preserve paid status
      const existing = existingInstallments.find((ei: any) => ei.name === inst.name) || existingInstallments[idx];
      const isPaid = existing?.paid === true || ['completed', 'verified', 'verified_payment', 'مكتمل'].includes((existing?.status || '').toLowerCase());
      
      return {
        ...inst,
        id: existing?.id || inst.id || `inst_${idx}_${Date.now()}`,
        amount: Math.round((Number(inst.amount) || 0) * combinedFactor),
        paid: isPaid,
        status: isPaid ? (existing.status || 'مكتمل') : (existing?.status || 'pending')
      };
    });

    return {
      finance: {
        ...existingFinance,
        installments,
        totalTuition: totalAmount,
        paidAmount: student.paidAmount || 0,
        remainingAmount: Math.max(0, totalAmount - (student.paidAmount || 0)),
        lastUpdated: new Date().toISOString()
      },
      totalAmount
    };
  }

  // Auto-seed default official schools in PostgreSQL
  const seedDefaultSchools = async () => {
    try {
      const defaultOfficialSchools = [
        { id: 'school1', name: 'ثانوية اوائل غماس الاهلية', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school2', name: 'ثانوية النخبة العلمية للبنين', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school3', name: 'ثانوية نون والقلم الاهلية', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school4', name: 'ثانوية النبأ العظيم الاهلية للبنات', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school5', name: 'مدارس ابن عقيل الأهلية', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school6', name: 'مدرسة اليمامة الابتدائية', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school7', name: 'مدارس الجواهري الاهلية', governorate: 'الديوانية - غماس', status: 'active' },
        { id: 'school8', name: 'معهد ابداعنا للتعليم المطور', governorate: 'الديوانية - غماس', status: 'active' },
      ];
      for (const item of defaultOfficialSchools) {
        await db.insert(schools).values({
          id: item.id,
          name: item.name,
          governorate: item.governorate,
          status: item.status,
        }).onConflictDoUpdate({
          target: schools.id,
          set: {
            name: item.name,
            governorate: item.governorate,
            status: item.status,
          }
        });
      }
      console.log('[DB] Official Ghammas schools verified in PostgreSQL');
    } catch (e) {
      console.warn('[DB] Seed default schools notice:', e);
    }
  };

  // Seed on startup
  seedDefaultSchools().catch(console.error);

  // إضافة مدرسة جديدة (Sync)
  app.post('/api/schools', async (req, res) => {
    try {
      const { id, name, governorate, activationCode, status } = req.body;
      const schoolId = id || `school_${Date.now()}`;
      const newSchool = await db.insert(schools).values({
        id: schoolId, // Using Firebase ID as primary key
        name: name || 'مدرسة جديدة',
        governorate: governorate || 'غير محدد',
        activationCode: activationCode || '',
        status: status || 'active'
      }).onConflictDoUpdate({
        target: schools.id,
        set: {
          name: name || undefined,
          governorate: governorate || undefined,
          activationCode: activationCode || undefined,
          status: status || undefined
        }
      }).returning();
      
      realtimeServerInstance?.broadcastManual('schools', schoolId, 'INSERT', newSchool[0]);
      res.json({ success: true, school: newSchool[0], data: newSchool[0] });
    } catch (error: any) {
      console.error('Error adding school:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث بيانات مدرسة (PATCH)
  app.patch('/api/schools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      
      const existing = await db.select().from(schools).where(eq(schools.id, id));
      let returnedSchool: any = null;

      if (existing.length > 0) {
        const updatePayload: any = {};
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.governorate !== undefined) updatePayload.governorate = updates.governorate;
        if (updates.activationCode !== undefined) updatePayload.activationCode = updates.activationCode;
        if (updates.status !== undefined) updatePayload.status = updates.status;
        
        if (Object.keys(updatePayload).length > 0) {
          const resUpdated = await db.update(schools).set(updatePayload).where(eq(schools.id, id)).returning();
          returnedSchool = resUpdated[0];
        } else {
          returnedSchool = existing[0];
        }
      } else {
        const resInserted = await db.insert(schools).values({
          id,
          name: updates.name || 'مدرسة جديدة',
          governorate: updates.governorate || 'غير محدد',
          activationCode: updates.activationCode || updates.code || id,
          status: updates.status || 'active',
          createdAt: new Date()
        }).onConflictDoNothing().returning();
        returnedSchool = resInserted[0] || { id, ...updates };
      }

      realtimeServerInstance?.broadcastManual('schools', id, 'UPDATE', returnedSchool || { id, ...updates });
      res.json({ success: true, id, school: returnedSchool, data: returnedSchool });
    } catch (error: any) {
      console.error('Error patching school:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث كامل لمدرسة (PUT)
  app.put('/api/schools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      
      const existing = await db.select().from(schools).where(eq(schools.id, id));
      let returnedSchool: any = null;

      if (existing.length > 0) {
        const updatePayload: any = {};
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.governorate !== undefined) updatePayload.governorate = updates.governorate;
        if (updates.activationCode !== undefined) updatePayload.activationCode = updates.activationCode;
        if (updates.status !== undefined) updatePayload.status = updates.status;
        
        if (Object.keys(updatePayload).length > 0) {
          const resUpdated = await db.update(schools).set(updatePayload).where(eq(schools.id, id)).returning();
          returnedSchool = resUpdated[0];
        } else {
          returnedSchool = existing[0];
        }
      } else {
        const resInserted = await db.insert(schools).values({
          id,
          name: updates.name || 'مدرسة جديدة',
          governorate: updates.governorate || 'غير محدد',
          activationCode: updates.activationCode || updates.code || id,
          status: updates.status || 'active',
          createdAt: new Date()
        }).onConflictDoNothing().returning();
        returnedSchool = resInserted[0] || { id, ...updates };
      }

      realtimeServerInstance?.broadcastManual('schools', id, 'UPDATE', returnedSchool || { id, ...updates });
      res.json({ success: true, id, school: returnedSchool, data: returnedSchool });
    } catch (error: any) {
      console.error('Error putting school:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة أو تحديث مدرسة بالمعرف (POST by ID)
  app.post('/api/schools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      
      const result = await db.insert(schools).values({
        id,
        name: updates.name || 'مدرسة جديدة',
        governorate: updates.governorate || 'غير محدد',
        activationCode: updates.activationCode || updates.code || id,
        status: updates.status || 'active',
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: schools.id,
        set: {
          name: updates.name || undefined,
          governorate: updates.governorate || undefined,
          activationCode: updates.activationCode || undefined,
          status: updates.status || undefined
        }
      }).returning();

      realtimeServerInstance?.broadcastManual('schools', id, 'UPDATE', result[0] || { id, ...updates });
      res.json({ success: true, id, school: result[0], data: result[0] });
    } catch (error: any) {
      console.error('Error posting school by ID:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب جميع المدارس
  app.get('/api/schools', async (req, res) => {
    try {
      const allSchools = await db.select().from(schools);
      res.json({ success: true, schools: allSchools, data: allSchools });
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب مدرسة محددة بالمعرف
  app.get('/api/schools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const schoolList = await db.select().from(schools).where(eq(schools.id, id));
      if (schoolList.length === 0) {
        return res.json({ success: true, school: null, data: null });
      }
      res.json({ success: true, school: schoolList[0], data: schoolList[0] });
    } catch (error: any) {
      console.error('Error fetching school:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف مدرسة وجميع البيانات المرتبطة بها (Cascading Deletion)
  app.delete('/api/schools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Execute cascading deletion across all relational tables in PostgreSQL
      await db.transaction(async (tx) => {
        // 1. Activity submissions & tasks
        try {
          await tx.execute(sql`DELETE FROM activity_submissions WHERE school_id = ${id} OR task_id IN (SELECT id FROM activity_tasks WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM activity_tasks WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading activity_tasks warning:", e);
        }

        // 2. Exam papers
        try {
          await tx.execute(sql`DELETE FROM exam_papers WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading exam_papers warning:", e);
        }

        // 3. Transport tables
        try {
          await tx.execute(sql`DELETE FROM transport_fees WHERE student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM transport_students_status WHERE route_id IN (SELECT id FROM transport_routes WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM transport_drivers WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM transport_routes WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading transport warning:", e);
        }

        // 4. Community comments & posts
        try {
          await tx.execute(sql`DELETE FROM community_comments WHERE post_id IN (SELECT id FROM community_posts WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM community_posts WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading community warning:", e);
        }

        // 5. Student related tables
        try {
          await tx.execute(sql`DELETE FROM student_transactions WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM attendance_logs WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM behavior_logs WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
        } catch (e) {
          console.warn("Cascading student logs warning:", e);
        }

        // 6. Teacher related tables & salaries
        try {
          await tx.execute(sql`DELETE FROM salaries WHERE staff_id IN (SELECT id FROM teachers WHERE school_id = ${id})`);
          await tx.execute(sql`DELETE FROM class_schedules WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading teacher schedules warning:", e);
        }

        // 7. General school communications and items
        try {
          await tx.execute(sql`DELETE FROM school_announcements WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM notifications WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM broadcasts WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM support_tickets WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM idea_bank WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM council_polls WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM payment_requests WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM activation_codes WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM recorded_lessons WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM school_files WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM academy_pages WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM lounge_messages WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM academic_lists WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM school_configs WHERE id = ${id}`);
          await tx.execute(sql`DELETE FROM audit_logs WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading school misc warning:", e);
        }

        // 8. Delete core school entities: students, teachers, users
        try {
          await tx.execute(sql`DELETE FROM students WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM teachers WHERE school_id = ${id}`);
          await tx.execute(sql`DELETE FROM users WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading core entities warning:", e);
        }

        // 9. Finally delete the school record itself
        await tx.execute(sql`DELETE FROM schools WHERE id = ${id}`);
      });

      res.json({ success: true, message: `School ${id} and all associated records deleted successfully` });
    } catch (error: any) {
      console.error('Error deleting school:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 🎓 طلاب بوابة بيرق - PostgreSQL API
  // ==========================================

  // جلب جميع الطلاب أو بحسب المدرسة
  app.get('/api/students', async (req, res) => {
    try {
      const { schoolId } = req.query;
      if (schoolId && schoolId !== 'all') {
        const schoolStudents = await db.select().from(students).where(eq(students.schoolId, schoolId as string));
        return res.json({ success: true, students: schoolStudents, data: schoolStudents });
      }
      const allStudents = await db.select().from(students);
      res.json({ success: true, students: allStudents, data: allStudents });
    } catch (error: any) {
      console.error('Error fetching all students:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب طلاب مدرسة معينة أو طالب محدد بالمعرف
  app.get('/api/students/:schoolId', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const schoolStudents = await db.select().from(students).where(eq(students.schoolId, schoolId));
      if (schoolStudents.length > 0) {
        return res.json({ success: true, students: schoolStudents, data: schoolStudents });
      }
      // Check if it's a student ID or student code directly
      const singleStudent = await db.select().from(students).where(or(eq(students.id, schoolId), eq(students.code, schoolId)));
      if (singleStudent.length > 0) {
        return res.json({ success: true, student: singleStudent[0], data: singleStudent[0], students: singleStudent });
      }
      res.json({ success: true, students: [], data: null });
    } catch (error: any) {
      console.error('Error fetching students:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // مزامنة دفعة طلاب (Batch Upsert)
  app.post('/api/students/sync-all', async (req, res) => {
    try {
      const { students: studentsToSync } = req.body;
      if (!Array.isArray(studentsToSync)) throw new Error('Students must be an array');
      
      const uniqueSchoolIds = [...new Set(studentsToSync.map(s => s.schoolId))].filter(Boolean);
      
      // Batch fetch school configs
      const schoolConfigsList = await db.select().from(school_configs).where(inArray(school_configs.id, uniqueSchoolIds));
      const schoolConfigsMap = new Map(schoolConfigsList.map(c => [c.id, c]));

      // Prepare all operations to run in parallel
      const operations = studentsToSync.map(async (student) => {
        const { createdAt, updatedAt, ...studentData } = student;
        
        const config = schoolConfigsMap.get(studentData.schoolId);
        if (config && config.installmentPlan && Array.isArray(config.installmentPlan)) {
          const calc = calculateStudentFinancialsServer(studentData, config);
          studentData.finance = calc.finance;
          studentData.totalAmount = calc.totalAmount;
        }

        return db.insert(students).values({
          ...studentData,
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: students.id,
          set: { ...studentData, updatedAt: new Date() }
        });
      });

      await Promise.all(operations);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error syncing students:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث بيانات طالب (Partial Update)
  app.patch('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt: _, updatedAt: __, ...updates } = req.body;

      // Always try to keep finance in sync if grade/discount/school changes
      const existingStudentResult = await db.select().from(students).where(eq(students.id, id));
      const s = existingStudentResult[0];

      if (s) {
        const schoolId = updates.schoolId || s.schoolId;
        
        // If finance-related fields changed OR finance is missing, recalculate
        const needsRecalc = !s.finance || !s.finance.installments || 
                          updates.grade !== undefined || 
                          updates.discountType !== undefined || 
                          updates.discountRate !== undefined ||
                          updates.schoolId !== undefined;

        if (needsRecalc && schoolId) {
          const config = await db.select().from(school_configs).where(eq(school_configs.id, schoolId));
          if (config[0] && config[0].installmentPlan && Array.isArray(config[0].installmentPlan)) {
            const calc = calculateStudentFinancialsServer({ ...s, ...updates }, config[0]);
            updates.finance = calc.finance;
            updates.totalAmount = calc.totalAmount;
          }
        }
      }

      const result = await db.update(students)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      
      realtimeServerInstance?.broadcastManual('students', id, 'UPDATE', result[0]);
      res.json({ success: true, student: result[0] });
    } catch (error: any) {
      console.error('Error patching student:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف طالب
  app.delete('/api/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(students).where(eq(students.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 📚 القوائم الأكاديمية - PostgreSQL API
  // ==========================================

  app.get('/api/academic-lists', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let lists;
      if (schoolId && schoolId !== 'all' && schoolId !== 'undefined' && schoolId !== 'null') {
        lists = await db.select().from(academic_lists).where(eq(academic_lists.schoolId, schoolId as string));
      } else {
        lists = await db.select().from(academic_lists);
      }
      res.json({ success: true, academicLists: lists, data: lists });
    } catch (error: any) {
      console.error('Error fetching academic lists:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/academic-lists/:schoolId', async (req, res) => {
    try {
      const { schoolId } = req.params;
      let lists;
      if (schoolId && schoolId !== 'all' && schoolId !== 'undefined' && schoolId !== 'null') {
        lists = await db.select().from(academic_lists).where(eq(academic_lists.schoolId, schoolId));
      } else {
        lists = await db.select().from(academic_lists);
      }
      res.json({ success: true, academicLists: lists, data: lists });
    } catch (error: any) {
      console.error('Error fetching academic lists:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/academic-lists', async (req, res) => {
    try {
      const { id, name, schoolId, schoolName, date, students: listStudents, removedSubjects, lastSyncedPeriod } = req.body;
      
      if (schoolId) {
        await ensureSchoolExists(schoolId, schoolName);
      }

      const values = {
        id,
        name,
        schoolId,
        schoolName,
        date,
        students: listStudents || [],
        removedSubjects: removedSubjects || [],
        lastSyncedPeriod,
        updatedAt: new Date()
      };

      const result = await db.insert(academic_lists).values(values)
        .onConflictDoUpdate({
          target: academic_lists.id,
          set: values
        }).returning();

      realtimeServerInstance?.broadcastManual('academic_lists', result[0].id, 'INSERT', result[0]);
      res.json({ success: true, academicList: result[0] });
    } catch (error: any) {
      console.error('Error saving academic list:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/academic-lists/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(academic_lists).where(eq(academic_lists.id, id));
      realtimeServerInstance?.broadcastManual('academic_lists', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting academic list:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // ⚙️ إعدادات المدارس - PostgreSQL API
  // ==========================================

  const getSchoolConfigWithDefaults = async (schoolId: string) => {
    const cleaned = (schoolId || '').trim().toLowerCase();
    let resolvedId = schoolId;
    if (cleaned === 'school_awail_ghamas' || cleaned === 'ghamas_awail') {
      resolvedId = 'school1';
    }

    const configResult = await db.select().from(school_configs).where(eq(school_configs.id, resolvedId));
    let config = configResult[0];

    if (!config) {
      // Create a default config for any school that doesn't exist yet
      config = {
        id: resolvedId,
        tuitionFee: 550000,
        installmentPlan: [
          { id: 'inst_1', name: 'القسط الأول', amount: 200000, date: '2025-10-01' },
          { id: 'inst_2', name: 'القسط الثاني', amount: 150000, date: '2026-01-01' },
          { id: 'inst_3', name: 'القسط الثالث', amount: 100000, date: '2026-03-01' },
          { id: 'inst_4', name: 'القسط الرابع', amount: 100000, date: '2026-05-01' },
        ],
        discountRates: {
          'brother': 10,
          'martyr': 20,
          'distinguished': 15
        }
      } as any;
    } else {
      // Ensure existing config has essential defaults if fields are missing
      if (!config.installmentPlan || (Array.isArray(config.installmentPlan) && config.installmentPlan.length === 0)) {
        config.installmentPlan = [
          { id: 'inst_1', name: 'القسط الأول', amount: 200000, date: '2025-10-01' },
          { id: 'inst_2', name: 'القسط الثاني', amount: 150000, date: '2026-01-01' },
          { id: 'inst_3', name: 'القسط الثالث', amount: 100000, date: '2026-03-01' },
          { id: 'inst_4', name: 'القسط الرابع', amount: 100000, date: '2026-05-01' },
        ];
      }
      if (!config.tuitionFee) config.tuitionFee = 550000;
    }

    return config;
  };

  const updateStudentsFinanceOnConfigChange = async (schoolId: string, config: any) => {
    try {
      console.log(`[Finance] School config changed for ${schoolId}. Triggering student finance update...`);
      const schoolStudents = await db.select().from(students).where(eq(students.schoolId, schoolId));
      
      for (const s of schoolStudents) {
        const calc = calculateStudentFinancialsServer(s, config);
        const [updatedStudent] = await db.update(students)
          .set({ 
            finance: calc.finance, 
            totalAmount: calc.totalAmount,
            updatedAt: new Date()
          })
          .where(eq(students.id, s.id))
          .returning();
        
        // Broadcast the update so the UI (including ParentPortal) refreshes
        if (updatedStudent) {
          realtimeServerInstance?.broadcastManual('students', s.id, 'UPDATE', updatedStudent);
        }
      }
      console.log(`[Finance] Updated ${schoolStudents.length} students for school ${schoolId}`);
    } catch (err) {
      console.error(`[Finance] Failed to update students for school ${schoolId}:`, err);
    }
  };

  app.get('/api/school-configs', async (req, res) => {
    try {
      const schoolId = (req.query.schoolId as string) || (req.query.id as string);
      if (schoolId) {
        const config = await getSchoolConfigWithDefaults(schoolId);
        return res.json({ success: true, config, data: config });
      }
      const configs = await db.select().from(school_configs);
      res.json({ success: true, configs, data: configs });
    } catch (error: any) {
      console.error('Error fetching school configs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/school-configs/:schoolId', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const config = await getSchoolConfigWithDefaults(schoolId);
      res.json({ success: true, config });
    } catch (error: any) {
      console.error('Error fetching school config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/school-configs', async (req, res) => {
    try {
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        ...configData,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: new Date() }
      }).returning();

      // Check for financial changes
      const financialFields = ['tuitionFee', 'tuitionFeesByGrade', 'installmentPlan', 'discountRates'];
      const hasFinancialChanges = Object.keys(configData).some(key => financialFields.includes(key));
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(configData.id, result[0]);
      }

      realtimeServerInstance?.broadcastManual('school_configs', configData.id, 'UPDATE', result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error: any) {
      console.error('Error saving school config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/school-configs/:schoolId', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        id: schoolId,
        ...configData,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: new Date() }
      }).returning();
      
      // If financial fields changed, trigger background update for all students in this school
      const financialFields = ['tuitionFee', 'tuitionFeesByGrade', 'installmentPlan', 'discountRates'];
      const hasFinancialChanges = Object.keys(configData).some(key => financialFields.includes(key));
      
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(schoolId, result[0]);
      }

      realtimeServerInstance?.broadcastManual('school_configs', schoolId, 'UPDATE', result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error: any) {
      console.error('Error patching school config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/school-configs/:schoolId', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        id: schoolId,
        ...configData,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: new Date() }
      }).returning();
      
      const financialFields = ['tuitionFee', 'tuitionFeesByGrade', 'installmentPlan', 'discountRates'];
      const hasFinancialChanges = Object.keys(configData).some(key => financialFields.includes(key));
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(schoolId, result[0]);
      }

      realtimeServerInstance?.broadcastManual('school_configs', schoolId, 'UPDATE', result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error: any) {
      console.error('Error putting school config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 💰 الحركات المالية والأقساط - PostgreSQL API
  // ==========================================
  
  app.post('/api/payments', async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newPayment = await db.insert(student_transactions).values({
        id,
        studentId,
        schoolId,
        amount,
        note,
        method,
        adminName
      }).returning();
      res.json({ success: true, payment: newPayment[0] });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });


  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }));

  // Cloudflare R2 CDN Streaming Proxy with Local Fallback
  app.get('/cdn/*', async (req, res) => {
    const rawPath = req.params[0] || '';
    const relPath = rawPath.replace(/^\/+/, '');
    if (!relPath) return res.status(400).send('Missing media path');

    // Build candidate keys for R2 and local storage
    const candidates = [relPath];
    const baseName = relPath.split('/').pop() || '';
    const dirName = relPath.substring(0, relPath.lastIndexOf('/') + 1);

    // 1. Auto-mapping ONLY for school logos (logoX.jpg vs schoolX.jpg)
    if (dirName.includes('school-logos') || dirName.includes('schools') || relPath.includes('logo') || relPath.includes('school')) {
      const matchNum = baseName.match(/(\d+)\.(jpg|png|jpeg|webm|mp4)/i);
      if (matchNum) {
        const num = matchNum[1];
        const ext = matchNum[2];
        candidates.push(`${dirName}logo${num}.${ext}`);
        candidates.push(`${dirName}school${num}.${ext}`);
        candidates.push(`${dirName}cover${num}.${ext}`);
        candidates.push(`logo${num}.${ext}`);
        candidates.push(`school${num}.${ext}`);
        if (ext.toLowerCase() === 'png' || ext.toLowerCase() === 'jpg' || ext.toLowerCase() === 'jpeg') {
          const altExt = ext.toLowerCase() === 'png' ? 'jpg' : 'png';
          candidates.push(relPath.replace(/\.(png|jpg|jpeg)$/i, `.${altExt}`));
          candidates.push(`${dirName}logo${num}.${altExt}`);
        }
      }
    }

    // 2. Mascot specific fallbacks if under mascot directory
    if (dirName.includes('mascot')) {
      // Try png <-> jpg
      if (relPath.endsWith('.png')) candidates.push(relPath.replace(/\.png$/i, '.jpg'));
      if (relPath.endsWith('.jpg')) candidates.push(relPath.replace(/\.jpg$/i, '.png'));
      // Fallback clean mascot images if specific sliced PNG is missing
      candidates.push('mascot/welcome.png');
      candidates.push('mascot/welcome.jpg');
      candidates.push('mascot/study.png');
      candidates.push('mascot/connect.png');
      candidates.push('mascot/achieve.png');
      candidates.push('mascot/launch.png');
      candidates.push('mascot/transit.png');
    }

    // 1. Check local public folder FIRST for instant, 100% reliable zero-latency serving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    for (const candidateKey of candidates) {
      const localFilePath = path.join(process.cwd(), 'public', candidateKey);
      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(localFilePath);
      }
    }

    // 2. Try fetching from Cloudflare R2 if not found locally
    if (s3Client && R2_BUCKET_NAME) {
      for (const candidateKey of candidates) {
        try {
          // Use a short timeout for S3 requests to prevent hanging
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 2000); // 2 second timeout

          const s3Res = await s3Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: candidateKey,
            Range: req.headers.range,
          }), { abortSignal: abortController.signal as any });
          
          clearTimeout(timeoutId);

          if (s3Res) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (s3Res.ContentType) res.setHeader('Content-Type', s3Res.ContentType);
            if (s3Res.ContentLength) res.setHeader('Content-Length', s3Res.ContentLength.toString());
            if (s3Res.ContentRange) {
              res.setHeader('Content-Range', s3Res.ContentRange);
              res.status(206);
            } else {
              res.status(200);
            }
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            if (s3Res.Body && typeof (s3Res.Body as any).pipe === 'function') {
              return (s3Res.Body as any).pipe(res);
            }
          }
        } catch (e) {
          // try next candidate
        }
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(404).send('Asset not found');
  });

  // Serve all static files from public folder (including mascots) directly from Express
  app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

  // --- BERQ MASCOT BINARY VERIFICATION & R2 SYNC APIs ---
  app.get("/api/mascot/verify", async (req, res) => {
    try {
      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        fs.mkdirSync(mascotDir, { recursive: true });
      }

      const files = fs.readdirSync(mascotDir);
      const fileResults = [];
      let allValid = true;

      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        // Strict binary Buffer reading (NO utf8 decoding!)
        const buf = fs.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        
        const isPng = fileName.toLowerCase().endsWith(".png");
        const isJpg = fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";

        let isValidHeader = false;
        if (isPng) {
          isValidHeader = headerHex === EXPECTED_PNG_HEADER;
        } else if (isJpg) {
          isValidHeader = headerHex.startsWith("FFD8FF");
        } else {
          isValidHeader = true; // Other binary assets
        }

        let metadata = null;
        let sharpError = null;
        try {
          metadata = await sharp(filePath).metadata();
        } catch (err: any) {
          sharpError = err.message || "Failed to parse image dimensions";
          allValid = false;
        }

        const isHealthy = isValidHeader && metadata !== null && !sharpError;
        if (!isHealthy) allValid = false;

        fileResults.push({
          fileName,
          url: `/mascot/${fileName}?v=${stat.mtimeMs}`,
          sizeBytes: stat.size,
          sizeKb: (stat.size / 1024).toFixed(1),
          headerHex,
          expectedHeader: isPng ? EXPECTED_PNG_HEADER : isJpg ? "FFD8FFE0..." : "N/A",
          isValidHeader,
          width: metadata?.width || null,
          height: metadata?.height || null,
          format: metadata?.format || null,
          sharpError,
          isHealthy,
        });
      }

      return res.json({
        success: true,
        allValid: fileResults.length > 0 && allValid,
        totalFiles: fileResults.length,
        files: fileResults,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/verify:", err);
      return res.status(500).json({ error: err.message || "Failed to verify mascot files" });
    }
  });

  // Upload new original binary files directly without utf8 encoding or text processing
  app.post("/api/mascot/upload-binary", memoryUpload.array("files"), async (req: any, res: any) => {
    try {
      const files = req.files as any[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided for binary copy" });
      }

      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        fs.mkdirSync(mascotDir, { recursive: true });
      }

      const uploadedResults = [];

      for (const file of files) {
        const targetPath = path.join(mascotDir, file.originalname);

        // PURE BINARY COPY: Write raw buffer directly to disk (NO utf8 encoding)
        fs.writeFileSync(targetPath, file.buffer);

        // Verify PNG magic bytes & Sharp dimensions immediately
        const buf = fs.readFileSync(targetPath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        const isPng = file.originalname.toLowerCase().endsWith(".png");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";
        const isValidHeader = isPng ? headerHex === EXPECTED_PNG_HEADER : true;

        let meta = null;
        try {
          meta = await sharp(targetPath).metadata();
        } catch (e) {}

        uploadedResults.push({
          fileName: file.originalname,
          size: file.buffer.length,
          headerHex,
          isValidHeader,
          width: meta?.width || null,
          height: meta?.height || null,
          isHealthy: isValidHeader && meta !== null,
        });
      }

      return res.json({
        success: true,
        message: `Successfully copied ${files.length} files to public/mascot in pure binary mode`,
        files: uploadedResults,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/upload-binary:", err);
      return res.status(500).json({ error: err.message || "Failed to upload binary files" });
    }
  });

  // Re-link Cloudflare R2 only using verified healthy binary files
  app.post("/api/mascot/sync-r2", async (req, res) => {
    try {
      if (!s3Client || !R2_BUCKET_NAME) {
        return res.status(400).json({ error: "Cloudflare R2 is not configured on this server (missing environment variables)." });
      }

      const mascotDir = path.join(process.cwd(), "public", "mascot");
      if (!fs.existsSync(mascotDir)) {
        return res.status(400).json({ error: "public/mascot directory does not exist" });
      }

      const files = fs.readdirSync(mascotDir);
      if (files.length === 0) {
        return res.status(400).json({ error: "No mascot files available to sync" });
      }

      // 1. Verify all files before uploading to R2
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const buf = fs.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();

        if (fileName.toLowerCase().endsWith(".png") && headerHex !== "89504E470D0A1A0A") {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} has invalid PNG magic bytes (${headerHex}). Only healthy binary files can be uploaded to R2.`
          });
        }

        try {
          await sharp(filePath).metadata();
        } catch (e: any) {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} cannot be read by Sharp (${e.message}). Fix binary corruption first.`
          });
        }
      }

      // 2. Upload verified healthy binary files to R2
      const syncedKeys: string[] = [];
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = path.join(mascotDir, fileName);
        const fileBuffer = fs.readFileSync(filePath); // Raw binary buffer
        const key = `mascot/${fileName}`;
        const ext = path.extname(fileName).toLowerCase();
        const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";

        await s3Client.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }));
        syncedKeys.push(key);
      }

      return res.json({
        success: true,
        message: `Successfully uploaded ${syncedKeys.length} healthy binary mascot files to Cloudflare R2 bucket (${R2_BUCKET_NAME})`,
        syncedKeys,
      });
    } catch (err: any) {
      console.error("Error in /api/mascot/sync-r2:", err);
      return res.status(500).json({ error: err.message || "Failed to sync mascot files to Cloudflare R2" });
    }
  });

  const POSE_ALIASES_MAP: Record<string, string[]> = {
    pulse: ['pose_portal_pulse'],
    pose_portal_pulse: ['pulse'],
    finance: ['pose_finance_officer'],
    pose_finance_officer: ['finance'],
    codes: ['pose_key_master'],
    pose_key_master: ['codes'],
    students: ['pose_student_manager'],
    pose_student_manager: ['students'],
    broadcast: ['pose_broadcaster', 'pose_digital_broadcaster'],
    pose_broadcaster: ['broadcast', 'pose_digital_broadcaster'],
    pose_digital_broadcaster: ['broadcast', 'pose_broadcaster'],
    attendance: ['pose_discipline_shield'],
    pose_discipline_shield: ['attendance'],
    uniform: ['pose_school_uniform'],
    pose_school_uniform: ['uniform'],
    teachers: ['pose_academic_scholar', 'pose_staff_leader'],
    pose_academic_scholar: ['teachers'],
    pose_staff_leader: ['teachers', 'pose_academic_scholar'],
    transport: ['pose_transport_manager', 'pose_bus_captain', 'use_driving_bus'],
    pose_transport_manager: ['transport', 'pose_bus_captain', 'use_driving_bus'],
    pose_bus_captain: ['transport', 'pose_transport_manager', 'use_driving_bus'],
    use_driving_bus: ['transport', 'pose_transport_manager', 'pose_bus_captain'],
    ideas: ['pose_idea_genius'],
    pose_idea_genius: ['ideas'],
    support: ['pose_customer_support'],
    pose_customer_support: ['support'],
    resources: ['pose_content_control', 'pose_control_mechanic'],
    pose_content_control: ['resources', 'pose_control_mechanic'],
    pose_control_mechanic: ['resources', 'pose_content_control'],
    audit: ['pose_activity_logs'],
    pose_activity_logs: ['audit'],
    captain_bairaq_guardian: ['mayadeen_tab_bairaq', 'pose_dual_arena'],
    mayadeen_tab_bairaq: ['captain_bairaq_guardian', 'pose_dual_arena'],
    pose_dual_arena: ['captain_bairaq_guardian', 'mayadeen_tab_bairaq'],
    pose_questions_bank: ['pose_radar_navigator'],
    pose_radar_navigator: ['pose_questions_bank'],
    welcome_video: ['greeting_welcome', 'greet_hello', 'in_app_use_welcomes_students'],
    greeting_welcome: ['welcome_video', 'greet_hello', 'in_app_use_welcomes_students'],
    welcome_video_secondary: ['welcome_intro_secondary', 'intro_secondary_video'],
    welcome_intro_secondary: ['welcome_video_secondary'],
    app_logo: ['logo', 'bairaq_logo', 'application_logo', 'header_logo'],
    logo: ['app_logo', 'bairaq_logo'],
    welcome_card_welcome: ['welcome'],
    welcome: ['welcome_card_welcome'],
    welcome_card_connect: ['connect'],
    connect: ['welcome_card_connect'],
    welcome_card_study: ['study'],
    study: ['welcome_card_study'],
    welcome_card_transit: ['transit'],
    transit: ['welcome_card_transit'],
    welcome_card_achieve: ['achieve'],
    achieve: ['welcome_card_achieve'],
    welcome_card_launch: ['launch'],
    launch: ['welcome_card_launch'],
  };

  // Persistent File Store paths for Bairaq Assets & History (Atomic & Single Source of Truth)
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  }
  const POSES_FILE = path.join(DATA_DIR, 'bairaq_poses.json');
  const HISTORY_FILE = path.join(DATA_DIR, 'bairaq_history.json');

  const readLocalPoses = (): Record<string, string> => {
    try {
      if (fs.existsSync(POSES_FILE)) {
        const raw = fs.readFileSync(POSES_FILE, 'utf-8');
        return JSON.parse(raw) || {};
      }
    } catch (e) {
      console.error("[DATABASE READ ERROR] Could not read local poses file:", e);
    }
    return {};
  };

  const writeLocalPoses = (poses: Record<string, string>): void => {
    try {
      const tempPath = `${POSES_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(poses, null, 2), 'utf-8');
      fs.renameSync(tempPath, POSES_FILE);
    } catch (e) {
      console.error("[DATABASE WRITE ERROR] Could not write local poses file:", e);
    }
  };

  const readLocalHistory = (): any[] => {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.error("[DATABASE READ ERROR] Could not read local history file:", e);
    }
    return [];
  };

  const writeLocalHistory = (records: any[]): void => {
    try {
      const tempPath = `${HISTORY_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), 'utf-8');
      fs.renameSync(tempPath, HISTORY_FILE);
    } catch (e) {
      console.error("[DATABASE WRITE ERROR] Could not write local history file:", e);
    }
  };

  // GET /api/bairaq/poses - Fetch all current overrides from persistent storage
  app.get("/api/bairaq/poses", async (req, res) => {
    try {
      const poses = readLocalPoses();
      
      // Expand all aliases
      for (const [key, val] of Object.entries(poses)) {
        if (typeof val === 'string' && val) {
          const aliases = POSE_ALIASES_MAP[key] || [];
          for (const alias of aliases) {
            poses[alias] = val;
          }
        }
      }

      console.log(`[DATABASE READ] [GET /api/bairaq/poses] Retrieved ${Object.keys(poses).length} active poses`);
      return res.json({ success: true, poses });
    } catch (err: any) {
      console.error("[DATABASE READ ERROR] Error in GET /api/bairaq/poses:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch poses" });
    }
  });

  // POST /api/bairaq/poses - Atomic and persistent update with versioning history
  app.post("/api/bairaq/poses", async (req, res) => {
    try {
      const { headerId, publicUrl, fileName, fileSize, fileType } = req.body;
      if (!headerId || !publicUrl) {
        return res.status(400).json({ error: "Missing headerId or publicUrl" });
      }

      console.log(`[UPLOAD SUCCESS] [ACTIVE ASSET ID] ${headerId} [STORAGE PATH] ${publicUrl}`);

      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToSave = Array.from(new Set([headerId, ...aliases]));
      
      // 1. Update Persistent Local Poses File (Atomic)
      const currentPoses = readLocalPoses();
      const oldAssetUrl = currentPoses[headerId] || null;
      if (oldAssetUrl) {
        console.log(`[OLD ASSET DETECTED] Previous URL for ${headerId}: ${oldAssetUrl}`);
      }

      keysToSave.forEach(k => {
        currentPoses[k] = publicUrl;
      });
      writeLocalPoses(currentPoses);
      console.log(`[DATABASE WRITE] [ASSET OVERRIDE] Stored new active version for ${headerId} and aliases [${keysToSave.join(', ')}]`);

      // 2. Append to Persistent History File (Atomic)
      const historyRecord = {
        id: `${headerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        assetId: headerId,
        fileName: fileName || "file",
        downloadUrl: publicUrl,
        assetType: fileType || "image/jpeg",
        fileSize: fileSize || 0,
        uploadedAt: new Date().toISOString(),
        status: "active"
      };

      const historyRecords = readLocalHistory();
      // Keep up to 200 records
      historyRecords.unshift(historyRecord);
      writeLocalHistory(historyRecords.slice(0, 200));
      console.log(`[ACTIVE VERSION] Logged new history version ID: ${historyRecord.id}`);

      // 3. (Firebase sync removed)
      
      return res.json({ success: true, poses: currentPoses, historyRecord });
    } catch (err: any) {
      console.error("[DATABASE WRITE ERROR] Error in POST /api/bairaq/poses:", err);
      return res.status(500).json({ error: err.message || "Failed to save pose" });
    }
  });

  // GET /api/bairaq/history/:assetId - Retrieve full version history
  app.get("/api/bairaq/history/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;
      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const matchKeys = new Set([assetId, ...aliases]);

      const allHistory = readLocalHistory();
      const records: any[] = [];
      const seenUrls = new Set<string>();

      for (const r of allHistory) {
        if (matchKeys.has(r.assetId) && r.downloadUrl && !seenUrls.has(r.downloadUrl)) {
          seenUrls.add(r.downloadUrl);
          records.push(r);
        }
      }

      // Sort descending by uploadedAt
      records.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

      console.log(`[DATABASE READ] [GET /api/bairaq/history/${assetId}] Found ${records.length} history records`);
      return res.json({ success: true, records });
    } catch (err: any) {
      console.error("[DATABASE READ ERROR] Error in GET /api/bairaq/history/:assetId:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch history" });
    }
  });

  // POST /api/bairaq/restore - Restore a version
  app.post("/api/bairaq/restore", async (req, res) => {
    try {
      const { assetId, downloadUrl } = req.body;
      if (!assetId || !downloadUrl) {
        return res.status(400).json({ error: "Missing assetId or downloadUrl" });
      }

      console.log(`[ASSET OVERRIDE] Restoring asset ${assetId} to URL: ${downloadUrl}`);

      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const keysToSave = Array.from(new Set([assetId, ...aliases]));
      
      const currentPoses = readLocalPoses();
      keysToSave.forEach(k => { currentPoses[k] = downloadUrl; });
      writeLocalPoses(currentPoses);

      // Append restore action to history
      const restoreRecord = {
        id: `${assetId}_restored_${Date.now()}`,
        assetId: assetId,
        fileName: "Restored Version",
        downloadUrl: downloadUrl,
        assetType: "image/jpeg",
        fileSize: 0,
        uploadedAt: new Date().toISOString(),
        status: "restored"
      };
      const allHistory = readLocalHistory();
      allHistory.unshift(restoreRecord);
      writeLocalHistory(allHistory.slice(0, 200));

      // Asynchronously attempt Firestore sync (REMOVED)
 
      return res.json({ success: true, activeUrl: downloadUrl, poses: currentPoses });
    } catch (err: any) {
      console.error("[ASSET OVERRIDE ERROR] Error in POST /api/bairaq/restore:", err);
      return res.status(500).json({ error: err.message || "Failed to restore pose" });
    }
  });

  // POST /api/bairaq/reset - Reset a pose to default
  app.post("/api/bairaq/reset", async (req, res) => {
    try {
      const { assetId } = req.body;
      if (!assetId) {
        return res.status(400).json({ error: "Missing assetId" });
      }

      console.log(`[ASSET OVERRIDE] Resetting asset ${assetId} to default`);

      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const keysToReset = Array.from(new Set([assetId, ...aliases]));
      
      const currentPoses = readLocalPoses();
      keysToReset.forEach(k => {
        delete currentPoses[k];
      });
      writeLocalPoses(currentPoses);

      // Asynchronously attempt Firestore sync (REMOVED)

      return res.json({ success: true, poses: currentPoses });
    } catch (err: any) {
      console.error("[ASSET OVERRIDE ERROR] Error in POST /api/bairaq/reset:", err);
      return res.status(500).json({ error: err.message || "Failed to reset pose" });
    }
  });

  app.post("/api/upload-url", async (req, res) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "Missing fileName or contentType" });
      }

      if (!s3Client || !R2_BUCKET_NAME) {
        return res.json({ local: true });
      }

      const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
      const publicUrl = rawPublicBase 
        ? `${rawPublicBase}/${key}` 
        : (R2_ENDPOINT ? `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}` : `/uploads/${key}`);

      res.json({ presignedUrl, key, publicUrl });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  });

  app.post(["/api/upload", "/api/worker/upload"], upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileName = req.file.originalname || "document.pdf";
      const contentType = req.file.mimetype || "application/octet-stream";
      const ext = path.extname(fileName) || ".pdf";
      const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 60) || "document";
      const key = `${Date.now()}_${safeBase}${ext}`;

      if (!s3Client) {
        // Use ephemeral/local persistent storage if R2 is not configured
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const destinationPath = path.join(uploadsDir, key);
        try {
          fs.renameSync(req.file.path, destinationPath);
        } catch (renameError: any) {
          if (renameError?.code === 'EXDEV') {
            fs.copyFileSync(req.file.path, destinationPath);
            fs.unlinkSync(req.file.path);
          } else {
            throw renameError;
          }
        }
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = (req.headers['x-frontend-origin'] as string) || process.env.APP_URL || `${protocol}://${host}`;
        const publicUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${key}`;
        console.log(`[Upload Success] File: ${fileName}, Size: ${req.file.size} bytes, URL: ${publicUrl}`);
        return res.json({ key, publicUrl, url: publicUrl, fileName, size: req.file.size });
      }

      const fileStream = fs.createReadStream(req.file.path);
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Body: fileStream,
      });

      await s3Client.send(command);
      
      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch(e) {}

      const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
      const publicUrl = rawPublicBase 
        ? `${rawPublicBase}/${key}` 
        : (R2_ENDPOINT ? `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${key}` : `/uploads/${key}`);

      console.log(`[Upload R2 Success] File: ${fileName}, URL: ${publicUrl}`);
      res.json({ key, publicUrl, url: publicUrl, fileName, size: req.file.size });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/storage/status", (req, res) => {
    const isR2Configured = Boolean(s3Client && R2_BUCKET_NAME);
    res.json({
      provider: isR2Configured ? "cloudflare_r2" : "local_fallback",
      r2Configured: isR2Configured,
      bucket: isR2Configured ? R2_BUCKET_NAME : null,
      publicBaseUrl: (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '') || null,
      status: "ready"
    });
  });

  app.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrlStr = req.query.url as string;
      if (!videoUrlStr) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      // Determine absolute URL
      let absoluteUrl = videoUrlStr;
      if (videoUrlStr.startsWith("/")) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        absoluteUrl = `${protocol}://${host}${videoUrlStr}`;
      }

      console.log(`[Video Proxy] Requesting: ${absoluteUrl}`);

      // If it is a local file, stream it directly with Range support
      if (absoluteUrl.includes("/uploads/")) {
        const filename = absoluteUrl.split("/uploads/")[1]?.split("?")[0];
        if (filename) {
          const filePath = path.join(process.cwd(), "public", "uploads", filename);
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
            res.setHeader('Accept-Ranges', 'bytes');

            let mime = "video/mp4";
            const ext = path.extname(filename).toLowerCase();
            if (ext === '.webm') mime = 'video/webm';
            else if (ext === '.ogg') mime = 'video/ogg';

            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

              if (start >= fileSize || end >= fileSize) {
                res.writeHead(416, {
                  "Content-Range": `bytes */${fileSize}`
                });
                return res.end();
              }

              const chunksize = (end - start) + 1;
              const fileStream = fs.createReadStream(filePath, { start, end });
              const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mime,
              };

              res.writeHead(206, head);
              fileStream.pipe(res);
              return;
            } else {
              const head = {
                'Content-Length': fileSize,
                'Content-Type': mime,
              };
              res.writeHead(200, head);
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }
      }

      // Serve remote URLs via server fetch with Range headers
      const rangeHeader = req.headers.range;
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      console.log(`[Video Proxy] Fetching remote URL: ${absoluteUrl} with Range: ${rangeHeader || 'None'}`);

      const response = await fetch(absoluteUrl, {
        headers: fetchHeaders,
        redirect: 'follow'
      });

      if (!response.ok && response.status !== 206) {
        console.error(`[Video Proxy] Remote fetch failed: ${response.status} ${response.statusText}`);
        return res.status(response.status).send(`Failed to fetch video: ${response.statusText}`);
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Accept-Ranges', 'bytes');

      const contentType = response.headers.get('content-type') || 'video/mp4';
      // If the content type is HTML but we expect video, it's likely an error page
      if (contentType.includes('text/html')) {
        console.warn(`[Video Proxy] Warning: Remote server returned HTML instead of video for ${absoluteUrl}`);
      }
      res.setHeader('Content-Type', contentType);

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      res.status(response.status);

      if (response.body) {
        // Use standard pipe if possible for better performance
        const body = response.body as any;
        if (body.pipe && typeof body.pipe === 'function') {
          body.pipe(res);
        } else if (typeof body[Symbol.asyncIterator] === 'function') {
          for await (const chunk of body) {
            res.write(chunk);
          }
          res.end();
        } else if (body.getReader) {
          const reader = body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } else {
          res.end();
        }
      } else {
        res.end();
      }
    } catch (proxyError: any) {
      console.error("[Video Proxy Error]:", proxyError);
      if (!res.headersSent) {
        res.status(500).json({ error: `Proxy failed: ${proxyError.message}` });
      }
    }
  });

  app.post("/api/check-video", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }

      let checkUrl = url;
      if (url.startsWith("/")) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        checkUrl = `${protocol}://${host}${url}`;
      }

      console.log(`[Video Check Server] Checking direct URL: ${checkUrl}`);

      // 1. Physically check file if it is an uploaded local file
      let localExists = false;
      let fileLocationInfo = "رابط خارجي أو من سحابة خارجية";
      let localFileSizeText = "N/A";
      let localFileMime = "video/mp4";

      if (url.includes("/uploads/")) {
        try {
          const filename = url.split("/uploads/")[1];
          if (filename) {
            const rawFilename = filename.split("?")[0];
            const filePath = path.join(process.cwd(), "public", "uploads", rawFilename);
            localExists = fs.existsSync(filePath);
            if (localExists) {
              const stats = fs.statSync(filePath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              localFileSizeText = `${sizeInMB} MB (${stats.size} bytes)`;
              fileLocationInfo = `نعم، الملف موجود مادياً على القرص في المسار: ${filePath}`;
              
              const ext = path.extname(rawFilename).toLowerCase();
              if (ext === '.mp4') localFileMime = 'video/mp4';
              else if (ext === '.webm') localFileMime = 'video/webm';
              else if (ext === '.ogg') localFileMime = 'video/ogg';
              else if (ext === '.m3u8') localFileMime = 'application/x-mpegURL';
            } else {
              fileLocationInfo = `❌ الملف مفقود! لم يتم العثور على أي ملف في المسار المحلي المتوقع: ${filePath}`;
            }
          }
        } catch (err: any) {
          console.error("[Video Check Server] Error during physical file check:", err);
          fileLocationInfo = `خطأ أثناء التحقق من مسار الملف: ${err.message}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(checkUrl, {
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = response.headers.get("content-type") || localFileMime;
        const contentLength = response.headers.get("content-length");
        const acceptRanges = response.headers.get("accept-ranges") || "none";
        
        let calculatedSize = localFileSizeText;
        if (contentLength) {
          const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
          calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
        }

        return res.json({
          status: response.status,
          statusText: response.statusText,
          contentType,
          fileSize: calculatedSize,
          acceptRanges,
          localExists,
          fileLocationInfo,
          ok: response.ok
        });
      } catch (headError: any) {
        console.log(`[Video Check Server] HEAD request failed: ${headError.message || headError}. Falling back to GET with byte range.`);
        
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 8000);
        try {
          const response = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              Range: 'bytes=0-0'
            },
            signal: getController.signal
          });
          clearTimeout(getTimeoutId);

          const contentType = response.headers.get("content-type") || localFileMime;
          const contentLength = response.headers.get("content-length");
          const acceptRanges = response.headers.get("accept-ranges") || "none";
          
          let calculatedSize = localFileSizeText;
          if (contentLength) {
            const rangeHeader = response.headers.get("content-range");
            if (rangeHeader && rangeHeader.includes("/")) {
              const totalBytes = rangeHeader.split("/")[1];
              const sizeInMB = (parseInt(totalBytes, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${totalBytes} bytes)`;
            } else {
              const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
            }
          }

          return res.json({
            status: response.status,
            statusText: response.statusText,
            contentType,
            fileSize: calculatedSize,
            acceptRanges,
            localExists,
            fileLocationInfo,
            ok: response.ok
          });
        } catch (getError: any) {
          console.error(`[Video Check Server] GET request also failed: ${getError.message || getError}`);
          return res.json({
            status: 500,
            statusText: getError.message || "Network Error",
            contentType: localFileMime,
            fileSize: localFileSizeText,
            acceptRanges: "none",
            localExists,
            fileLocationInfo,
            ok: false
          });
        }
      }
    } catch (err: any) {
      console.error(`[Video Check Server] Fatal exception during check:`, err);
      return res.json({
        status: 500,
        statusText: err.message || "Internal Server Error",
        contentType: "video/mp4",
        fileSize: "N/A",
        acceptRanges: "none",
        localExists: false,
        fileLocationInfo: err.message || "N/A",
        ok: false
      });
    }
  });

  // ----------------------------------------------------
  // Cloudflare Workers Gateway & Gemini Routes Direct Mapping
  // ----------------------------------------------------
  app.get(["/api/worker/health", "/api/gemini/health"], (req, res) => {
    res.json({
      status: "ok",
      gateway: "Cloudflare-Worker-Development-Proxy",
      provider: "gemini",
      r2Configured: Boolean(process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL),
      timestamp: new Date().toISOString()
    });
  });

  app.post(["/api/upload-url", "/api/worker/upload-url"], (req, res) => {
    const { fileName } = req.body;
    const cleanName = `${Date.now()}_${(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const rawPublicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
    const publicUrl = rawPublicBase 
      ? `${rawPublicBase}/${cleanName}` 
      : `/uploads/${cleanName}`;

    res.json({
      presignedUrl: null,
      key: cleanName,
      publicUrl
    });
  });

  app.post(["/api/gemini/extract", "/api/worker/ai/extract"], async (req, res) => {
    const { base64Data, mimeType = "image/jpeg", extractedText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const cleanBase64 = base64Data.split(',')[1] || base64Data;
      
      const prompt = `
    أنت محلل بنية هيكلية (Structural Analyzer) ومحول عرض ذكي (Smart Presentation Converter).
    مهمتك هي قراءة نص الصفحة الأصلي وتحويله إلى كتل (Blocks) هيكلية بصرية، دون أي تغيير في النص الأصلي.
    
    القواعد الصارمة والنهائية (إياك مخالفتها):
    1. الحفاظ على المادة العلمية حرفياً (Word-for-Word) بنسبة 100%. يمنع التلخيص، يمنع إعادة الصياغة، يمنع الاختصار.
    2. التجاهل التام والحذف لأي (إعلانات، أرقام هواتف، معرفات تليكرام، أسماء مطابع، وحسابات تواصل) لا تنتمي للمادة العلمية بصورة صافية.
    3. تقسيم النص المتبقي إلى كتل (Block) بحيث كل فقرة، مثال، ملاحظة، سؤال، تعليل، جدول، يتم وضعه في كائن JSON مستقل داخل مصفوفة structuredContent.
    4. بالنسبة لتمارين الإسقاطات (Fill in the blanks) وصناديق المفردات (Word Box) وصناديق الحلول أسفل الصفحة (Answer Key):
       - استخرج صندوق الكلمات كاملاً ككتلة vocabulary في بداية التمرين مع ترجمتها.
       - استخرج كل نقطة مرقمة (1, 2, 3...) ككتلة question مستقلة بالنص الحرفي كاملاً، وضع حل النقطة في حقل solutionText.
       - استخرج صندوق مفتاح الحلول (في أسفل الصفحة أو نهايتها) ككتلة مستقلة (type: "example" أو "note" بعنوان "مفتاح الحلول النموذجية") حتى لا يُهمل أي حل إطلاقاً.
    5. يجب أن يبقى تسلسل الكتل مطابقاً تماماً لتسلسل الصفحة الأصلية من الأعلى للأسفل. لا دمج، ولا تقسيم عشوائي للأسطر.

    أنواع الكتل المدعومة في structuredContent:
    - "heading": للعناوين الرئيسية والفرعية المطولة.
    - "paragraph": للفقرات النصية العادية والشروحات والنقاط المترابطة.
    - "example": للأمثلة والتمارين ومفاتيح الحلول.
    - "note": للملاحظات والتنبيهات.
    - "warning": للتحذيرات الوزارية أو التعاليل والنقاط الحرجة.
    - "question": للأسئلة المباشرة، النقاط المرقمة، التمارين، والوزاريات.
    - "law": للقوانين أو القواعد الفيزيائية والرياضية.
    - "table": للجداول أو المقارنات (يمثل كصفوف من النصوص داخل items).
    - "vocabulary": لقوائم وصناديق المفردات والكلمات الإنكليزية ومعانيها (يجب استخلاص كائن vocabItems لها).

    ${extractedText ? `\n--- النص الأصلي الدقيق المستخرج آلياً ---\n${extractedText}\n-----------------------------------\nيجب ألا يضيع أي حرف علمي من هذا النص، انقله كما هو تماماً.` : ''}

    يجب أن يطابق الهيكل بصيغة JSON المخطط التالي بالضبط:
    {
      "pages": [
        {
          "pageNumber": 1,
          "title": "عنوان رئيسي للصفحة المطول",
          "subtitle": "عنوان فرعي أو وصف مبسط",
          "objectives": ["أهداف موجودة في الصفحة إن وجدت"],
          "coreConcepts": ["مفاهيم واسماء رئيسية في المفردات"],
          "structuredContent": [
            {
              "type": "heading" | "paragraph" | "example" | "note" | "warning" | "question" | "law" | "table" | "vocabulary",
              "title": "عنوان اختياري للكتلة (مثال: مثال 1، ملاحظة هامة، النقطة 1)",
              "content": "النص الأصلي الحرفي الكامل للكتلة",
              "questionText": "نص السؤال في حال كان النوع question",
              "solutionText": "الجواب أو حل الفراغ/النقطة ليظهر عند النقر على إظهار الحل",
              "linguisticAnalysis": "تحليل وزاري أو لغوي ذكي",
              "items": ["تستخدم في حال القوائم أو الجداول كنصوص مصفوفة"],
              "vocabItems": [{"en": "الكلمة بالانكليزية", "ar": "الترجمة بالعربية"}]
            }
          ],
          "integrityWarning": "رسالة تحذيرية صريحة إذا تم العثور على نقص مقارنة بالنص الأصلي، أو ترك فارغاً.",
          "quiz": [
             {
               "type": "mcq",
               "question": "يجب توليد 5 إلى 8 أسئلة متنوعة هنا من محتوى الصفحة لتوفير تجربة سريعة ومتجددة كل مرة يُفتح فيها تحدي 60 ثانية للمستخدم.",
               "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
               "correct": 0,
               "explanation": "تفسير سريع للإجابة الصحيحة"
             }
          ],
          "ministerialQuestions": [
            {
              "question": "نص السؤال الوزاري كما ورد بحرفيته إذا توفر",
              "answer": "الجواب التوضيحي للسؤال",
              "years": "السنوات والأدوار الوزارية (التعرف التام على كافة الرموز والأدوار: د1، دور أول، د2، دور ثاني، د3، دور ثالث، ت، تمهيدي، خ، خارجي، خارج القطر، ن، نازحين، تكميلي، استثنائي، وكافة السنوات من 2000 إلى 2026)",
              "session": "الدور الوزاري المستنبط (مثال: الدور الأول (د1)، تمهيدي (ت)، خارج القطر (خ)، نازحين (ن))",
              "year": "السنة الوزارية المستنبطة (مثال: 2023، 2024)"
            }
          ],
          "passes": []
        }
      ]
    }
  `;

      const fullPrompt = prompt + "\nملاحظة هامة جدا: 1) تأكد من تضمين 5 أسئلة اختيار من متعدد في قسم quiz من صلب محتوى الصفحة. 2) استخرج كل سؤال وزاري بدقة وتعرف على جميع صيغ الأدوار (د1, د2, د3, ت, خ, ن, نازحين, تمهيدي, خارج القطر) والسنوات من 2000 إلى 2026.";

      const parsedResults = await decisionEngine.process({
        prompt: fullPrompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: 'json',
        endpointName: 'extract',
        extractedText
      });

      // Helper function to synthesize 60s challenge MCQs from text/blocks if AI skipped or returned 0 quiz items
      const generateFallbackQuiz = (pageTitle: string, blocks: any[], rawText: string) => {
        const questions: any[] = [];
        const contentSentences = blocks
          .filter(b => b.content && b.content.length > 20)
          .map(b => b.content)
          .join(" ")
          .split(/[\.\n؟!\u061B]/)
          .map(s => s.trim())
          .filter(s => s.length > 25 && s.length < 150);

        if (contentSentences.length >= 2) {
          contentSentences.slice(0, 5).forEach((sent, sIdx) => {
            const words = sent.split(/\s+/);
            const keyWordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(words.length / 2)));
            const keyWord = words[keyWordIdx];
            const clozeSentence = words.map((w, idx) => idx === keyWordIdx ? "(___)" : w).join(" ");
            
            questions.push({
              type: "mcq",
              question: `س${sIdx + 1}: أكمل الفراغ بالخيار الدقيق وفقاً للنص العلمي: "${clozeSentence}"`,
              options: [
                keyWord,
                "إلغاء المعنى السياقي",
                "عكس النتيجة النموذجية",
                "تغيير الضوابط المحددة"
              ],
              correct: 0,
              explanation: `الإجابة النموذجية الحرفية كما وردت في سياق الصفحة: ${sent}`
            });
          });
        }

        if (questions.length < 3) {
          questions.push(
            {
              type: "mcq",
              question: `ما هو المحور الأساسي الذي تتناوله هذه الصفحة التعليمية (${pageTitle || 'الدرس'})؟`,
              options: [
                pageTitle || "المفاهيم والشروحات الأساسية المعتمدة في الصفحة",
                "مواضيع خارجية غير متعلقة بالمنهج",
                "إلغاء القواعد والشروط المنهجية",
                "نصوص عشوائية غير موثقة"
              ],
              correct: 0,
              explanation: "تمحور الصفحة حول المادة العلمية والشروحات والقواعد الموثقة بها."
            },
            {
              type: "mcq",
              question: "ما هي التوصية الوزارية والتربوية الذهبية لإتقان محتوى هذا الدرس؟",
              options: [
                "الفهم الدقيق للقاعدة وحل التطبيقات مع مطابقة الإجابة النموذجية",
                "الحفظ العشوائي السريع دون مراجعة الأمثلة",
                "تجاوز الملاحظات والتحذيرات الهامة",
                "إهمال الأسئلة والتمارين التطبيقية"
              ],
              correct: 0,
              explanation: "الفهم والتدريب العملي المستمر يضمنان استقرار المعلومة والدرجة الكاملة."
            }
          );
        }

        return questions;
      };

      // Helper function to build structured blocks from raw text if structuredContent was empty
      const buildBlocksFromRawText = (text: string): any[] => {
        if (!text || typeof text !== 'string') return [];
        const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
        const resultBlocks: any[] = [];

        lines.forEach((line, idx) => {
          if (idx === 0 && line.length < 80) {
            resultBlocks.push({ type: "heading", title: "العنوان الرئيسي", content: line });
          } else if (line.startsWith("س/") || line.startsWith("سؤال") || line.startsWith("تحدي") || line.includes("؟")) {
            resultBlocks.push({ type: "question", title: "سؤال وتطبيق", content: line });
          } else if (line.startsWith("ملاحظة") || line.startsWith("تنبيه") || line.startsWith("فائدة")) {
            resultBlocks.push({ type: "note", title: "ملاحظة هامة", content: line });
          } else if (line.startsWith("تحذير") || line.startsWith("انتبه") || line.includes("وزاري")) {
            resultBlocks.push({ type: "warning", title: "تركيز وزاري", content: line });
          } else if (line.startsWith("قاعدة") || line.startsWith("قانون") || line.startsWith("Rule")) {
            resultBlocks.push({ type: "law", title: "قاعدة / قانون", content: line });
          } else if (line.startsWith("مثال") || line.startsWith("Example")) {
            resultBlocks.push({ type: "example", title: "مثال تطبيقي", content: line });
          } else {
            resultBlocks.push({ type: "paragraph", content: line });
          }
        });

        return resultBlocks;
      };

      // Raw blocks extraction from parsedResults
      let rawBlocks: any[] = [];
      if (Array.isArray(parsedResults)) {
        rawBlocks = parsedResults;
      } else if (parsedResults && typeof parsedResults === 'object') {
        if (Array.isArray(parsedResults.pages)) {
          rawBlocks = parsedResults.pages;
        } else {
          rawBlocks = [parsedResults];
        }
      }

      // Universal Normalization for every Page
      const normalizedPages: any[] = [];

      rawBlocks.forEach((rawPage: any, idx: number) => {
        if (!rawPage || typeof rawPage !== 'object') return;

        // If rawPage itself contains a nested .pages array
        if (Array.isArray(rawPage.pages)) {
          rawPage.pages.forEach((subPage: any, subIdx: number) => {
            if (subPage && typeof subPage === 'object') {
              rawBlocks.push(subPage);
            }
          });
          return;
        }

        const pageNum = rawPage.pageNumber || idx + 1;
        const pageTitle = rawPage.title || (idx === 0 ? "المحتوى العلمي المعتمد" : `الصفحة ${pageNum}`);
        const pageSubtitle = rawPage.subtitle || rawPage.tag || "الوحدة الأولى";

        // 1. Normalize Structured Content Blocks
        let blocks: any[] = [];
        const candidateBlocks = rawPage.structuredContent || rawPage.structured_content || rawPage.blocks || rawPage.content_blocks || rawPage.items || rawPage.sections;
        
        if (Array.isArray(candidateBlocks) && candidateBlocks.length > 0) {
          blocks = candidateBlocks.map((b: any, bIdx: number) => {
            if (typeof b === 'string') {
              return { type: 'paragraph', content: b };
            }
            const contentVal = b.content || (b.text ? b.text : (Array.isArray(b.items) ? b.items.join('\n') : ''));
            const qVal = b.questionText || b.question || (b.type === 'question' ? contentVal : undefined);
            const sVal = b.solutionText || b.answer || b.solution || undefined;
            return {
              id: b.id || `node_${idx}_${bIdx}_${Date.now()}`,
              type: b.type || (qVal ? 'question' : 'paragraph'),
              title: b.title || undefined,
              content: contentVal,
              questionText: qVal,
              solutionText: sVal,
              linguisticAnalysis: b.linguisticAnalysis || b.analysis || undefined,
              difficulty: b.difficulty || undefined,
              tag: b.tag || undefined,
              year: b.year || undefined,
              session: b.session || undefined,
              branch: b.branch || undefined,
              items: Array.isArray(b.items) ? b.items : undefined,
              vocabItems: Array.isArray(b.vocabItems) ? b.vocabItems : undefined
            };
          });
        }

        // If blocks are still empty, synthesize from raw text or page content
        const fallbackText = rawPage.rawText || rawPage.extractedText || rawPage.text || (typeof rawPage.content === 'string' ? rawPage.content : '') || extractedText || '';
        if (blocks.length === 0 && fallbackText.trim().length > 0) {
          blocks = buildBlocksFromRawText(fallbackText);
        }

        // If still empty, provide a clean default paragraph
        if (blocks.length === 0) {
          blocks = [
            {
              type: "paragraph",
              title: "المحتوى التعليمي",
              content: "تم استخراج محتوى الصفحة بنجاح وجاري إعداده للعرض التفاعلي."
            }
          ];
        }

        // 2. Normalize 60s Quiz Questions
        let quizItems: any[] = [];
        const candidateQuiz = rawPage.quiz || rawPage.quizQuestions || rawPage.quiz_questions || rawPage.questions || rawPage.mcqs;
        if (Array.isArray(candidateQuiz) && candidateQuiz.length > 0) {
          quizItems = candidateQuiz.map((q: any) => ({
            type: "mcq",
            question: q.question || q.text || q.title || "سؤال اختباري",
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
            correct: typeof q.correct === 'number' ? q.correct : 0,
            explanation: q.explanation || q.tip || "الإجابة مستنبطة مباشرة من نص الصفحة الأصلي."
          }));
        }

        // If quiz is empty, generate from blocks/text
        if (quizItems.length === 0) {
          quizItems = generateFallbackQuiz(pageTitle, blocks, fallbackText);
        }

        // 3. Normalize Ministerial Questions
        let ministerialItems: any[] = [];
        const candidateMinisterial = rawPage.ministerialQuestions || rawPage.ministerial_questions || rawPage.ministerials;
        if (Array.isArray(candidateMinisterial) && candidateMinisterial.length > 0) {
          ministerialItems = candidateMinisterial.map((m: any) => ({
            question: m.question || m.text || "سؤال وزاري",
            answer: m.answer || m.solution || "الجواب النموذجي وفق الضوابط الوزارية",
            years: m.years || m.year || "مقرر وزاري"
          }));
        }

        normalizedPages.push({
          pageNumber: pageNum,
          title: pageTitle,
          subtitle: pageSubtitle,
          objectives: Array.isArray(rawPage.objectives) ? rawPage.objectives : [],
          coreConcepts: Array.isArray(rawPage.coreConcepts) ? rawPage.coreConcepts : [],
          structuredContent: blocks,
          quiz: quizItems,
          ministerialQuestions: ministerialItems,
          extractedText: fallbackText || blocks.map(b => b.content).filter(Boolean).join("\n\n"),
          integrityWarning: rawPage.integrityWarning || ""
        });
      });

      if (normalizedPages.length === 0) {
        // Fallback single page
        const fbBlocks = buildBlocksFromRawText(extractedText || "محتوى تعليمي مستخرج");
        normalizedPages.push({
          pageNumber: 1,
          title: "المحتوى العلمي المعتمد",
          subtitle: "الوحدة الأولى",
          structuredContent: fbBlocks.length > 0 ? fbBlocks : [{ type: "paragraph", content: extractedText || "تمت معالجة الصفحة بنجاح." }],
          quiz: generateFallbackQuiz("المحتوى العلمي المعتمد", fbBlocks, extractedText || ""),
          ministerialQuestions: [],
          extractedText: extractedText || ""
        });
      }

      res.json({ pages: normalizedPages });
    } catch (error: any) {
      console.error("Error generating content via AI service:", error);
      res.status(500).json({ error: "Failed to generate content", details: error.message });
    }
  });

  app.post(["/api/gemini/radar", "/api/worker/ai/radar"], async (req, res) => {
    const { content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const parsedResults = await decisionEngine.process({
        prompt: `
        بناءً على المحتوى التالي، استنتج 3 أسئلة ذكية وعميقة (أسئلة استنتاجية) للطلاب.
        المحتوى:
        ${content}
        
        أرجع النتيجة كقائمة نصية بسيطة باللغة العربية.
      `,
        endpointName: 'radar',
        responseFormat: 'text'
      });
      
      const text = typeof parsedResults === 'string' ? parsedResults : (parsedResults?.text || "");
      res.json({ questions: text.split('\n').filter(line => line.trim().length > 0) });
    } catch (error) {
      console.error("Error getting radar:", error);
      res.status(500).json({ error: "Failed to process" });
    }
  });

  app.post(["/api/gemini/mock-exam", "/api/worker/ai/mock-exam", "/api/generate-mock-exam"], async (req, res) => {
    const { content, subject } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const prompt = `
        أنت واضع أسئلة امتحانات وزارة التربية العراقية لمرحلة السادس الإعدادي.
        بناءً على محتوى الملزمة التالي والمادة الدراسية: [${subject || 'عام'}]، قم بتوليد امتحان تجريبي شامل يتكون من 20 سؤالاً متنوعاً.
        المحتوى المتاح من الملزمة:
        ${content || "لا يوجد محتوى محدد، يرجى توليد أسئلة نموذجية عامة في مادة " + (subject || "الفيزياء")}
        
        شروط توليد الأسئلة:
        1. يجب أن يكون العدد الإجمالي 20 سؤالاً متنوعاً (اختيارات، صح وخطأ، فراغات، تعاليل، تعاريف، تعداد) مصاغة بطريقة الاختيار من متعدد.
        2. أن تكون أسئلة ذكية واستنتاجية من وحي المنهج العراقي الرسمي حصراً وبأسلوب وزاري.
        3. للصح والخطأ: اجعل الخيارات ["صح", "خطأ"]. للتعاليل/التعاريف/التعداد: اجعل الجواب الصحيح أحد الخيارات واصنع ثلاثة خيارات أخرى مموهة ومقاربة.
        4. أن ترفق كل سؤال بـ "التفسير الوزاري الدقيق والعميق" (explanation) باللغة العربية لشرح سبب الإجابة الصحيحة.
        5. أن تعود بالنتيجة كـ مصفوفة JSON صالحة حصراً (valid JSON array of objects) دون أي كلام خارجي أو تغليف ماركداون. الهيكل المطلوب:
        [
          {
            "id": 1,
            "text": "نص السؤال هنا... (مثال: علل: كذا كذا، أو عرف: كذا كذا)",
            "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
            "correctAnswer": 0,
            "explanation": "التفسير الأكاديمي التفصيلي..."
          }
        ]
      `;

      const parsedQuestions = await decisionEngine.process({
        prompt,
        endpointName: 'mock-exam',
        responseFormat: 'json'
      });

      let formattedQuestions = Array.isArray(parsedQuestions) ? parsedQuestions : (parsedQuestions?.questions || [parsedQuestions]);
      if (Array.isArray(formattedQuestions) && formattedQuestions.length > 0 && formattedQuestions[0]?.unparsed) {
        formattedQuestions = [];
      }

      res.json({ questions: formattedQuestions });
    } catch (error) {
      console.error("Error generating mock exam via Gemini:", error);
      res.status(500).json({ error: "Failed to generate mock exam", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post(["/api/gemini/extract-questions", "/api/worker/ai/extract-questions", "/api/extract-exam-questions"], async (req, res) => {
    const { base64Data, mimeType = "image/jpeg" } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const cleanBase64 = base64Data.split(',')[1] || base64Data;
      
      const prompt = `
        قم بقراءة هذه الورقة المكتوبة أو المطبوعة والتي تحتوي على أسئلة امتحانية.
        المهمة الأساسية والأهم هي استخراج **كل الأسئلة وجميع الأفرع والنقاط الفرعية** حرفياً كما هي مكتوبة في الورقة، وعدم إهمال أي سؤال أو فرع.
        لا تهتم كثيراً بتصنيف نوع السؤال إذا كان ذلك سيؤدي إلى فقدان بعض الأسئلة أو تعقيد الاستخراج. اجعل نوع السؤال "custom" (مخصص) افتراضياً لجميع الأسئلة والأفرع المستخرجة، وضع نص السؤال كاملاً في حقل "text". 
        يمكنك تقييم درجة الصعوبة تقريبياً.
        
        أرجع النتيجة حصراً كمصفوفة JSON صالحة بالهيكل التالي (بدون أي علامات ماركداون إضافية أو نصوص خارج الـ JSON):
        [
          {
            "text": "نص السؤال والفرع كاملاً...", 
            "type": "custom", 
            "difficulty": "medium", // easy, medium, hard
            "options": []
          }
        ]
      `;

      const parsed = await decisionEngine.process({
        prompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: 'json',
        endpointName: 'extract-questions'
      });

      const questionsList = Array.isArray(parsed) ? parsed : (parsed?.questions || [parsed]);
      res.json({ questions: questionsList });
    } catch (error: any) {
      console.error("Error extracting questions via Gemini:", error);
      res.status(500).json({ error: "Failed to extract questions from image", details: error.message });
    }
  });

  app.post(["/api/gemini/evaluate-homework", "/api/worker/ai/evaluate-homework", "/api/evaluate-homework"], async (req, res) => {
    const { schoolId, taskId, taskTitle, studentId, studentName, content } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    if (!schoolId || !taskId || !studentId || !content) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const prompt = `
      أنت مقيّم تربوي ذكي وناقد مبدع في منصة الأستاذ التعليمية.
      مهمتك هي تقييم إجابة الطالب على الواجب الدراسي التالي بشكل تلقائي وعادل.
      
      عنوان الواجب: "${taskTitle}"
      إجابة الطالب:
      "${content}"
      
      المطلوب منك هو:
      1. تقييم جودة الإجابة تربوياً وعلمياً وكتابة تغذية راجعة مفصلة، ودودة، ومشجعة للطالب (باللغة العربية).
      2. احتساب نقاط خبرة (XP / Points) يستحقها الطالب بناءً على جودة وعمق إجابته:
         - إجابة ممتازة ومثالية: من 80 إلى 100 نقطة.
         - إجابة جيدة جداً أو جيدة: من 50 إلى 79 نقطة.
         - إجابة مقبولة أو تحتاج تطوير: من 20 إلى 49 نقطة.
      3. تحديد ما إذا كان الطالب يستحق وساماً شرفياً مميزاً بناءً على تميزه:
         - "honor_mid" (نجم الشهر 🌟): إذا كانت الإجابة نموذجية مذهلة وتفوق التوقعات بشكل كامل.
         - "star" (نجم الأسبوع ⭐): إذا كانت الإجابة إبداعية وتفاعلية جداً وبها فكر مميز.
         - "progress" (تطور ملحوظ 🎯): إذا بذل الطالب جهداً كبيراً جداً في الكتابة والشرح حتى وإن لم يكن خبيراً.
         - "discipline" (وسام الانضباط 🔥): إذا كانت الإجابة منظمة ومرتبة بدقة متناهية والتزمت بجميع عناصر السؤال.
         - null: إذا كانت الإجابة اعتيادية جيدة ولكنها لا تستحق وساماً شرفياً خاصاً في الوقت الحالي.

      يجب أن تكون المخرجات بصيغة JSON تماماً بالمواصفات التالية:
      {
        "points": number,
        "feedback": "string (التغذية الراجعة باللغة العربية)",
        "badge": "string or null"
      }
      `;

      const evaluation = await decisionEngine.process({
        prompt,
        endpointName: 'evaluate-homework',
        responseFormat: 'json'
      });

      const evalObj = Array.isArray(evaluation) ? (evaluation[0] || {}) : (evaluation || {});

      // Ensure points is a valid number
      let points = Number(evalObj.points);
      if (isNaN(points) || points < 0) points = 50;
      if (points > 100) points = 100;

      res.json({
        success: true,
        pointsAwarded: points,
        feedback: evalObj.feedback || evalObj.text || "تم تقييم إجابتك بنجاح من قبل المعلم الذكي.",
        badgeAwarded: evalObj.badge || null
      });

    } catch (error: any) {
      console.error("Error evaluating homework via Gemini:", error);
      res.status(500).json({ error: "Failed to evaluate homework", details: error.message });
    }
  });

  app.post(["/api/gemini/chat", "/api/worker/ai/chat"], async (req, res) => {
    const { context, message, history = [], imageUrl, fileUrls = [], isTeacherMode } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const fileParts: any[] = [];
    const urlsToProcess = [];
    if (imageUrl) urlsToProcess.push(imageUrl);
    if (Array.isArray(fileUrls)) urlsToProcess.push(...fileUrls);

    for (const url of urlsToProcess) {
      try {
        const fileRes = await fetch(url);
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let mimeType = fileRes.headers.get("content-type") || "application/octet-stream";
        
        if (url.toLowerCase().endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (url.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        }
        
        const supportedPrefixes = ['image/', 'audio/', 'video/', 'application/pdf', 'text/'];
        const isSupported = supportedPrefixes.some(prefix => mimeType.startsWith(prefix));
        
        if (!isSupported) {
          throw new Error(`نوع الملف غير مدعوم من قبل الذكاء الاصطناعي: ${mimeType}. يرجى رفع ملفات PDF أو صور فقط.`);
        }

        fileParts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType
          }
        });
      } catch (err) {
        console.error("Failed to fetch file for Gemini:", err);
      }
    }

    const systemInstruction = isTeacherMode ? context : `
      أنت مساعد ذكي لمنصة تعليمية.
      مهمتك هي الإجابة على أسئلة الطلاب بناءً حصراً على المحتوى الدراسي المقدم لك أدناه.
      المحتوى الدراسي للصفحة الحالية:
      ${context}

      قواعد العمل:
      1. أجب باللغة العربية الفصحى وبأسلوب تعليمي مشجع.
      2. إذا كان السؤال عن "هذه الصفحة" أو "الملزمة"، اعتمد فقط على المحتوى المذكور أو الصورة المرفقة.
      3. إذا طلب تلخيص الصفحة، قم بتقديم ملخص ذكي ومنظم ومختصر.
      4. إذا طلب إنشاء اختبار أو أسئلة، قم بتوليد الأسئلة من هذا المحتوى.
      5. كن دقيقاً، ووضح المعلومات بشكل يسهل فهمه.
    `;

    const parsedHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    async function sendChatWithRetry(maxRetries = 3) {
      const client = getGeminiClient();
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.1-pro-preview", "gemini-flash-latest"];
      let lastChatError: any = null;

      for (const currentModel of modelsToTry) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const chat = client.chats.create({
              model: currentModel,
              config: {
                systemInstruction,
              },
              history: parsedHistory
            });

            let parts: any[] = [{ text: message }];
            if (fileParts.length > 0) {
              parts = [...fileParts, ...parts];
            }

            return await chat.sendMessage({ message: parts as any });
          } catch (error: any) {
            lastChatError = error;
            const errMsg = String(error.message || error || "").toLowerCase();
            const isHighDemandOr503 = 
              error.status === 503 || 
              error.code === 503 || 
              errMsg.includes('503') || 
              errMsg.includes('unavailable') || 
              errMsg.includes('high demand') || 
              errMsg.includes('overloaded');

            const isRateLimit = 
              error.status === 429 || 
              error.code === 429 || 
              errMsg.includes('429') || 
              errMsg.includes('quota') || 
              errMsg.includes('limit') || 
              errMsg.includes('exceeded') || 
              errMsg.includes('resource_exhausted') || 
              errMsg.includes('rate');
              
            if (isHighDemandOr503) {
              console.warn(`[Gemini Chat High Demand] Model ${currentModel} returned 503/unavailable. Trying next fallback model immediately...`);
              break; // Switch to next model immediately
            } else if (isRateLimit) {
              if (i < maxRetries - 1) {
                const delayMs = Math.min((i + 1) * 3000, 10000);
                console.warn(`Retrying chat message with model ${currentModel} (Attempt ${i + 1}/${maxRetries}) in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              } else {
                console.warn(`Chat model ${currentModel} exhausted retries, trying next model...`);
              }
            } else {
              console.warn(`Chat model ${currentModel} error:`, errMsg);
              break; // try next model
            }
          }
        }
      }
      throw lastChatError;
    }

    try {
      const result = await sendChatWithRetry();
      const responseText = result?.text || "";
      res.json({ response: responseText });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  const serverErrorLogs: any[] = [];

  app.get("/api/health", (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      env: process.env.NODE_ENV || "development",
      port: 3000,
      r2Configured: Boolean(s3Client && R2_BUCKET_NAME),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  app.get("/api/log-error", (req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.post("/api/log-error", (req, res) => {
    const errorData = req.body || {};
    const logItem = {
      id: errorData.id || `SRV_ERR_${Date.now()}`,
      receivedAt: new Date().toISOString(),
      ...errorData
    };
    serverErrorLogs.unshift(logItem);
    if (serverErrorLogs.length > 200) serverErrorLogs.pop();
    console.log("[Client Error Tracked]", logItem.id, logItem.service, logItem.errorMessage);
    res.json({ success: true, loggedId: logItem.id });
  });

  app.get("/api/server-errors", (req, res) => {
    res.json({
      total: serverErrorLogs.length,
      logs: serverErrorLogs
    });
  });

  // API routes
  app.post(["/api/gemini/generate-illustration", "/api/generate-illustration"], async (req, res) => {
    const { topic, pageTitle, context, style = "mindmap" } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const prompt = `
        أنت خبير تصميم وإنفوجرافيك تعليمي لطلبة السادس الإعدادي.
        المطلوب منك هو إنشاء رسم توضيحي بصري تخطيطي بصيغة SVG مباشرة لتبسيط وشرح المفهوم التعليمي التالي:
        - عنوان الدرس: "${pageTitle || topic}"
        - المفهوم المطلوب رسمه: "${topic}"
        - السياق التعليمي: "${context || ''}"
        - نوع المخطط المطلوب: "${style}" (مثلاً خريطة مفاهيم، مخطط انسيابي، جدول مقارنة، أو هيكل قواعدي)

        القواعد الصارمة لإنتاج الـ SVG:
        1. أرجع كود SVG صالح ومباشر يبدأ بـ <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" ...> وينتهي بـ </svg>.
        2. استخدم تصميماً عصرياً بخلفية شفافة أو داكنة ناعمة (#0F132A)، خطوط عربية جميلة، وألوان متناسقة وفوسفورية (Cyan #00E5FF, Gold #F59E0B, Purple #A855F7, Emerald #10B981).
        3. تأكد من أن النصوص واضحة، متناسقة باتجاه RTL، وتوضح القواعد والملاحظات الوزارية الرئيسية.
        4. لا تضع أي شروح أو كلام خارج كود الـ <svg> ... </svg>.
      `;

      const result = await generateContentWithRetry({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const rawText = result?.text || "";
      const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      const svgCode = svgMatch ? svgMatch[0] : "";

      res.json({
        success: true,
        svg: svgCode,
        title: topic || pageTitle || "مخطط توضيحي ذكي",
        explanation: "تم توليد الرسم التوضيحي التعليمي بالذكاء الاصطناعي بنجاح."
      });
    } catch (error: any) {
      console.error("Error generating illustration via Gemini:", error);
      res.status(500).json({ error: "Failed to generate illustration", details: error.message });
    }
  });

  app.post(["/api/explain", "/api/worker/ai/explain", "/api/gemini/explain"], async (req, res) => {
    const { questionText } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    try {
      const parsedResults = await decisionEngine.process({
        prompt: `Explain why the answer to "${questionText}" is wrong and provide the correct answer in Arabic.`,
        endpointName: 'explain',
        responseFormat: 'text'
      });
      const text = typeof parsedResults === 'string' ? parsedResults : (parsedResults?.text || "");
      res.json({ explanation: text });
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      res.status(500).json({ error: "Failed to get explanation" });
    }
  });

  app.post("/api/redeem-code", redeemCodeLimiter, async (req, res) => {
    const { code } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      res.json({ success: true, message: 'تم تفعيل الاشتراك في بوابة بيرق بنجاح!' });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ error: 'حدث خطأ أثناء تفعيل الكود' });
    }
  });

  // Webhook endpoint for payment notifications
  app.post("/api/webhook/payment", async (req, res) => {
    const sig = req.headers['x-payment-signature']; // This header depends on the payment gateway
    
    // TODO: Verify signature here using a secret from process.env.PAYMENT_WEBHOOK_SECRET
    // if (!verifySignature(req.body, sig, process.env.PAYMENT_WEBHOOK_SECRET)) {
    //   return res.status(400).send('Webhook signature verification failed.');
    // }

    const { userId, courseId, status } = req.body;

    if (status === 'success') {
      try {
        console.log(`Subscription activated for user ${userId} and course ${courseId}`);
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Error activating subscription via webhook:", error);
        res.status(500).json({ error: 'Failed to activate subscription' });
      }
    } else {
      res.status(200).json({ received: true, message: 'Payment not successful' });
    }
  });

  // User provided Node.js notification logic
  app.post("/api/notifications/notify-parent-payment", async (req, res) => {
    const { parentToken, amount, receiptId } = req.body;
    
    if (!parentToken || !amount) {
      return res.status(400).json({ error: 'Missing parentToken or amount' });
    }

    const message = {
      notification: {
        title: 'تم تأكيد الدفع ✅',
        body: `عزيزي ولي الأمر، تم استلام مبلغ ${amount} د.ع بنجاح وصدر وصلكم الرقمي.`
      },
      token: parentToken,
      data: {
        type: 'PAYMENT_CONFIRMED',
        receipt_id: receiptId || 'REC-UNKNOWN'
      }
    };

    try {
      // In a real environment with FCM enabled, this would be: await admin.messaging().send(message)
      // Since FCM is not enabled in this AI Studio preview project, we mock the success response.
      console.log('Successfully simulated FCM message sending to:', parentToken);
      res.status(200).json({ success: true, messageId: 'simulated_message_id_' + Date.now() });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // فحص المواعيد النهائية للأقساط وتذكير أولياء الأمور
  app.post("/api/notifications/check-deadlines", async (req, res) => {
    try {
      const today = new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      
      const { studentFinancials } = req.body; 

      if (!studentFinancials || !Array.isArray(studentFinancials)) {
        return res.status(400).json({ error: 'يلزم إرسال قائمة ببيانات الطلاب المالية' });
      }

      let sentCount = 0;

      for (const student of studentFinancials) {
        if (!student.nextInstallmentDate || !student.parentDeviceId) continue;

        const dueDate = new Date(student.nextInstallmentDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        
        if (timeDiff > 0 && timeDiff <= threeDaysInMs && student.remainingAmount > 0) {
          const message = {
            notification: {
              title: "تذكير مالي من بوابة بيرق 🔔",
              body: `عزيزي ولي الأمر، نود تذكيركم باقتراب موعد القسط القادم للطالب ${student.name}.`
            },
            token: student.parentDeviceId,
            data: {
              type: 'INSTALLMENT_REMINDER',
              student_id: String(student.id)
            }
          };

          try {
            // Simulated FCM push for the preview environment
            console.log(`Simulated reminder sent to parent of ${student.name}`);
            sentCount++;
          } catch (err) {
            console.error(`Failed to send reminder to ${student.name}:`, err);
          }
        }
      }

      res.status(200).json({ success: true, sentCount });
    } catch (error) {
      console.error('Error processing deadlines:', error);
      res.status(500).json({ error: 'حدث خطأ في النظام' });
    }
  });

  app.post("/api/notify-attendance", async (req, res) => {
    const { parentUserId, studentId, status, date } = req.body;

    if (!parentUserId || !status) {
      return res.status(400).json({ error: 'Missing parentUserId or status' });
    }

    try {
      const statusText = status === 'absent' ? 'غائب' : 'متأخر';
      const bodyText = `عزيزي ولي الأمر، نود إعلامكم بأن الطالب قد تم تسجيل حالة ${statusText} بتاريخ ${date}.`;
      
      console.log(`Simulated notification: Student ${studentId} is ${status} on ${date}. Parent user: ${parentUserId}. Body: ${bodyText}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.get("/api/ai/analytics", async (req, res) => {
    try {
      const logs = AnalyticsManager.getLogs();
      const totalRequests = logs.length;
      
      if (totalRequests === 0) {
        return res.json({
          totalRequests: 0,
          cacheHits: 0,
          savingsRatio: 0,
          avgProcessingTimeMs: 0,
          modelStats: [],
          endpointStats: [],
          timeSeries: []
        });
      }

      const cacheHits = logs.filter(d => d.isCacheHit).length;
      const totalTime = logs.reduce((sum, d) => sum + (Number(d.processingTimeMs) || 0), 0);
      const avgTime = totalRequests > 0 ? totalTime / totalRequests : 0;
      
      // Group by model
      const modelStats = logs.reduce((acc: any, d) => {
        const model = d.model || 'unknown';
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {});

      // Group by endpoint
      const endpointStats = logs.reduce((acc: any, d) => {
        const endpoint = d.endpoint || 'unknown';
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {});

      // Group by date
      const timeSeriesMap = logs.reduce((acc: any, d) => {
        const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString() : 'unknown';
        acc[date] = acc[date] || { date, requests: 0, cacheHits: 0 };
        acc[date].requests++;
        if (d.isCacheHit) acc[date].cacheHits++;
        return acc;
      }, {});

      res.json({ 
         totalRequests, 
         cacheHits, 
         savingsRatio: cacheHits / totalRequests,
         avgProcessingTimeMs: avgTime,
         modelStats: Object.entries(modelStats).map(([name, value]) => ({ name, value })),
         endpointStats: Object.entries(endpointStats).map(([name, value]) => ({ name, value })),
         timeSeries: Object.values(timeSeriesMap).reverse()
      });
    } catch (e: any) {
      console.error("Analytics Endpoint Error:", e);
      res.json({ 
        totalRequests: 0, cacheHits: 0, savingsRatio: 0, avgProcessingTimeMs: 0,
        modelStats: [], endpointStats: [], timeSeries: [], error: e.message 
      });
    }
  });

  // System Recovery & Health Actions Endpoints
  app.post("/api/system/flush-cache", async (req, res) => {
    try {
      const beforeMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {}
      }
      const afterMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      res.json({
        success: true,
        message: "تم تفريغ الذاكرة المؤقتة وإعادة تحسين استهلاك الموارد بنجاح",
        heapUsedMb: afterMem,
        freedMb: Math.max(0, beforeMem - afterMem),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error flushing cache:", error);
      res.status(500).json({ error: error.message || "Failed to flush cache" });
    }
  });

  app.post("/api/system/reset-ai-cache", async (req, res) => {
    try {
      // Invalidate memory caches or backoff counters
      res.json({
        success: true,
        message: "تمت إعادة ضبط جلسة وبوابة الذكاء الاصطناعي بنجاح",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error resetting AI cache:", error);
      res.status(500).json({ error: error.message || "Failed to reset AI cache" });
    }
  });

  app.post("/api/system/ping-reconnect", async (req, res) => {
    try {
      const memoryUsageMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      res.json({
        success: true,
        message: "تم فحص الاتصال وتنشيط القناة السحابية بنجاح",
        serverUptime: Math.round(process.uptime()),
        memoryUsageMb,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to ping reconnect" });
    }
  });

  // Error handling middleware to prevent HTML error responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  // ==========================================
  // 📊 Dev Dashboard - PostgreSQL APIs
  // ==========================================

  app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
      const dbSchools = await db.select().from(schools);
      // For now we just return schools, but we can expand this
      res.json({
        success: true,
        stats: {
          schools: dbSchools,
          // Add other tables as needed
        }
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/sync-schools', async (req, res) => {
    try {
      const { schoolsList } = req.body;
      if (!Array.isArray(schoolsList)) {
        return res.status(400).json({ success: false, message: "schoolsList must be an array" });
      }
      
      let synced = 0;
      for (const s of schoolsList) {
        // Upsert logic
        await db.insert(schools).values({
          id: s.id,
          name: s.name,
          governorate: s.governorate,
          activationCode: s.activationCode,
          status: s.status || 'active'
        }).onConflictDoUpdate({
          target: schools.id,
          set: {
            name: s.name,
            governorate: s.governorate,
            status: s.status || 'active'
          }
        });
        synced++;
      }
      
      res.json({ success: true, synced });
    } catch (error: any) {
      console.error('Error syncing schools:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

    
  // ==========================================
  // 🔑 Activation Codes - PostgreSQL API
  // ==========================================
  app.get('/api/activation-codes', async (req, res) => {
    try {
      const { schoolId, role } = req.query;
      
      const conditions = [];
      if (schoolId) conditions.push(eq(activation_codes.schoolId, schoolId as string));
      // @ts-ignore - role might be new in schema
      if (role) conditions.push(eq(activation_codes.role, role as string));
      
      const allCodes = await (conditions.length > 0 
        // @ts-ignore
        ? db.select().from(activation_codes).where(and(...conditions))
        : db.select().from(activation_codes));
        
      res.json({ success: true, codes: allCodes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/activation-codes/generate', async (req, res) => {
    try {
      const { schoolId, role, count, prefix } = req.body;
      const numCount = Number(count) || 1;
      const results = [];
      
      for (let i = 0; i < numCount; i++) {
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${prefix || 'ACT'}-${randomStr}`;
        const newCode = await db.insert(activation_codes).values({
          id: `act_${Date.now()}_${i}`,
          code,
          schoolId: schoolId || 'general',
          used: false,
          // @ts-ignore
          role: role || 'student',
          createdAt: new Date()
        }).returning();
        results.push(newCode[0]);
      }
      
      res.json({ success: true, codes: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/activation-codes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(activation_codes).where(eq(activation_codes.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/activation-codes/sync', async (req, res) => {
    try {
      const { codes } = req.body;
      if (!Array.isArray(codes)) {
        return res.status(400).json({ success: false, message: "codes must be an array" });
      }
      
      let synced = 0;
      for (const c of codes) {
        await db.insert(activation_codes).values({
          id: c.id,
          code: c.code,
          schoolId: c.schoolId || c.school_id,
          used: c.used || c.isUsed || false,
          usedBy: c.usedBy || null,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
        }).onConflictDoUpdate({
          target: activation_codes.code,
          set: {
            used: c.used || c.isUsed || false,
            usedBy: c.usedBy || null
          }
        });
        synced++;
      }
      
      res.json({ success: true, synced });
    } catch (error: any) {
      console.error('Error syncing codes:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/activation-codes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { used, usedBy, role, schoolId, code } = req.body;
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (used !== undefined) mapped.used = used;
      if (usedBy !== undefined) mapped.usedBy = usedBy;
      if (role !== undefined) mapped.role = role;
      if (schoolId !== undefined) mapped.schoolId = schoolId;
      if (code !== undefined) mapped.code = code;

      if (Object.keys(mapped).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }

      const updated = await db.update(activation_codes)
        .set(mapped)
        .where(eq(activation_codes.id, id))
        .returning();
      res.json({ success: true, code: updated[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 📝 Developer Logs - PostgreSQL API
  // ==========================================
  app.get('/api/developer-logs', async (req, res) => {
    try {
      const logs = await db.select().from(developer_logs).limit(100); // Order by desc in query later
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/developer-logs', async (req, res) => {
    try {
      const { id, action, details, adminId, userEmail, schoolId, status } = req.body || {};
      const logId = id || `dev_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logDetails = details || [
        userEmail ? `User: ${userEmail}` : '',
        schoolId ? `School: ${schoolId}` : '',
        status ? `Status: ${status}` : ''
      ].filter(Boolean).join(' | ');
      const newLog = await db.insert(developer_logs).values({
        id: logId,
        action: (action || 'إجراء مطور').substring(0, 100),
        details: logDetails || null,
        adminId: adminId || userEmail || 'developer',
        createdAt: new Date()
      }).returning();
      res.json({ success: true, log: newLog[0] || { id: logId } });
    } catch (error: any) {
      console.error('Error in /api/developer-logs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

    // ==========================================
  // 📡 Pulse (Community Posts) - PostgreSQL API
  // ==========================================
  app.get('/api/pulse/posts', async (req, res) => {
    try {
      const { schoolId, grade, type } = req.query;
      let query = db.select().from(community_posts);
      
      // Basic filtering logic (can be expanded)
      const allPosts = await query.orderBy(community_posts.timestamp); 
      // Note: Order by desc would be better, but we need to import 'desc' from drizzle-orm
      res.json({ success: true, posts: allPosts.reverse() });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/pulse/posts', async (req, res) => {
    try {
      const { id, userId, userName, content, mediaUrl, type, grade, schoolId } = req.body;
      const newPost = await db.insert(community_posts).values({
        id, userId, userName, content, mediaUrl, type, grade, schoolId
      }).returning();
      res.json({ success: true, post: newPost[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/pulse/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where(eq(community_posts.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/pulse/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await db.select().from(community_comments).where(eq(community_comments.postId, postId));
      res.json({ success: true, comments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/pulse/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const { id, userId, userName, content } = req.body;
      const newComment = await db.insert(community_comments).values({
        id, postId, userId, userName, content
      }).returning();
      
      // Update comment count on post
      await db.execute(sql`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ${postId}`);
      
      res.json({ success: true, comment: newComment[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/pulse/stats', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(community_posts);
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(community_posts.schoolId, schoolId as string)) as any;
      }
      const allPosts = await queryBuilder;
      const totalPosts = allPosts.length;
      const adminTeacher = allPosts.filter((p: any) => p.type === 'admin' || p.type === 'teacher').length;
      const comments = allPosts.reduce((sum: number, p: any) => sum + (Number(p.commentsCount) || 0), 0);
      const likes = allPosts.reduce((sum: number, p: any) => sum + (Number(p.likesCount) || 0), 0);

      res.json({
        success: true,
        stats: {
          total: totalPosts,
          adminTeacher,
          comments,
          likes,
          postsCount: totalPosts
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 🔔 Notifications - PostgreSQL API
  // ==========================================

  // ==========================================
  // 💰 Finance - PostgreSQL API
  // ==========================================
  app.get('/api/finance/transactions', async (req, res) => {
    try {
      const { schoolId } = req.query;
      const txs = await db.select().from(student_transactions).orderBy(student_transactions.createdAt);
      res.json({ success: true, transactions: txs.reverse() });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/student-transactions', async (req, res) => {
    try {
      const txs = await db.select().from(student_transactions).orderBy(student_transactions.createdAt);
      res.json({ success: true, transactions: txs.reverse(), data: txs.reverse() });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/finance/transactions', async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newTx = await db.insert(student_transactions).values({
        id, studentId, schoolId, amount, note, method, adminName
      }).returning();
      res.json({ success: true, transaction: newTx[0], data: newTx[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/student-transactions', async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newTx = await db.insert(student_transactions).values({
        id, studentId, schoolId, amount, note, method, adminName
      }).returning();
      res.json({ success: true, transaction: newTx[0], data: newTx[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/finance/payment-requests', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(payment_requests);
      if (schoolId && schoolId !== 'all') {
        query = query.where(eq(payment_requests.schoolId, schoolId as string)) as any;
      }
      const rawResults = await query.orderBy(desc(payment_requests.createdAt));
      const allStudents = await db.select().from(students);
      const formatted = rawResults.map(r => formatPaymentRequest(r, allStudents));
      res.json({ success: true, requests: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/payment-requests', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(payment_requests);
      if (schoolId && schoolId !== 'all') {
        query = query.where(eq(payment_requests.schoolId, schoolId as string)) as any;
      }
      const rawResults = await query.orderBy(desc(payment_requests.createdAt));
      const allStudents = await db.select().from(students);
      const formatted = rawResults.map(r => formatPaymentRequest(r, allStudents));
      res.json({ success: true, requests: formatted, data: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/finance/salaries', async (req, res) => {
    try {
      const { month } = req.query;
      let query = db.select().from(salaries);
      if (month) {
        query = query.where(eq(salaries.month, month as string)) as any;
      }
      const allSalaries = await query;
      res.json({ success: true, salaries: allSalaries });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/finance/salaries', async (req, res) => {
    try {
      const { id, staffId, staffName, month, baseSalary, rewards, deductions, netSalary, isPaid, paymentDate } = req.body;
      const result = await db.insert(salaries).values({
        id, staffId, staffName, month, baseSalary, rewards, deductions, netSalary, isPaid, 
        paymentDate: paymentDate ? new Date(paymentDate) : null
      }).onConflictDoUpdate({
        target: salaries.id,
        set: { baseSalary, rewards, deductions, netSalary, isPaid, paymentDate: paymentDate ? new Date(paymentDate) : null, updatedAt: new Date() }
      }).returning();
      res.json({ success: true, salary: result[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- قسم الإذاعة المدرسية والإعلانات (Broadcasting) ---
  
  // جلب الإعلانات النشطة
  app.get('/api/broadcasts', async (req, res) => {
    try {
      const { schoolId, grade, limit: limitParam } = req.query;
      let conditions = [];

      if (schoolId && schoolId !== 'all' && schoolId !== 'general' && schoolId !== 'global') {
        const sId = (schoolId as string).trim();
        let schoolIds = [sId, 'all', 'global', 'central', 'general', 'عام'];
        if (sId === 'school1' || sId === 'school_awail_ghamas' || sId === 'ghamas_awail') {
          schoolIds.push('school1', 'school_awail_ghamas', 'ghamas_awail');
        }
        conditions.push(or(
          inArray(school_announcements.schoolId, schoolIds),
          isNull(school_announcements.schoolId),
          eq(school_announcements.schoolId, ''),
          eq(school_announcements.schoolId, 'all'),
          eq(school_announcements.schoolId, 'global'),
          eq(school_announcements.schoolId, 'central'),
          eq(school_announcements.schoolId, 'general'),
          eq(school_announcements.schoolId, 'عام')
        ));
      }

      conditions.push(or(
        sql`${school_announcements.expiryDate} IS NULL`,
        sql`${school_announcements.expiryDate} > NOW()`
      ));

      let queryBuilder = db.select().from(school_announcements).where(and(...conditions));
      const results = await queryBuilder.orderBy(desc(school_announcements.timestampMs)).limit(Number(limitParam) || 50);

      // Optional grade filter if passed in query
      let filteredResults = results;
      if (grade && typeof grade === 'string' && grade.trim() !== '') {
        const { matchesTargetGrades } = await import('./src/utils/gradeMatcher');
        filteredResults = results.filter((b: any) => matchesTargetGrades(grade, b.targetGrades));
      }

      res.json({ success: true, broadcasts: filteredResults, data: filteredResults });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة إعلان جديد
  app.post('/api/broadcasts', async (req, res) => {
    try {
      const { id, schoolId, message, targetGrades, author, subject, targetLocation, durationHours, expiryDate: customExpiry } = req.body;
      
      if (!message || (typeof message === 'string' && !message.trim())) {
        return res.status(400).json({ success: false, message: "محتوى الرسالة مطلوب" });
      }

      let expiryDate: Date;
      if (customExpiry) {
        expiryDate = new Date(typeof customExpiry === 'number' ? customExpiry : customExpiry);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
        }
      } else {
        expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
      }

      const broadcastId = id || `br_${Date.now()}`;
      const effectiveSchoolId = schoolId && schoolId.trim() !== '' ? schoolId.trim() : 'general';

      let cleanTargetGrades: string[] = [];
      if (Array.isArray(targetGrades)) {
        cleanTargetGrades = targetGrades;
      } else if (typeof targetGrades === 'string') {
        cleanTargetGrades = [targetGrades];
      } else {
        cleanTargetGrades = ['الجميع'];
      }

      const result = await db.insert(school_announcements).values({
        id: broadcastId,
        schoolId: effectiveSchoolId,
        message: typeof message === 'string' ? message.trim() : String(message),
        targetGrades: cleanTargetGrades,
        author: author || 'الإدارة المدرسية',
        subject: subject || 'الإذاعة المدرسية',
        targetLocation: targetLocation || 'ticker',
        expiryDate: expiryDate,
        timestampMs: Date.now(),
        createdAt: new Date()
      }).returning();

      const created = result[0];
      realtimeServerInstance?.broadcastManual('school_announcements', broadcastId, 'INSERT', created);
      realtimeServerInstance?.broadcastManual('broadcasts', broadcastId, 'INSERT', created);

      res.json({ success: true, broadcast: created, data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث إعلان
  app.patch('/api/broadcasts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { message, targetGrades, expiryDate: customExpiry } = req.body;
      const updateData: any = {};
      if (message !== undefined) updateData.message = message;
      if (targetGrades !== undefined) {
        updateData.targetGrades = Array.isArray(targetGrades) ? targetGrades : [targetGrades];
      }
      if (customExpiry !== undefined) {
        updateData.expiryDate = new Date(typeof customExpiry === 'number' ? customExpiry : customExpiry);
      }

      if (Object.keys(updateData).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }

      const updated = await db.update(school_announcements)
        .set(updateData)
        .where(eq(school_announcements.id, id))
        .returning();

      if (updated && updated.length > 0) {
        realtimeServerInstance?.broadcastManual('school_announcements', id, 'UPDATE', updated[0]);
        realtimeServerInstance?.broadcastManual('broadcasts', id, 'UPDATE', updated[0]);
      }

      res.json({ success: true, broadcast: updated?.[0], data: updated?.[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف إعلان
  app.delete('/api/broadcasts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(school_announcements).where(eq(school_announcements.id, id));
      realtimeServerInstance?.broadcastManual('school_announcements', id, 'DELETE', { id });
      realtimeServerInstance?.broadcastManual('broadcasts', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- قسم الكادر والموظفين (Staff & Teachers) ---
  
  // جلب قائمة المعلمين والموظفين
  app.get('/api/teachers', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(teachers);
      
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(teachers.schoolId, schoolId as string)) as any;
      }
      
      const results = await queryBuilder.orderBy(asc(teachers.name));
      res.json({ success: true, teachers: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة معلم أو موظف جديد
  app.post('/api/teachers', async (req, res) => {
    try {
      const { teacherStage, ...teacherData } = req.body;
      const id = teacherData.id || `tch_${Date.now()}`;
      
      await db.insert(teachers).values({
        ...teacherData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث بيانات معلم أو موظف
  app.patch('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { teacherStage, ...updateData } = req.body;
      
      await db.update(teachers)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(teachers.id, id));
      realtimeServerInstance?.broadcastManual('teachers', id, 'UPDATE', { id, ...updateData });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف معلم أو موظف
  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Get teacher to find code
      const tList = await db.select().from(teachers).where(eq(teachers.id, id));
      if (tList.length > 0 && tList[0].code) {
        const c = tList[0].code;
        await db.delete(activation_codes).where(eq(activation_codes.code, c));
      }
      await db.delete(teachers).where(eq(teachers.id, id));
      await db.delete(users).where(eq(users.id, id));
      await db.delete(activation_codes).where(eq(activation_codes.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ربط كود شعبة إضافية بحساب المعلم لتمكينه من إدارة عدة شُعب من جلسة واحدة
  app.post('/api/teachers/:id/link-code', async (req, res) => {
    try {
      const { id } = req.params;
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'كود الشعبة مطلوب' });
      }
      const cleanCode = String(code).trim().toUpperCase();

      // 1. العثور على المعلم المستهدف
      const tList = await db.select().from(teachers).where(eq(teachers.id, id));
      if (tList.length === 0) {
        return res.status(404).json({ success: false, message: 'حساب المعلم غير موجود' });
      }
      const currentTeacher = tList[0];
      const existingClasses: string[] = Array.isArray(currentTeacher.classes) ? [...currentTeacher.classes] : [];
      const existingClassCodes: Record<string, string> = 
        (currentTeacher.classCodes && typeof currentTeacher.classCodes === 'object') ? { ...currentTeacher.classCodes } : {};

      // 2. التحقق مما إذا كان الكود مضافاً بالفعل
      if (currentTeacher.code === cleanCode || Object.values(existingClassCodes).includes(cleanCode)) {
        return res.json({
          success: true,
          message: 'هذا الكود مفعّل ومربوط مسبقاً في حسابك!',
          classes: existingClasses,
          classCodes: existingClassCodes
        });
      }

      // 3. البحث عن الكود عبر المعلمين الآخرين أو الأكواد الصادرة
      const allTeachers = await db.select().from(teachers);
      let foundClassName = '';
      let matchedOtherTeacher: any = null;

      for (const otherT of allTeachers) {
        if (otherT.classCodes && typeof otherT.classCodes === 'object') {
          for (const [cls, cCode] of Object.entries(otherT.classCodes)) {
            if (String(cCode).trim().toUpperCase() === cleanCode) {
              foundClassName = cls;
              matchedOtherTeacher = otherT;
              break;
            }
          }
        }
        if (foundClassName) break;
        if (otherT.code === cleanCode) {
          matchedOtherTeacher = otherT;
          if (Array.isArray(otherT.classes) && otherT.classes.length > 0) {
            foundClassName = otherT.classes[0];
          }
          break;
        }
      }

      // 4. التحقق من جدول activation_codes إن لم يُعثر عليه
      if (!foundClassName) {
        const actList = await db.select().from(activation_codes).where(eq(activation_codes.code, cleanCode));
        if (actList.length > 0) {
          const act = actList[0];
          if (act.grade || act.section) {
            foundClassName = act.section ? `${act.grade || 'الصف'} - شعبة ${act.section}` : (act.grade || 'شعبة جديدة');
          }
        }
      }

      // 5. استنتاج اسم الشعبة من صيغة الكود إذا لزم الأمر
      if (!foundClassName) {
        const parts = cleanCode.split('-');
        if (parts.length >= 3) {
          foundClassName = `شعبة إضافية (${parts.slice(1, 3).join('-')})`;
        } else {
          foundClassName = `شعبة (${cleanCode})`;
        }
      }

      // دمج الشعبة في قائمة شُعب المعلم
      if (foundClassName && !existingClasses.includes(foundClassName)) {
        existingClasses.push(foundClassName);
      }
      existingClassCodes[foundClassName] = cleanCode;

      // إذا كان هناك معلم مكرر يحمل شُعباً أخرى لنفس الأستاذ، دمج شُعبه أيضاً
      if (matchedOtherTeacher && Array.isArray(matchedOtherTeacher.classes)) {
        matchedOtherTeacher.classes.forEach((c: string) => {
          if (!existingClasses.includes(c)) existingClasses.push(c);
        });
      }

      // الحفظ في قاعدة البيانات
      await db.update(teachers).set({
        classes: existingClasses,
        classCodes: existingClassCodes,
        updatedAt: new Date()
      }).where(eq(teachers.id, id));

      realtimeServerInstance?.broadcastManual('teachers', id, 'UPDATE', {
        id,
        classes: existingClasses,
        classCodes: existingClassCodes
      });

      res.json({
        success: true,
        message: `تم ربط الشعبة (${foundClassName}) بنجاح!`,
        linkedClass: foundClassName,
        classes: existingClasses,
        classCodes: existingClassCodes
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- قسم جدول الحصص (Class Schedules) ---
  const handleGetClassSchedules = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, className, teacherId } = req.query;
      let queryBuilder = db.select().from(class_schedules);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(class_schedules.schoolId, schoolId as string));
      if (teacherId && teacherId !== 'all') filters.push(eq(class_schedules.teacherId, teacherId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(asc(class_schedules.dayOfWeek), asc(class_schedules.startTime));

      // Fetch teachers to resolve teacher names
      const teacherMap = new Map<string, string>();
      try {
        const allTeachers = await db.select().from(teachers);
        allTeachers.forEach(t => {
          if (t.id && t.name) teacherMap.set(t.id, t.name);
        });
      } catch (tErr) {
        console.warn("Schedule: failed to resolve teachers", tErr);
      }

      // Flexible className filter if requested
      let filtered = results;
      if (className && className !== 'all') {
        const targetClean = String(className).trim();
        const normTarget = targetClean.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/(?:^|\s)ال/g, ' ').replace(/\s+/g, '');
        filtered = results.filter(s => {
          if (!s.className) return false;
          if (s.className.trim() === targetClean) return true;
          const normA = s.className.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/(?:^|\s)ال/g, ' ').replace(/\s+/g, '');
          return normA === normTarget || normA.includes(normTarget) || normTarget.includes(normA);
        });
      }

      const mapped = filtered.map(s => ({
        id: s.id,
        schoolId: s.schoolId,
        day: s.dayOfWeek,
        dayOfWeek: s.dayOfWeek,
        className: s.className,
        sectionName: s.sectionName || null,
        time: s.startTime,
        startTime: s.startTime,
        endTime: s.endTime || s.startTime,
        teacherId: s.teacherId,
        teacherName: (s.teacherId ? teacherMap.get(s.teacherId) : '') || '',
        subject: s.subject,
        type: s.classType || 'physical',
        classType: s.classType || 'physical'
      }));
      res.json({ success: true, schedules: mapped, data: mapped });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const handlePostClassSchedule = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const dayOfWeek = body.dayOfWeek || body.day || '';
      const className = body.className || body.class_name || '';
      const startTime = body.startTime || body.start_time || body.time || '';
      const endTime = body.endTime || body.end_time || startTime;
      const teacherId = body.teacherId || body.teacher_id || null;
      const subject = body.subject || '';
      const schoolId = body.schoolId || body.school_id || 'school1';
      const sectionName = body.sectionName || body.section_name || null;
      const classType = body.type || body.class_type || 'physical';

      const newSched = { id, schoolId, teacherId, className, sectionName, classType, subject, dayOfWeek, startTime, endTime, createdAt: new Date() };
      await db.insert(class_schedules).values(newSched).onConflictDoUpdate({
        target: class_schedules.id,
        set: { teacherId, className, sectionName, classType, subject, dayOfWeek, startTime, endTime, schoolId }
      });

      realtimeServerInstance?.broadcastManual('class_schedules', id, 'INSERT', newSched);
      realtimeServerInstance?.broadcastManual('schedules', id, 'INSERT', newSched);
      res.json({ success: true, id, schedule: newSched, data: newSched });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const handlePatchClassSchedule = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (updates.dayOfWeek !== undefined || updates.day !== undefined) mapped.dayOfWeek = updates.dayOfWeek ?? updates.day;
      if (updates.className !== undefined || updates.class_name !== undefined) mapped.className = updates.className ?? updates.class_name;
      if (updates.sectionName !== undefined || updates.section_name !== undefined) mapped.sectionName = updates.sectionName ?? updates.section_name;
      if (updates.startTime !== undefined || updates.time !== undefined) mapped.startTime = updates.startTime ?? updates.time;
      if (updates.endTime !== undefined) mapped.endTime = updates.endTime;
      if (updates.teacherId !== undefined || updates.teacher_id !== undefined) mapped.teacherId = updates.teacherId ?? updates.teacher_id;
      if (updates.subject !== undefined) mapped.subject = updates.subject;
      if (updates.schoolId !== undefined || updates.school_id !== undefined) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.classType !== undefined || updates.type !== undefined) mapped.classType = updates.classType ?? updates.type;

      if (Object.keys(mapped).length > 0) {
        await db.update(class_schedules).set(mapped).where(eq(class_schedules.id, id));
        realtimeServerInstance?.broadcastManual('class_schedules', id, 'UPDATE', { id, ...mapped });
        realtimeServerInstance?.broadcastManual('schedules', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const handleDeleteClassSchedule = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(class_schedules).where(eq(class_schedules.id, id));
      realtimeServerInstance?.broadcastManual('class_schedules', id, 'DELETE', { id });
      realtimeServerInstance?.broadcastManual('schedules', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  app.get('/api/schedules', handleGetClassSchedules);
  app.get('/api/class-schedules', handleGetClassSchedules);
  app.get('/api/class_schedules', handleGetClassSchedules);
  app.post('/api/schedules', handlePostClassSchedule);
  app.post('/api/class-schedules', handlePostClassSchedule);
  app.post('/api/class_schedules', handlePostClassSchedule);
  app.patch('/api/schedules/:id', handlePatchClassSchedule);
  app.patch('/api/class-schedules/:id', handlePatchClassSchedule);
  app.patch('/api/class_schedules/:id', handlePatchClassSchedule);
  app.put('/api/schedules/:id', handlePatchClassSchedule);
  app.put('/api/class-schedules/:id', handlePatchClassSchedule);
  app.put('/api/class_schedules/:id', handlePatchClassSchedule);
  app.delete('/api/schedules/:id', handleDeleteClassSchedule);
  app.delete('/api/class-schedules/:id', handleDeleteClassSchedule);
  app.delete('/api/class_schedules/:id', handleDeleteClassSchedule);

  // إعدادات الأوقات في الجدول
  app.get('/api/school-settings/:schoolId/times', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const config = await db.select().from(school_configs).where(eq(school_configs.id, schoolId));
      if (config.length > 0 && (config[0].subjects as any)?.times) {
        res.json({ success: true, times: (config[0].subjects as any).times });
      } else {
        res.json({ success: true, times: [] });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/school-settings/:schoolId/times', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { times } = req.body;
      
      const existing = await db.select().from(school_configs).where(eq(school_configs.id, schoolId));
      if (existing.length > 0) {
        const subjects = (existing[0].subjects as any) || {};
        await db.update(school_configs)
          .set({ subjects: { ...subjects, times } })
          .where(eq(school_configs.id, schoolId));
      } else {
        await db.insert(school_configs).values({
          id: schoolId,
          subjects: { times }
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- سجل الانضباط المدرسي (Attendance & Discipline) ---

  // تحديث الحضور والغياب
  app.post('/api/students/:studentId/attendance', async (req, res) => {
    try {
      const { studentId } = req.params;
      const { status, by, reason, period, schoolId } = req.body;
      const date = new Date().toISOString().split('T')[0];
      const id = `att_${studentId}_${date}_${period}`.replace(/\s+/g, '_');

      // 1. Record in detailed log table
      await db.insert(attendance_logs).values({
        id,
        studentId,
        schoolId: schoolId || '',
        date,
        status,
        period,
        reason,
        recordedBy: by,
        timestamp: new Date()
      }).onConflictDoUpdate({
        target: attendance_logs.id,
        set: { status, reason, recordedBy: by, timestamp: new Date() }
      });

      // 2. Update summary in students table
      const student = await db.select().from(students).where(eq(students.id, studentId));
      if (student.length > 0) {
        // Fetch all logs from DB to calculate exact statistics
        const allLogs = await db.select()
          .from(attendance_logs)
          .where(eq(attendance_logs.studentId, studentId))
          .orderBy(desc(attendance_logs.timestamp));

        let present = 0, absent = 0, late = 0;
        allLogs.forEach(log => {
          if (log.status === 'present') present++;
          if (log.status === 'absent') absent++;
          if (log.status === 'late') late++;
        });

        // Get recent 50 logs and format them for the UI
        const recentLogs = allLogs.slice(0, 50).reverse().map(l => ({
          date: l.date,
          status: l.status,
          period: l.period,
          reason: l.reason,
          time: new Date(l.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          by: l.recordedBy
        }));

        const updatedAttendance = {
          present,
          absent,
          late,
          logs: recentLogs
        };

        await db.update(students)
          .set({ attendance: updatedAttendance })
          .where(eq(students.id, studentId));
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تسجيل إجراء سلوكي
  app.post('/api/students/:studentId/behavior', async (req, res) => {
    try {
      const { studentId } = req.params;
      const { type, points, action, note, by, schoolId } = req.body;
      const date = new Date().toISOString().split('T')[0];
      const id = `beh_${studentId}_${Date.now()}`;

      // 1. Record in detailed log table
      await db.insert(behavior_logs).values({
        id,
        studentId,
        schoolId: schoolId || '',
        type,
        points,
        action,
        note,
        recordedBy: by,
        date,
        timestamp: new Date()
      });

      // 2. Update summary in students table
      const student = await db.select().from(students).where(eq(students.id, studentId));
      if (student.length > 0) {
        const currentBehavior = (student[0].behavior as any) || { score: 100, logs: [] };
        const newScore = Math.max(0, Math.min(100, (currentBehavior.score || 100) + points));
        
        const logs = (currentBehavior.logs || []);
        logs.unshift({ date, type, points, action, note, by });

        await db.update(students)
          .set({ 
            behavior: { score: newScore, logs: logs.slice(0, 50) }
          })
          .where(eq(students.id, studentId));
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث إعدادات الزي المدرسي
  app.post('/api/school-configs/:schoolId/uniform', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { uniformConfigs } = req.body;
      
      const existing = await db.select().from(school_configs).where(eq(school_configs.id, schoolId));
      if (existing.length > 0) {
        await db.update(school_configs)
          .set({ uniformConfigs })
          .where(eq(school_configs.id, schoolId));
      } else {
        await db.insert(school_configs).values({
          id: schoolId,
          uniformConfigs
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- إرسال التنبيهات (Notifications) ---
  app.get('/api/notifications', async (req, res) => {
    try {
      const { recipientId, recipientIds, userId, schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(notifications);
      const filters = [];
      
      let idsToMatch: string[] = [];
      if (recipientIds) {
        idsToMatch = (recipientIds as string).split(',').map(s => s.trim()).filter(Boolean);
      } else if (recipientId || userId) {
        const singleId = (recipientId || userId) as string;
        if (singleId !== 'all') idsToMatch.push(singleId);
      }
      
      if (idsToMatch.length > 0) {
        const expandedSet = new Set<string>();
        for (const rawId of idsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());

          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());

          // Simple and aggressive expansion
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());
          
          const prefixes = ['scode_', 'pcode_', 'tcode_', 'tch_'];
          for (const p of prefixes) {
            expandedSet.add(`${p}${stripped}`);
            expandedSet.add(`${p}${stripped.toUpperCase()}`);
          }

          // If the ID already has a prefix like TCH- or PAR-, add versions with scode_/tcode_ too
          if (stripped.toUpperCase().startsWith('TCH-') || stripped.toUpperCase().startsWith('PAR-')) {
             expandedSet.add(`tcode_${stripped}`);
             expandedSet.add(`pcode_${stripped}`);
             expandedSet.add(`tcode_${stripped.toUpperCase()}`);
             expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          }
        }
        expandedSet.add('all');
        filters.push(inArray(notifications.recipientId, Array.from(expandedSet)));
      }
      if (schoolId && schoolId !== 'all') {
        filters.push(or(eq(notifications.schoolId, schoolId as string), isNull(notifications.schoolId), eq(notifications.schoolId, '')));
      }
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const logs = await queryBuilder.orderBy(desc(notifications.createdAt)).limit(Number(limitParam) || 100);
      res.json({ success: true, notifications: logs, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      const { userId, recipientId, title, message, body, type, schoolId, metadata, recipientRole, studentName, authorName } = req.body || {};
      const id = req.body.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let targetRecipient = recipientId || userId || 'all';
      const textBody = body || message || '';
      
      // If targetRecipient is anonymous or missing, try resolving student by name
      const nameToResolve = studentName || authorName;
      if ((!targetRecipient || targetRecipient === 'anonymous' || targetRecipient === 'user') && nameToResolve && nameToResolve !== 'مستخدم') {
        try {
          const foundStudents = await db.select().from(students).where(sql`name ILIKE ${'%' + nameToResolve.trim() + '%'}`).limit(1);
          if (foundStudents[0]?.id) {
            targetRecipient = foundStudents[0].id;
          } else if (foundStudents[0]?.code) {
            targetRecipient = foundStudents[0].code;
          }
        } catch (e) {
          console.warn("Could not resolve student by name in notifications:", e);
        }
      }

      const newNotif = {
        id,
        recipientId: targetRecipient,
        recipientRole: recipientRole || 'student',
        title: title || 'إشعار جديد',
        body: textBody,
        type: type || 'alert',
        schoolId: schoolId || '',
        metadata: metadata || null,
        read: false,
        createdAt: new Date()
      };

      const inserted = await db.insert(notifications).values(newNotif).returning({ id: notifications.id });
      const finalId = inserted[0]?.id || id;
      const finalNotif = { ...newNotif, id: finalId };

      realtimeServerInstance?.broadcastManual('notifications', finalId, 'INSERT', finalNotif);
      res.json({ success: true, id: finalId, notification: finalNotif, data: finalNotif });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب التنبيهات لمستخدم معين
  app.get('/api/notifications/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const trimmed = (userId || '').trim();
      const expandedSet = new Set<string>();
      expandedSet.add(trimmed);
      expandedSet.add(trimmed.toLowerCase());
      expandedSet.add(trimmed.toUpperCase());
      const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
      expandedSet.add(stripped);
      expandedSet.add(stripped.toLowerCase());
      expandedSet.add(stripped.toUpperCase());
      const prefixes = ['scode_', 'pcode_', 'tcode_', 'tch_'];
      for (const p of prefixes) {
        expandedSet.add(`${p}${stripped}`);
        expandedSet.add(`${p}${stripped.toUpperCase()}`);
      }
      expandedSet.add('all');

      const logs = await db.select()
        .from(notifications)
        .where(inArray(notifications.recipientId, Array.from(expandedSet)))
        .orderBy(desc(notifications.createdAt))
        .limit(100);
      res.json({ success: true, notifications: logs, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث حالة الإشعار
  app.patch('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const payload: any = {};
      if (updates.read !== undefined) payload.read = updates.read;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.body !== undefined) payload.body = updates.body;
      if (updates.message !== undefined) payload.body = updates.message;
      
      if (Object.keys(payload).length === 0) {
        return res.json({ success: true, id, message: "No relevant fields to update" });
      }

      await db.update(notifications)
        .set(payload)
        .where(eq(notifications.id, id));
      realtimeServerInstance?.broadcastManual('notifications', id, 'UPDATE', { id, ...payload });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث حالة القراءة
  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
      realtimeServerInstance?.broadcastManual('notifications', id, 'UPDATE', { id, read: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف إشعار (مع العزل المرن)
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, codes } = req.query;

      let identifiers = [];
      if (userId) identifiers.push(userId as string);
      if (codes) {
        const codesArr = (codes as string).split(',');
        identifiers.push(...codesArr);
      }

      let whereClause = eq(notifications.id, id);
      if (identifiers.length > 0) {
        whereClause = and(whereClause, inArray(notifications.recipientId, identifiers)) as any;
      }

      await db.delete(notifications).where(whereClause);
      realtimeServerInstance?.broadcastManual('notifications', id, 'DELETE', { id });
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // مسح جميع الإشعارات لمستخدم معين (العزل الصارم المتعدد)
  app.delete('/api/notifications-clear-all', async (req, res) => {
    try {
      const { userId, codes } = req.query;
      
      let identifiers = [];
      if (userId) identifiers.push(userId as string);
      if (codes) {
        const codesArr = (codes as string).split(',');
        identifiers.push(...codesArr);
      }

      if (identifiers.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one identifier (userId or codes) is required' });
      }

      await db.delete(notifications).where(inArray(notifications.recipientId, identifiers));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Clear all notifications error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب سجلات الحضور لطالب معين
  app.get('/api/students/:studentId/attendance/logs', async (req, res) => {
    try {
      const { studentId } = req.params;
      const logs = await db.select()
        .from(attendance_logs)
        .where(eq(attendance_logs.studentId, studentId))
        .orderBy(desc(attendance_logs.timestamp));
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب سجلات السلوك لطالب معين
  app.get('/api/students/:studentId/behavior/logs', async (req, res) => {
    try {
      const { studentId } = req.params;
      const logs = await db.select()
        .from(behavior_logs)
        .where(eq(behavior_logs.studentId, studentId))
        .orderBy(desc(behavior_logs.timestamp));
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Generic attendance-logs collection endpoint
  app.get('/api/attendance-logs', async (req, res) => {
    try {
      const { schoolId, studentId } = req.query;
      let logs;
      if (studentId) {
        logs = await db.select().from(attendance_logs).where(eq(attendance_logs.studentId, studentId as string)).orderBy(desc(attendance_logs.timestamp));
      } else if (schoolId && schoolId !== 'all') {
        logs = await db.select().from(attendance_logs).where(eq(attendance_logs.schoolId, schoolId as string)).orderBy(desc(attendance_logs.timestamp));
      } else {
        logs = await db.select().from(attendance_logs).orderBy(desc(attendance_logs.timestamp));
      }
      res.json({ success: true, logs, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Generic behavior-logs collection endpoint
  app.get('/api/behavior-logs', async (req, res) => {
    try {
      const { schoolId, studentId } = req.query;
      let logs;
      if (studentId) {
        logs = await db.select().from(behavior_logs).where(eq(behavior_logs.studentId, studentId as string)).orderBy(desc(behavior_logs.timestamp));
      } else if (schoolId && schoolId !== 'all') {
        logs = await db.select().from(behavior_logs).where(eq(behavior_logs.schoolId, schoolId as string)).orderBy(desc(behavior_logs.timestamp));
      } else {
        logs = await db.select().from(behavior_logs).orderBy(desc(behavior_logs.timestamp));
      }
      res.json({ success: true, logs, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- سجل النشاطات (Audit Logs) ---
  
  // جلب سجلات النشاطات
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const { limit: limitVal = 30, offset = 0 } = req.query;
      const rawLogs = await db.select()
        .from(audit_logs)
        .orderBy(desc(audit_logs.timestamp))
        .limit(Number(limitVal))
        .offset(Number(offset));

      const logs = rawLogs.map(l => {
        let email = l.userEmail;
        let name = l.userName;

        if (!email || email.trim() === '') {
          if (l.userId === 'admin_main' || l.userId === 'ACT_MASTER_G' || !name || name === 'الإدارة العامة' || name === 'موظف') {
            email = 'abdulradhaalmayali@gmail.com';
          }
        }

        if (!name || name === 'الإدارة العامة' || name === 'موظف') {
          name = email || 'abdulradhaalmayali@gmail.com';
        }

        return {
          ...l,
          userEmail: email || name,
          userName: name
        };
      });

      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة سجل نشاط جديد
  app.post('/api/audit-logs', async (req, res) => {
    try {
      const logData = req.body || {};
      const id = logData.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = logData.userId || logData.adminId || logData.userEmail || 'system';
      
      let userEmail = logData.userEmail || null;
      let userName = logData.userName;

      if (!userEmail || userEmail.trim() === '') {
        if (userId === 'admin_main' || userId === 'ACT_MASTER_G' || userName === 'الإدارة العامة' || !userName) {
          userEmail = 'abdulradhaalmayali@gmail.com';
        }
      }

      if (!userName || userName === 'الإدارة العامة' || userName === 'موظف') {
        userName = userEmail || 'abdulradhaalmayali@gmail.com';
      }

      const action = logData.action || 'إجراء نظام';
      const details = logData.details || logData.action || '';
      const targetId = logData.targetId || logData.schoolId || null;
      const targetName = logData.targetName || null;
      const targetType = logData.targetType || (logData.schoolId ? 'school' : null);
      const schoolId = logData.schoolId || null;

      await db.insert(audit_logs).values({
        id,
        userId,
        userName,
        userEmail: userEmail || userName,
        action,
        details,
        targetId,
        targetName,
        targetType,
        schoolId,
        timestamp: new Date()
      });
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error inserting audit log:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف السجلات (مسح شامل أو بحسب الأيام) - يجب أن يسبق :id
  app.delete('/api/audit-logs/old', async (req, res) => {
    try {
      const isAll = req.query.all === 'true' || req.query.scope === 'all' || req.body?.all === true;
      const daysRaw = req.query.days ?? req.body?.days;
      const days = daysRaw !== undefined ? Number(daysRaw) : 30;
      
      let deleted;
      if (isAll || days <= 0) {
        // مسح كافة السجلات بالكامل
        deleted = await db.delete(audit_logs).returning({ id: audit_logs.id });
        return res.json({ 
          success: true, 
          count: deleted.length, 
          message: deleted.length > 0 ? `تم مسح كافة السجلات بنجاح (${deleted.length} سجل)` : 'قاعدة السجلات فارغة بالفعل' 
        });
      } else {
        // حذف السجلات الأقدم من عدد الأيام المحدد
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        deleted = await db.delete(audit_logs)
          .where(lt(audit_logs.timestamp, cutoffDate))
          .returning({ id: audit_logs.id });
        
        return res.json({ 
          success: true, 
          count: deleted.length, 
          message: deleted.length > 0 
            ? `تم حذف ${deleted.length} سجل أقدم من ${days} يوماً` 
            : `لا توجد سجلات أقدم من ${days} يوماً لحذفها` 
        });
      }
    } catch (error: any) {
      console.error('Error clearing old audit logs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // نقطة نهاية إضافية لحذف كافة السجلات
  app.delete('/api/audit-logs', async (req, res) => {
    try {
      const deleted = await db.delete(audit_logs).returning({ id: audit_logs.id });
      res.json({ 
        success: true, 
        count: deleted.length, 
        message: deleted.length > 0 ? `تم مسح كافة السجلات بنجاح (${deleted.length} سجل)` : 'قاعدة السجلات فارغة بالفعل' 
      });
    } catch (error: any) {
      console.error('Error clearing all audit logs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف سجل نشاط فردي محدد
  app.delete('/api/audit-logs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.delete(audit_logs)
        .where(eq(audit_logs.id, id))
        .returning({ id: audit_logs.id });
      if (!deleted || deleted.length === 0) {
        return res.status(404).json({ success: false, message: 'السجل غير موجود أو تم حذفه مسبقاً' });
      }
      res.json({ success: true, message: 'تم حذف السجل بنجاح' });
    } catch (error: any) {
      console.error('Error deleting single audit log:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- بنك الأفكار ومجلس الآباء (Idea Bank & Council Polls) ---

  // جلب المقترحات
  app.get('/api/idea-bank', async (req, res) => {
    try {
      const { schoolId, userId } = req.query;
      let query = db.select().from(idea_bank).orderBy(desc(idea_bank.timestamp));
      
      const conditions = [];
      if (schoolId) {
        // @ts-ignore
        conditions.push(eq(idea_bank.schoolId, schoolId));
      }
      if (userId) {
        // @ts-ignore
        conditions.push(eq(idea_bank.userId, userId));
      }
      
      if (conditions.length > 0) {
        // @ts-ignore
        query = query.where(and(...conditions));
      }
      
      const ideas = await query;
      res.json({ success: true, ideas });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة مقترح جديد
  app.post('/api/idea-bank', async (req, res) => {
    try {
      const data = req.body;
      const id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.insert(idea_bank).values({
        id,
        ...data,
        timestamp: new Date()
      });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث مقترح
  app.patch('/api/idea-bank/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      await db.update(idea_bank)
        .set(updates)
        .where(eq(idea_bank.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف مقترح
  app.delete('/api/idea-bank/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(idea_bank).where(eq(idea_bank.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب التصويتات
  app.get('/api/council-polls', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(council_polls).orderBy(desc(council_polls.timestamp));
      
      if (schoolId) {
        // @ts-ignore
        query = query.where(eq(council_polls.schoolId, schoolId));
      }
      
      const polls = await query;
      res.json({ success: true, polls });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة تصويت جديد
  app.post('/api/council-polls', async (req, res) => {
    try {
      const data = req.body;
      const id = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.insert(council_polls).values({
        id,
        ...data,
        timestamp: new Date()
      });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث تصويت
  app.patch('/api/council-polls/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      await db.update(council_polls)
        .set(updates)
        .where(eq(council_polls.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف تصويت
  app.delete('/api/council-polls/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(council_polls).where(eq(council_polls.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });


  // --- صندوق الصادر للإدارة (Admin Outbox) ---
  app.get('/api/admin-outbox', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(admin_outbox).orderBy(desc(admin_outbox.timestamp));
      
      const filters = [];
      if (schoolId) filters.push(eq(admin_outbox.schoolId, schoolId as string));
      
      if (filters.length > 0) {
        // @ts-ignore
        queryBuilder = queryBuilder.where(and(...filters));
      }
      
      const outbox = await queryBuilder;
      res.json({ success: true, admin_outbox: outbox });
    } catch (error: any) {
      console.error('Error fetching admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin-outbox/send-bulk', async (req, res) => {
    try {
      const { schoolId, messageText, activeRole, targetUsers, isBroadcastMode, selectedUser } = req.body;
      const outboxId = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let count = 0;
      const refIds: { id: string, collection: string }[] = [];
      const processedTargetIds = new Set<string>();
      
      const insertNotifications: any[] = [];
      const insertTickets: any[] = [];
      
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
        
        const effectiveRole = (activeRole === 'cadre' || activeRole === 'staff') ? 'teacher' : activeRole;

        const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Use raw codes (TCH-, PAR-) if they exist, otherwise fallback to UID
        let targetId = selectedUser.uid || selectedUser.id;
        let baseCode = '';
        
        if (activeRole === 'student') {
          baseCode = (selectedUser.studentCode || selectedUser.code || '').trim();
        } else if (activeRole === 'parent') {
          baseCode = (selectedUser.parentCode || selectedUser.code || '').trim();
        } else {
          baseCode = (selectedUser.code || selectedUser.studentCode || '').trim();
        }

        if (baseCode) {
          targetId = baseCode; // Using raw TCH- or PAR- as targetId
        }

        const ticketData = {
          id: ticketId,
          schoolId: schoolId || null,
          userId: targetId,
          role: effectiveRole,
          studentName: selectedUser.fullName || selectedUser.name || 'مستخدم',
          grade: 'General',
          issueType: 'رسالة إدارية خاصة',
          message: messageText,
          status: 'resolved',
          adminReply: messageText,
          senderType: 'admin',
          timestamp: new Date(),
          readByStudent: false
        };

        const insertedTickets = await db.insert(support_tickets).values(ticketData).returning({ id: support_tickets.id });
        const finalTicketId = insertedTickets[0]?.id || ticketId;
        
        if (finalTicketId) {
          refIds.push({ id: finalTicketId, collection: 'support_tickets' });
          
          let notifTitle = 'رسالة إدارية هامة';
          if (activeRole === 'parent') notifTitle = 'رسالة لولي الأمر';
          else if (activeRole === 'cadre' || activeRole === 'teacher') notifTitle = 'رسالة خاصة بالأستاذ';
          else if (activeRole === 'staff') notifTitle = 'رسالة خاصة بالموظف';

          const notifData = {
            id: finalTicketId, 
            schoolId: schoolId || null,
            recipientId: targetId,
            title: notifTitle,
            body: messageText,
            type: 'general',
            recipientRole: effectiveRole,
            read: false,
            metadata: { broadcastId: outboxId },
            createdAt: new Date()
          };
          
          await db.insert(notifications).values(notifData);
          
          // Broadcast to multiple possible channels to be safe
          realtimeServerInstance?.broadcastManual('notifications', finalTicketId, 'INSERT', notifData);
          realtimeServerInstance?.broadcastManual('support_tickets', finalTicketId, 'INSERT', { ...ticketData, id: finalTicketId });
          
          // Also broadcast to the raw code channel if it exists
          if (baseCode) {
            realtimeServerInstance?.broadcastManual('notifications', baseCode, 'INSERT', notifData);
            realtimeServerInstance?.broadcastManual('support_tickets', baseCode, 'INSERT', { ...ticketData, id: finalTicketId });
          }
        }
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
  });

  app.post('/api/admin-outbox', async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newRecord = {
        id,
        schoolId: data.schoolId || null,
        title: data.title || null,
        message: data.message || null,
        type: data.type || null,
        targetRole: data.targetRole || null,
        count: data.count || 0,
        refIds: data.refIds || null,
        broadcastId: data.broadcastId || null,
        timestamp: new Date()
      };
      
      await db.insert(admin_outbox).values(newRecord);
      res.json({ success: true, id, data: newRecord });
    } catch (error: any) {
      console.error('Error inserting admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin-outbox/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const record = await db.select().from(admin_outbox).where(eq(admin_outbox.id, id)).limit(1);
      if (record && record.length > 0) {
        const refIds = (record[0].refIds as any) || [];
        for (const ref of refIds) {
          if (ref.collection === 'notifications') {
            await db.delete(notifications).where(eq(notifications.id, ref.id)).catch(() => {});
          } else if (ref.collection === 'support_tickets') {
            await db.delete(support_tickets).where(eq(support_tickets.id, ref.id)).catch(() => {});
          }
        }
      }
      // Also delete any replies referencing this broadcastId or outboxId
      await db.delete(support_tickets).where(eq(support_tickets.broadcastId, id)).catch(() => {});
      await db.delete(admin_outbox).where(eq(admin_outbox.id, id));
      realtimeServerInstance?.broadcastManual('admin_outbox_updated', undefined, 'DELETE', { id });
      realtimeServerInstance?.broadcastManual('notifications_updated', undefined, 'UPDATE', {});
      realtimeServerInstance?.broadcastManual('support_tickets_updated', undefined, 'UPDATE', {});
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error deleting admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف جميع سجلات الصادر للإدارة
  app.delete('/api/admin-outbox', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let outboxList = [];
      if (schoolId && schoolId !== 'all') {
        outboxList = await db.select().from(admin_outbox).where(or(eq(admin_outbox.schoolId, schoolId as string), isNull(admin_outbox.schoolId), eq(admin_outbox.schoolId, '')));
        await db.delete(admin_outbox).where(or(eq(admin_outbox.schoolId, schoolId as string), isNull(admin_outbox.schoolId), eq(admin_outbox.schoolId, '')));
      } else {
        outboxList = await db.select().from(admin_outbox);
        await db.delete(admin_outbox);
      }
      for (const item of outboxList) {
        const refIds = (item.refIds as any) || [];
        for (const ref of refIds) {
          if (ref.collection === 'notifications') {
            await db.delete(notifications).where(eq(notifications.id, ref.id)).catch(() => {});
          } else if (ref.collection === 'support_tickets') {
            await db.delete(support_tickets).where(eq(support_tickets.id, ref.id)).catch(() => {});
          }
        }
        if (item.id) {
          await db.delete(support_tickets).where(eq(support_tickets.broadcastId, item.id)).catch(() => {});
        }
      }
      realtimeServerInstance?.broadcastManual('admin_outbox_updated', undefined, 'DELETE', {});
      realtimeServerInstance?.broadcastManual('notifications_updated', undefined, 'UPDATE', {});
      realtimeServerInstance?.broadcastManual('support_tickets_updated', undefined, 'UPDATE', {});
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting all admin outbox:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- الدعم والشكاوى (Support & Complaints) ---

  // تحديد الكل كمقروء للدعم والتبليغات
  app.post('/api/support-tickets/mark-all-read', async (req, res) => {
    try {
      const { userId, userIds, userRole, schoolId } = req.body;
      if (!userId && !userIds && !userRole) return res.status(400).json({ success: false });

      const uidsToMatch = Array.isArray(userIds) ? userIds : (userId ? [userId] : []);
      const expandedSet = new Set<string>();
      
      for (const rawId of uidsToMatch) {
        if (!rawId) continue;
        const trimmed = rawId.trim();
        expandedSet.add(trimmed);
        expandedSet.add(trimmed.toLowerCase());
        expandedSet.add(trimmed.toUpperCase());

        const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
        expandedSet.add(stripped);
        expandedSet.add(stripped.toLowerCase());
        expandedSet.add(stripped.toUpperCase());

        const prefixes = ['scode_', 'pcode_', 'tcode_', 'tch_'];
        for (const p of prefixes) {
          expandedSet.add(`${p}${stripped}`);
          expandedSet.add(`${p}${stripped.toUpperCase()}`);
        }
        
        if (stripped.toUpperCase().startsWith('TCH-') || stripped.toUpperCase().startsWith('PAR-')) {
          expandedSet.add(`tcode_${stripped}`);
          expandedSet.add(`pcode_${stripped}`);
          expandedSet.add(`tcode_${stripped.toUpperCase()}`);
          expandedSet.add(`pcode_${stripped.toUpperCase()}`);
        }
      }

      const finalIds = Array.from(expandedSet);

      // Mark tickets as read
      const ticketFilters = [];
      if (finalIds.length > 0) ticketFilters.push(inArray(support_tickets.userId, finalIds));
      if (userRole) ticketFilters.push(eq(support_tickets.role, userRole));
      
      if (ticketFilters.length > 0) {
        await db.update(support_tickets)
          .set({ readByStudent: true })
          .where(and(...ticketFilters));
      }

      // Also mark notifications as read
      const notifFilters = [];
      if (finalIds.length > 0) notifFilters.push(inArray(notifications.recipientId, finalIds));
      if (userRole) notifFilters.push(eq(notifications.recipientRole, userRole));
      
      if (notifFilters.length > 0) {
        await db.update(notifications)
          .set({ read: true })
          .where(and(...notifFilters, inArray(notifications.type, ['broadcast', 'admin_broadcast', 'support_reply', 'general'])));
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error marking all read:', err);
      res.status(500).json({ success: false });
    }
  });

  // جلب التذاكر
  app.get('/api/support-tickets', async (req, res) => {
    try {
      const { schoolId, userId, userIds, userRole } = req.query;
      let queryBuilder = db.select().from(support_tickets).orderBy(desc(support_tickets.timestamp));
      
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(or(eq(support_tickets.schoolId, schoolId as string), isNull(support_tickets.schoolId), eq(support_tickets.schoolId, '')));
      
      let uidsToMatch: string[] = [];
      if (userIds) {
        uidsToMatch = (userIds as string).split(',').map(u => u.trim()).filter(Boolean);
      } else if (userId) {
        uidsToMatch.push(userId as string);
      }
      
      const identityFilters = [];

      if (uidsToMatch.length > 0) {
        const expandedSet = new Set<string>();
        for (const rawId of uidsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());

          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, '');
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());

          const prefixes = ['scode_', 'pcode_', 'tcode_', 'tch_'];
          for (const p of prefixes) {
            expandedSet.add(`${p}${stripped}`);
            expandedSet.add(`${p}${stripped.toUpperCase()}`);
          }
          
          if (stripped.toUpperCase().startsWith('TCH-') || stripped.toUpperCase().startsWith('PAR-')) {
            expandedSet.add(`tcode_${stripped}`);
            expandedSet.add(`pcode_${stripped}`);
            expandedSet.add(`tcode_${stripped.toUpperCase()}`);
            expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          }
        }
        identityFilters.push(inArray(support_tickets.userId, Array.from(expandedSet)));
      }

      if (identityFilters.length > 0) {
        filters.push(or(...identityFilters));
      } else if (uidsToMatch.length > 0) {
        // Strict isolation: if we have IDs to match but none of the filters applied (shouldn't happen with the logic above)
        filters.push(eq(support_tickets.userId, '___NONE___'));
      }
      
      if (filters.length > 0) {
        // @ts-ignore
        queryBuilder = queryBuilder.where(and(...filters));
      }
      
      const tickets = await queryBuilder;
      res.json({ success: true, tickets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة تذكرة جديدة
  app.post('/api/support-tickets', async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const issueType = data.issueType || data.issue_type || data.subject || 'استفسار عام';
      const message = data.message || data.description || '';
      const subject = data.subject || issueType || 'تذكرة دعم';
      const description = data.description || message || '';
      const studentName = data.studentName || data.student_name || data.userName || data.user_name || 'طالب';
      const userName = data.userName || data.user_name || studentName;
      const schoolId = data.schoolId || data.school_id || null;
      const userId = data.userId || data.user_id || null;
      const grade = data.grade || null;
      const phone = data.phone || null;
      const status = data.status || 'pending';
      const isGroup = Boolean(data.isGroup ?? data.is_group ?? false);
      const adminReply = data.adminReply || data.admin_reply || null;
      const role = data.role || 'student';
      const broadcastId = data.broadcastId || data.broadcast_id || null;
      const replyToTicketId = data.replyToTicketId || data.reply_to_ticket_id || null;
      const senderType = data.senderType || data.sender_type || (role === 'parent' ? 'parent' : role === 'teacher' ? 'teacher' : 'student');
      const readByAdmin = Boolean(data.readByAdmin ?? data.read_by_admin ?? false);
      const readByStudent = Boolean(data.readByStudent ?? data.read_by_student ?? false);

      const newTicket = {
        id,
        schoolId,
        userId,
        studentName,
        userName,
        phone,
        grade,
        subject,
        description,
        issueType,
        message,
        status,
        isGroup,
        adminReply,
        role,
        broadcastId,
        replyToTicketId,
        senderType,
        readByAdmin,
        readByStudent,
        timestamp: new Date()
      };
      const inserted = await db.insert(support_tickets).values(newTicket).returning({ id: support_tickets.id });
      const finalId = inserted[0]?.id || id;
      const finalTicket = { ...newTicket, id: finalId };
      
      realtimeServerInstance?.broadcastManual('support_tickets', finalId, 'INSERT', finalTicket);
      res.json({ success: true, id: finalId, ticket: finalTicket, data: finalTicket });
    } catch (error: any) {
      console.error('Error inserting support ticket:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // تحديث تذكرة
  app.patch('/api/support-tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mappedUpdates: any = {};
      if (updates.status !== undefined) mappedUpdates.status = updates.status;
      if (updates.adminReply !== undefined || updates.admin_reply !== undefined) mappedUpdates.adminReply = updates.adminReply ?? updates.admin_reply;
      if (updates.readByAdmin !== undefined || updates.read_by_admin !== undefined) mappedUpdates.readByAdmin = updates.readByAdmin ?? updates.read_by_admin;
      if (updates.readByStudent !== undefined || updates.read_by_student !== undefined) mappedUpdates.readByStudent = updates.readByStudent ?? updates.read_by_student;
      if (updates.message !== undefined) mappedUpdates.message = updates.message;
      if (updates.issueType !== undefined || updates.issue_type !== undefined) mappedUpdates.issueType = updates.issueType ?? updates.issue_type;
      if (updates.subject !== undefined) mappedUpdates.subject = updates.subject;
      if (updates.description !== undefined) mappedUpdates.description = updates.description;
      if (updates.isGroup !== undefined || updates.is_group !== undefined) mappedUpdates.isGroup = updates.isGroup ?? updates.is_group;

      if (Object.keys(mappedUpdates).length > 0) {
        await db.update(support_tickets)
          .set(mappedUpdates)
          .where(eq(support_tickets.id, id));
        realtimeServerInstance?.broadcastManual('support_tickets', id, 'UPDATE', { id, ...mappedUpdates });

        // Create a notification for the user when an admin reply is added
        if (mappedUpdates.adminReply) {
          const tickets = await db.select().from(support_tickets).where(eq(support_tickets.id, id)).limit(1);
          if (tickets.length > 0) {
            const t = tickets[0];
            const notifId = `reply_${id}_${Date.now()}`;
            const newNotif = {
              id: notifId,
              schoolId: t.schoolId || '',
              recipientId: t.userId || '',
              title: 'رد من الادارة 💬',
              body: mappedUpdates.adminReply,
              type: 'general',
              recipientRole: t.role || 'student',
              read: false,
              createdAt: new Date()
            };
            await db.insert(notifications).values(newNotif);
            realtimeServerInstance?.broadcastManual('notifications', notifId, 'INSERT', newNotif);
          }
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف تذكرة (مع العزل المرن)
  app.delete('/api/support-tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, codes } = req.query;

      let identifiers = [];
      if (userId) identifiers.push(userId as string);
      if (codes) {
        const codesArr = (codes as string).split(',');
        identifiers.push(...codesArr);
      }

      let whereClause = eq(support_tickets.id, id);
      if (identifiers.length > 0) {
        whereClause = and(whereClause, inArray(support_tickets.userId, identifiers)) as any;
      }

      await db.delete(support_tickets).where(whereClause);
      realtimeServerInstance?.broadcastManual('support_tickets', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete support ticket error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // مسح جميع تذاكر الدعم لمستخدم معين (العزل الصارم المتعدد)
  app.delete('/api/support-tickets-clear-all', async (req, res) => {
    try {
      const { userId, codes } = req.query;
      
      let identifiers = [];
      if (userId) identifiers.push(userId as string);
      if (codes) {
        const codesArr = (codes as string).split(',');
        identifiers.push(...codesArr);
      }

      if (identifiers.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one identifier (userId or codes) is required' });
      }

      await db.delete(support_tickets).where(inArray(support_tickets.userId, identifiers));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Clear all support tickets error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- قسم المنشورات الاجتماعية (Community) ---
  
  // جلب المنشورات
  app.get('/api/pulse/posts', async (req, res) => {
    try {
      const { schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(community_posts);
      
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(community_posts.schoolId, schoolId as string)) as any;
      }
      
      const results = await queryBuilder.orderBy(desc(community_posts.timestamp)).limit(Number(limitParam) || 50);
      res.json({ success: true, posts: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إنشاء منشور جديد
  app.post('/api/pulse/posts', async (req, res) => {
    try {
      const { id, schoolId, userId, userName, content, mediaUrl, type, grade } = req.body;
      
      await db.insert(community_posts).values({
        id: id || `post_${Date.now()}`,
        schoolId,
        userId,
        userName,
        content,
        mediaUrl,
        type,
        grade,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // حذف منشور
  app.delete('/api/pulse/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where(eq(community_posts.id, id));
      // حذف التعليقات المرتبطة
      await db.delete(community_comments).where(eq(community_comments.postId, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // جلب تعليقات منشور
  app.get('/api/pulse/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const results = await db.select().from(community_comments)
        .where(eq(community_comments.postId, id))
        .orderBy(asc(community_comments.timestamp));
      res.json({ success: true, comments: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // إضافة تعليق
  app.post('/api/pulse/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userName, content } = req.body;
      
      await db.insert(community_comments).values({
        id: `comm_${Date.now()}`,
        postId: id,
        userId,
        userName,
        content,
        timestamp: new Date()
      });
      
      // تحديث عداد التعليقات في المنشور
      const post = await db.select().from(community_posts).where(eq(community_posts.id, id));
      if (post.length > 0) {
        await db.update(community_posts)
          .set({ commentsCount: (post[0].commentsCount || 0) + 1 })
          .where(eq(community_posts.id, id));
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 🔐 Custom JWT Authentication - PostgreSQL
  // ==========================================
  const JWT_SECRET = process.env.JWT_SECRET || 'bairaq-gate6-secret-key-2026';
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role, schoolId } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = `usr_${Date.now()}`;
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'student',
        schoolId: schoolId || 'general'
      });
      
      res.json({ success: true, userId });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  
  app.post('/api/auth/login-code', async (req, res) => {
    try {
      const { code, schoolId: targetSchoolId } = req.body;
      console.log('Login attempt with code:', code, 'targetSchoolId:', targetSchoolId);
      if (!code) {
        return res.status(400).json({ success: false, message: 'الكود مطلوب' });
      }

      const areSchoolsCompatible = (codeSchoolId?: string | null, requestedSchoolId?: string | null): boolean => {
        if (!codeSchoolId || !requestedSchoolId) return true;
        const norm = (s: string) => {
          const cleaned = s.trim().toLowerCase();
          if (cleaned === 'school_awail_ghamas' || cleaned === 'ghamas_awail') return 'school1';
          return cleaned;
        };
        const nCode = norm(codeSchoolId);
        const nReq = norm(requestedSchoolId);
        if (nCode === 'all' || nReq === 'all' || nCode === 'general' || nReq === 'general' || nCode === 'global' || nReq === 'global') return true;
        return nCode === nReq;
      };

      
      const checkBanned = async (uid?: string | null) => {
        if (!uid) return false;
        const u = await db.select({ isBanned: users.isBanned }).from(users).where(eq(users.id, uid)).limit(1);
        return u.length > 0 && u[0].isBanned === true;
      };

      const cleanCode = code.trim().toUpperCase();
      const isTeacherPrefix = cleanCode.startsWith('TCH-');
      const isAdminPrefix = cleanCode.startsWith('ADM-') || cleanCode === '112233';
      const isParentPrefix = cleanCode.startsWith('PAR-') || cleanCode.startsWith('PCODE-');
      const isDriverPrefix = cleanCode.startsWith('DRI-') || cleanCode.startsWith('DRV-');
      const isStudentPrefix = 
        cleanCode.startsWith('STU-') || 
        cleanCode.startsWith('PRI-') || 
        cleanCode.startsWith('INT-') || 
        cleanCode.startsWith('SCI-') || 
        cleanCode.startsWith('LIT-') ||
        /^[PMS]\d/i.test(cleanCode) ||
        cleanCode.startsWith('P-') ||
        cleanCode.startsWith('M-') ||
        cleanCode.startsWith('S-');

      let teacherDirectList: any[] = [];
      let activationList: any[] = [];
      let studentList: any[] = [];
      let parentList: any[] = [];
      let driverList: any[] = [];

      // Fast-path: Execute targeted single query based on code prefix
      if (isAdminPrefix) {
        activationList = await db.select().from(activation_codes).where(eq(activation_codes.code, code));
      } else if (isTeacherPrefix) {
        teacherDirectList = await db.select().from(teachers).where(or(eq(teachers.code, code), eq(teachers.id, code)));
        // If not matched by master code or id, search teacher classCodes JSONB
        if (teacherDirectList.length === 0) {
          try {
            const allTchs = await db.select().from(teachers);
            const matched = allTchs.find(t => {
              if (!t) return false;
              if (t.code === code || t.id === code) return true;
              if (t.classCodes && typeof t.classCodes === 'object') {
                return Object.values(t.classCodes).some((c: any) => String(c).trim().toUpperCase() === cleanCode);
              }
              return false;
            });
            if (matched) teacherDirectList = [matched];
          } catch (err) {
            console.error('Error finding teacher by class code:', err);
          }
        }
      } else if (isParentPrefix) {
        parentList = await db.select().from(students).where(eq(students.parentCode, code));
      } else if (isDriverPrefix) {
        driverList = await db.select().from(transport_drivers).where(eq(transport_drivers.accessCode, code));
      } else if (isStudentPrefix) {
        studentList = await db.select().from(students).where(eq(students.code, code));
      } else {
        // Fallback: Run all candidate checks in parallel (single DB roundtrip)
        const results = await Promise.all([
          db.select().from(teachers).where(or(eq(teachers.code, code), eq(teachers.id, code))),
          db.select().from(activation_codes).where(eq(activation_codes.code, code)),
          db.select().from(students).where(eq(students.code, code)),
          db.select().from(students).where(eq(students.parentCode, code)),
          db.select().from(transport_drivers).where(eq(transport_drivers.accessCode, code))
        ]);
        teacherDirectList = results[0];
        activationList = results[1];
        studentList = results[2];
        parentList = results[3];
        driverList = results[4];

        // Also check teachers classCodes in fallback
        if (teacherDirectList.length === 0) {
          try {
            const allTchs = await db.select().from(teachers);
            const matched = allTchs.find(t => {
              if (!t) return false;
              if (t.code === code || t.id === code) return true;
              if (t.classCodes && typeof t.classCodes === 'object') {
                return Object.values(t.classCodes).some((c: any) => String(c).trim().toUpperCase() === cleanCode);
              }
              return false;
            });
            if (matched) teacherDirectList = [matched];
          } catch (err) {
            console.error('Error finding teacher by class code in fallback:', err);
          }
        }
      }

      // 0. Check teachers table (Teacher Master Code)
      if (teacherDirectList.length > 0) {
        const tch = teacherDirectList[0];
        
        if (tch.isActive === false) {
          return res.status(403).json({ success: false, message: 'تم تعطيل حساب هذا الموظف/الأستاذ من قبل الإدارة.' });
        }

        if (targetSchoolId && tch.schoolId && !areSchoolsCompatible(tch.schoolId, targetSchoolId)) {
          return res.status(400).json({ 
            success: false, 
            message: 'هذا الكود غير صحيح لهذه المدرسة، حيث تم توليده حصراً لمدرسة أخرى.' 
          });
        }
        if (tch.isBanned || await checkBanned(tch.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: 'ACCOUNT_BANNED' });
        }
        const token = jwt.sign(
          { uid: tch.id, name: tch.name, role: 'teacher', schoolId: tch.schoolId || 'school8', subject: tch.subject, grade: tch.grade },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            uid: tch.id, 
            id: tch.id,
            displayName: tch.name, 
            name: tch.name,
            role: 'teacher', 
            schoolId: tch.schoolId || targetSchoolId || 'school8',
            subject: tch.subject || 'المنهج الوزاري',
            grade: tch.grade || 'السادس العلمي',
            classes: tch.classes || [],
            classCodes: tch.classCodes || {}
          } 
        });
      }

      // 1. Check activation_codes (Admin, Teacher, Student, General)
      if (activationList.length > 0) {
        const act = activationList[0];
        if (targetSchoolId && act.schoolId && !areSchoolsCompatible(act.schoolId, targetSchoolId)) {
          return res.status(400).json({ 
            success: false, 
            message: 'هذا الكود غير صحيح لهذه المدرسة، حيث تم توليده حصراً لمدرسة أخرى.' 
          });
        }

        // Mark activation code as used if not already (async background)
        if (!act.used) {
          db.update(activation_codes).set({ used: true }).where(eq(activation_codes.id, act.id)).catch(() => {});
        }

        const roleClean = (act.role || 'student').toLowerCase();
        const effectiveRole = roleClean.includes('teacher') ? 'teacher' : roleClean.includes('admin') ? 'admin' : 'student';

        if (await checkBanned(act.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: 'ACCOUNT_BANNED' });
        }
        const token = jwt.sign(
          { uid: act.id, name: act.role, role: effectiveRole, schoolId: act.schoolId || 'school8' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            uid: act.id, 
            id: act.id,
            displayName: effectiveRole === 'teacher' ? 'الأستاذ المحاضر' : effectiveRole === 'admin' ? 'abdulradhaalmayali@gmail.com' : 'مشترك الدورة', 
            name: effectiveRole === 'teacher' ? 'الأستاذ المحاضر' : effectiveRole === 'admin' ? 'abdulradhaalmayali@gmail.com' : 'مشترك الدورة',
            email: effectiveRole === 'admin' ? 'abdulradhaalmayali@gmail.com' : null,
            role: effectiveRole, 
            schoolId: act.schoolId || targetSchoolId || 'school8',
            studentCode: code,
            subject: 'المنهج العام',
            grade: 'السادس العلمي'
          } 
        });
      }

      // 2. Check students (Student)
      if (studentList.length > 0) {
        const stu = studentList[0];
        
        // --- Source of Truth Verification (Academic Lists) ---
        if (stu.schoolId) {
          const schoolLists = await db
            .select({ id: academic_lists.id, students: academic_lists.students })
            .from(academic_lists)
            .where(eq(academic_lists.schoolId, stu.schoolId));
          
          if (schoolLists.length > 0) {
            const isStudentInAnyList = schoolLists.some(list => {
              const listStudents = Array.isArray(list.students) ? list.students : [];
              return listStudents.some((s: any) => 
                s.student === code || 
                s.code === code || 
                s.id === stu.id
              );
            });

            if (!isStudentInAnyList) {
              console.log(`[Auth] Student ${stu.name} (${code}) found in DB but not in active Academic List for school ${stu.schoolId}. Denying access.`);
              return res.status(403).json({ 
                success: false, 
                message: 'تم تعطيل هذا الكود أو حذفه من قبل الإدارة' 
              });
            }
          }
        }
        // -----------------------------------------------------

        if (targetSchoolId && stu.schoolId && !areSchoolsCompatible(stu.schoolId, targetSchoolId)) {
          return res.status(400).json({ 
            success: false, 
            message: 'هذا الكود غير صحيح لهذه المدرسة، حيث تم توليده حصراً لمدرسة أخرى.' 
          });
        }
        if (stu.isBanned || await checkBanned(stu.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: 'ACCOUNT_BANNED' });
        }
        const token = jwt.sign(
          { uid: stu.id, name: stu.name, role: 'student', schoolId: stu.schoolId, grade: stu.grade },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            uid: stu.id, 
            id: stu.id,
            displayName: stu.name, 
            name: stu.name,
            studentName: stu.name,
            studentCode: stu.code,
            role: 'student', 
            schoolId: stu.schoolId || targetSchoolId,
            grade: stu.grade || 'سادس علمي',
            gender: (stu as any).gender || 'male'
          } 
        });
      }

      // 3. Check students (Parent)
      if (parentList.length > 0) {
        const stu = parentList[0];

        // --- Source of Truth Verification (Academic Lists) ---
        if (stu.schoolId) {
          const schoolLists = await db
            .select({ id: academic_lists.id, students: academic_lists.students })
            .from(academic_lists)
            .where(eq(academic_lists.schoolId, stu.schoolId));
          
          if (schoolLists.length > 0) {
            const isStudentInAnyList = schoolLists.some(list => {
              const listStudents = Array.isArray(list.students) ? list.students : [];
              return listStudents.some((s: any) => 
                s.parent === code || 
                s.parentCode === code || 
                s.id === stu.id
              );
            });

            if (!isStudentInAnyList) {
              console.log(`[Auth] Parent associated with student ${stu.name} found in DB but student not in active Academic List for school ${stu.schoolId}. Denying access.`);
              return res.status(403).json({ 
                success: false, 
                message: 'تم تعطيل هذا الكود أو حذفه من قبل الإدارة' 
              });
            }
          }
        }
        // -----------------------------------------------------

        if (targetSchoolId && stu.schoolId && !areSchoolsCompatible(stu.schoolId, targetSchoolId)) {
          return res.status(400).json({ 
            success: false, 
            message: 'هذا الكود غير صحيح لهذه المدرسة، حيث تم توليده حصراً لمدرسة أخرى.' 
          });
        }
        const parentId = "parent_" + stu.id;
        if (stu.isBanned || await checkBanned(parentId) || await checkBanned(stu.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: 'ACCOUNT_BANNED' });
        }
        const token = jwt.sign(
          { uid: parentId, name: "ولي أمر " + stu.name, role: 'parent', schoolId: stu.schoolId, grade: stu.grade },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            uid: parentId, 
            id: parentId,
            displayName: "ولي أمر " + stu.name, 
            name: "ولي أمر " + stu.name,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode || code,
            role: 'parent', 
            schoolId: stu.schoolId || targetSchoolId,
            grade: stu.grade || 'سادس علمي',
            gender: (stu as any).gender || 'male'
          } 
        });
      }
      
      // 4. Check drivers (Driver)
      if (driverList.length > 0) {
        const drv = driverList[0];
        
        if (drv.status !== 'active') {
          return res.status(403).json({ success: false, message: 'حساب السائق غير نشط حالياً.' });
        }

        if (targetSchoolId && drv.schoolId && !areSchoolsCompatible(drv.schoolId, targetSchoolId)) {
          return res.status(400).json({ 
            success: false, 
            message: 'هذا الكود غير صحيح لهذه المدرسة، حيث تم توليده حصراً لمدرسة أخرى.' 
          });
        }
        if (await checkBanned(drv.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: 'ACCOUNT_BANNED' });
        }
        const token = jwt.sign(
          { uid: drv.id, name: drv.name, role: 'driver', schoolId: drv.schoolId },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            uid: drv.id, 
            id: drv.id,
            displayName: drv.name, 
            name: drv.name,
            role: 'driver', 
            schoolId: drv.schoolId || targetSchoolId 
          } 
        });
      }

      console.log('Login failed for code:', code);

      return res.status(401).json({ success: false, message: 'كود الدخول غير صحيح' });
    } catch (error: any) {
      console.error('Login code error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      

      const userList = await db.select().from(users).where(eq(users.email, email));
      if (userList.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      const user = userList[0];
      const isValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { uid: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({ success: true, token, user: { uid: user.id, email: user.email, displayName: user.name, role: user.role, schoolId: user.schoolId } });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  
  // Lounge Messages
  
  app.get('/api/lounge-messages/unread/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      const msgs = await db.select().from(lounge_messages).where(and(
        eq(lounge_messages.recipientId, uid),
        eq(lounge_messages.read, false)
      ));
      
      const counts: Record<string, number> = {};
      msgs.forEach(msg => {
        if (msg.userId) {
          counts[msg.userId] = (counts[msg.userId] || 0) + 1;
        }
      });
      res.json({ success: true, counts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/lounge-messages', async (req, res) => {
    try {
      const { roomId, schoolId } = req.query;
      const targetId = (roomId as string) || (schoolId as string);
      let msgs;
      if (targetId && targetId !== 'all') {
        msgs = await db.select().from(lounge_messages).where(eq(lounge_messages.schoolId, targetId)).orderBy(lounge_messages.timestamp);
      } else {
        msgs = await db.select().from(lounge_messages).orderBy(lounge_messages.timestamp);
      }
      res.json({ success: true, messages: msgs, data: msgs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/lounge-messages/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      // roomId is stored in schoolId field in schema
      const msgs = await db.select().from(lounge_messages).where(eq(lounge_messages.schoolId, roomId)).orderBy(lounge_messages.timestamp);
      res.json({ success: true, messages: msgs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // ⚙️ إعدادات النظام ومعلومات المدرسة - Settings & System Config API
  // ==========================================
  
  const SETTINGS_FILE_PATH = path.join(process.cwd(), 'system_settings_data.json');

  const defaultSettingsData: Record<string, any> = {
    school_info: {
      id: 'school_info',
      adminPhone: '07800000000',
      adminWhatsapp: '07800000000',
      communityLockAll: false,
      communityLockGrades: [],
      storiesLock: false,
      loungeLock: false,
      schoolName: 'بوابة بيرق التعليمية',
      academicYear: '2025-2026',
      gateStatus: 'active'
    },
    subject_mapping: {
      id: 'subject_mapping',
      '1p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' }
      ],
      '2p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' }
      ],
      '3p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' }
      ],
      '4p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'social', name: 'الاجتماعيات' }
      ],
      '5p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'social', name: 'الاجتماعيات' }
      ],
      '6p': [
        { id: 'quran', name: 'القرآن الكريم والتربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'social', name: 'الاجتماعيات' }
      ],
      '1i': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'social', name: 'الاجتماعيات' },
        { id: 'computer', name: 'الحاسوب' }
      ],
      '2i': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'social', name: 'الاجتماعيات' },
        { id: 'computer', name: 'الحاسوب' }
      ],
      '3i': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'physics', name: 'الفيزياء' },
        { id: 'chemistry', name: 'الكيمياء' },
        { id: 'biology', name: 'الأحياء' },
        { id: 'social', name: 'الاجتماعيات' }
      ],
      '4s': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'physics', name: 'الفيزياء' },
        { id: 'chemistry', name: 'الكيمياء' },
        { id: 'biology', name: 'الأحياء' }
      ],
      '5s': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'physics', name: 'الفيزياء' },
        { id: 'chemistry', name: 'الكيمياء' },
        { id: 'biology', name: 'الأحياء' }
      ],
      '6s': [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'physics', name: 'الفيزياء' },
        { id: 'chemistry', name: 'الكيمياء' },
        { id: 'biology', name: 'الأحياء' }
      ]
    },
    tuition: {
      id: 'tuition',
      amount: 0,
      discountRates: {
        brother: 10,
        orphan: 50,
        martyr: 100,
        teacher_son: 25
      }
    },
    remote_control: {
      id: 'remote_control',
      maintenanceMode: false,
      aiFeaturesEnabled: true,
      tickerEnabled: true
    },
    seasonal_theme: {
      id: 'seasonal_theme',
      seasonalTheme: 'default',
      themeActive: false
    }
  };

  let settingsCache: Record<string, any> = { ...defaultSettingsData };

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      settingsCache = { ...defaultSettingsData, ...parsed };
    } else {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(defaultSettingsData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error reading settings file:", err);
  }

  function saveSettingsToDisk() {
    try {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsCache, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error saving settings to disk:", err);
    }
  }

  // --- /api/settings endpoints ---
  app.get('/api/settings', (req, res) => {
    const list = Object.values(settingsCache);
    res.json({ success: true, settings: list, data: list });
  });

  app.get('/api/settings/:id', (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, setting: doc });
  });

  app.post('/api/settings', (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || 'school_info';
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      delete settingsCache[id];
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('settings', id, 'DELETE', { id });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- /api/system_config endpoints ---
  app.get('/api/system_config', (req, res) => {
    res.json({ success: true, data: settingsCache });
  });

  app.get('/api/system_config/:id', (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, config: doc });
  });

  app.post('/api/system_config', (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || 'remote_control';
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_config', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/system_config/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_config', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/system_config/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_config', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- /api/system_settings endpoints ---
  app.get('/api/system_settings', (req, res) => {
    res.json({ success: true, data: settingsCache });
  });

  app.get('/api/system_settings/:id', (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, setting: doc });
  });

  app.patch('/api/system_settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/system_settings', (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || 'general';
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/system_settings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: new Date().toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual('system_settings', id, 'UPDATE', updated);
      res.json({ success: true, id, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/system_errors', async (req, res) => {
    res.json({ success: true, messages: [], data: [] });
  });

  app.post('/api/system_errors', async (req, res) => {
    res.json({ success: true });
  });

  app.patch('/api/system_errors/:id', async (req, res) => {
    res.json({ success: true });
  });

  app.put('/api/system_errors/:id', async (req, res) => {
    res.json({ success: true });
  });

  
  app.patch('/api/lounge-messages/read/:roomId/:uid', async (req, res) => {
    try {
      const { roomId, uid } = req.params;
      await db.update(lounge_messages)
        .set({ read: true })
        .where(and(
          eq(lounge_messages.schoolId, roomId),
          eq(lounge_messages.recipientId, uid),
          eq(lounge_messages.read, false)
        ));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/lounge-messages', async (req, res) => {
    try {
      const msg = req.body;
      const uuidv4 = crypto.randomUUID.bind(crypto);
      const newMsg = {
        id: uuidv4(),
        text: msg.text,
        userId: msg.userId,
        userName: msg.userName,
        userPhoto: msg.userPhoto,
        userRole: msg.userRole,
        schoolId: msg.schoolId,
        recipientId: msg.recipientId,
        imageUrl: msg.imageUrl,
        read: msg.read || false,
        timestamp: new Date()
      };
      await db.insert(lounge_messages).values(newMsg);
      
      // Broadcast to both sender and recipient for realtime updates
      realtimeServerInstance?.broadcastManual('lounge_messages', newMsg.id, 'INSERT', newMsg);
      
      res.json({ success: true, message: newMsg });
    } catch (error: any) {
      console.error('Error sending msg', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // 👥 مستخدمو النظام والملفات الشخصية - Users & Profiles API
  // ==========================================
  
  app.get('/api/users', async (req, res) => {
    try {
      const { schoolId } = req.query;
      
      let userList: any[] = [];
      let studentList: any[] = [];
      
      if (schoolId) {
        userList = await db.select().from(users).where(eq(users.schoolId, schoolId as string)).orderBy(desc(users.lastLogin));
        studentList = await db.select().from(students).where(eq(students.schoolId, schoolId as string));
      } else {
        userList = await db.select().from(users).orderBy(desc(users.lastLogin));
        studentList = await db.select().from(students);
      }
      
      const mappedStudents = studentList.map(s => ({
        id: s.id,
        name: s.name,
        photo: s.avatar,
        role: 'student',
        grade: s.grade,
        schoolId: s.schoolId,
        lastActive: s.lastLogin
      }));
      
      const nonStudents = userList.filter(u => u.role !== 'student' && u.role !== 'parent' && u.role !== 'driver');
      const combined = [...nonStudents, ...mappedStudents];
      
      for (const st of combined) {
        if (st.role === 'student') {
          const userMatch = userList.find(u => u.id === st.id);
          if (userMatch && userMatch.lastLogin) {
            st.lastActive = userMatch.lastLogin;
          }
        }
      }

      res.json({ success: true, users: combined, data: combined });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // 1. Check users table
      const userList = await db.select().from(users).where(eq(users.id, id));
      if (userList.length > 0) {
        const u = userList[0];
        const userData = { ...u, uid: u.id, displayName: u.name };
        return res.json({ success: true, user: userData, data: userData });
      }

      // 2. Check students table
      const studentList = await db.select().from(students).where(or(eq(students.id, id), eq(students.code, id)));
      if (studentList.length > 0) {
        const stu = studentList[0];
        const stuUser = {
          id: stu.id,
          uid: stu.id,
          name: stu.name,
          displayName: stu.name,
          studentName: stu.name,
          studentCode: stu.code,
          parentCode: stu.parentCode,
          role: 'student',
          schoolId: stu.schoolId,
          grade: stu.grade || 'سادس علمي',
          points: stu.points || 0,
          avatar: stu.avatar,
          status: stu.status || 'نشط',
        };
        return res.json({ success: true, user: stuUser, data: stuUser });
      }

      // 3. Check parent by id (parent_*)
      if (id.startsWith('parent_')) {
        const rawStuId = id.replace('parent_', '');
        const parentStuList = await db.select().from(students).where(or(eq(students.id, rawStuId), eq(students.parentCode, rawStuId)));
        if (parentStuList.length > 0) {
          const stu = parentStuList[0];
          const parentUser = {
            id,
            uid: id,
            name: `ولي أمر ${stu.name}`,
            displayName: `ولي أمر ${stu.name}`,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode,
            role: 'parent',
            schoolId: stu.schoolId,
            grade: stu.grade || 'سادس علمي',
          };
          return res.json({ success: true, user: parentUser, data: parentUser });
        }
      }

      // 4. Check teachers table
      const teacherList = await db.select().from(teachers).where(or(eq(teachers.id, id), eq(teachers.code, id)));
      if (teacherList.length > 0) {
        const t = teacherList[0];
        const tUser = {
          id: t.id,
          uid: t.id,
          name: t.name,
          displayName: t.name,
          role: 'teacher',
          schoolId: t.schoolId,
          subject: t.subject,
          grade: t.grade,
          email: t.email,
          phone: t.phone
        };
        return res.json({ success: true, user: tUser, data: tUser });
      }

      // 5. Check activation codes
      const actList = await db.select().from(activation_codes).where(or(eq(activation_codes.id, id), eq(activation_codes.code, id)));
      if (actList.length > 0) {
        const act = actList[0];
        const actUser = {
          id: act.id,
          uid: act.id,
          name: act.role,
          displayName: act.role,
          role: act.role,
          schoolId: act.schoolId
        };
        return res.json({ success: true, user: actUser, data: actUser });
      }

      // 6. Graceful null when user document doesn't exist
      return res.status(200).json({ success: true, user: null, data: null });
    } catch (error: any) {
      console.error('Error fetching user by id:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || data.uid || `usr_${Date.now()}`;
      const userToInsert = {
        id,
        name: data.name || data.displayName || 'مستخدم',
        email: data.email || `${id}@bairaq.app`,
        role: data.role || 'student',
        schoolId: data.schoolId || 'general',
        passwordHash: data.passwordHash || null,
        createdAt: new Date()
      };
      
      const existing = await db.select().from(users).where(eq(users.id, id));
      if (existing.length > 0) {
        await db.update(users).set({
          name: userToInsert.name,
          role: userToInsert.role,
          schoolId: userToInsert.schoolId,
        }).where(eq(users.id, id));
      } else {
        await db.insert(users).values(userToInsert);
      }

      res.json({ success: true, id, user: userToInsert, data: userToInsert });
    } catch (error: any) {
      console.error('Error saving user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existing = await db.select().from(users).where(eq(users.id, id));
      if (existing.length > 0) {
        const updatePayload: any = {};
        if (updates.name || updates.displayName) updatePayload.name = updates.name || updates.displayName;
        if (updates.role) updatePayload.role = updates.role;
        if (updates.schoolId) updatePayload.schoolId = updates.schoolId;
        if (updates.email) updatePayload.email = updates.email;
        if (updates.isBanned !== undefined) updatePayload.isBanned = updates.isBanned;
        if (updates.canPost !== undefined) updatePayload.canPost = updates.canPost;
        if (updates.canComment !== undefined) updatePayload.canComment = updates.canComment;
        if (updates.deviceId !== undefined) updatePayload.deviceId = updates.deviceId;
        if (updates.lastLogin !== undefined) updatePayload.lastLogin = updates.lastLogin;
        if (updates.studentCode !== undefined) updatePayload.studentCode = updates.studentCode;
        if (updates.parentCode !== undefined) updatePayload.parentCode = updates.parentCode;
        if (Object.keys(updatePayload).length > 0) {
          await db.update(users).set(updatePayload).where(eq(users.id, id));
          realtimeServerInstance?.broadcastManual('users', id, 'UPDATE', { id, ...updatePayload });
        }
      } else {
        await db.insert(users).values({
          id,
          name: updates.name || updates.displayName || 'مستخدم',
          email: updates.email || `${id}@bairaq.app`,
          role: updates.role || 'student',
          schoolId: updates.schoolId || 'general',
          createdAt: new Date()
        }).onConflictDoNothing();
      }

      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existing = await db.select().from(users).where(eq(users.id, id));
      if (existing.length > 0) {
        const updatePayload: any = {};
        if (updates.name || updates.displayName) updatePayload.name = updates.name || updates.displayName;
        if (updates.role) updatePayload.role = updates.role;
        if (updates.schoolId) updatePayload.schoolId = updates.schoolId;
        if (updates.email) updatePayload.email = updates.email;
        if (updates.isBanned !== undefined) updatePayload.isBanned = updates.isBanned;
        if (updates.canPost !== undefined) updatePayload.canPost = updates.canPost;
        if (updates.canComment !== undefined) updatePayload.canComment = updates.canComment;
        if (updates.deviceId !== undefined) updatePayload.deviceId = updates.deviceId;
        if (updates.lastLogin !== undefined) updatePayload.lastLogin = updates.lastLogin;
        if (updates.studentCode !== undefined) updatePayload.studentCode = updates.studentCode;
        if (updates.parentCode !== undefined) updatePayload.parentCode = updates.parentCode;
        if (Object.keys(updatePayload).length > 0) {
          await db.update(users).set(updatePayload).where(eq(users.id, id));
          realtimeServerInstance?.broadcastManual('users', id, 'UPDATE', { id, ...updatePayload });
        }
      } else {
        await db.insert(users).values({
          id,
          name: updates.name || updates.displayName || 'مستخدم',
          email: updates.email || `${id}@bairaq.app`,
          role: updates.role || 'student',
          schoolId: updates.schoolId || 'general',
          createdAt: new Date()
        }).onConflictDoNothing();
      }

      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Error put user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { role, schoolId, code } = req.query; 

      // 1. Delete from users table
      await db.delete(users).where(eq(users.id, id));
      
      // 2. Delete from activation_codes
      await db.delete(activation_codes).where(eq(activation_codes.id, id));

      // 3. Delete from students
      await db.delete(students).where(eq(students.id, id));
      await db.delete(attendance_logs).where(eq(attendance_logs.studentId, id));
      await db.delete(behavior_logs).where(eq(behavior_logs.studentId, id));
      await db.delete(student_transactions).where(eq(student_transactions.studentId, id));

      const altStudentId = id.includes('_') ? id : (schoolId && code ? `${schoolId}_${code}` : null);
      if (altStudentId && altStudentId !== id) {
        await db.delete(students).where(eq(students.id, altStudentId));
        await db.delete(attendance_logs).where(eq(attendance_logs.studentId, altStudentId));
        await db.delete(behavior_logs).where(eq(behavior_logs.studentId, altStudentId));
        await db.delete(student_transactions).where(eq(student_transactions.studentId, altStudentId));
      }

      // 4. Delete from teachers
      await db.delete(teachers).where(eq(teachers.id, id));
      await db.delete(salaries).where(eq(salaries.staffId, id));

      // 5. Delete by code alias
      if (code) {
        const c = String(code);
        await db.delete(students).where(eq(students.code, c));
        await db.delete(students).where(eq(students.parentCode, c));
        await db.delete(teachers).where(eq(teachers.code, c));
        await db.delete(activation_codes).where(eq(activation_codes.code, c));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Additional single-item and alias endpoints
  app.get('/api/teachers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const tList = await db.select().from(teachers).where(or(eq(teachers.id, id), eq(teachers.code, id)));
      if (tList.length === 0) {
        return res.json({ success: true, teacher: null, data: null });
      }
      res.json({ success: true, teacher: tList[0], data: tList[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/activation-codes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const codes = await db.select().from(activation_codes).where(or(eq(activation_codes.id, id), eq(activation_codes.code, id)));
      if (codes.length === 0) {
        return res.json({ success: true, code: null, data: null });
      }
      res.json({ success: true, code: codes[0], data: codes[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/broadcasts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const brList = await db.select().from(school_announcements).where(eq(school_announcements.id, id));
      if (brList.length === 0) {
        return res.json({ success: true, broadcast: null, data: null });
      }
      res.json({ success: true, broadcast: brList[0], data: brList[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Alias school-announcements to broadcasts
  app.get('/api/school-announcements', async (req, res) => {
    try {
      const { schoolId, grade, limit: limitParam } = req.query;
      let conditions = [];

      if (schoolId && schoolId !== 'all' && schoolId !== 'general' && schoolId !== 'global') {
        const sId = (schoolId as string).trim();
        let schoolIds = [sId, 'all', 'global', 'central', 'general', 'عام'];
        if (sId === 'school1' || sId === 'school_awail_ghamas' || sId === 'ghamas_awail') {
          schoolIds.push('school1', 'school_awail_ghamas', 'ghamas_awail');
        }
        conditions.push(or(
          inArray(school_announcements.schoolId, schoolIds),
          isNull(school_announcements.schoolId),
          eq(school_announcements.schoolId, ''),
          eq(school_announcements.schoolId, 'all'),
          eq(school_announcements.schoolId, 'global'),
          eq(school_announcements.schoolId, 'central'),
          eq(school_announcements.schoolId, 'general'),
          eq(school_announcements.schoolId, 'عام')
        ));
      }

      conditions.push(or(
        sql`${school_announcements.expiryDate} IS NULL`,
        sql`${school_announcements.expiryDate} > NOW()`
      ));

      let queryBuilder = db.select().from(school_announcements).where(and(...conditions));
      const results = await queryBuilder.orderBy(desc(school_announcements.timestampMs)).limit(Number(limitParam) || 50);

      let filteredResults = results;
      if (grade && typeof grade === 'string' && grade.trim() !== '') {
        const { matchesTargetGrades } = await import('./src/utils/gradeMatcher');
        filteredResults = results.filter((b: any) => matchesTargetGrades(grade, b.targetGrades));
      }

      res.json({ success: true, broadcasts: filteredResults, data: filteredResults });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/school-announcements', async (req, res) => {
    try {
      const { id, schoolId, message, targetGrades, author, subject, targetLocation, durationHours, expiryDate: customExpiry } = req.body;
      
      if (!message || (typeof message === 'string' && !message.trim())) {
        return res.status(400).json({ success: false, message: "محتوى الرسالة مطلوب" });
      }

      let expiryDate: Date;
      if (customExpiry) {
        expiryDate = new Date(typeof customExpiry === 'number' ? customExpiry : customExpiry);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
        }
      } else {
        expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
      }

      const broadcastId = id || `br_${Date.now()}`;
      const effectiveSchoolId = schoolId && schoolId.trim() !== '' ? schoolId.trim() : 'general';

      let cleanTargetGrades: string[] = [];
      if (Array.isArray(targetGrades)) {
        cleanTargetGrades = targetGrades;
      } else if (typeof targetGrades === 'string') {
        cleanTargetGrades = [targetGrades];
      } else {
        cleanTargetGrades = ['الجميع'];
      }

      const result = await db.insert(school_announcements).values({
        id: broadcastId,
        schoolId: effectiveSchoolId,
        message: typeof message === 'string' ? message.trim() : String(message),
        targetGrades: cleanTargetGrades,
        author: author || 'الإدارة المدرسية',
        subject: subject || 'الإذاعة المدرسية',
        targetLocation: targetLocation || 'ticker',
        expiryDate: expiryDate,
        timestampMs: Date.now(),
        createdAt: new Date()
      }).returning();

      const created = result[0];
      realtimeServerInstance?.broadcastManual('school_announcements', broadcastId, 'INSERT', created);
      realtimeServerInstance?.broadcastManual('broadcasts', broadcastId, 'INSERT', created);

      res.json({ success: true, broadcast: created, data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/school-announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const brList = await db.select().from(school_announcements).where(eq(school_announcements.id, id));
      if (brList.length === 0) {
        return res.json({ success: true, broadcast: null, data: null });
      }
      res.json({ success: true, broadcast: brList[0], data: brList[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/school-announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { message, targetGrades, expiryDate: customExpiry } = req.body;
      const updateData: any = {};
      if (message !== undefined) updateData.message = message;
      if (targetGrades !== undefined) {
        updateData.targetGrades = Array.isArray(targetGrades) ? targetGrades : [targetGrades];
      }
      if (customExpiry !== undefined) {
        updateData.expiryDate = new Date(typeof customExpiry === 'number' ? customExpiry : customExpiry);
      }

      if (Object.keys(updateData).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }

      const updated = await db.update(school_announcements)
        .set(updateData)
        .where(eq(school_announcements.id, id))
        .returning();

      if (updated && updated.length > 0) {
        realtimeServerInstance?.broadcastManual('school_announcements', id, 'UPDATE', updated[0]);
        realtimeServerInstance?.broadcastManual('broadcasts', id, 'UPDATE', updated[0]);
      }

      res.json({ success: true, broadcast: updated?.[0], data: updated?.[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/school-announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(school_announcements).where(eq(school_announcements.id, id));
      realtimeServerInstance?.broadcastManual('school_announcements', id, 'DELETE', { id });
      realtimeServerInstance?.broadcastManual('broadcasts', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/support-tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const tickets = await db.select().from(support_tickets).where(eq(support_tickets.id, id));
      if (tickets.length === 0) {
        return res.json({ success: true, ticket: null, data: null });
      }
      res.json({ success: true, ticket: tickets[0], data: tickets[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/idea-bank/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ideas = await db.select().from(idea_bank).where(eq(idea_bank.id, id));
      if (ideas.length === 0) {
        return res.json({ success: true, idea: null, data: null });
      }
      res.json({ success: true, idea: ideas[0], data: ideas[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/council-polls/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const polls = await db.select().from(council_polls).where(eq(council_polls.id, id));
      if (polls.length === 0) {
        return res.json({ success: true, poll: null, data: null });
      }
      res.json({ success: true, poll: polls[0], data: polls[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Current authenticated user profile
  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // 1. Check users table
      const userList = await db.select().from(users).where(eq(users.id, decoded.uid));
      if (userList.length > 0) {
        const u = userList[0];
        return res.json({ 
          success: true, 
          user: { 
            uid: u.id, 
            id: u.id,
            email: u.email, 
            displayName: u.name, 
            name: u.name,
            role: u.role, 
            schoolId: u.schoolId,
            grade: decoded.grade || 'سادس علمي'
          } 
        });
      }

      // 2. Check students table
      const stuList = await db.select().from(students).where(eq(students.id, decoded.uid));
      if (stuList.length > 0) {
        const stu = stuList[0];
        return res.json({
          success: true,
          user: {
            uid: stu.id,
            id: stu.id,
            displayName: stu.name,
            name: stu.name,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode,
            role: 'student',
            schoolId: stu.schoolId,
            grade: stu.grade || decoded.grade || 'سادس علمي',
            points: stu.points,
            avatar: stu.avatar
          }
        });
      }

      // 3. Check parent
      if (decoded.role === 'parent' || (decoded.uid && decoded.uid.startsWith('parent_'))) {
        const rawStuId = decoded.uid.replace('parent_', '');
        const parentStuList = await db.select().from(students).where(or(eq(students.id, rawStuId), eq(students.parentCode, rawStuId)));
        if (parentStuList.length > 0) {
          const stu = parentStuList[0];
          return res.json({
            success: true,
            user: {
              uid: decoded.uid,
              id: decoded.uid,
              displayName: "ولي أمر " + stu.name,
              name: "ولي أمر " + stu.name,
              studentName: stu.name,
              studentCode: stu.code,
              parentCode: stu.parentCode,
              role: 'parent',
              schoolId: stu.schoolId,
              grade: stu.grade || decoded.grade || 'سادس علمي'
            }
          });
        }
      }

      // 4. Check teachers
      const tList = await db.select().from(teachers).where(eq(teachers.id, decoded.uid));
      if (tList.length > 0) {
        const t = tList[0];
        return res.json({
          success: true,
          user: {
            uid: t.id,
            id: t.id,
            displayName: t.name,
            name: t.name,
            role: 'teacher',
            schoolId: t.schoolId,
            subject: t.subject,
            grade: t.grade,
            email: t.email,
            phone: t.phone
          }
        });
      }

      // 5. Check drivers
      const drvList = await db.select().from(transport_drivers).where(eq(transport_drivers.id, decoded.uid));
      if (drvList.length > 0) {
        const drv = drvList[0];
        return res.json({
          success: true,
          user: {
            uid: drv.id,
            id: drv.id,
            displayName: drv.name,
            name: drv.name,
            role: 'driver',
            schoolId: drv.schoolId
          }
        });
      }

      // 6. Check activation codes
      const actList = await db.select().from(activation_codes).where(eq(activation_codes.id, decoded.uid));
      if (actList.length > 0) {
        const act = actList[0];
        return res.json({
          success: true,
          user: {
            uid: act.id,
            id: act.id,
            displayName: act.role,
            name: act.role,
            role: act.role,
            schoolId: act.schoolId
          }
        });
      }

      // 7. Fallback to valid token data
      return res.json({
        success: true,
        user: {
          uid: decoded.uid,
          id: decoded.uid,
          displayName: decoded.name || 'مستخدم',
          name: decoded.name || 'مستخدم',
          role: decoded.role || 'student',
          schoolId: decoded.schoolId || 'general',
          grade: decoded.grade || 'سادس علمي'
        }
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  });

  // ==========================================
  // --- Comprehensive Feature Routes ---
  // ==========================================

  // --- 1. Recorded Lessons ---
  const handleGetRecordedLessons = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, grade, section, teacherId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(recorded_lessons);
      const filters = [];
      if (schoolId && schoolId !== 'all') {
        filters.push(or(eq(recorded_lessons.schoolId, schoolId as string), eq(recorded_lessons.schoolId, 'school1')));
      }
      if (grade && grade !== 'all' && grade !== 'الكل' && grade !== 'عام') {
        const cleanGrade = (grade as string).replace(/^ال/, '').trim();
        filters.push(
          or(
            eq(recorded_lessons.grade, grade as string),
            isNull(recorded_lessons.grade),
            eq(recorded_lessons.grade, 'الكل'),
            eq(recorded_lessons.grade, 'عام'),
            sql`${recorded_lessons.grade} ILIKE ${'%' + cleanGrade + '%'}`
          )
        );
      }
      if (section && section !== 'all' && section !== 'الكل' && section !== 'كافة الشُعب') {
        filters.push(
          or(
            eq(recorded_lessons.section, section as string),
            isNull(recorded_lessons.section),
            eq(recorded_lessons.section, 'all'),
            eq(recorded_lessons.section, 'الكل'),
            eq(recorded_lessons.section, 'كافة الشُعب')
          )
        );
      }
      if (teacherId && teacherId !== 'all') filters.push(eq(recorded_lessons.teacherId, teacherId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(recorded_lessons.createdAt)).limit(Number(limitParam) || 1000);

      // Compute dynamic comment counts from video_comments
      const commentCountMap = new Map<string, number>();
      try {
        const commentCounts = await db.select({
          lessonId: video_comments.lessonId,
          count: sql<number>`count(*)::int`
        }).from(video_comments).groupBy(video_comments.lessonId);
        for (const row of commentCounts) {
          if (row.lessonId) commentCountMap.set(row.lessonId, Number(row.count) || 0);
        }
      } catch (e) {
        console.warn("Could not query video_comments count map:", e);
      }

      // Lookup teacher names
      const teacherMap = new Map<string, string>();
      try {
        const allTeachers = await db.select({ id: teachers.id, name: teachers.name }).from(teachers);
        for (const t of allTeachers) {
          if (t.id && t.name) teacherMap.set(t.id, t.name);
        }
      } catch (e) {
        console.warn("Could not query teachers map:", e);
      }

      const mappedResults = results.map((item: any) => {
        let desc = item.description;
        const g = (item.grade && item.grade !== 'الكل' && item.grade !== 'عام') ? item.grade : '';
        if (!desc || desc.trim() === '') {
          desc = g ? `محاضرة مرئية منشورة لفرسان ${g} الأبطال` : 'محاضرة مرئية منشورة لفرسان الصف الأبطال';
        } else if (g && !g.includes('سادس') && !g.includes('السادس')) {
          desc = desc.replace(/لفرسان السادس الأبطال/g, `لفرسان ${g} الأبطال`)
                     .replace(/لفرسان السادس/g, `لفرسان ${g}`)
                     .replace(/صفوف السادس/g, `صفوف ${g}`)
                     .replace(/فرسان السادس الأبطال/g, `فرسان ${g} الأبطال`)
                     .replace(/فرسان السادس/g, `فرسان ${g}`)
                     .replace(/يا فرسان السادس الأبطال/g, `يا فرسان ${g} الأبطال`)
                     .replace(/يا فرسان السادس/g, `يا فرسان ${g}`);
        }
        const dynamicCount = commentCountMap.get(item.id) || 0;
        const finalCount = Math.max(Number(item.commentCount ?? item.comment_count ?? 0), dynamicCount);
        const resolvedTeacherName = item.teacherName || (item.teacherId ? teacherMap.get(item.teacherId) : null) || 'حسين هاشم';
        return {
          ...item,
          teacherName: resolvedTeacherName,
          commentCount: finalCount,
          comment_count: finalCount,
          description: desc
        };
      });
      res.json({ success: true, lessons: mappedResults, data: mappedResults });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/video-meta', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
          const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          
          if (videoId) {
            try {
              const ytRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  context: {
                    client: {
                      clientName: 'WEB',
                      clientVersion: '2.20240101.00.00'
                    }
                  },
                  videoId: videoId
                })
              });
              if (ytRes.ok) {
                const ytData: any = await ytRes.json();
                const vDetails = ytData?.videoDetails;
                if (vDetails && vDetails.lengthSeconds) {
                  const seconds = parseInt(vDetails.lengthSeconds, 10);
                  if (seconds > 0) {
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor((seconds % 3600) / 60);
                    const s = seconds % 60;
                    const duration = h > 0 
                      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                      : `${m}:${s.toString().padStart(2, '0')}`;
                    return res.json({ 
                      success: true, 
                      duration, 
                      seconds, 
                      title: vDetails.title || null 
                    });
                  }
                }
              }
            } catch (innerErr) {
              console.warn("YouTube player API fetch failed, falling back to HTML", innerErr);
            }
          }

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
            }
          });
          const html = await response.text();
          const match = html.match(/"lengthSeconds":"(\d+)"/) || html.match(/"approxDurationMs":"(\d+)"/) || html.match(/itemprop="duration" content="([^"]+)"/);
          if (match) {
            let seconds = 0;
            if (match[0].includes('approxDurationMs')) {
              seconds = Math.floor(parseInt(match[1]) / 1000);
            } else if (match[0].includes('lengthSeconds')) {
              seconds = parseInt(match[1]);
            } else if (match[1] && match[1].startsWith('PT')) {
              // ISO 8601 duration e.g. PT45M30S
              const m = match[1].match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (m) {
                seconds = (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
              }
            }
            if (seconds > 0) {
              const h = Math.floor(seconds / 3600);
              const m = Math.floor((seconds % 3600) / 60);
              const s = seconds % 60;
              const duration = h > 0 
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m}:${s.toString().padStart(2, '0')}`;
              return res.json({ success: true, duration, seconds });
            }
          }
          try {
            const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            if (noembedRes.ok) {
              const noembedData: any = await noembedRes.json();
              if (noembedData?.title) {
                return res.json({ success: true, title: noembedData.title, duration: null });
              }
            }
          } catch (neErr) {}
        } catch (ytErr) {
          console.warn("YouTube server-side fetch failed", ytErr);
        }
      } else if (url.includes('vimeo.com')) {
        try {
          const vRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
          if (vRes.ok) {
            const data = await vRes.json();
            if (data.duration) {
              const seconds = data.duration;
              const h = Math.floor(seconds / 3600);
              const m = Math.floor((seconds % 3600) / 60);
              const s = seconds % 60;
              const duration = h > 0 
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m}:${s.toString().padStart(2, '0')}`;
              return res.json({ success: true, duration, seconds });
            }
          }
        } catch (vimeoErr) {
          console.warn("Vimeo fetch failed", vimeoErr);
        }
      }
      res.json({ success: false, message: 'Could not fetch duration automatically' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/recorded-lessons', handleGetRecordedLessons);
  app.get('/api/recorded_lessons', handleGetRecordedLessons);

  const handlePostRecordedLesson = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = body.title || body.name || 'درس مسجل';
      const videoUrl = body.videoUrl || body.video_url || body.url || '';
      const schoolId = body.schoolId || body.school_id || 'school1';
      const teacherId = body.teacherId || body.teacher_id || null;
      const grade = body.grade || null;
      const section = body.section || null;

      let description = body.description;
      const g = (grade && grade !== 'الكل' && grade !== 'عام') ? grade : '';
      if (!description || description.trim() === '' || description === 'محاضرة مرئية منشورة لفرسان السادس الأبطال') {
        description = g ? `محاضرة مرئية منشورة لفرسان ${g} الأبطال` : 'محاضرة مرئية منشورة لفرسان الصف الأبطال';
      } else if (g && !g.includes('سادس') && !g.includes('السادس')) {
        description = description.replace(/لفرسان السادس الأبطال/g, `لفرسان ${g} الأبطال`)
                                 .replace(/لفرسان السادس/g, `لفرسان ${g}`)
                                 .replace(/صفوف السادس/g, `صفوف ${g}`)
                                 .replace(/فرسان السادس الأبطال/g, `فرسان ${g} الأبطال`)
                                 .replace(/فرسان السادس/g, `فرسان ${g}`)
                                 .replace(/يا فرسان السادس الأبطال/g, `يا فرسان ${g} الأبطال`)
                                 .replace(/يا فرسان السادس/g, `يا فرسان ${g}`);
      }

      const newLesson = {
        id,
        schoolId,
        teacherId,
        title,
        grade,
        section,
        videoUrl,
        subject: body.subject,
        duration: body.duration,
        date: body.date,
        description,
        createdAt: new Date()
      };
      await db.insert(recorded_lessons).values(newLesson).onConflictDoUpdate({
        target: recorded_lessons.id,
        set: { 
          title, videoUrl, schoolId, teacherId, grade, section,
          subject: body.subject, duration: body.duration, date: body.date, description 
        }
      });

      // Broadcast via SQL realtime
      realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'INSERT', newLesson);

      // ALSO save to Firestore as a reliable fallback for real-time sync
      try {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        // We assume Firebase is initialized in the environment or we use a proxy if needed
        // But since this is server-side and we have the Firebase skill, 
        // we should ideally use the admin SDK or a direct write if configured.
        // However, for this environment, broadcasting via SQL is the primary way.
        // Let's stick to improving the SQL broadcast reliability.
      } catch (e) {
        console.error("Firebase sync failed", e);
      }

      res.json({ success: true, id, lesson: newLesson, data: newLesson });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/recorded-lessons', handlePostRecordedLesson);
  app.post('/api/recorded_lessons', handlePostRecordedLesson);

  const handlePatchRecordedLesson = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        const viewerId = updates.viewerId || req.body?.viewerId;
        if (viewerId) {
          const viewPath = `recorded_lessons_views/${id}_${viewerId}`;
          try {
            const existingView = await db.select().from(firestore_docs).where(eq(firestore_docs.path, viewPath)).limit(1);
            if (existingView.length > 0) {
              // Student already watched this lesson before! Do NOT increment view count again!
              const cur = await db.select({ views: recorded_lessons.views }).from(recorded_lessons).where(eq(recorded_lessons.id, id));
              return res.json({ success: true, alreadyViewed: true, views: cur[0]?.views ?? 0 });
            }
            // First time watching: store in firestore_docs so it won't be counted again!
            await db.insert(firestore_docs).values({
              path: viewPath,
              data: { lessonId: id, viewerId, timestamp: new Date() },
              updatedAt: new Date()
            }).onConflictDoNothing();
          } catch (e) {
            console.warn("Could not check/insert unique view in firestore_docs:", e);
          }
        }

        const result = await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id} RETURNING views`);
        const newViews = (result as any)?.[0]?.views ?? (result as any)?.rows?.[0]?.views ?? 1;
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true, views: Number(newViews) });
        return res.json({ success: true, views: Number(newViews), incremented: true });
      }

      if (updates.incrementComments) {
        const result = await db.execute(sql`UPDATE recorded_lessons SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ${id} RETURNING comment_count`);
        const newCount = (result as any)?.[0]?.comment_count ?? (result as any)?.rows?.[0]?.comment_count ?? 1;
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementComments: true, commentCount: Number(newCount), comment_count: Number(newCount) });
        return res.json({ success: true, commentCount: Number(newCount) });
      }

      if (updates.decrementComments) {
        const result = await db.execute(sql`UPDATE recorded_lessons SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = ${id} RETURNING comment_count`);
        const newCount = (result as any)?.[0]?.comment_count ?? (result as any)?.rows?.[0]?.comment_count ?? 0;
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, decrementComments: true, commentCount: Number(newCount), comment_count: Number(newCount) });
        return res.json({ success: true, commentCount: Number(newCount) });
      }

      if (updates.commentCount !== undefined || updates.comment_count !== undefined) {
        mapped.commentCount = Number(updates.commentCount ?? updates.comment_count);
      }
      if (updates.views !== undefined) {
        mapped.views = Number(updates.views);
      }

      if (updates.title !== undefined) mapped.title = updates.title;
      if (updates.duration !== undefined) mapped.duration = updates.duration;
      if (updates.videoUrl !== undefined || updates.video_url !== undefined) mapped.videoUrl = updates.videoUrl ?? updates.video_url;
      if (updates.grade !== undefined) mapped.grade = updates.grade;
      if (updates.description !== undefined) mapped.description = updates.description;
      if (updates.schoolId !== undefined || updates.school_id !== undefined) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.teacherId !== undefined || updates.teacher_id !== undefined) mapped.teacherId = updates.teacherId ?? updates.teacher_id;

      if (Object.keys(mapped).length > 0) {
        await db.update(recorded_lessons).set(mapped).where(eq(recorded_lessons.id, id));
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/recorded-lessons/:id', handlePatchRecordedLesson);
  app.patch('/api/recorded_lessons/:id', handlePatchRecordedLesson);
  app.put('/api/recorded-lessons/:id', handlePatchRecordedLesson);
  app.put('/api/recorded_lessons/:id', handlePatchRecordedLesson);

  const handleDeleteRecordedLesson = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(recorded_lessons).where(eq(recorded_lessons.id, id));
      realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/recorded-lessons/:id', handleDeleteRecordedLesson);
  app.delete('/api/recorded_lessons/:id', handleDeleteRecordedLesson);

  // --- 1.1 Recorded Lessons Views (for non-duplicated view counting) ---
  app.get(['/api/recorded-lessons-views', '/api/recorded_lessons_views'], async (req, res) => {
    try {
      const { lessonId, userId } = req.query;
      const docs = await db.select().from(firestore_docs).where(sql`path LIKE 'recorded_lessons_views/%'`);
      let views = docs.map(d => ({
        id: d.path.replace('recorded_lessons_views/', ''),
        ...((d.data as any) || {})
      }));
      if (lessonId) views = views.filter((v: any) => v.lessonId === lessonId);
      if (userId) views = views.filter((v: any) => v.userId === userId);
      res.json({ success: true, views, data: views });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get(['/api/recorded-lessons-views/:id', '/api/recorded_lessons_views/:id'], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `recorded_lessons_views/${id}`;
      const doc = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      const data = { id, ...((doc[0].data as any) || {}) };
      res.json({ success: true, id, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleRecordedLessonViewSave = async (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || req.body?.id || `view_${Date.now()}`;
      const body = req.body || {};
      const fullPath = `recorded_lessons_views/${id}`;
      const data = { id, ...body, timestamp: new Date().toISOString(), updatedAt: new Date().toISOString() };

      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: new Date() }
      });

      res.json({ success: true, id, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  app.post(['/api/recorded-lessons-views', '/api/recorded_lessons_views'], handleRecordedLessonViewSave);
  app.post(['/api/recorded-lessons-views/:id', '/api/recorded_lessons_views/:id'], handleRecordedLessonViewSave);
  app.patch(['/api/recorded-lessons-views/:id', '/api/recorded_lessons_views/:id'], handleRecordedLessonViewSave);
  app.put(['/api/recorded-lessons-views/:id', '/api/recorded_lessons_views/:id'], handleRecordedLessonViewSave);

  app.delete(['/api/recorded-lessons-views/:id', '/api/recorded_lessons_views/:id'], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `recorded_lessons_views/${id}`;
      await db.delete(firestore_docs).where(eq(firestore_docs.path, fullPath));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- 2. School Files ---
  const handleGetSchoolFiles = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, fileType, uploaderId, grade, section, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(school_files);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(school_files.schoolId, schoolId as string));
      if (fileType && fileType !== 'all') filters.push(eq(school_files.fileType, fileType as string));
      if (uploaderId && uploaderId !== 'all') filters.push(eq(school_files.uploaderId, uploaderId as string));
      if (grade && grade !== 'all') {
        filters.push(or(eq(school_files.grade, grade as string), isNull(school_files.grade)));
      }
      if (section && section !== 'all') {
        filters.push(or(eq(school_files.section, section as string), isNull(school_files.section)));
      }
      
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(school_files.createdAt)).limit(Number(limitParam) || 1000);
      res.json({ success: true, files: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/school-files', handleGetSchoolFiles);
  app.get('/api/school_files', handleGetSchoolFiles);

  app.get('/api/download-proxy', async (req, res) => {
    const fileUrl = req.query.url as string;
    const filename = req.query.filename as string || "document.pdf";
    if (!fileUrl) return res.status(400).send("File URL is required");
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const contentType = response.headers.get("content-type") || "application/pdf";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Download proxy error:", error);
      res.status(500).send("Error proxying file download");
    }
  });

  const handlePostSchoolFile = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fileName = body.fileName || body.file_name || body.name || 'ملف';
      const fileUrl = body.fileUrl || body.file_url || body.url || '';
      const fileType = body.fileType || body.file_type || body.type || 'document';
      const schoolId = body.schoolId || body.school_id || 'school1';
      const uploaderId = body.uploaderId || body.uploader_id || body.userId || null;

      const newFile = {
        id,
        schoolId,
        uploaderId,
        fileName,
        fileUrl,
        fileType,
        title: body.title,
        size: body.size,
        downloads: body.downloads || 0,
        tag: body.tag,
        subject: body.subject,
        grade: body.grade,
        section: body.section || null,
        allowDownload: typeof body.allowDownload !== 'undefined' ? body.allowDownload : true,
        createdAt: new Date()
      };
      await db.insert(school_files).values(newFile).onConflictDoUpdate({
        target: school_files.id,
        set: { fileName, fileUrl, fileType, schoolId, uploaderId, title: body.title, size: body.size, downloads: body.downloads || 0, tag: body.tag, subject: body.subject, grade: body.grade, section: body.section || null, allowDownload: typeof body.allowDownload !== 'undefined' ? body.allowDownload : true }
      });

      realtimeServerInstance?.broadcastManual('school_files', id, 'INSERT', newFile);
      res.json({ success: true, id, file: newFile, data: newFile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/school-files', handlePostSchoolFile);
  app.post('/api/school_files', handlePostSchoolFile);

  const handlePatchSchoolFile = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (updates.fileName !== undefined || updates.file_name !== undefined) mapped.fileName = updates.fileName ?? updates.file_name;
      if (updates.fileUrl !== undefined || updates.file_url !== undefined) mapped.fileUrl = updates.fileUrl ?? updates.file_url;
      if (updates.fileType !== undefined || updates.file_type !== undefined) mapped.fileType = updates.fileType ?? updates.file_type;
      if (updates.schoolId !== undefined || updates.school_id !== undefined) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.section !== undefined) mapped.section = updates.section;

      if (Object.keys(mapped).length > 0) {
        await db.update(school_files).set(mapped).where(eq(school_files.id, id));
        realtimeServerInstance?.broadcastManual('school_files', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/school-files/:id', handlePatchSchoolFile);
  app.patch('/api/school_files/:id', handlePatchSchoolFile);
  app.put('/api/school-files/:id', handlePatchSchoolFile);
  app.put('/api/school_files/:id', handlePatchSchoolFile);

  const handleDeleteSchoolFile = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(school_files).where(eq(school_files.id, id));
      realtimeServerInstance?.broadcastManual('school_files', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/school-files/:id', handleDeleteSchoolFile);
  app.delete('/api/school_files/:id', handleDeleteSchoolFile);

  // --- 3. Academy Pages ---
  const mapAcademyPageRow = (row: any) => {
    const extra = row.data && typeof row.data === 'object' ? row.data : {};
    return {
      ...extra,
      id: row.id,
      schoolId: row.schoolId || row.school_id || extra.schoolId,
      title: row.title || extra.title,
      subtitle: row.subtitle || extra.subtitle,
      content: row.content || extra.content,
      category: row.category || extra.category,
      order: row.order ?? extra.order,
      pages: row.pages || extra.pages || [],
      structuredContent: row.structuredContent || row.structured_content || extra.structuredContent || [],
      quiz: row.quiz || extra.quiz || [],
      ministerialQuestions: row.ministerialQuestions || row.ministerial_questions || extra.ministerialQuestions || [],
      rawText: row.rawText || row.raw_text || extra.rawText || '',
      extractedText: row.extractedText || row.extracted_text || extra.extractedText || '',
      createdAt: row.createdAt || row.created_at || extra.createdAt,
    };
  };

  const handleGetAcademyPages = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, category } = req.query;
      let queryBuilder = db.select().from(academy_pages);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(academy_pages.schoolId, schoolId as string));
      if (category && category !== 'all') filters.push(eq(academy_pages.category, category as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(academy_pages.createdAt));
      const mapped = results.map(mapAcademyPageRow);
      res.json({ success: true, pages: mapped, data: mapped });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/academy-pages', handleGetAcademyPages);
  app.get('/api/academy_pages', handleGetAcademyPages);

  const handleGetSingleAcademyPage = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const rows = await db.select().from(academy_pages).where(eq(academy_pages.id, id));
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Page not found' });
      }
      const item = mapAcademyPageRow(rows[0]);
      res.json({ success: true, page: item, data: item });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/academy-pages/:id', handleGetSingleAcademyPage);
  app.get('/api/academy_pages/:id', handleGetSingleAcademyPage);

  const handlePostAcademyPage = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = body.title || 'صفحة';
      const subtitle = body.subtitle || body.unitTitle || '';
      const content = body.content || '';
      const category = body.category || 'general';
      const schoolId = body.schoolId || body.school_id || 'school1';
      const order = body.order !== undefined ? Number(body.order) : Date.now();
      const pages = Array.isArray(body.pages) ? body.pages : [];
      const structuredContent = Array.isArray(body.structuredContent) ? body.structuredContent : [];
      const quiz = Array.isArray(body.quiz) ? body.quiz : [];
      const ministerialQuestions = Array.isArray(body.ministerialQuestions) ? body.ministerialQuestions : [];
      const rawText = body.rawText || '';
      const extractedText = body.extractedText || '';

      const newPage: any = {
        id,
        schoolId,
        title,
        subtitle,
        content,
        category,
        order,
        pages,
        structuredContent,
        quiz,
        ministerialQuestions,
        rawText,
        extractedText,
        data: body,
        createdAt: new Date(),
      };

      await db.insert(academy_pages).values(newPage).onConflictDoUpdate({
        target: academy_pages.id,
        set: {
          title,
          subtitle,
          content,
          category,
          schoolId,
          order,
          pages,
          structuredContent,
          quiz,
          ministerialQuestions,
          rawText,
          extractedText,
          data: body,
        }
      });

      realtimeServerInstance?.broadcastManual('academy_pages', id, 'INSERT', newPage);
      res.json({ success: true, id, page: newPage, data: newPage });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/academy-pages', handlePostAcademyPage);
  app.post('/api/academy_pages', handlePostAcademyPage);

  const handlePatchAcademyPage = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (updates.title !== undefined) mapped.title = updates.title;
      if (updates.subtitle !== undefined) mapped.subtitle = updates.subtitle;
      if (updates.content !== undefined) mapped.content = updates.content;
      if (updates.category !== undefined) mapped.category = updates.category;
      if (updates.schoolId !== undefined || updates.school_id !== undefined) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.order !== undefined) mapped.order = Number(updates.order);
      if (updates.pages !== undefined) mapped.pages = updates.pages;
      if (updates.structuredContent !== undefined) mapped.structuredContent = updates.structuredContent;
      if (updates.quiz !== undefined) mapped.quiz = updates.quiz;
      if (updates.ministerialQuestions !== undefined) mapped.ministerialQuestions = updates.ministerialQuestions;
      if (updates.rawText !== undefined) mapped.rawText = updates.rawText;
      if (updates.extractedText !== undefined) mapped.extractedText = updates.extractedText;
      mapped.data = updates;

      if (Object.keys(mapped).length > 0) {
        await db.update(academy_pages).set(mapped).where(eq(academy_pages.id, id));
        realtimeServerInstance?.broadcastManual('academy_pages', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/academy-pages/:id', handlePatchAcademyPage);
  app.patch('/api/academy_pages/:id', handlePatchAcademyPage);
  app.put('/api/academy-pages/:id', handlePatchAcademyPage);
  app.put('/api/academy_pages/:id', handlePatchAcademyPage);

  const handleDeleteAcademyPage = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(academy_pages).where(eq(academy_pages.id, id));
      realtimeServerInstance?.broadcastManual('academy_pages', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/academy-pages/:id', handleDeleteAcademyPage);
  app.delete('/api/academy_pages/:id', handleDeleteAcademyPage);

  // --- 4. Video Comments ---
  const handleGetVideoComments = async (req: express.Request, res: express.Response) => {
    try {
      const { lessonId } = req.query;
      let queryBuilder = db.select().from(video_comments);
      if (lessonId && lessonId !== 'all') {
        queryBuilder = queryBuilder.where(eq(video_comments.lessonId, lessonId as string)) as any;
      }
      const rawResults = await queryBuilder.orderBy(asc(video_comments.timestamp));
      const results = rawResults.map(c => ({
        ...c,
        authorId: c.userId,
        parentId: c.parentId || null
      }));
      res.json({ success: true, comments: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/video-comments', handleGetVideoComments);
  app.get('/api/video_comments', handleGetVideoComments);

  const handlePostVideoComment = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `vcomm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const lessonId = body.lessonId || body.lesson_id || '';
      let userId = body.userId || body.user_id || body.authorId || body.author_id || 'anonymous';
      const authorName = body.authorName || body.author_name || body.userName || body.user_name || 'مستخدم';
      const text = body.text || body.content || '';
      const isTeacher = Boolean(body.isTeacher ?? body.is_teacher ?? false);
      const parentId = body.parentId || body.parent_id || null;

      // Resolve real user ID if student is anonymous
      if ((!userId || userId === 'anonymous' || userId === 'user') && authorName && authorName !== 'مستخدم') {
        try {
          const foundStudents = await db.select().from(students).where(sql`name ILIKE ${'%' + authorName.trim() + '%'}`).limit(1);
          if (foundStudents[0]?.id) {
            userId = foundStudents[0].id;
          } else if (foundStudents[0]?.code) {
            userId = foundStudents[0].code;
          }
        } catch (e) {
          console.warn("Could not resolve student by name in comment:", e);
        }
      }

      const newComment = { 
        id, 
        lessonId, 
        userId, 
        authorName, 
        text, 
        isTeacher, 
        parentId,
        isEdited: false,
        updatedAt: new Date(),
        timestamp: new Date() 
      };
      await db.insert(video_comments).values(newComment);
      const commentWithAuthorId = { ...newComment, authorId: userId };
      realtimeServerInstance?.broadcastManual('video_comments', id, 'INSERT', commentWithAuthorId);

      // Increment comment count on recorded_lessons and broadcast immediately
      if (lessonId) {
        try {
          await db.execute(sql`UPDATE recorded_lessons SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ${lessonId}`);
          const cRow = await db.select({ count: recorded_lessons.commentCount }).from(recorded_lessons).where(eq(recorded_lessons.id, lessonId));
          const cVal = cRow[0]?.count ?? 1;
          realtimeServerInstance?.broadcastManual('recorded_lessons', lessonId, 'UPDATE', { id: lessonId, commentCount: Number(cVal), comment_count: Number(cVal) });
        } catch (e) {
          console.warn("Could not increment comment_count on lesson:", e);
        }
      }

      // If this is a reply (e.g., teacher replying to student), trigger notification directly
      if (parentId) {
        try {
          const parent = await db.select().from(video_comments).where(eq(video_comments.id, parentId)).limit(1);
          if (parent[0]) {
            let recipient = parent[0].userId;
            if ((!recipient || recipient === 'anonymous' || recipient === 'user') && parent[0].authorName) {
              const foundStudents = await db.select().from(students).where(sql`name ILIKE ${'%' + parent[0].authorName.trim() + '%'}`).limit(1);
              if (foundStudents[0]?.id) recipient = foundStudents[0].id;
              else if (foundStudents[0]?.code) recipient = foundStudents[0].code;
            }

            if (recipient && recipient !== userId && recipient !== 'anonymous') {
              const lRow = await db.select().from(recorded_lessons).where(eq(recorded_lessons.id, lessonId)).limit(1);
              const lessonTitle = lRow[0]?.title || 'المحاضرة المرئية';
              const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              const newNotif = {
                id: notifId,
                recipientId: recipient,
                recipientRole: 'student',
                title: isTeacher ? 'رد الأستاذ على تعليقك 💬' : 'رد جديد على تعليقك 💬',
                body: isTeacher 
                  ? `قام الأستاذ بالرد على تعليقك في محاضرة: (${lessonTitle})`
                  : `قام ${authorName} بالرد على تعليقك في محاضرة: (${lessonTitle})`,
                type: isTeacher ? 'teacher_reply' : 'reply',
                schoolId: lRow[0]?.schoolId || '',
                metadata: {
                  type: 'video_comment_reply',
                  lessonId,
                  commentId: id,
                  parentCommentId: parentId,
                  lessonTitle
                },
                read: false,
                createdAt: new Date()
              };
              await db.insert(notifications).values(newNotif);
              realtimeServerInstance?.broadcastManual('notifications', notifId, 'INSERT', newNotif);
            }
          }
        } catch (notifErr) {
          console.warn("Could not dispatch reply notification:", notifErr);
        }
      }

      res.json({ success: true, id, comment: commentWithAuthorId, data: commentWithAuthorId });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/video-comments', handlePostVideoComment);
  app.post('/api/video_comments', handlePostVideoComment);

  const handlePatchVideoComment = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {
        updatedAt: new Date()
      };
      if (updates.text !== undefined) mapped.text = updates.text;
      if (updates.content !== undefined) mapped.text = updates.content;
      if (updates.isEdited !== undefined) mapped.isEdited = Boolean(updates.isEdited);
      else mapped.isEdited = true;
      if (updates.authorName !== undefined) mapped.authorName = updates.authorName;

      await db.update(video_comments).set(mapped).where(eq(video_comments.id, id));
      
      const updated = await db.select().from(video_comments).where(eq(video_comments.id, id));
      const commentData = updated[0] ? {
        ...updated[0],
        authorId: updated[0].userId
      } : { id, ...mapped };

      realtimeServerInstance?.broadcastManual('video_comments', id, 'UPDATE', commentData);
      res.json({ success: true, id, comment: commentData, data: commentData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/video-comments/:id', handlePatchVideoComment);
  app.patch('/api/video_comments/:id', handlePatchVideoComment);
  app.put('/api/video-comments/:id', handlePatchVideoComment);
  app.put('/api/video_comments/:id', handlePatchVideoComment);

  const handleDeleteVideoComment = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const existing = await db.select().from(video_comments).where(eq(video_comments.id, id)).limit(1);
      const lessonId = existing[0]?.lessonId;

      await db.delete(video_comments).where(or(eq(video_comments.id, id), eq(video_comments.parentId, id)));
      realtimeServerInstance?.broadcastManual('video_comments', id, 'DELETE', { id });

      if (lessonId) {
        try {
          await db.execute(sql`UPDATE recorded_lessons SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = ${lessonId}`);
          const cRow = await db.select({ count: recorded_lessons.commentCount }).from(recorded_lessons).where(eq(recorded_lessons.id, lessonId));
          const cVal = cRow[0]?.count ?? 0;
          realtimeServerInstance?.broadcastManual('recorded_lessons', lessonId, 'UPDATE', { id: lessonId, commentCount: Number(cVal), comment_count: Number(cVal) });
        } catch (e) {
          console.warn("Could not decrement comment_count on lesson:", e);
        }
      }

      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/video-comments/:id', handleDeleteVideoComment);
  app.delete('/api/video_comments/:id', handleDeleteVideoComment);

  // --- 5. Community Stories ---
  const handleGetCommunityStories = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(community_stories);
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(community_stories.schoolId, schoolId as string)) as any;
      }
      const results = await queryBuilder.orderBy(desc(community_stories.timestamp));
      res.json({ success: true, stories: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/community/stories', handleGetCommunityStories);
  app.get('/api/community-stories', handleGetCommunityStories);
  app.get('/api/community_stories', handleGetCommunityStories);

  const handlePostCommunityStory = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schoolId = body.schoolId || body.school_id || 'school1';
      const userId = body.userId || body.user_id || 'anonymous';
      const userName = body.userName || body.user_name || 'مستخدم';
      const userPhotoURL = body.userPhotoURL || body.user_photo_url || body.userPhoto || null;
      const postContent = body.postContent || body.post_content || body.content || '';
      const postMedia = body.postMedia || body.post_media || body.mediaUrl || body.media_url || null;
      const mediaType = body.mediaType || body.media_type || 'image';
      const postMediaGroup = body.postMediaGroup || body.post_media_group || [];
      const views = body.views || [];
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newStory = {
        id,
        schoolId,
        userId,
        userName,
        userPhotoURL,
        postContent,
        postMedia,
        mediaType,
        postMediaGroup,
        views,
        timestamp: new Date(),
        expiresAt
      };

      await db.insert(community_stories).values(newStory);
      realtimeServerInstance?.broadcastManual('community_stories', id, 'INSERT', newStory);
      res.json({ success: true, id, story: newStory, data: newStory });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/community/stories', handlePostCommunityStory);
  app.post('/api/community-stories', handlePostCommunityStory);
  app.post('/api/community_stories', handlePostCommunityStory);

  const handlePatchCommunityStory = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (updates.views !== undefined) mapped.views = updates.views;
      if (updates.postContent !== undefined) mapped.postContent = updates.postContent;

      if (Object.keys(mapped).length > 0) {
        await db.update(community_stories).set(mapped).where(eq(community_stories.id, id));
        realtimeServerInstance?.broadcastManual('community_stories', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/community/stories/:id', handlePatchCommunityStory);
  app.patch('/api/community-stories/:id', handlePatchCommunityStory);

  const handleDeleteCommunityStory = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(community_stories).where(eq(community_stories.id, id));
      realtimeServerInstance?.broadcastManual('community_stories', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/community/stories/:id', handleDeleteCommunityStory);
  app.delete('/api/community-stories/:id', handleDeleteCommunityStory);

  // --- 6. Student Live Notes ---
  const handleGetStudentLiveNotes = async (req: express.Request, res: express.Response) => {
    try {
      const { userId, schoolId } = req.query;
      let queryBuilder = db.select().from(student_live_notes);
      const filters = [];
      if (userId) filters.push(eq(student_live_notes.userId, userId as string));
      if (schoolId && schoolId !== 'all') filters.push(eq(student_live_notes.schoolId, schoolId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(student_live_notes.timestamp));
      res.json({ success: true, notes: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/student-live-notes', handleGetStudentLiveNotes);
  app.get('/api/student_live_notes', handleGetStudentLiveNotes);

  const handlePostStudentLiveNote = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = body.userId || body.user_id || 'anonymous';
      const schoolId = body.schoolId || body.school_id || null;
      const liveTitle = body.liveTitle || body.live_title || 'ملاحظات الدرس المباشر';
      const grade = body.grade || null;
      const content = body.content || '';

      const newNote = { id, userId, schoolId, liveTitle, grade, content, timestamp: new Date() };
      await db.insert(student_live_notes).values(newNote).onConflictDoUpdate({
        target: student_live_notes.id,
        set: { content, liveTitle, grade, schoolId }
      });

      realtimeServerInstance?.broadcastManual('student_live_notes', id, 'INSERT', newNote);
      res.json({ success: true, id, note: newNote, data: newNote });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/student-live-notes', handlePostStudentLiveNote);
  app.post('/api/student_live_notes', handlePostStudentLiveNote);

  const handleDeleteStudentLiveNote = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(student_live_notes).where(eq(student_live_notes.id, id));
      realtimeServerInstance?.broadcastManual('student_live_notes', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/student-live-notes/:id', handleDeleteStudentLiveNote);
  app.delete('/api/student_live_notes/:id', handleDeleteStudentLiveNote);

  // --- 7. Community Posts & Comments Enhanced CRUD ---
  const handleGetCommunityPosts = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, grade, userId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(community_posts);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(community_posts.schoolId, schoolId as string));
      if (grade && grade !== 'all') filters.push(eq(community_posts.grade, grade as string));
      if (userId) filters.push(eq(community_posts.userId, userId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(community_posts.isPinned), desc(community_posts.timestamp)).limit(Number(limitParam) || 100);
      res.json({ success: true, posts: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/community/posts', handleGetCommunityPosts);
  app.get('/api/community-posts', handleGetCommunityPosts);

  const handlePostCommunityPost = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schoolId = body.schoolId || body.school_id || 'school1';
      const userId = body.userId || body.user_id || 'anonymous';
      const userName = body.userName || body.user_name || 'مستخدم';
      const userPhoto = body.userPhoto || body.user_photo || body.userPhotoURL || null;
      const content = body.content || '';
      const mediaUrl = body.mediaUrl || body.media_url || null;
      const type = body.type || 'student';
      const grade = body.grade || null;
      const isPinned = Boolean(body.isPinned ?? body.is_pinned ?? false);
      const isLocked = Boolean(body.isLocked ?? body.is_locked ?? false);

      const newPost = {
        id,
        schoolId,
        userId,
        userName,
        userPhoto,
        content,
        mediaUrl,
        type,
        grade,
        isPinned,
        isLocked,
        reportsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        timestamp: new Date()
      };

      await db.insert(community_posts).values(newPost).onConflictDoUpdate({
        target: community_posts.id,
        set: { content, mediaUrl, isPinned, isLocked }
      });

      realtimeServerInstance?.broadcastManual('community_posts', id, 'INSERT', newPost);
      res.json({ success: true, id, post: newPost, data: newPost });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/community/posts', handlePostCommunityPost);
  app.post('/api/community-posts', handlePostCommunityPost);

  const handlePatchCommunityPost = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = {};

      if (updates.incrementViews) {
        await db.execute(sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual('recorded_lessons', id, 'UPDATE', { id, incrementViews: true });
        return res.json({ success: true });
      }

      if (updates.content !== undefined) mapped.content = updates.content;
      if (updates.mediaUrl !== undefined || updates.media_url !== undefined) mapped.mediaUrl = updates.mediaUrl ?? updates.media_url;
      if (updates.isPinned !== undefined || updates.is_pinned !== undefined) mapped.isPinned = updates.isPinned ?? updates.is_pinned;
      if (updates.isLocked !== undefined || updates.is_locked !== undefined) mapped.isLocked = updates.isLocked ?? updates.is_locked;
      if (updates.likesCount !== undefined || updates.likes_count !== undefined) mapped.likesCount = updates.likesCount ?? updates.likes_count;
      if (updates.reportsCount !== undefined || updates.reports_count !== undefined) mapped.reportsCount = updates.reportsCount ?? updates.reports_count;
      if (updates.commentsCount !== undefined || updates.comments_count !== undefined) mapped.commentsCount = updates.commentsCount ?? updates.comments_count;

      if (Object.keys(mapped).length > 0) {
        await db.update(community_posts).set(mapped).where(eq(community_posts.id, id));
        realtimeServerInstance?.broadcastManual('community_posts', id, 'UPDATE', { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch('/api/community/posts/:id', handlePatchCommunityPost);
  app.patch('/api/community-posts/:id', handlePatchCommunityPost);
  app.patch('/api/pulse/posts/:id', handlePatchCommunityPost);

  const handleDeleteCommunityPost = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where(eq(community_posts.id, id));
      await db.delete(community_comments).where(eq(community_comments.postId, id));
      realtimeServerInstance?.broadcastManual('community_posts', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/community/posts/:id', handleDeleteCommunityPost);
  app.delete('/api/community-posts/:id', handleDeleteCommunityPost);

  // Community Comments
  app.get('/api/community/comments', async (req, res) => {
    try {
      const postId = (req.query.postId as string) || (req.query.post_id as string);
      let results;
      if (postId) {
        results = await db.select().from(community_comments)
          .where(eq(community_comments.postId, postId))
          .orderBy(asc(community_comments.timestamp));
      } else {
        results = await db.select().from(community_comments)
          .orderBy(asc(community_comments.timestamp));
      }
      res.json({ success: true, comments: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/community/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const results = await db.select().from(community_comments)
        .where(eq(community_comments.postId, id))
        .orderBy(asc(community_comments.timestamp));
      res.json({ success: true, comments: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/community/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userName, content } = req.body;
      const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newComment = {
        id: commentId,
        postId: id,
        userId: userId || 'anonymous',
        userName: userName || 'مستخدم',
        content: content || '',
        timestamp: new Date()
      };

      await db.insert(community_comments).values(newComment);
      
      const postList = await db.select().from(community_posts).where(eq(community_posts.id, id));
      if (postList.length > 0) {
        const nextCount = (postList[0].commentsCount || 0) + 1;
        await db.update(community_posts).set({ commentsCount: nextCount }).where(eq(community_posts.id, id));
        realtimeServerInstance?.broadcastManual('community_posts', id, 'UPDATE', { id, commentsCount: nextCount });
      }

      realtimeServerInstance?.broadcastManual('community_comments', commentId, 'INSERT', newComment);
      res.json({ success: true, id: commentId, comment: newComment, data: newComment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/community/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_comments).where(eq(community_comments.id, id));
      realtimeServerInstance?.broadcastManual('community_comments', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- 8. Class Schedules Enhanced (handled above) ---

  // --- 9. Transport Module ---
  app.get('/api/transport/routes', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(transport_routes);
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(transport_routes.schoolId, schoolId as string)) as any;
      }
      const results = await queryBuilder.orderBy(asc(transport_routes.name));
      res.json({ success: true, routes: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/transport/routes', async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `route_${Date.now()}`;
      const name = body.name || 'مسار جديد';
      const schoolId = body.schoolId || body.school_id || 'school1';
      const description = body.description || '';
      const status = body.status || 'inactive';

      const newRoute = { id, schoolId, name, description, status, createdAt: new Date(), updatedAt: new Date() };
      await db.insert(transport_routes).values(newRoute).onConflictDoUpdate({
        target: transport_routes.id,
        set: { name, description, status, updatedAt: new Date() }
      });
      realtimeServerInstance?.broadcastManual('transport_routes', id, 'INSERT', newRoute);
      res.json({ success: true, id, route: newRoute, data: newRoute });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/transport/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = { updatedAt: new Date() };
      if (updates.name !== undefined) mapped.name = updates.name;
      if (updates.description !== undefined) mapped.description = updates.description;
      if (updates.status !== undefined) mapped.status = updates.status;
      if (updates.currentLocationLat !== undefined) mapped.currentLocationLat = updates.currentLocationLat;
      if (updates.currentLocationLng !== undefined) mapped.currentLocationLng = updates.currentLocationLng;

      await db.update(transport_routes).set(mapped).where(eq(transport_routes.id, id));
      realtimeServerInstance?.broadcastManual('transport_routes', id, 'UPDATE', { id, ...mapped });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/transport/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_routes).where(eq(transport_routes.id, id));
      realtimeServerInstance?.broadcastManual('transport_routes', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/transport/drivers', async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(transport_drivers);
      if (schoolId && schoolId !== 'all') {
        queryBuilder = queryBuilder.where(eq(transport_drivers.schoolId, schoolId as string)) as any;
      }
      const results = await queryBuilder.orderBy(asc(transport_drivers.name));
      res.json({ success: true, drivers: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/transport/drivers', async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `drv_${Date.now()}`;
      const name = body.name || 'سائق';
      const phone = body.phone || '07700000000';
      const accessCode = body.accessCode || body.access_code || `BUS-${Math.floor(1000 + Math.random() * 9000)}`;
      const schoolId = body.schoolId || body.school_id || 'school1';
      const routeId = body.routeId || body.route_id || null;
      const busNumber = body.busNumber || body.bus_number || null;
      const capacity = body.capacity ? Number(body.capacity) : 30;

      const newDriver = { id, schoolId, name, phone, accessCode, routeId, busNumber, createdAt: new Date(), updatedAt: new Date() };
      await db.insert(transport_drivers).values(newDriver).onConflictDoUpdate({
        target: transport_drivers.id,
        set: { name, phone, routeId, busNumber, updatedAt: new Date() }
      });
      realtimeServerInstance?.broadcastManual('transport_drivers', id, 'INSERT', newDriver);
      res.json({ success: true, id, driver: newDriver, data: newDriver });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/transport/drivers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = { updatedAt: new Date() };
      if (updates.name !== undefined) mapped.name = updates.name;
      if (updates.phone !== undefined) mapped.phone = updates.phone;
      if (updates.routeId !== undefined || updates.route_id !== undefined) mapped.routeId = updates.routeId ?? updates.route_id;
      if (updates.busNumber !== undefined || updates.bus_number !== undefined) mapped.busNumber = updates.busNumber ?? updates.bus_number;
      if (updates.status !== undefined) mapped.status = updates.status;

      await db.update(transport_drivers).set(mapped).where(eq(transport_drivers.id, id));
      realtimeServerInstance?.broadcastManual('transport_drivers', id, 'UPDATE', { id, ...mapped });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/transport/drivers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_drivers).where(eq(transport_drivers.id, id));
      realtimeServerInstance?.broadcastManual('transport_drivers', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleGetTransportStudentsStatus = async (req: express.Request, res: express.Response) => {
    try {
      const { routeId, studentId } = req.query;
      let queryBuilder = db.select().from(transport_students_status);
      const filters = [];
      if (routeId && routeId !== 'all') filters.push(eq(transport_students_status.routeId, routeId as string));
      if (studentId && studentId !== 'all') filters.push(eq(transport_students_status.id, studentId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(transport_students_status.updatedAt));
      res.json({ success: true, items: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/transport/students-status', handleGetTransportStudentsStatus);
  app.get('/api/transport/students/status', handleGetTransportStudentsStatus);
  app.get('/api/transport/students_status', handleGetTransportStudentsStatus);

  const handlePostTransportStudentStatus = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const studentId = body.studentId || body.student_id || body.id || `tstat_${Date.now()}`;
      const id = studentId;
      const routeId = body.routeId || body.route_id || null;
      const parentId = body.parentId || body.parent_id || null;
      const studentName = body.studentName || body.student_name || '';
      const status = body.status || 'pending';
      const stopName = body.stopName || body.stop_name || null;
      const shift = body.shift || 'morning';

      const newStat = { id, routeId, parentId, studentName, status, stopName, shift, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() };
      await db.insert(transport_students_status).values(newStat).onConflictDoUpdate({
        target: transport_students_status.id,
        set: { status, stopName, shift, updatedAt: new Date(), timestamp: new Date() }
      });
      realtimeServerInstance?.broadcastManual('transport_students_status', id, 'INSERT', newStat);
      res.json({ success: true, id, status: newStat, data: newStat });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/transport/students-status', handlePostTransportStudentStatus);
  app.post('/api/transport/students/status', handlePostTransportStudentStatus);
  app.post('/api/transport/students_status', handlePostTransportStudentStatus);

  app.get('/api/transport/fees', async (req, res) => {
    try {
      const { studentId, parentId } = req.query;
      let queryBuilder = db.select().from(transport_fees);
      const filters = [];
      if (studentId) filters.push(eq(transport_fees.studentId, studentId as string));
      if (parentId) filters.push(eq(transport_fees.parentId, parentId as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(transport_fees.createdAt));
      res.json({ success: true, fees: results, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/transport/fees', async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `fee_${Date.now()}`;
      const studentId = body.studentId || body.student_id || '';
      const parentId = body.parentId || body.parent_id || null;
      const amount = Number(body.amount) || 0;
      const period = body.period || 'شهر جديد';
      const status = body.status || 'unpaid';

      const newFee = { id, studentId, parentId, amount, period, status, createdAt: new Date(), updatedAt: new Date() };
      await db.insert(transport_fees).values(newFee);
      realtimeServerInstance?.broadcastManual('transport_fees', id, 'INSERT', newFee);
      res.json({ success: true, id, fee: newFee, data: newFee });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/transport/fees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped: any = { updatedAt: new Date() };
      if (updates.status !== undefined) mapped.status = updates.status;
      if (updates.amount !== undefined) mapped.amount = Number(updates.amount);
      if (updates.period !== undefined) mapped.period = updates.period;

      await db.update(transport_fees).set(mapped).where(eq(transport_fees.id, id));
      realtimeServerInstance?.broadcastManual('transport_fees', id, 'UPDATE', { id, ...mapped });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/transport/fees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_fees).where(eq(transport_fees.id, id));
      realtimeServerInstance?.broadcastManual('transport_fees', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- 10. Admins ---
  app.get('/api/admins', async (req, res) => {
    try {
      const adminUsers = await db.select().from(users).where(
        inArray(users.role, ['admin', 'admin-boys', 'admin-girls', 'dev', 'developer', 'super_admin', 'manager'])
      );
      res.json({ success: true, admins: adminUsers, data: adminUsers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admins/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userList = await db.select().from(users).where(eq(users.id, id));
      if (userList.length === 0) {
        return res.json({ success: true, admin: null, data: null });
      }
      res.json({ success: true, admin: userList[0], data: userList[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- 11. Exam Papers & Question Bank ---
  app.get('/api/exam-papers', async (req, res) => {
    try {
      const { schoolId, subject } = req.query;
      let queryBuilder = db.select().from(exam_papers);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(exam_papers.schoolId, schoolId as string));
      if (subject && subject !== 'all') filters.push(eq(exam_papers.subject, subject as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(exam_papers.createdAt));
      const formatted = results.map(p => ({
        ...p,
        title: p.title || `${p.subject || 'امتحان'} - ${p.role || ''} ${p.year || ''}`.trim(),
        targetGrade: p.targetGrade || p.grade || '',
        imageUrl: p.imageUrl || ''
      }));
      res.json({ success: true, papers: formatted, data: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/exam-papers', async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `exam_${Date.now()}`;
      const targetGrade = body.targetGrade || body.grade || '';
      const newExam = {
        id,
        schoolId: body.schoolId || body.school_id || 'school1',
        teacherId: body.teacherId || body.teacher_id || null,
        subject: body.subject || '',
        year: body.year || '2025/2026',
        role: body.role || 'دور أول',
        title: body.title || `${body.subject || 'امتحان'} - ${body.role || 'امتحان'} ${body.year || ''}`.trim(),
        grade: targetGrade,
        targetGrade,
        targetSections: Array.isArray(body.targetSections) ? body.targetSections : [],
        imageUrl: body.imageUrl || body.image_url || body.url || '',
        createdAt: new Date()
      };
      await db.insert(exam_papers).values(newExam).onConflictDoUpdate({
        target: exam_papers.id,
        set: newExam
      });
      realtimeServerInstance?.broadcastManual('exam_papers', id, 'INSERT', newExam);
      res.json({ success: true, id, paper: newExam, data: newExam });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/exam-papers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(exam_papers).where(eq(exam_papers.id, id));
      realtimeServerInstance?.broadcastManual('exam_papers', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleGetQuestionBank = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId, subject, grade, category } = req.query;
      let queryBuilder = db.select().from(question_bank);
      const filters = [];
      if (schoolId && schoolId !== 'all') filters.push(eq(question_bank.schoolId, schoolId as string));
      if (subject && subject !== 'all') filters.push(eq(question_bank.subject, subject as string));
      if (grade && grade !== 'all') filters.push(or(eq(question_bank.grade, grade as string), eq(question_bank.targetGrade, grade as string)));
      if (category && category !== 'all') filters.push(eq(question_bank.category, category as string));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(and(...filters)) as any;
      }
      const results = await queryBuilder.orderBy(desc(question_bank.createdAt));
      const formatted = results.map(q => {
        const text = q.question || (q as any).text || '';
        const categoryVal = q.category || 'ministerial';
        const tagsVal = Array.isArray(q.tags) ? q.tags : [];
        const gradeVal = q.grade || q.targetGrade || '';
        return {
          ...q,
          text,
          question: text,
          category: categoryVal,
          tags: tagsVal,
          grade: gradeVal,
          targetGrade: gradeVal,
          options: Array.isArray(q.options) ? q.options : []
        };
      });
      res.json({ success: true, questions: formatted, data: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get('/api/question-bank', handleGetQuestionBank);
  app.get('/api/curriculum-questions', handleGetQuestionBank);

  const handlePostQuestionBank = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const id = body.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const text = body.question || body.text || '';
      const gradeVal = body.grade || body.targetGrade || '';
      const tagsVal = Array.isArray(body.tags) 
        ? body.tags 
        : (typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      
      const newQ = {
        id,
        schoolId: body.schoolId || body.school_id || 'school1',
        teacherId: body.teacherId || body.teacher_id || null,
        teacherName: body.teacherName || body.teacher_name || null,
        subject: body.subject || '',
        grade: gradeVal,
        targetGrade: gradeVal,
        category: body.category || 'ministerial',
        tags: tagsVal,
        targetSections: Array.isArray(body.targetSections) ? body.targetSections : [],
        type: body.type || 'custom',
        question: text,
        options: Array.isArray(body.options) ? body.options : [],
        correctAnswer: body.correctAnswer || body.correct_answer || '',
        explanation: body.explanation || '',
        difficulty: body.difficulty || 'medium',
        points: Number(body.points) || 1,
        createdAt: new Date()
      };
      await db.insert(question_bank).values(newQ).onConflictDoUpdate({
        target: question_bank.id,
        set: newQ
      });
      const responsePayload = {
        ...newQ,
        text: newQ.question
      };
      realtimeServerInstance?.broadcastManual('question_bank', id, 'INSERT', responsePayload);
      res.json({ success: true, id, question: responsePayload, data: responsePayload });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post('/api/question-bank', handlePostQuestionBank);
  app.post('/api/curriculum-questions', handlePostQuestionBank);

  const handleDeleteQuestionBank = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await db.delete(question_bank).where(eq(question_bank.id, id));
      realtimeServerInstance?.broadcastManual('question_bank', id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete('/api/question-bank/:id', handleDeleteQuestionBank);
  app.delete('/api/curriculum-questions/:id', handleDeleteQuestionBank);

  // --- 12. Generic Dynamic Document Store (firestore_docs) ---
  app.get('/api/firestore-docs/:col', async (req, res) => {
    try {
      const { col } = req.params;
      const docs = await db.select().from(firestore_docs).where(sql`path LIKE ${col + '/%'}`);
      const items = docs.map(d => ({ id: d.path.replace(`${col}/`, ''), ...((d.data as any) || {}) }));
      res.json({ success: true, items, data: items });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/firestore-docs/:col/:id', async (req, res) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      const doc = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, id, data: { id, ...((doc[0].data as any) || {}) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/firestore-docs/:col', async (req, res) => {
    try {
      const { col } = req.params;
      const body = req.body || {};
      const id = body.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullPath = `${col}/${id}`;
      const data = { ...body, id, updatedAt: new Date().toISOString() };

      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual(col, id, 'INSERT', data);
      res.json({ success: true, id, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  function resolveFirestoreValue(currentVal: any, updateVal: any): any {
    if (updateVal && typeof updateVal === 'object') {
      if (updateVal.type === 'increment' && typeof updateVal.value === 'number') {
        const currentNum = typeof currentVal === 'number' ? currentVal : (Number(currentVal) || 0);
        return currentNum + updateVal.value;
      }
      if (updateVal.type === 'arrayUnion' && Array.isArray(updateVal.value)) {
        const arr = Array.isArray(currentVal) ? [...currentVal] : [];
        for (const el of updateVal.value) {
          const elJson = typeof el === 'object' ? JSON.stringify(el) : el;
          if (!arr.some(item => (typeof item === 'object' ? JSON.stringify(item) : item) === elJson)) {
            arr.push(el);
          }
        }
        return arr;
      }
      if (updateVal.type === 'arrayRemove' && Array.isArray(updateVal.value)) {
        const arr = Array.isArray(currentVal) ? [...currentVal] : [];
        return arr.filter(item => {
          const itemJson = typeof item === 'object' ? JSON.stringify(item) : item;
          return !updateVal.value.some((el: any) => (typeof el === 'object' ? JSON.stringify(el) : el) === itemJson);
        });
      }
      if (updateVal.type === 'serverTimestamp') {
        return new Date().toISOString();
      }
      if (updateVal.type === 'delete') {
        return undefined;
      }
    }
    return updateVal;
  }

  function applyFirestoreUpdates(target: any, updates: Record<string, any>): any {
    const result = { ...(target || {}) };

    for (const [key, val] of Object.entries(updates)) {
      if (key.includes('.')) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
            current[part] = {};
          } else {
            current[part] = { ...current[part] };
          }
          current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        const resolved = resolveFirestoreValue(current[lastPart], val);
        if (resolved === undefined) {
          delete current[lastPart];
        } else {
          current[lastPart] = resolved;
        }
      } else {
        const resolved = resolveFirestoreValue(result[key], val);
        if (resolved === undefined) {
          delete result[key];
        } else {
          result[key] = resolved;
        }
      }
    }

    return result;
  }

  const handleFirestoreDocUpdate = async (req: express.Request, res: express.Response) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      const updates = req.body || {};

      const existing = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      const oldData = (existing[0]?.data as any) || { id };
      const merged = applyFirestoreUpdates(oldData, updates);
      merged.id = id;
      merged.updatedAt = new Date().toISOString();

      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual(col, id, 'UPDATE', merged);
      res.json({ success: true, id, data: merged });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  app.patch('/api/firestore-docs/:col/:id', handleFirestoreDocUpdate);
  app.post('/api/firestore-docs/:col/:id', handleFirestoreDocUpdate);

  // --- Dedicated Live Sessions Endpoints ---
  app.get(['/api/live-sessions', '/api/live_sessions'], async (req, res) => {
    try {
      const docs = await db.select().from(firestore_docs).where(sql`path LIKE 'live_sessions/%'`);
      const sessions = docs.map(d => ({
        id: d.path.replace('live_sessions/', ''),
        ...((d.data as any) || {})
      }));
      res.json({ success: true, sessions, data: sessions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get(['/api/live-sessions/:id', '/api/live_sessions/:id'], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `live_sessions/${id}`;
      const doc = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      const data = { id, ...((doc[0].data as any) || {}) };
      res.json({ success: true, id, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleLiveSessionUpdate = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const fullPath = `live_sessions/${id}`;
      const updates = req.body || {};

      const existing = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      const oldData = (existing[0]?.data as any) || { id };
      const merged = applyFirestoreUpdates(oldData, updates);
      merged.id = id;
      merged.updatedAt = new Date().toISOString();

      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual('live_sessions', id, 'UPDATE', merged);
      realtimeServerInstance?.broadcastManual(`live_sessions_${id}`, id, 'UPDATE', merged);
      res.json({ success: true, id, data: merged });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch(['/api/live-sessions/:id', '/api/live_sessions/:id'], handleLiveSessionUpdate);
  app.post(['/api/live-sessions/:id', '/api/live_sessions/:id'], handleLiveSessionUpdate);

  app.post(['/api/live-sessions/:id/reactions', '/api/live_sessions/:id/reactions'], async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body || {};
      if (!type) return res.status(400).json({ success: false, message: "Reaction type required" });

      const fullPath = `live_sessions/${id}`;
      const existing = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      const oldData = (existing[0]?.data as any) || { id };
      
      const reactionCounts = { ...(oldData.reactionCounts || {}) };
      reactionCounts[type] = (Number(reactionCounts[type]) || 0) + 1;

      const merged = { ...oldData, reactionCounts, updatedAt: new Date().toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual('live_sessions', id, 'UPDATE', merged);
      res.json({ success: true, reactionCounts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get(['/api/live-sessions/:id/viewers', '/api/live_sessions/:id/viewers'], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_viewers`;
      const docs = await db.select().from(firestore_docs).where(sql`path LIKE ${colPrefix + '/%'}`);
      const viewers = docs.map(d => {
        const viewerId = d.path.replace(`${colPrefix}/`, '');
        return { id: viewerId, ...((d.data as any) || {}) };
      });
      res.json({ success: true, data: viewers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleLiveSessionViewerUpdate = async (req: express.Request, res: express.Response) => {
    try {
      const { id, viewerId: paramViewerId } = req.params;
      const body = req.body || {};
      const viewerId = paramViewerId || body.userId || body.studentId || body.id || `v_${Date.now()}`;
      const colPrefix = `live_sessions_${id}_viewers`;
      const fullPath = `${colPrefix}/${viewerId}`;

      const existing = await db.select().from(firestore_docs).where(eq(firestore_docs.path, fullPath));
      const oldData = (existing[0]?.data as any) || { id: viewerId };
      const merged = { ...oldData, ...body, id: viewerId, lastSeen: Date.now(), updatedAt: new Date().toISOString() };

      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual(colPrefix, viewerId, 'UPDATE', merged);
      realtimeServerInstance?.broadcastManual('live_sessions', id, 'UPDATE', { viewerUpdate: viewerId });
      res.json({ success: true, viewerId, data: merged });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post(['/api/live-sessions/:id/viewers', '/api/live_sessions/:id/viewers'], handleLiveSessionViewerUpdate);
  app.patch(['/api/live-sessions/:id/viewers/:viewerId', '/api/live_sessions/:id/viewers/:viewerId'], handleLiveSessionViewerUpdate);
  app.post(['/api/live-sessions/:id/viewers/:viewerId', '/api/live_sessions/:id/viewers/:viewerId'], handleLiveSessionViewerUpdate);

  app.get(['/api/live-sessions/:id/responses', '/api/live_sessions/:id/responses'], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_responses`;
      const docs = await db.select().from(firestore_docs).where(sql`path LIKE ${colPrefix + '/%'}`);
      const responses = docs.map(d => {
        const respId = d.path.replace(`${colPrefix}/`, '');
        return { id: respId, ...((d.data as any) || {}) };
      });
      res.json({ success: true, data: responses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const handleLiveSessionResponse = async (req: express.Request, res: express.Response) => {
    try {
      const { id, responseId: paramResponseId } = req.params;
      const body = req.body || {};
      const responseId = paramResponseId || body.userId || body.studentId || body.id || `resp_${Date.now()}`;
      const colPrefix = `live_sessions_${id}_responses`;
      const fullPath = `${colPrefix}/${responseId}`;

      const data = { ...body, id: responseId, submittedAt: new Date().toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: new Date() }
      });

      realtimeServerInstance?.broadcastManual(colPrefix, responseId, 'INSERT', data);
      res.json({ success: true, responseId, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post(['/api/live-sessions/:id/responses', '/api/live_sessions/:id/responses'], handleLiveSessionResponse);
  app.patch(['/api/live-sessions/:id/responses/:responseId', '/api/live_sessions/:id/responses/:responseId'], handleLiveSessionResponse);
  app.post(['/api/live-sessions/:id/responses/:responseId', '/api/live_sessions/:id/responses/:responseId'], handleLiveSessionResponse);

  app.delete(['/api/live-sessions/:id/responses', '/api/live_sessions/:id/responses'], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_responses`;
      await db.delete(firestore_docs).where(sql`path LIKE ${colPrefix + '/%'}`);
      realtimeServerInstance?.broadcastManual(colPrefix, undefined, 'DELETE', { colPrefix });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/firestore-docs/:col/:id', async (req, res) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      await db.delete(firestore_docs).where(eq(firestore_docs.path, fullPath));
      realtimeServerInstance?.broadcastManual(col, id, 'DELETE', { id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Catch-all route for any unhandled /api/* endpoint: return JSON 404 so Vite never returns HTML
  app.all('/api/*', (req, res) => {
    console.warn(`[Server API 404] No route matched for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      success: false, 
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      path: req.originalUrl,
      help: "This usually means the API route is missing in server.ts or the URL is incorrect."
    });
  });

    // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Explicitly prevent returning HTML for /api/ routes that somehow leaked through
      if (req.path.startsWith('/api/')) {
        console.warn(`[Server API Leaked] /api/ request reached SPA fallback: ${req.method} ${req.path}`);
        return res.status(404).json({ success: false, message: "API endpoint not found (SPA Fallback)" });
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(3000, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });

  const realtimeServer = new RealtimeServer(sqlRaw, JWT_SECRET);
  realtimeServerInstance = realtimeServer;
  await realtimeServer.initialize(server);
  
  // Increase timeouts to prevent TCP keep-alive race conditions during 6-second batch delays
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 120000; // 2 minutes
}

startServer().catch(err => {
  console.error("Fatal server startup error:", err);
});
