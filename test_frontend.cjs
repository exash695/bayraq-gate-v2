const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT ERROR:', error.message);
  });

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('Loaded.');

  await new Promise(r => setTimeout(r, 2000));
  
  // Click the entry button
  try {
    const btn = await page.$('.lucide-graduation-cap');
    if (btn) await btn.click();
    console.log('Clicked entry button');
  } catch (e) {
    console.log('No entry button found');
  }

  await new Promise(r => setTimeout(r, 3000));

  // Instead of localStorage, let's click the exact button that says "ميادين الدراسة"
  try {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const hubBtn = btns.find(b => b.textContent && b.textContent.includes('ميادين الدراسة'));
      if (hubBtn) {
        hubBtn.click();
      }
    });
    console.log('Clicked ميادين الدراسة');
  } catch (e) {
    console.log('Failed to click academy pro', e);
  }
  
  await new Promise(r => setTimeout(r, 4000));

  const rootHTML = await page.$eval('#root', el => el.innerHTML);
  console.log('ROOT HTML:', rootHTML);

  await browser.close();
})();
