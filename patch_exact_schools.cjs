const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/FleetPanel.tsx', 'utf8');

// We need to replace the GHAMMAS_STOPS array.
// Instead of simple string replace, let's replace the whole array declaration.
const newStops = `const GHAMMAS_STOPS: MapStop[] = [
  { id: 'stop1', name: 'مدرسة أم الربيعين الابتدائية', lat: 31.7367231, lng: 44.6144858, waitingStudents: 5, students: ['محمد حيدر', 'زينب علي', 'فاطمة الكناني', 'حسن الموسوي', 'سجاد العبودي'], busId: 'bus1' },
  { id: 'stop2', name: 'مدرسة غماس الإبتدائية', lat: 31.7367349, lng: 44.6042306, waitingStudents: 8, students: ['علي الكناني', 'أمير الغانم', 'سارة الجبوري', 'رقية العزاوي', 'عباس الربيعي', 'حسين البديري', 'مقتدى الخفاجي', 'تبارك العبودي'], busId: 'bus1' },
  { id: 'stop3', name: 'مدرسة الشهيد فيصل دلول', lat: 31.7427235, lng: 44.6184886, waitingStudents: 4, students: ['جعفر الكعبي', 'هدى الموسوي', 'نور الهدى الربيعي', 'كرار البديري'], busId: 'bus4' },
  { id: 'stop4', name: 'مدرسة زنوبيا للبنات', lat: 31.7345365, lng: 44.6023995, waitingStudents: 6, students: ['أحمد الخفاجي', 'زهراء الغانم', 'فاطمة العبودي', 'علي الربيعي', 'حسين الموسوي', 'بنين الكناني'], busId: 'bus2' },
  { id: 'stop5', name: 'متوسطة ذو الفقار للبنين', lat: 31.7348318, lng: 44.6010327, waitingStudents: 3, students: ['يوسف الجبوري', 'mriam', 'حسن الكناني'], busId: 'bus3' },
  { id: 'stop6', name: 'ثانوية غماس المسائية للبنين', lat: 31.7350439, lng: 44.6001650, waitingStudents: 6, students: ['أمير الكعبي', 'زينب الموسوي', 'سارة الكناني', 'فاطمة البديري', 'حيدر الربيعي', 'زهراء الخفاجي'], busId: 'bus5' },
  { id: 'stop7', name: 'مدارس ابن عقيل الاهلية', lat: 31.7346894, lng: 44.5999198, waitingStudents: 0, students: [], busId: 'bus6' }
];`;

code = code.replace(/const GHAMMAS_STOPS: MapStop\[\] = \[[\s\S]*?\];/, newStops);

// Also let's adjust the buses to be near the new coordinates (31.73xx, 44.60xx)
const newBuses = `const INITIAL_BUSES: MapBus[] = [
  { id: 'bus1', name: 'حافلة ١', driverName: 'الكابتن حيدر الربيعي', plate: 'القادسية - ١٢٤٥٦', phone: '+964 771 234 5671', speed: 35, studentsCount: 26, status: 'moving', lat: 31.7367231, lng: 44.6144858, routeColor: '#22c55e', routeName: 'الخط الأخضر - مدرسة أم الربيعين' },
  { id: 'bus2', name: 'حافلة ٢', driverName: 'الكابتن أبو أحمد الكناني', plate: 'القادسية - ٨٧٦٥٤', phone: '+964 782 345 6782', speed: 42, studentsCount: 28, status: 'moving', lat: 31.7345365, lng: 44.6023995, routeColor: '#2563eb', routeName: 'الخط الأزرق - مدرسة زنوبيا' },
  { id: 'bus3', name: 'حافلة ٣', driverName: 'الكابتن عمر الجبوري', plate: 'القادسية - ٣٤٥٦٧', phone: '+964 750 456 7893', speed: 28, studentsCount: 24, status: 'moving', lat: 31.7348318, lng: 44.6010327, routeColor: '#f97316', routeName: 'الخط البرتقالي - متوسطة ذو الفقار' },
  { id: 'bus4', name: 'حافلة ٤', driverName: 'الكابتن جعفر الموسوي', plate: 'القادسية - ٥٦٧٨٩', phone: '+964 770 567 8904', speed: 0, studentsCount: 18, status: 'boarding', lat: 31.7427235, lng: 44.6184886, routeColor: '#a855f7', routeName: 'الخط البنفسجي - مدرسة الشهيد فيصل دلول' },
  { id: 'bus5', name: 'حافلة ٥', driverName: 'الكابتن سجاد العزاوي', plate: 'القادسية - ٤٥٦٧٨', phone: '+964 780 678 9012', speed: 30, studentsCount: 30, status: 'moving', lat: 31.7350439, lng: 44.6001650, routeColor: '#ef4444', routeName: 'الخط الأحمر - ثانوية غماس' },
  { id: 'bus6', name: 'حافلة ٦', driverName: 'الكابتن منتظر الغانم', plate: 'القادسية - ٦٥٤٣٢', phone: '+964 751 789 0123', speed: 38, studentsCount: 22, status: 'moving', lat: 31.7346894, lng: 44.5999198, routeColor: '#eab308', routeName: 'الخط الأصفر - مدارس ابن عقيل' }
];`;

code = code.replace(/const INITIAL_BUSES: MapBus\[\] = \[[\s\S]*?\];/, newBuses);

// Fix BUS_PATHS to also be around the real coordinates
const newPaths = `const BUS_PATHS: Record<string, Array<{ lat: number; lng: number }>> = {
  bus1: [{ lat: 31.7367231, lng: 44.6144858 }, { lat: 31.736000, lng: 44.610000 }, { lat: 31.735500, lng: 44.605000 }],
  bus2: [{ lat: 31.7345365, lng: 44.6023995 }, { lat: 31.735000, lng: 44.603000 }, { lat: 31.735500, lng: 44.605000 }],
  bus3: [{ lat: 31.7348318, lng: 44.6010327 }, { lat: 31.735000, lng: 44.603000 }, { lat: 31.735500, lng: 44.605000 }],
  bus4: [{ lat: 31.7427235, lng: 44.6184886 }, { lat: 31.740000, lng: 44.615000 }, { lat: 31.735500, lng: 44.605000 }],
  bus5: [{ lat: 31.7350439, lng: 44.6001650 }, { lat: 31.735200, lng: 44.602000 }, { lat: 31.735500, lng: 44.605000 }],
  bus6: [{ lat: 31.7346894, lng: 44.5999198 }, { lat: 31.735000, lng: 44.602000 }, { lat: 31.735500, lng: 44.605000 }]
};`;

code = code.replace(/const BUS_PATHS: Record<string, Array<\{ lat: number; lng: number \}>> = \{[\s\S]*?\};/, newPaths);

// Fix the center of the map in FleetPanel
// We see `const schoolCoord = { lat: 31.8145, lng: 44.6055`
// We'll replace 31.8145 with 31.735500 and 44.6055 with 44.605000
code = code.replace(/lat: 31\.8145, lng: 44\.6055/g, "lat: 31.735500, lng: 44.605000");

// Also remove landmarks or fix them
code = code.replace(/const GHAMMAS_LANDMARKS = \[[\s\S]*?\];/, "const GHAMMAS_LANDMARKS: any[] = [];");

fs.writeFileSync('src/components/Transport/FleetPanel.tsx', code);
