import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Pattern for DriverDashboard
content = re.sub(
    r'<DriverDashboard\s*/>',
    r'<DriverDashboard driverId={loggedInDriver?.id || "unknown"} routeId={loggedInDriver?.routeId || "unknown"} onBack={() => setActiveSection("hub")} />',
    content
)

# Pattern for ParentPortal
content = re.sub(
    r'<ParentPortal\s*/>',
    r'<ParentPortal studentName={userProfile?.name || "ولي أمر"} onBack={() => setActiveSection("hub")} />',
    content
)

with open("src/App.tsx", "w") as f:
    f.write(content)
