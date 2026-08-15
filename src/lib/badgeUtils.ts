import { UserProgress, Badge, UnitId } from '../types';
import { BADGES } from '../constants/badges';
import { INITIAL_PAGES } from '../data';

export const checkNewBadges = (
  oldProgress: UserProgress,
  newProgress: UserProgress
): Badge[] => {
  const newlyEarned: Badge[] = [];

  BADGES.forEach(badge => {
    // If already earned, skip
    if (oldProgress.badges[badge.id]) return;

    let earned = false;

    switch (badge.id) {
      case 'first-note':
        earned = Object.keys(newProgress.stickyNotes).length > 0;
        break;
      case 'page-master-5':
        earned = newProgress.masteredPages.length >= 5;
        break;
      case 'unit-1-conqueror':
        earned = checkUnitCompletion(newProgress, 1);
        break;
      case 'unit-2-conqueror':
        earned = checkUnitCompletion(newProgress, 2);
        break;
      case 'unit-3-conqueror':
        earned = checkUnitCompletion(newProgress, 3);
        break;
      // 'challenge-perfect' is handled directly in ChallengeModal
    }

    if (earned) {
      newlyEarned.push(badge);
    }
  });

  return newlyEarned;
};

const checkUnitCompletion = (progress: UserProgress, unitId: number): boolean => {
  const unitPages = INITIAL_PAGES.filter(p => 
    p.unit.includes(`Unit ${unitId}`) || 
    p.unit.includes(`الوحدة ${unitId === 1 ? 'الاولى' : unitId === 2 ? 'الثانية' : unitId}`)
  );
  
  if (unitPages.length === 0) return false;
  
  return unitPages.every(p => progress.masteredPages.includes(p.id));
};
