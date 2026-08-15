const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Click skip video
  try {
    const btn = await page.$('button'); // there are two buttons, first is skip
    if (btn) {
      await btn.click();
      console.log('Skipped video');
    }
  } catch (e) {
    console.log('No skip btn', e);
  }

  await new Promise(r => setTimeout(r, 3000)); // wait for auth or next page

  // Check if there is an auth page skip (sometimes we have skip on login)
  try {
    const skipAuthBtn = await page.$('button'); // we might need specific selector
    // Just evaluate and click any button that has text "دخول" or similar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const skipBtn = btns.find(b => b.textContent.includes('تخطي') || b.textContent.includes('دخول') || b.textContent.includes('زائر'));
      if (skipBtn) skipBtn.click();
    });
  } catch(e) {}
  
  await new Promise(r => setTimeout(r, 3000));
  
  const imgInfo = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => {
      const computed = window.getComputedStyle(img);
      return {
        tag: img.tagName,
        src: img.src,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: computed.width,
        height: computed.height,
        zIndex: computed.zIndex,
        objectFit: computed.objectFit,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      };
    });
  });

  console.log("DOM Image Info:", JSON.stringify(imgInfo, null, 2));

  await browser.close();
})();
