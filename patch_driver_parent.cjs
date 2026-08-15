const fs = require('fs');

const realStops = {
  'مدرسة أم الربيعين الابتدائية': { lat: 31.7367231, lng: 44.6144858 },
  'مدرسة غماس الإبتدائية': { lat: 31.7367349, lng: 44.6042306 },
  'مدرسة الشهيد فيصل دلول': { lat: 31.7427235, lng: 44.6184886 },
  'مدرسة زنوبيا للبنات': { lat: 31.7345365, lng: 44.6023995 },
  'متوسطة ذو الفقار للبنين': { lat: 31.7348318, lng: 44.6010327 },
  'ثانوية غماس المسائية للبنين': { lat: 31.7350439, lng: 44.6001650 },
  'مدارس ابن عقيل الاهلية': { lat: 31.7346894, lng: 44.5999198 }
};

let driverCode = fs.readFileSync('src/components/Transport/DriverDashboard.tsx', 'utf8');
driverCode = driverCode.replace(/'محطة تقاطع البلدية الرئيسي': \{ lat: 31.8185, lng: 44.6050 \},/g, "'مدرسة أم الربيعين الابتدائية': { lat: 31.7367231, lng: 44.6144858 },");
driverCode = driverCode.replace(/'مدرسة النور الابتدائية': \{ lat: 31.8185, lng: 44.6050 \},/g, ""); // if replaced
driverCode = driverCode.replace(/'إعدادية غماس للبنين': \{ lat: 31.8210, lng: 44.6015 \},/g, "'مدرسة غماس الإبتدائية': { lat: 31.7367349, lng: 44.6042306 },");
driverCode = driverCode.replace(/'محطة مدخل طريق الشامية السريع': \{ lat: 31.8245, lng: 44.5930 \},/g, "'مدرسة الشهيد فيصل دلول': { lat: 31.7427235, lng: 44.6184886 },");
driverCode = driverCode.replace(/'محطة حي الحسين الشرقي': \{ lat: 31.8110, lng: 44.6140 \},/g, "'مدرسة زنوبيا للبنات': { lat: 31.7345365, lng: 44.6023995 },");
driverCode = driverCode.replace(/'محطة شارع السوق التجاري': \{ lat: 31.8130, lng: 44.6090 \},/g, "'متوسطة ذو الفقار للبنين': { lat: 31.7348318, lng: 44.6010327 },");
driverCode = driverCode.replace(/'محطة حي الصدر الغربي': \{ lat: 31.8125, lng: 44.5980 \},/g, "'ثانوية غماس المسائية للبنين': { lat: 31.7350439, lng: 44.6001650 },");
driverCode = driverCode.replace(/'محطة شارع الإدارة المحلية': \{ lat: 31.8175, lng: 44.6120 \},/g, "'مدارس ابن عقيل الاهلية': { lat: 31.7346894, lng: 44.5999198 },");
fs.writeFileSync('src/components/Transport/DriverDashboard.tsx', driverCode);


let parentCode = fs.readFileSync('src/components/Transport/ParentTransportView.tsx', 'utf8');
parentCode = parentCode.replace(/'s1': \{ lat: 31.8185, lng: 44.6050, name: 'محطة تقاطع البلدية الرئيسي' \},/g, "'s1': { lat: 31.7367231, lng: 44.6144858, name: 'مدرسة أم الربيعين الابتدائية' },");
parentCode = parentCode.replace(/'s1': \{ lat: 31.8185, lng: 44.6050, name: 'مدرسة النور الابتدائية' \},/g, ""); // if replaced
parentCode = parentCode.replace(/'s2': \{ lat: 31.8210, lng: 44.6015, name: 'إعدادية غماس للبنين' \},/g, "'s2': { lat: 31.7367349, lng: 44.6042306, name: 'مدرسة غماس الإبتدائية' },");
parentCode = parentCode.replace(/'s3': \{ lat: 31.8245, lng: 44.5930, name: 'محطة مدخل طريق الشامية السريع' \},/g, "'s3': { lat: 31.7427235, lng: 44.6184886, name: 'مدرسة الشهيد فيصل دلول' },");
parentCode = parentCode.replace(/'s4': \{ lat: 31.8110, lng: 44.6140, name: 'محطة حي الحسين الشرقي' \},/g, "'s4': { lat: 31.7345365, lng: 44.6023995, name: 'مدرسة زنوبيا للبنات' },");
parentCode = parentCode.replace(/'s5': \{ lat: 31.8130, lng: 44.6090, name: 'محطة شارع السوق التجاري' \},/g, "'s5': { lat: 31.7348318, lng: 44.6010327, name: 'متوسطة ذو الفقار للبنين' },");
parentCode = parentCode.replace(/'s6': \{ lat: 31.8125, lng: 44.5980, name: 'محطة حي الصدر الغربي' \},/g, "'s6': { lat: 31.7350439, lng: 44.6001650, name: 'ثانوية غماس المسائية للبنين' },");
parentCode = parentCode.replace(/'s7': \{ lat: 31.8175, lng: 44.6120, name: 'محطة شارع الإدارة المحلية' \}/g, "'s7': { lat: 31.7346894, lng: 44.5999198, name: 'مدارس ابن عقيل الاهلية' }");
fs.writeFileSync('src/components/Transport/ParentTransportView.tsx', parentCode);

