import { doc, updateDoc, increment, getDoc, setDoc } from '@/src/lib/firebase';
import { db } from './firebase';

export const calculateRank = (points: number, isTop100: boolean = false) => {
  if (isTop100) return 'guardian'; // Was فارس العرش, mapping to highest rank
  if (points >= 2000) return 'commander';
  if (points >= 500) return 'knight';
  return 'squire';
};

export const updatePoints = async (userId: string, pointsToAdd: number, reason: string) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    // Get current user data to check streak multiplier
    const userSnap = await getDoc(userRef);
    let multiplier = 1;
    let currentScore = 0;
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      currentScore = data.totalScore || 0;
      if (data.streak >= 3) {
        multiplier = 2;
      }
    }

    // Don't multiply negative points (losses)
    const finalPoints = pointsToAdd > 0 ? pointsToAdd * multiplier : pointsToAdd; 
    const newScore = Math.max(0, currentScore + finalPoints); // Prevent negative total score

    const newRank = calculateRank(newScore);

    await setDoc(userRef, {
      totalScore: newScore,
      xp: newScore, // Keep xp in sync if used
      rank: newRank
    }, { merge: true });
    
    return { finalPoints, newScore, newRank, multiplier };
  } catch (error) {
    console.error("Error updating points:", error);
    return null;
  }
};

export const updateDailyLogin = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    const userSnap = await getDoc(userRef);
    const today = new Date().toISOString().split('T')[0];
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const lastLogin = data.lastLoginDate;
      
      if (lastLogin !== today) {
        let newStreak = data.streak || 0;
        
        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1; // Reset streak
          }
        } else {
          newStreak = 1;
        }
        
        await updateDoc(userRef, {
          lastLoginDate: today,
          streak: newStreak
        });
      }
    }
  } catch (error) {
    console.error("Error updating daily login:", error);
  }
};
