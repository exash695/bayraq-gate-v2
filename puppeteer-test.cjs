const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React DevTools')) {
      console.log('[BROWSER]', msg.type(), text);
    }
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err));
  page.on('request', req => {
    if (req.url().includes('/api/auth') || req.url().includes('/api/schools') || req.url().includes('/api/academic')) {
      console.log('[NET REQ]', req.method(), req.url());
    }
  });
  page.on('response', async res => {
    if (res.url().includes('/api/auth')) {
      console.log('[NET RES]', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:3000');

  // Register and login properly
  const email = `test_${Date.now()}@example.com`;
  console.log('Registering user with email:', email);
  const loginRes = await page.evaluate(async (em) => {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: em,
        password: 'Password123!',
        name: 'فارس تجريبي',
        role: 'student',
        schoolId: 'general'
      })
    });
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, password: 'Password123!' })
    });
    return await login.json();
  }, email);
  console.log('Login response:', loginRes.success, 'Token exists:', !!loginRes.token);

  // Set the token and navigate to school-content
  await page.evaluate((token) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('bairaq_jwt_token', token);
    localStorage.setItem('s6_activeSection', 'school-content');
    localStorage.setItem('s6_selectedSchoolId', 'school1');
  }, loginRes.token);

  await page.goto('http://localhost:3000');
  
  // Wait for the input of SchoolAccessGate
  await page.waitForSelector('input', { timeout: 10000 });
  console.log('SchoolAccessGate is displayed on screen!');

  // Check buttons on screen
  const gateButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
  });
  console.log('Gate buttons:', gateButtons);

  // Type student code P1-G-3093
  await page.type('input', 'P1-G-3093');
  console.log('Typed code P1-G-3093 into input field');

  // Click verify button
  const startTime = Date.now();
  console.log('>>> CLICKING VERIFY BUTTON NOW <<<');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyBtn = btns.find(b => b.textContent.includes('تـحـقـق') || b.textContent.includes('تحقق'));
    if (verifyBtn) {
      console.log('Found verify button, triggering click...');
      verifyBtn.click();
    } else {
      console.error('Verify button NOT found!');
    }
  });

  // Track the next 15 seconds to see when and how it transitions
  for (let i = 1; i <= 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const pageState = await page.evaluate(() => {
      const isGate = !!document.querySelector('input');
      const verifyBtnText = Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent.trim())
        .find(t => t.includes('تحقق') || t.includes('تـحـقـق') || t.includes('جاري'));
      const activeHeadings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(Boolean);
      return { isGate, verifyBtnText, headings: activeHeadings.slice(0, 4) };
    });
    console.log(`[T+${i}s, Elapsed: ${Date.now() - startTime}ms] State:`, JSON.stringify(pageState));
    if (!pageState.isGate) {
      console.log('SUCCESS! Transitioned out of SchoolAccessGate at T+' + i + 's!');
      break;
    }
  }

  await page.screenshot({ path: '/tmp/gate_result.png' });
  await browser.close();
})();
