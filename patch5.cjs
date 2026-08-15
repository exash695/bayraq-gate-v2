const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    }
                  >
                    <AnimatePresence>
                      <motion.div`;

const replacement = `                    }
                  >
                    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                      <motion.div`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
