const fs = require('fs');
let content = fs.readFileSync('src/components/SchoolPlatform.tsx', 'utf8');

const oldSort = `        // Sort classmates by totalPoints descending for live sync leaderboard
        computedStudents.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return (a.name || "").localeCompare(b.name || "", "ar");
        });`;

const newSort = `        // Sort classmates by totalPoints, then by average percent descending for live sync leaderboard
        computedStudents.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          const aAvg = Number(a.averagePercent) || 0;
          const bAvg = Number(b.averagePercent) || 0;
          if (bAvg !== aAvg) {
            return bAvg - aAvg;
          }
          return (a.name || "").localeCompare(b.name || "", "ar");
        });`;

content = content.replace(oldSort, newSort);
fs.writeFileSync('src/components/SchoolPlatform.tsx', content);
