const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

// Add a useEffect to guarantee video plays automatically whenever effectiveVideoSrc changes
const videoEffectToAdd = `
  // Robust Autoplay Effect
  React.useEffect(() => {
    if (isVideoFile && !videoError && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(err => {
        console.log('[BERQ VIDEO] Autoplay prevented or failed:', err);
        // Try again on next tick or user interaction fallback
      });
    }
  }, [effectiveVideoSrc, isVideoFile, videoError]);
`;

if (!code.includes('Robust Autoplay Effect')) {
  // Insert before the return statement of BerqCharacter
  code = code.replace(`  return (`, videoEffectToAdd + '\n  return (');
  fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
  console.log('Added robust autoplay effect to BerqCharacterManager.tsx');
}
