const fs = require('fs');
let code = fs.readFileSync('src/components/Transport/FleetPanel.tsx', 'utf8');

code = code.replace(/'تقاطع البلدية'/g, "'مدرسة النور الابتدائية'");
code = code.replace(/'حي العسكري'/g, "'إعدادية غماس للبنين'");
code = code.replace(/'مدخل الشامية'/g, "'مدرسة الفراهيدي'");
code = code.replace(/'حي الحسين'/g, "'ثانوية العقيدة للبنات'");
code = code.replace(/'السوق التجاري'/g, "'مدرسة الهدى'");
code = code.replace(/'حي الصدر'/g, "'مدرسة الكوثر'");
code = code.replace(/'الإدارة المحلية'/g, "'إعدادية الصناعة'");

code = code.replace(/'الخط الأخضر - حي العسكري'/g, "'الخط الأخضر - إعدادية غماس'");
code = code.replace(/'الخط الأزرق - حي الحسين'/g, "'الخط الأزرق - ثانوية العقيدة'");
code = code.replace(/'الخط البرتقالي - شارع السوق'/g, "'الخط البرتقالي - مدرسة الهدى'");
code = code.replace(/'الخط البنفسجي - طريق الشامية'/g, "'الخط البنفسجي - مدرسة الفراهيدي'");
code = code.replace(/'الخط الأحمر - حي الصدر'/g, "'الخط الأحمر - مدرسة الكوثر'");
code = code.replace(/'الخط الأصفر - الإدارة المحلية'/g, "'الخط الأصفر - إعدادية الصناعة'");

fs.writeFileSync('src/components/Transport/FleetPanel.tsx', code);
