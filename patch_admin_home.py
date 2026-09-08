with open("src/components/AdminDashboard.tsx", "r") as f:
    content = f.read()

# 1. Add Import
if "AdminHomeDashboard" not in content:
    content = content.replace("import { PortalPulseDashboard } from './PortalPulseDashboard';", "import { PortalPulseDashboard } from './PortalPulseDashboard';\nimport { AdminHomeDashboard } from './AdminHomeDashboard';")

# 2. Add 'home' to activeTab state (if not already there) and set it as default
if "useState<'home' |" not in content:
    content = content.replace("useState<'pulse' | 'codes'", "useState<'home' | 'pulse' | 'codes'")
    content = content.replace("('pulse');", "('home');") # Set default to home

# 3. Add home tab to the tabs array
if "{ id: 'home'" not in content:
    home_tab_str = "    { id: 'home', name: 'غرفة القيادة (الرئيسية)', icon: Layout, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },\n"
    content = content.replace("  const tabs = [", "  const tabs = [\n" + home_tab_str)

# 4. Add rendering logic for home tab
if "key=\"home-tab\"" not in content:
    home_render_str = """          {activeTab === 'home' && (
            <motion.div 
               key="home-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
            >
              <AdminHomeDashboard schoolName={schoolName} selectedSchoolId={selectedSchoolId} setActiveTab={setActiveTab} />
            </motion.div>
          )}

"""
    content = content.replace("<AnimatePresence mode=\"wait\">", "<AnimatePresence mode=\"wait\">\n" + home_render_str)

with open("src/components/AdminDashboard.tsx", "w") as f:
    f.write(content)
