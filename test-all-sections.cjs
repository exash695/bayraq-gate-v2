const puppeteer = require('puppeteer');

const sections = [
  'gate-6',
  'hub',
  'mayadeen',
  'school-content',
  'unit-detail',
  'radar',
  'bank',
  'control',
  'ai-bot',
  'profile',
  'sovereignty',
  'battalion',
  'hall-of-fame',
  'idea-bank',
  'vault',
  'admin-hub',
  'dev-dashboard',
  'mascot-test'
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const sec of sections) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.stack || err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });

    try {
      await page.goto('http://localhost:3000');
      await page.evaluate((s) => {
        localStorage.setItem('s6_activeSection', s);
      }, sec);
      await page.reload({ waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const isError = await page.evaluate(() => {
        return document.body.innerText.includes('GATE 6 - RECOVERY MODE') ||
               document.body.innerText.includes('جاري تحسين تجربة التعلم');
      });

      console.log(`Section "${sec}": errors=${pageErrors.length}, inRecoveryMode=${isError}`);
      if (pageErrors.length > 0) {
        console.log(`  Errors:`, pageErrors.slice(0, 3));
      }
    } catch (e) {
      console.log(`Section "${sec}" FAILED to test:`, e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
