const fs = require('fs');
let driverCode = fs.readFileSync('src/components/Transport/DriverDashboard.tsx', 'utf8');
driverCode = driverCode.replace(/'محطة حي العسكري الشمالي'/g, "'إعدادية غماس للبنين'");
driverCode = driverCode.replace(/'محطة تقاطع البلدية'/g, "'مدرسة النور الابتدائية'");
fs.writeFileSync('src/components/Transport/DriverDashboard.tsx', driverCode);

let parentCode = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');
parentCode = parentCode.replace(/'محطة حي العسكري الشمالي'/g, "'إعدادية غماس للبنين'");
parentCode = parentCode.replace(/'محطة تقاطع البلدية'/g, "'مدرسة النور الابتدائية'");
fs.writeFileSync('src/components/Transport/ParentTransportView.tsx', parentCode);
