export type StudentLevelInfo = {
  level: number;
  title: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
};

export const getStudentLevelInfo = (xp: number = 0): StudentLevelInfo => {
  if (xp >= 5000) {
    return {
      level: 5,
      title: 'أسطورة بيرق',
      borderColor: 'border-[#ffffff]', // أبيض مضيء
      glowColor: 'shadow-[0_0_25px_rgba(255,255,255,0.6)]',
      bgGradient: 'from-[#4c1d95] to-[#2e1065]', // بنفسجي داكن
    };
  } else if (xp >= 3000) {
    return {
      level: 4,
      title: 'بطل النخبة',
      borderColor: 'border-[#FFD700]', // ذهبي متوهج
      glowColor: 'shadow-[0_0_20px_rgba(255,215,0,0.5)]',
      bgGradient: 'from-[#1e293b] to-[#0f172a]',
    };
  } else if (xp >= 1500) {
    return {
      level: 3,
      title: 'فارس المعرفة',
      borderColor: 'border-[#D4AF37]', // ذهبي خفيف
      glowColor: 'shadow-[0_0_15px_rgba(212,175,55,0.3)]',
      bgGradient: 'from-[#1e3a8a] to-[#1e1b4b]', // أزرق ملكي
    };
  } else if (xp >= 500) {
    return {
      level: 2,
      title: 'طالب متفوق',
      borderColor: 'border-[#0ea5e9]', // فيروزي
      glowColor: 'shadow-[0_0_15px_rgba(14,165,233,0.4)]',
      bgGradient: 'from-[#0f172a] to-[#020617]',
    };
  } else {
    return {
      level: 1,
      title: 'طالب أكاديمي',
      borderColor: 'border-[#475569]', // هادئ
      glowColor: 'shadow-[0_0_10px_rgba(71,85,105,0.2)]',
      bgGradient: 'from-[#1e293b] to-[#0f172a]',
    };
  }
};

export const getProfessionalAvatar = (user: any) => {
  if (user?.photoURL || user?.avatarUrl) {
    return user.photoURL || user.avatarUrl;
  }
  
  // Create beautiful abstract initials representing an academic 3D-like icon
  const name = user?.name || user?.fullName || 'بطل';
  const firstLetter = name.charAt(0).toUpperCase(); // works for arabic or english
  
  const xp = user?.xp || user?.totalScore || 0;
  const levelInfo = getStudentLevelInfo(xp);
  
  // Build UI Avatar with specific colors based on level
  let bg = '1e293b';
  let color = 'ffffff';
  
  if (levelInfo.level === 5) { bg = '4c1d95'; color = 'ffffff'; }
  else if (levelInfo.level === 4) { bg = 'D4AF37'; color = '000000'; }
  else if (levelInfo.level === 3) { bg = '1e3a8a'; color = 'D4AF37'; }
  else if (levelInfo.level === 2) { bg = '0ea5e9'; color = 'ffffff'; }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=${bg}&color=${color}&size=200&bold=true&font-size=0.6`;
};
