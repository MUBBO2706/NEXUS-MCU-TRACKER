import React from 'react';
import { AnalyticsDash } from '../AnalyticsDash';
import { AchievementsGrid } from '../AchievementsGrid';
import { UserWatchData } from '../../types';

interface AnalyticsTabProps {
  watchData: Record<string, UserWatchData>;
  favoritePhase: string;
  updatePreference: (key: string, value: any) => void;
  favoriteCharacter: string;
  activeTheme: 'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra';
  unlockedAchievements: string[];
  handleSetUnlockedAchievements: (next: string[] | ((prev: string[]) => string[])) => void;
  triggerConfettiParticles: () => void;
  orderingMode: 'theatrical' | 'chronological';
}

export function AnalyticsTab({
  watchData,
  favoritePhase,
  updatePreference,
  favoriteCharacter,
  activeTheme,
  unlockedAchievements,
  handleSetUnlockedAchievements,
  triggerConfettiParticles,
  orderingMode,
}: AnalyticsTabProps) {
  return (
    <>
      <AnalyticsDash
        watchData={watchData}
        favoritePhase={favoritePhase}
        setFavoritePhase={(val) => updatePreference('favPhase', val)}
        favoriteCharacter={favoriteCharacter}
        setFavoriteCharacter={(val) => updatePreference('favChar', val)}
        activeTheme={activeTheme}
        orderingMode={orderingMode}
        setOrderingMode={(val) => updatePreference('orderingMode', val)}
      />

      {/* Achievements sheet block */}
      <AchievementsGrid
        watchData={watchData}
        unlockedAchievements={unlockedAchievements}
        setUnlockedAchievements={handleSetUnlockedAchievements}
        onTriggerConfetti={triggerConfettiParticles}
      />
    </>
  );
}
