const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept requests to monitor what is loading
  const responses = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status()
    });
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait a bit to ensure rendering
  await new Promise(r => setTimeout(r, 2000));

  const imgInfo = await page.evaluate(() => {
    // Find images containing mascot or school in their src
    const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src.includes('mascot') || img.src.includes('school'));
    if (imgs.length === 0) return { error: 'No mascot/school images found' };

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
