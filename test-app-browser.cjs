const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[PAGEERROR] ${err.stack || err.message}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    logs.push(`[GOTO ERROR] ${e.message}`);
  }

  // Wait a bit for React to render or throw
  await new Promise(r => setTimeout(r, 3000));

  const domInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      title: document.title,
      rootExists: !!root,
      rootChildCount: root ? root.children.length : 0,
      rootHTML: root ? root.innerHTML.slice(0, 1000) : '',
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      visibleText: document.body.innerText.slice(0, 500)
    };
  });

  await page.screenshot({ path: '/tmp/app_screen.png' });
  await browser.close();

  console.log('=== DOM INFO ===');
  console.log(JSON.stringify(domInfo, null, 2));
  console.log('=== PAGE ERRORS ===');
  console.log(errors.join('\n') || 'None');
  console.log('=== CONSOLE LOGS (last 20) ===');
  console.log(logs.slice(-20).join('\n'));
})();
