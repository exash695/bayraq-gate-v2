const fs = require('fs');
let content = fs.readFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', 'utf8');

const oldSort = `        const classroomColleagues = useMemo(() => {
          if (isTeacher) {
            const list = [...(activeClassStudents || [])];
            return list.sort((a: any, b: any) => {
              const aPts = Number(a.totalPoints !== undefined ? a.totalPoints : (a.excellencePoints || 0));
              const bPts = Number(b.totalPoints !== undefined ? b.totalPoints : (b.excellencePoints || 0));
              return bPts - aPts;
            });
          }
          return topStudents || [];
        }, [isTeacher, activeClassStudents, topStudents]);`;

const newSort = `        const classroomColleagues = useMemo(() => {
          if (isTeacher) {
            const list = [...(activeClassStudents || [])];
            return list.sort((a: any, b: any) => {
              const aPts = Number(a.totalPoints !== undefined ? a.totalPoints : (a.excellencePoints || 0));
              const bPts = Number(b.totalPoints !== undefined ? b.totalPoints : (b.excellencePoints || 0));
              if (bPts !== aPts) return bPts - aPts;
              const aAvg = Number(a.averagePercent) || 0;
              const bAvg = Number(b.averagePercent) || 0;
              if (bAvg !== aAvg) return bAvg - aAvg;
              return (a.name || "").localeCompare(b.name || "", "ar");
            });
          }
          return topStudents || [];
        }, [isTeacher, activeClassStudents, topStudents]);`;

if (content.includes(oldSort)) {
    content = content.replace(oldSort, newSort);
    fs.writeFileSync('src/components/SchoolPlatform/StudentExcellenceTab.tsx', content);
    console.log("Replaced");
} else {
    console.log("Not found");
}
