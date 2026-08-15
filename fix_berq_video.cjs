const fs = require('fs');
let code = fs.readFileSync('src/components/BerqCharacterManager.tsx', 'utf8');

// Remove the misplaced block
code = code.replace(`  // Robust Autoplay Effect
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
  }, [effectiveVideoSrc, isVideoFile, videoError]);`, '');

// Now let's add it right inside BerqCharacter before return
const target = '  return (\n    <motion.div';
const replacement = `  // Robust Autoplay Effect for automatic playback
  React.useEffect(() => {
    if (isVideoFile && !videoError && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(err => {
        console.log('[BERQ VIDEO] Autoplay prevented or failed:', err);
      });
    }
  }, [effectiveVideoSrc, isVideoFile, videoError]);

  return (
    <motion.div`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/BerqCharacterManager.tsx', code, 'utf8');
  console.log('Successfully placed autoplay effect inside BerqCharacter.');
} else {
  console.log('Could not find target in BerqCharacterManager.tsx');
}
