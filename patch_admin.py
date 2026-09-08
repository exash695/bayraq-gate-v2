with open("src/components/AdminDashboard.tsx", "r") as f:
    content = f.read()

import re

# Add import
if "import { AdminSovereigntyManager }" not in content:
    content = content.replace("import { db, auth } from '../lib/firebase';", "import { db, auth } from '../lib/firebase';\nimport { AdminSovereigntyManager } from './Sovereignty/AdminSovereigntyManager';")

# Add tab
if "{ id: 'sovereignty'" not in content:
    content = content.replace("  const tabs = [", "  const tabs = [\n    { id: 'sovereignty', name: 'منصة السيادة (البطولات)', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-400/10' },")

# Add Trophy to imports
if "Trophy" not in content:
    content = content.replace("Activity,", "Activity,\n  Trophy,")

# Add panel
if '<motion.div key="sovereignty-tab"' not in content:
    panel = """            {activeTab === 'sovereignty' && (
              <motion.div key="sovereignty-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AdminSovereigntyManager language={language} selectedSchoolId={selectedSchoolId} />
              </motion.div>
            )}"""
    # Insert before <motion.div key="teachers-tab"
    content = content.replace('<motion.div key="teachers-tab"', panel + '\n            <motion.div key="teachers-tab"')

with open("src/components/AdminDashboard.tsx", "w") as f:
    f.write(content)
