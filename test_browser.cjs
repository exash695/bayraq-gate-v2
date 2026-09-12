const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const content = await page.content();
  console.log('HTML ROOT:', await page.$eval('#root', el => el.innerHTML));
  await browser.close();
})();
