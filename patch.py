import re

with open('src/components/Transport/FleetPanel.tsx', 'r') as f:
    code = f.read()

# Replace GHAMMAS_STOPS, GHAMMAS_LANDMARKS, INITIAL_BUSES, BUS_PATHS
code = re.sub(r'const GHAMMAS_STOPS.*?\];', '', code, flags=re.DOTALL)
code = re.sub(r'const GHAMMAS_LANDMARKS.*?\];', '', code, flags=re.DOTALL)
code = re.sub(r'const INITIAL_BUSES.*?\];', '', code, flags=re.DOTALL)
code = re.sub(r'const BUS_PATHS.*?\]\n};', '', code, flags=re.DOTALL)

# Replace buses state and loop
marker_start = '// Live buses simulation states with staggered starting positions'
marker_end = '// Drag handlers for the interactive map'

start_idx = code.find(marker_start)
end_idx = code.find(marker_end)

replacement = """// Simulation and dynamic mapping
  const [busProgress, setBusProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setBusProgress(prev => {
      const init = { ...prev };
      routes.forEach(route => {
        if (init[route.id] === undefined) {
          init[route.id] = Math.random(); // Start at random point
        }
      });
      return init;
    });
  }, [routes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBusProgress(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          let p = next[key] + 0.02 + (Math.random() * 0.01);
          if (p >= 1) p = 0;
          next[key] = p;
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const buses: MapBus[] = routes.map((route, idx) => {
    const driver = drivers.find(d => d.id === route.driverId);
    const colors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];
    return {
      id: route.id,
      name: `حافلة ${idx + 1}`,
      driverName: driver?.name || 'غير محدد',
      plate: route.busPlate || 'غير محدد',
      phone: driver?.phone || 'غير محدد',
      speed: route.status === 'in_transit' ? Math.floor(Math.random() * 20) + 20 : 0,
      studentsCount: studentStatuses.filter(s => s.routeId === route.id && s.status === 'picked_up').length,
      status: route.status === 'in_transit' ? 'moving' : (route.status === 'idle' ? 'stopped' : 'moving'),
      lat: 0,
      lng: 0,
      routeColor: colors[idx % colors.length],
      routeName: route.name
    };
  });

  const allStops: MapStop[] = routes.flatMap(route => {
    return (route.stops || []).map((stopName, idx) => ({
      id: `${route.id}-stop-${idx}`,
      name: stopName,
      lat: 0,
      lng: 0,
      waitingStudents: studentStatuses.filter(s => s.routeId === route.id && s.stopName === stopName && s.status === 'waiting').length,
      students: studentStatuses.filter(s => s.routeId === route.id && s.stopName === stopName).map(s => s.studentName),
      busId: route.id
    }));
  });

  // Automatic camera centering and notification when school changes
  useEffect(() => {
    setCameraCenter({ x: currentCenter.x, y: currentCenter.y });
    setCameraZoom(1.05);
    setNotificationZone(currentCenter.cityName);
    const t = setTimeout(() => setNotificationZone(null), 3500);
    return () => clearTimeout(t);
  }, [schoolId, schoolName]);

"""

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + replacement + code[end_idx:]

code = code.replace('GHAMMAS_STOPS', 'allStops')
code = re.sub(r'const busProgressMap = buses\.reduce.*?\} as Record<string, number>\);', 'const busProgressMap = busProgress;', code, flags=re.DOTALL)

button_regex = r'<motion\.button\s+onClick=\{\(\) => setIsTrackingCenterOpen\(false\)\}[\s\S]*?<\/motion\.button>'
new_button = '''<motion.button
              onClick={() => setIsTrackingCenterOpen(false)}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md"
              title="رجوع للتبويب"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>'''
            
code = re.sub(button_regex, new_button, code, count=1)

with open('src/components/Transport/FleetPanel.tsx', 'w') as f:
    f.write(code)

print("Patched correctly via python!")
