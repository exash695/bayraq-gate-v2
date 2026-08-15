import React from 'react';
import { SeasonalThemeCard } from './SeasonalThemeCard';
import { SeasonalAmbientEffects } from './SeasonalAmbientEffects';

export const SeasonalThemeBanner: React.FC = () => {
  return (
    <>
      <SeasonalAmbientEffects />
      <SeasonalThemeCard />
    </>
  );
};
