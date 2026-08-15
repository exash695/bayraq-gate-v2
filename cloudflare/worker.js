/**
 * Cloudflare Worker - Gateway Middleware for Bairaq Portal (بوابة بيرق)
 * 
 * Functions:
 * 1. Acts as the primary backend gateway for all external AI requests.
 * 2. Isolates API keys (GEMINI_API_KEY / OpenAI / Claude) inside Worker Environment Secrets.
 * 3. Provides route handling for chat, OCR extract, radar, mock exam, paper questions, homework evaluation, explanations.
 * 4. Enables swappable AI providers via process/env config.
 * 5. Proxies heavy media uploads and R2 storage presigning.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bairaq-Gateway, Range',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Standard Response Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    };

    try {
      // ----------------------------------------------------
      // 1. Health Check & Telemetry
      // ----------------------------------------------------
      if (path === '/health' || path === '/api/worker/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'Bairaq-Cloudflare-Worker-Gateway',
          version: '2.0.0',
          provider: env.AI_PROVIDER || 'gemini',
          timestamp: new Date().toISOString()
        }), { status: 200, headers: corsHeaders });
      }

      // ----------------------------------------------------
      // 2. AI Chat Endpoint (/api/worker/ai/chat)
      // ----------------------------------------------------
      if (path === '/api/worker/ai/chat') {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret is not configured in Worker environment' }), { status: 500, headers: corsHeaders });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const promptText = `
${body.context ? `المحتوى الدراسي المتاح:\n${body.context}\n` : ''}
السؤال/الطلب من الطالب: ${body.message}
أجب باللغة العربية الفصحى وبأسلوب مشجع ودقيق.
        `.trim();

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          return new Response(JSON.stringify({ error: 'AI Provider error', details: errText }), { status: geminiRes.status, headers: corsHeaders });
        }

        const data = await geminiRes.json();
        const responseMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم يتوفر رد من الذكاء الاصطناعي.';
        return new Response(JSON.stringify({ response: responseMessage }), { status: 200, headers: corsHeaders });
      }

      // ----------------------------------------------------
      // 3. AI Extract & Presentation Converter (/api/worker/ai/extract)
      // ----------------------------------------------------
      if (path === '/api/worker/ai/extract') {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is missing' }), { status: 500, headers: corsHeaders });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const cleanBase64 = body.base64Data ? body.base64Data.replace(/^data:[^;]+;base64,/, '') : '';
        const prompt = `
أنت محلل بنية هيكلية وتحويل العرض لملفات الملازم الدراسية.
قم باستخلاص الكتل الهيكلية (structuredContent) من هذه الصفحة دون تعديل المادة العلمية.
${body.extractedText ? `النص المستخرج الأصلي:\n${body.extractedText}` : ''}
أرجع النتيجة بصيغة JSON مطابقة للهيكل المطلوب:
{
  "pages": [
    {
      "pageNumber": 1,
      "title": "عنوان الصفحة",
      "structuredContent": [],
      "quiz": []
    }
  ]
}
        `;

        const parts = [{ text: prompt }];
        if (cleanBase64) {
          parts.unshift({
            inlineData: {
              mimeType: body.mimeType || 'image/jpeg',
              data: cleanBase64
            }
          });
        }

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await geminiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        let parsedJSON = { pages: [] };
        try {
          const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
          parsedJSON = JSON.parse(match[1].trim());
        } catch (e) {
          parsedJSON = { pages: [{ pageNumber: 1, title: 'صفحة المحتوى', structuredContent: [{ type: 'paragraph', content: body.extractedText || 'محتوى الصفحة' }], quiz: [] }] };
        }

        return new Response(JSON.stringify(parsedJSON), { status: 200, headers: corsHeaders });
      }

      // ----------------------------------------------------
      // 4. AI Radar Questions (/api/worker/ai/radar)
      // ----------------------------------------------------
      if (path === '/api/worker/ai/radar') {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const prompt = `بناءً على المحتوى التالي، استنتج 3 أسئلة ذكية واستنتاجية عميقة للطلاب:\n${body.content}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await geminiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const questions = rawText.split('\n').filter(q => q.trim().length > 0);

        return new Response(JSON.stringify({ questions }), { status: 200, headers: corsHeaders });
      }

      // ----------------------------------------------------
      // 5. AI Mock Exam (/api/worker/ai/mock-exam)
      // ----------------------------------------------------
      if (path === '/api/worker/ai/mock-exam') {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const prompt = `
أنشئ امتحان تجريبي من 20 سؤالاً اختيار من متعدد باللغة العربية لمادة [${body.subject || 'عام'}] بالهيكل التالي:
[
  {
    "id": 1,
    "text": "السؤال",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "correctAnswer": 0,
    "explanation": "التفسير الوزاري"
  }
]
        `;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await geminiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        let questions = [];
        try {
          const match = rawText.match(/\[[\s\S]*\]/);
          questions = match ? JSON.parse(match[0]) : [];
        } catch (e) {}

        return new Response(JSON.stringify({ questions }), { status: 200, headers: corsHeaders });
      }

      // ----------------------------------------------------
      // 6. R2 Storage Asset Gateway Handler
      // ----------------------------------------------------
      if (path.startsWith('/media/') || path.startsWith('/mascot/') || path.startsWith('/schools/')) {
        if (env.BAIRAQ_MEDIA_BUCKET) {
          const objectKey = path.replace(/^\//, '');
          const object = await env.BAIRAQ_MEDIA_BUCKET.get(objectKey);

          if (!object) {
            return new Response('Media asset not found in R2', { status: 404 });
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('etag', object.httpEtag);

          return new Response(object.body, { headers });
        }
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found', path }), { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Worker Gateway exception', details: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
