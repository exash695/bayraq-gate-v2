const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // get innerText of body
  const text = await page.evaluate(() => document.body.innerText);
  console.log('TEXT:', text.substring(0, 500));
  
  await browser.close();
})();
