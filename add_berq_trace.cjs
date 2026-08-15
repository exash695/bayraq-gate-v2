const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

// Insert useEffect for fetch tracing and ref for img element tracing
const targetImgTag = `<img
          src={imgSrc || fallbackPng || fallbackJpg || defaultJpg || defaultPng}
          alt={altText}
          loading="eager"
          onError={(e) => {`;

const tracedImgTag = `<img
          ref={(el) => {
            if (el) {
              console.log('[BERQ TRACE] --- <img> element mounted ---');
              console.log('[BERQ TRACE] 1. Requested pose name:', pose);
              console.log('[BERQ TRACE] 2. Final filename / URL:', imageUrl);
              console.log('[BERQ TRACE] 3. Final path passed to src:', imgSrc || fallbackPng || fallbackJpg);
              console.log('[BERQ TRACE] 5. img.src:', el.src);
              console.log('[BERQ TRACE] 6. img.currentSrc:', el.currentSrc);
              console.log('[BERQ TRACE] 7. img.complete:', el.complete);
              console.log('[BERQ TRACE] 8. img.naturalWidth:', el.naturalWidth);
              console.log('[BERQ TRACE] 10. Cache/Registry check: imageMapping contains:', imageUrl, 'fallbackJpg:', fallbackJpg);
            }
          }}
          src={imgSrc || fallbackPng || fallbackJpg || defaultJpg || defaultPng}
          alt={altText}
          loading="eager"
          onError={(e) => {
            const target = e.currentTarget;
            console.log('[BERQ TRACE] 9. onError is triggered! pose:', pose, 'failed src:', target.src);`;

code = code.replace(targetImgTag, tracedImgTag);

// Also add useEffect inside BerqCharacter for fetch result
const targetEffect = `  React.useEffect(() => {
    setVideoError(false);
    setIsVideoPlaying(false);
    setImgSrc(fallbackPng || fallbackJpg || defaultJpg || defaultPng);
  }, [pose, imageUrl, fallbackPng, fallbackJpg]);`;

const tracedEffect = `  React.useEffect(() => {
    setVideoError(false);
    setIsVideoPlaying(false);
    setImgSrc(fallbackPng || fallbackJpg || defaultJpg || defaultPng);
  }, [pose, imageUrl, fallbackPng, fallbackJpg]);

  React.useEffect(() => {
    const p = imgSrc || fallbackPng || fallbackJpg || defaultJpg || defaultPng;
    console.log('[BERQ TRACE] --- FETCH CHECK --- pose:', pose, 'path:', p);
    fetch(p, { method: 'HEAD' })
      .then(res => console.log('[BERQ TRACE] 4. Result of fetch for path', p, ':', res.status, res.statusText))
      .catch(err => console.log('[BERQ TRACE] 4. Result of fetch FAILED for path', p, ':', err));
  }, [pose, imgSrc, fallbackPng, fallbackJpg]);`;

code = code.replace(targetEffect, tracedEffect);

fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
console.log('Successfully added Berq trace logging.');
