const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLine = '  const activeSection = activeSectionState;';
const hookStr = `

  useEffect(() => {
    // Reset scroll position instantly when switching sections
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    
    // Also try to reset any scroll containers if needed
    const mainContent = document.getElementById("main-content-area");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [activeSectionState]);
`;

code = code.replace(targetLine, targetLine + hookStr);
fs.writeFileSync('src/App.tsx', code);
