import React, { useEffect } from "react";

interface WelcomeIntroScreenProps {
  onComplete: () => void;
  videoSrc?: string;
  secondaryVideoSrc?: string;
}

export const WelcomeIntroScreen = React.forwardRef<HTMLDivElement, WelcomeIntroScreenProps>(({ 
  onComplete
}, ref) => {
  useEffect(() => {
    // Immediately complete without loading any heavy videos
    onComplete();
  }, [onComplete]);

  return <div ref={ref} className="hidden" />;
});

WelcomeIntroScreen.displayName = "WelcomeIntroScreen";
