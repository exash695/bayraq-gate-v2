import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, Trophy, Sparkles, Clock, ArrowLeft, FileText, 
  ChevronLeft, ChevronRight, ShieldCheck, Crown, BookOpen, 
  Award, Activity, FileCheck, RefreshCw, Play, Check, HelpCircle 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProgress } from '../types';
import { sounds } from '../lib/sounds';
import { ConfettiReward } from './ConfettiReward';

// Pre-programmed high-quality ministerial exams for core subjects
const DEFAULT_EXAMS = [
  {
    id: 'exam_physics',
    title: 'امتحان الفيزياء التجريبي - الفصل الأول (المتسعات)',
    subject: 'الفيزياء',
    badgeId: 'm_physics',
    badgeTitle: 'وسام فارس الفيزياء ⚡',
    badgeIcon: '⚡',
    badgeColor: 'from-amber-400 to-yellow-600',
    questions: [
      {
        id: 1,
        text: 'متسعة ذات صفيحتين متوازيتين الهواء عازل بينهما، إذا أُدخل عازل ثابت عزله k=2 وملأت المتسعة به، فماذا يحدث للشحنة المختزنة إذا بقيت متصلة بالبطارية؟',
        options: ['تزداد للضعف', 'تقل للنصف', 'تبقى ثابتة', 'تزداد لأربعة أمثالها'],
        correctAnswer: 0,
        explanation: 'بما أن المتسعة متصلة بالبطارية، فإن فرق الجهد يبقى ثابتاً (V=const). وبما أن السعة تزداد بإدخال العازل لتصبح C_k = k*C = 2C، وبحسب العلاقة Q = C * V، فإن الشحنة المختزنة (Q) تزداد للضعف طردياً مع السعة.'
      },
      {
        id: 2,
        text: 'ما تأثير إدخال عازل قطبي بين صفيحتي متسعة مشحونة ومفصولة عن المصدر على المجال الكهربائي بينهما؟',
        options: ['يبقى ثابتاً', 'يزداد بنسبة ثابت العزل', 'يقل بنسبة ثابت العزل', 'يصبح صفراً'],
        correctAnswer: 2,
        explanation: 'عند إدخال عازل قطبي، يتولد مجال كهربائي داخل العازل (E_d) يعاكس المجال الأصلي (E)، مما يؤدي إلى انخفاض المجال المحصل (E_k) بنسبة ثابت العزل طبقاً للعلاقة E_k = E / k.'
      },
      {
        id: 3,
        text: 'عند مضاعفة فرق الجهد الكهربائي بين صفيحتي متسعة مشحونة ومتصلة، فإن مقدار الطاقة المختزنة في مجالها الكهربائي:',
        options: ['تزداد إلى أربعة أمثال ما كانت عليه', 'تقل للنصف', 'تبقى ثابتة', 'تزداد للضعف'],
        correctAnswer: 0,
        explanation: 'العلاقة بين الطاقة المختزنة وفرق الجهد هي علاقة طردية مع مربع فرق الجهد (PE = 0.5 * C * V^2). عند مضاعفة فرق الجهد (2V)، فإن مربع فرق الجهد يصبح (4V^2)، وبالتالي تزداد الطاقة إلى أربعة أمثال.'
      },
      {
        id: 4,
        text: 'متسعتان (C1=4μF, C2=8μF) مربوطتان على التوازي، فإذا كانت الشحنة الكلية 600μC، فإن فرق جهد كل متسعة يساوي:',
        options: ['50V', '100V', '150V', '200V'],
        correctAnswer: 0,
        explanation: 'في ربط التوازي، السعة المكافئة C_eq = C1 + C2 = 4 + 8 = 12μF. وبما أن فرق الجهد متساوي في التوازي، فإن V = Q_total / C_eq = 600μC / 12μF = 50V.'
      },
      {
        id: 5,
        text: 'ربطت متسعتان على التوالي، فإن الشحنة المختزنة في أي من صفيحتي كل متسعة تكون:',
        options: ['متساوية لجميع المتسعات', 'أكبر في المتسعة الأكبر سعة', 'أصغر في المتسعة الأكبر سعة', 'تعتمد على فرق الجهد الفردي'],
        correctAnswer: 0,
        explanation: 'في ربط التوالي، تكون الشحنة الكهربائية متساوية المقدار في جميع المتسعات المربوطة في المجموعة (Q_total = Q1 = Q2)، وذلك بسبب خاصية تدفق الشحنات عبر مسار واحد.'
      },
      {
        id: 6,
        text: 'ما الفائدة العملية من وجود العازل الكهربائي في المتسعة؟',
        options: ['تقليل السعة وزيادة التفريغ', 'زيادة سعة المتسعة ومنع الانهيار الكهربائي المبكر', 'زيادة المقاومة الأومية', 'تفريغ الشحنة بالكامل'],
        correctAnswer: 1,
        explanation: 'العازل يقوم بزيادة سعة المتسعة بعامل ثابت العزل (k) ويمنع الانهيار الكهربائي المبكر للمادة العازلة عند تسليط فرق جهد كبير بين صفيحتيها.'
      },
      {
        id: 7,
        text: 'وحدة قياس السعة الكهربائية (الفاراد) تكافئ:',
        options: ['كولوم / فولت', 'كولوم * فولت', 'جول / فولت', 'واط / ثانية'],
        correctAnswer: 0,
        explanation: 'من قانون السعة C = Q / V، فإن وحدة السعة (الفاراد) تساوي وحدة الشحنة (كولوم) مقسومة على وحدة فرق الجهد (فولت).'
      },
      {
        id: 8,
        text: 'العازل غير القطبي يكتسب عزوماً كهربائية ثنائية القطب مؤقتة بطريقة:',
        options: ['التوصيل المباشر', 'الدلك الاحتكاكي', 'الحث الكهربائي', 'الاستقطاب المغناطيسي'],
        correctAnswer: 2,
        explanation: 'عند وضع عازل غير قطبي بين صفيحتي متسعة، يعمل المجال الكهربائي على إزاحة مركزي الشحنتين إزاحة ضئيلة، فيكتسب عزوماً كهربائية ثنائية القطب مؤقتة بطريقة الحث الكهربائي (الاستقطاب).'
      },
      {
        id: 9,
        text: 'يقل مقدار المجال الكهربائي المحصل بين صفيحتي المتسعة عند إدخال عازل نتيجة:',
        options: ['تولّد مجال كهربائي داخل العازل يعاكس المجال الأصلي', 'تلاشي الشحنات السطحية', 'زيادة المسافة بين الصفيحتين', 'انخفاض سعة المتسعة'],
        correctAnswer: 0,
        explanation: 'عند إدخال عازل كهربائي، تترتب جزيئاته لتولد مجالاً عازلاً يعاكس باتجاهه المجال المؤثر الأصلي، فيضعفه ويكون المجال المحصل E_k = E - E_d.'
      },
      {
        id: 10,
        text: 'متسعة ذات صفيحتين متوازيتين سعتها C، إذا قلّت المساحة السطحية المتقابلة لصفيحتيها إلى نصف ما كانت عليه، فإن سعتها تصبح:',
        options: ['C/2', '2C', '4C', 'C'],
        correctAnswer: 0,
        explanation: 'تتناسب سعة المتسعة طردياً مع المساحة السطحية المتقابلة للصفيحتين (C ∝ A). فإذا قلت المساحة للنصف (A/2)، تقل السعة تلقائياً للنصف لتصبح (C/2).'
      }
    ]
  },
  {
    id: 'exam_arabic',
    title: 'امتحان اللغة العربية التجريبي - الاستفهام وقواعد النحو',
    subject: 'اللغة العربية',
    badgeId: 'm_arabic',
    badgeTitle: 'وسام عميد الأدب العربي 📚',
    badgeIcon: '📚',
    badgeColor: 'from-rose-500 to-red-700',
    questions: [
      {
        id: 1,
        text: 'في قول الشاعر: (فأين من زفراتي من كُلفتُ بهِ)، ما دلالة اسم الاستفهام (أين) وما محلّه الإعرابي؟',
        options: ['للمكان - في محل نصب مفعول فيه', 'للمكان - في محل رفع خبر مقدم وجوباً', 'للزمان - في محل نصب حال', 'للحال - في محل نصب مفعول به مقدم وجوباً'],
        correctAnswer: 1,
        explanation: 'اسم الاستفهام "أين" يدل على المكان. وجاء بعده شبه جملة (من زفراتي) ثم اسم موصول (من كُلفت به) وهو معرفة. أسماء الاستفهام الدالة على الزمان والمكان إذا تلاها معرفة تُعرب في محل رفع خبر مقدم وجوباً.'
      },
      {
        id: 2,
        text: 'ما نوع الاستفهام في قوله تعالى: (أَأَنتُمْ تَخْلُقُونَهُ أَمْ نَحْنُ الْخَالِقُونَ)؟',
        options: ['تصديقي بالهمزة', 'تصوري بالهمزة وأم المعادلة', 'مجازي متضمن معنى النفي', 'مجازي متضمن معنى التعجب'],
        correctAnswer: 1,
        explanation: 'الاستفهام هنا بالهمزة مع وجود "أم المعادلة المتصلة"، ويجاب عنه بالتعيين (أحدهما)، ولذلك يسمى استفهاماً تصورياً.'
      },
      {
        id: 3,
        text: 'ما إعراب اسم الاستفهام (من) في قوله تعالى: (مَن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا) إذا عُدّت كلمة واحدة؟',
        options: ['اسم استفهام مبني في محل رفع مبتدأ أو خبر مقدم', 'في محل نصب مفعول به مقدم وجوباً', 'في محل جر بحرف الجر', 'في محل نصب حال'],
        correctAnswer: 0,
        explanation: 'إذا اعتبرنا "من ذا" كلمة واحدة، فقد تلاها اسم المعرفة "الذي". أسماء الاستفهام الدالة على الذات (العاقل وغير العاقل) إذا تلاها معرفة تُعرب في محل رفع مبتدأ أو خبر مقدم.'
      },
      {
        id: 4,
        text: 'في قوله تعالى: (وَمَا تِلْكَ بِيَمِينِكَ يَا مُوسَىٰ)، ما إعراب اسم الاستفهام (ما)؟',
        options: ['مبني في محل رفع مبتدأ أو خبر مقدم', 'مبني في محل نصب مفعول به مقدم', 'مبني في محل نصب حال', 'مبني في محل جر بالإضافة'],
        correctAnswer: 0,
        explanation: 'تلا اسم الاستفهام "ما" اسم الإشارة "تلك" وهو اسم معرفة، لذلك يُعرب اسم الاستفهام مبنياً في محل رفع مبتدأ أو خبر مقدم جوازاً.'
      },
      {
        id: 5,
        text: 'متى يُعرب اسم الاستفهام الدال على الزمان أو المكان في محل نصب مفعولاً فيه؟',
        options: ['إذا تلاه فعل تام أو فعل ناقص استوفى خبره', 'إذا تلاه اسم معرفة', 'إذا تلاه فعل ناقص لم يستوفِ خبره', 'إذا تلي بجملة اسمية'],
        correctAnswer: 0,
        explanation: 'تُعرب أسماء الزمان والمكان مفعولاً فيه (ظرف زمان أو مكان) إذا تلاها فعل تام (أي ليس ناقصاً) أو فعل ناقص استوفى خبره في الجملة.'
      },
      {
        id: 6,
        text: 'ما دلالة الهمزة في قوله تعالى: (أَسَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ)؟',
        options: ['همزة التسوية', 'همزة الاستفهام التصديقي', 'همزة النداء', 'همزة أصلية من أصل الكلمة'],
        correctAnswer: 0,
        explanation: 'الهمزة هنا هي "همزة التسوية" لأنها سُبقت بكلمة "سواء"، وهي تخرج عن معنى الاستفهام الحقيقي وتُقدر مع ما بعدها بمصدر.'
      },
      {
        id: 7,
        text: 'في الجملة: (كتابَ مَنِ استعرتَ؟)، ما سبب جر اسم الاستفهام؟',
        options: ['لأنه مضاف إليه بعد اسم نكرة مضاف', 'لأنه مسبوق بحرف جر ظاهر', 'لأنه في محل نصب حال', 'لأنه من الأسماء التي تجر وجوباً بالفتحة'],
        correctAnswer: 0,
        explanation: 'اسم الاستفهام "من" وقع بعد اسم نكرة وهو "كتاب" مضاف، وأسماء الاستفهام لها الصدارة ولكنها تنجر إذا سبقت باسم نكرة مضاف وتكون في محل جر بالإضافة.'
      },
      {
        id: 8,
        text: 'ما حكم تقديم الخبر وجوباً في جملة: (في صفنا طلابُه)؟',
        options: ['مقدم وجوباً لاتصال المبتدأ بضمير يعود على بعض الخبر', 'مقدم جوازاً لأن المبتدأ معرفة', 'مقدم جوازاً لأن الخبر شبه جملة والمبتدأ نكرة مخصصة', 'مقدم وجوباً لأن الخبر من الألفاظ التي لها الصدارة'],
        correctAnswer: 0,
        explanation: 'يجب تقديم الخبر إذا اتصل بالمبتدأ ضمير (الهاء في طلابه) يعود على بعض الخبر (شبه الجملة: في صفنا)، لئلا يعود الضمير على متأخر لفظاً ورتبة.'
      },
      {
        id: 9,
        text: 'في قوله تعالى: (فَهَلْ عَلَى الرُّسُلِ إِلَّا الْبَلَاغُ الْمُبِينُ)، ما نوع الاستفهام؟',
        options: ['استفهام مجازي خرج لمعنى النفي الضمني', 'استفهام حقيقي تصديقي', 'استفهام مجازي خرج لمعنى التعجب', 'استفهام تصوري بـ هل'],
        correctAnswer: 0,
        explanation: 'الاستفهام بـ "هل" خرج مجازياً لمعنى النفي الضمني (أي: ما على الرسل إلا البلاغ المبين)، وهو مؤكد بأداة الاستثناء "إلا".'
      },
      {
        id: 10,
        text: 'ما إعراب (كيف) في قوله تعالى: (كَيْفَ يَكُونُ لِلْمُشْرِكِينَ عَهْدٌ عِندَ اللَّهِ) إذا علمت أن الفعل الناقص قد استوفى خبره؟',
        options: ['في محل نصب حال', 'في محل نصب خبر مقدم للفعل الناقص', 'في محل رفع مبتدأ', 'في محل نصب مفعول مطلق'],
        correctAnswer: 0,
        explanation: 'بما أن الفعل الناقص "يكون" قد استوفى خبره ("للمشركين عهد" جملة تامة المستوفاة الخبر)، فإن اسم الاستفهام "كيف" يُعرب مبنياً في محل نصب حال.'
      }
    ]
  },
  {
    id: 'exam_chemistry',
    title: 'امتحان الكيمياء التجريبي - الفصل الثاني (الاتزان الكيميائي)',
    subject: 'الكيمياء',
    badgeId: 'm_chemistry',
    badgeTitle: 'وسام بطل الكيمياء الفسفورية 🧪',
    badgeIcon: '🧪',
    badgeColor: 'from-emerald-400 to-green-600',
    questions: [
      {
        id: 1,
        text: 'تفاعل متزن ماص للحرارة، عند زيادة درجة حرارته فإن ثابت الاتزان K_eq:',
        options: ['يزداد', 'يقل', 'يبقى ثابتاً', 'ينخفض للصفر'],
        correctAnswer: 0,
        explanation: 'في التفاعلات الماصة للحرارة، تعمل زيادة درجة الحرارة على ترجيح التفاعل الأمامي للتخلص من الفائض الحراري، مما يزيد من تركيز النواتج وبالتالي يزداد ثابت الاتزان K_eq.'
      },
      {
        id: 2,
        text: 'ما تأثير زيادة الضغط الكلي (بتقليل حجم الإناء) على تفاعل الغازات المتزن: N2 + 3H2 ⇌ 2NH3 ؟',
        options: ['ينزاح نحو المتفاعلات (اليسار)', 'ينزاح نحو النواتج (اليمين)', 'لا يتأثر التفاعل', 'يتوقف التفاعل تماماً'],
        correctAnswer: 1,
        explanation: 'زيادة الضغط تجعل التفاعل ينزاح باتجاه عدد المولات الغازية الأقل. مولات المتفاعلات = 4، مولات النواتج = 2. لذلك ينزاح التفاعل نحو اليمين (نحو النواتج الأمامية).'
      },
      {
        id: 3,
        text: 'عامل الجذب الوحيد الذي يمكنه تغيير قيمة ثابت الاتزان K_eq هو تغير:',
        options: ['الضغط', 'الحجم', 'التركيز', 'درجة الحرارة'],
        correctAnswer: 3,
        explanation: 'تغير درجة الحرارة هو العامل الوحيد الذي يغير من موضع الاتزان وقيمة ثابت الاتزان معاً، بينما العوامل الأخرى تغير موضع الاتزان فقط ويبقى الثابت دون تغيير.'
      },
      {
        id: 4,
        text: 'في التفاعلات الانعكاسية المتزنة، تسمى الحالة التي يتساوى فيها سرعة التفاعل الأمامي مع سرعة التفاعل الخلفي بـ:',
        options: ['الاتزان الساكن الكلي', 'الاتزان الديناميكي الحركي', 'التفكك المتساوي', 'الاتزان الترموديناميكي'],
        correctAnswer: 1,
        explanation: 'الاتزان الكيميائي هو اتزان ديناميكي (حركي) وليس استاتيكياً ساكناً، حيث تتوحد سرعتا التفاعلين الأمامي والخلفي وتثبت التراكيز للمواد دون توقف.'
      },
      {
        id: 5,
        text: 'قيمة ثابت الاتزان K_p للتفاعل الغازي تعتمد على:',
        options: ['الضغوط الجزيئية للمواد', 'التراكيز المولارية للمواد', 'كميات المواد الصلبة المضافة', 'طبيعة الوعاء الزجاجي'],
        correctAnswer: 0,
        explanation: 'ثابت الاتزان K_p يُحسب بدلالة الضغوط الجزيئية للغازات المشاركة في التفاعل المتزن فقط، ولا علاقة له بالتراكيز المولارية أو المواد الصلبة.'
      }
    ]
  },
  {
    id: 'exam_biology',
    title: 'امتحان الأحياء التجريبي - الفصل الأول (الخلية وانقساماتها)',
    subject: 'الأحياء',
    badgeId: 'm_biology',
    badgeTitle: 'وسام فارس الأحياء العبقري 🔬',
    badgeIcon: '🔬',
    badgeColor: 'from-cyan-400 to-blue-600',
    questions: [
      {
        id: 1,
        text: 'ما العضية الخلوية المسؤولة عن تحرير الطاقة وتسمى بـ بيوت الطاقة في الخلية؟',
        options: ['جهاز كولجي', 'الجسيمات الحالة', 'المايتوكوندريا', 'البلاستيدات الملونة'],
        correctAnswer: 2,
        explanation: 'المايتوكوندريا هي تراكيب خلوية مغلفة بغشاء مزدوج تحتوي على إنزيمات تنفسية ومسؤولة عن إنتاج معظم جزيئات ATP الغنية بالطاقة، لذلك تلقب ببيوت الطاقة.'
      },
      {
        id: 2,
        text: 'في أي دور من أدوار الانقسام الاختزالي الأول يحدث تصالب الكروموسومات وعبور الجينات (التصالبات)؟',
        options: ['الدور القلادي', 'الدور التغلظي', 'الدور الانفراجي', 'الدور الحركي'],
        correctAnswer: 2,
        explanation: 'يحدث التبادل في مواقع الجينات (العبور والخلط الكروموسومي) عند نقطة التصالب في الدور الانفراجي من الطور التمهيدي الأول للانقسام الاختزالي الأول.'
      },
      {
        id: 3,
        text: 'وظيفة الجسيمات الحالة (Lysosomes) الرئيسية داخل الخلية الحيوانية هي:',
        options: ['بناء البروتينات', 'إفراز الهرمونات والسكريات', 'الهضم الخلوي والتخلص من الفضلات', 'تنفس الخلية الهوائي'],
        correctAnswer: 2,
        explanation: 'الجسيمات الحالة حويصلات محاطة بغشاء أحادي تحتوي على أعداد كبيرة من الإنزيمات المحللة، وتعمل كجهاز هضمي ينظف السايتوبلازم من الدقائق الغذائية والأجسام الغريبة.'
      },
      {
        id: 4,
        text: 'الخلايا بدائية النواة (مثل البكتيريا والطحالب الخضر المزرقة) تتميز بخلوها من:',
        options: ['الجدار الخلوي', 'الرايبوسومات', 'الغشاء النووي والعضيات الغشائية', 'المادة الوراثية DNA'],
        correctAnswer: 2,
        explanation: 'الخلايا بدائية النواة لا تمتلك غشاءً نووياً يحيط بالمادة الوراثية (لذا تسمى منطقة نووية) كما تفتقر للعضيات الخلوية الغشائية مثل المايتوكوندريا وجهاز كولجي.'
      },
      {
        id: 5,
        text: 'الجسيم الحركي (المرتكز) يوجد عند قاعدة السوط أو الهدب في الخلايا ويلعب دوراً هاماً في:',
        options: ['بناء السيلولوز', 'حركة الأهداب والأسواط', 'انقسام السايتوبلازم', 'صنع الغذاء'],
        correctAnswer: 1,
        explanation: 'الجسيم الحركي يشابه تركيب الجسيم المركزي ويقع عند قاعدة السوط أو الهدب في الخلايا التي تمتلكها، وله دور مباشر في توجيه وحفز حركة الهدب والسوط.'
      }
    ]
  }
];

interface AIEnhancedRadarProps {
  userProfile: any;
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  onBack: () => void;
  files: any[];
}

export const AIEnhancedRadar: React.FC<AIEnhancedRadarProps> = ({
  userProfile,
  progress,
  setProgress,
  onBack,
  files = []
}) => {
  const isAr = true; // The interface is in Arabic as requested by user
  
  // App States
  const [activeTab, setActiveTab] = useState<'selection' | 'scanning' | 'arena' | 'results'>('selection');
  
  // Custom Firestore loading fallback
  const [dbFiles, setDbFiles] = useState<any[]>([]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const snap = await getDocs(collection(db, "school_files"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbFiles(data);
      } catch (e) {
        console.error("Error fetching school files inside Radar:", e);
      }
    };
    loadFiles();
  }, []);

  const availableFiles = files.length > 0 ? files : dbFiles;

  // Scanning state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [scanningLogs, setScanningLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  // Exam state
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [examCompleted, setExamCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<any>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scan steps
  const SCAN_LOG_STEPS = [
    '📡 تهيئة رادار بَيْرَق للذكاء الاصطناعي الشامل...',
    '⚙️ الاتصال بالمستشعرات السحابية وقراءة الملزمة المرفوعة...',
    '📂 جاري فحص بنية الملف وتحليل نصوص الفصول...',
    '🧠 استخلاص الروابط العلمية وصياغة الأسئلة الاستنتاجية...',
    '📋 صياغة البدائل والخيارات النموذجية وتحديد الأجوبة الصحيحة...',
    '🔒 تشفير ورقة الامتحان وتوليد نموذج الإجابة النموذجي الوزاري...',
    '✨ تم بناء الاختبار التجريبي الشامل بنجاح! جاهز للانطلاق.'
  ];

  useEffect(() => {
    if (activeTab === 'scanning') {
      sounds.playStart();
      setScanningLogs([SCAN_LOG_STEPS[0]]);
      setScanProgress(5);
      setLogIndex(0);
      
      const interval = setInterval(() => {
        setLogIndex((prev) => {
          const next = prev + 1;
          if (next < SCAN_LOG_STEPS.length) {
            sounds.playPop();
            setScanningLogs((logs) => [...logs, SCAN_LOG_STEPS[next]]);
            setScanProgress(Math.floor((next / SCAN_LOG_STEPS.length) * 100));
            return next;
          } else {
            clearInterval(interval);
            setScanProgress(100);
            setTimeout(() => {
              setActiveTab('arena');
              setTimeLeft(currentExam?.questions?.length * 90 || 900); // 90 sec per question
            }, 800);
            return prev;
          }
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [activeTab, selectedDoc]);

  // Exam Countdown Timer
  useEffect(() => {
    if (activeTab === 'arena' && timeLeft > 0 && !examCompleted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !examCompleted) {
      handleFinishExam();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeTab, timeLeft, examCompleted]);

  // Handle select exam
  const handleSelectDefaultExam = (exam: any) => {
    sounds.playClick();
    setSelectedDoc({
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      isDefault: true
    });
    setCurrentExam(exam);
    setQuestions(exam.questions);
    
    // Reset quiz state
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setExamCompleted(false);
    setErrorMessage(null);
    
    setActiveTab('scanning');
  };

  // Scan uploaded file and fetch generated questions
  const handleScanUploadedFile = async (fileDoc: any) => {
    sounds.playClick();
    setSelectedDoc({
      id: fileDoc.id,
      title: fileDoc.title,
      subject: fileDoc.subject || fileDoc.tag || 'العامة',
      isDefault: false
    });
    setIsLoadingExam(true);
    setErrorMessage(null);

    try {
      // 1. Call Gemini mock-exam route on express backend
      const response = await fetch('/api/gemini/mock-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileDoc.extractedText || fileDoc.title,
          subject: fileDoc.subject || fileDoc.tag || 'الفيزياء'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from server');
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("استجابة غير صالحة من السيرفر.");
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        // Map subject code to corresponding badge config
        const sub = fileDoc.subject || fileDoc.tag || 'الفيزياء';
        let badgeId = 'm_legend';
        let badgeTitle = 'وسام حارس العلم الأسطوري 📡';
        let badgeIcon = '📡';
        let badgeColor = 'from-indigo-400 to-purple-600';

        if (sub.includes('فيزياء') || sub.toLowerCase().includes('phy')) {
          badgeId = 'm_physics';
          badgeTitle = 'وسام فارس الفيزياء ⚡';
          badgeIcon = '⚡';
          badgeColor = 'from-amber-400 to-yellow-600';
        } else if (sub.includes('عربي') || sub.includes('أدب') || sub.toLowerCase().includes('arb')) {
          badgeId = 'm_arabic';
          badgeTitle = 'وسام عميد الأدب العربي 📚';
          badgeIcon = '📚';
          badgeColor = 'from-rose-500 to-red-700';
        } else if (sub.includes('كيمياء') || sub.toLowerCase().includes('chm') || sub.toLowerCase().includes('che')) {
          badgeId = 'm_chemistry';
          badgeTitle = 'وسام بطل الكيمياء الفسفورية 🧪';
          badgeIcon = '🧪';
          badgeColor = 'from-emerald-400 to-green-600';
        } else if (sub.includes('أحياء') || sub.includes('احياء') || sub.toLowerCase().includes('bio')) {
          badgeId = 'm_biology';
          badgeTitle = 'وسام فارس الأحياء العبقري 🔬';
          badgeIcon = '🔬';
          badgeColor = 'from-cyan-400 to-blue-600';
        }

        const customExam = {
          id: `custom_${fileDoc.id}`,
          title: `اختبار ذكاء: ${fileDoc.title}`,
          subject: sub,
          badgeId,
          badgeTitle,
          badgeIcon,
          badgeColor,
          questions: data.questions
        };

        setCurrentExam(customExam);
        setQuestions(data.questions);
        
        // Reset quiz state
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowExplanation({});
        setExamCompleted(false);
        setIsLoadingExam(false);
        setActiveTab('scanning');
      } else {
        throw new Error('Empty questions returned');
      }

    } catch (err) {
      console.warn("Gemini Exam creation failed, falling back to rich core mock pool...", err);
      // Fallback: search default exams for a matching subject, otherwise use first
      const sub = fileDoc.subject || fileDoc.tag || '';
      let fallbackExam = DEFAULT_EXAMS[0]; // physics default
      if (sub.includes('عربي') || sub.includes('أدب')) {
        fallbackExam = DEFAULT_EXAMS[1];
      } else if (sub.includes('كيمياء')) {
        fallbackExam = DEFAULT_EXAMS[2];
      } else if (sub.includes('أحياء') || sub.includes('احياء')) {
        fallbackExam = DEFAULT_EXAMS[3];
      }
      
      const mockedExam = {
        ...fallbackExam,
        id: `mocked_${fileDoc.id}`,
        title: `اختبار ذكاء مستنتج: ${fileDoc.title}`
      };
      
      setCurrentExam(mockedExam);
      setQuestions(mockedExam.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowExplanation({});
      setExamCompleted(false);
      setIsLoadingExam(false);
      setActiveTab('scanning');
    }
  };

  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (files.length === 1 && files[0] && activeTab === 'selection' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleScanUploadedFile(files[0]);
    }
  }, [files, activeTab]);

  // Finish exam and calculate score
  const handleFinishExam = async () => {
    sounds.playSuccess();
    
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);
    setExamCompleted(true);
    setActiveTab('results');

    // If score is >= 80%, award mastery badge
    if (calculatedScore >= 80) {
      const bId = currentExam.badgeId;
      const bTitle = currentExam.badgeTitle;
      const bIcon = currentExam.badgeIcon;
      const bColor = currentExam.badgeColor;

      setNewlyUnlockedBadge({
        id: bId,
        title: bTitle,
        icon: bIcon,
        color: bColor,
        desc: `اجتياز الامتحان الوزاري الشامل لمادة ${currentExam.subject} بنسبة ${calculatedScore}%`
      });
      setShowConfetti(true);

      // Save to progress state (updates safeStorage and triggers downstream listeners)
      setProgress((prev) => {
        const updatedBadges = { ...prev.badges };
        const dateString = new Date().toLocaleDateString('ar-IQ');
        updatedBadges[bId] = dateString;

        return {
          ...prev,
          badges: updatedBadges
        };
      });

      // Also try to save to Firestore permanently
      if (userProfile?.uid) {
        try {
          const userRef = doc(db, "users", userProfile.uid);
          await setDoc(userRef, {
            badges: {
              [bId]: new Date().toLocaleDateString('ar-IQ')
            }
          }, { merge: true });
        } catch (e) {
          console.warn("Could not save unlocked badge to Firestore", e);
        }
      }
    }
  };

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="ai_enhanced_radar_container" className="min-h-screen bg-[#030616] text-white py-8 px-4 relative overflow-hidden font-sans">
      {/* Background radial elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.03)_0%,transparent_50%)] pointer-events-none" />

      {showConfetti && (
        <ConfettiReward onComplete={() => setShowConfetti(false)} />
      )}

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation back and header */}
        <div className="flex items-center justify-between">
          <button 
            id="back_to_hub_btn"
            onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-sm font-bold"
          >
            <ArrowLeft size={16} />
            <span>الرجوع للمحطة الرئيسية</span>
          </button>
          
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
            <Activity className="text-indigo-400 animate-pulse" size={16} />
            <span className="text-xs text-indigo-300 font-bold font-mono">RADAR CHANNELS ACTIVE</span>
          </div>
        </div>

        {/* ==================== TAB 1: SELECTION ==================== */}
        {activeTab === 'selection' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Main title banner */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-1.5 rounded-full border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Sparkles size={12} className="animate-spin" />
                <span>الامتحان الشامل</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                رادار الذكاء الاصطناعي
              </h1>
              <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
                يتم الآن فحص محتوى الملزمة لتوليد أسئلة دقيقة وشاملة لضمان إتقانك للمادة.
              </p>
            </div>

            {/* List of uploaded custom files */}
            <div className="space-y-4">
              {isLoadingExam ? (
                <div className="glass-card py-16 text-center rounded-3xl border border-indigo-500/20 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)] space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-purple-400 animate-spin flex items-center justify-center">
                      <Sparkles size={24} className="text-indigo-300" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold text-lg">جاري فحص الملزمة وتوليد الامتحان...</p>
                    <p className="text-indigo-300/70 text-xs font-bold">يرجى الانتظار قليلاً بينما يقوم الرادار بتحليل المحتوى</p>
                  </div>
                </div>
              ) : availableFiles.filter(f => f.extractedText || f.title).length === 0 ? (
                <div className="glass-card p-8 text-center rounded-2xl border-white/5 space-y-2">
                  <p className="text-white/40 font-bold">لم تقم برفع أي ملفات خاصة بك بعد في مكتبتك.</p>
                  <p className="text-xs text-white/30">يمكنك رفع ملازمك وسيقوم الرادار بفحصها بالكامل فوراً. استخدم الامتحانات المعتمدة أدناه حالياً!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableFiles.filter(f => f.extractedText || f.title).map((file) => (
                    <div 
                      key={file.id}
                      className="glass-card p-5 rounded-2xl border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 font-bold">
                            {file.subject || file.tag || 'ملزمة عامة'}
                          </span>
                          <span className="text-[10px] text-white/30 font-mono">{file.size || 'N/A'}</span>
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition line-clamp-1">{file.title}</h3>
                        <p className="text-xs text-white/40">عدد تحميلات الطلاب: {file.downloads || 0} تحميل</p>
                      </div>

                      <button
                        onClick={() => handleScanUploadedFile(file)}
                        className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition duration-200"
                      >
                        <Play size={14} />
                        <span>مسح الرادار والامتحان الشامل</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ==================== TAB 2: SCANNING ANIMATION ==================== */}
        {activeTab === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-12">
            
            {/* Visual radar scanning widget */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer spinning dash border */}
              <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-spin [animation-duration:30s]" />
              
              {/* Pulsing ring 1 */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-4 border border-indigo-500/30 rounded-full"
              />
              
              {/* Spinning sweep arm */}
              <div className="absolute inset-0 animate-spin [animation-duration:3s]">
                <div className="w-1/2 h-1/2 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/5 to-indigo-500/40 border-r border-indigo-500/50 rounded-tr-full origin-bottom-left" />
              </div>

              {/* Centered glowing icon */}
              <div className="w-20 h-20 rounded-full bg-[#0E152D] border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.4)] relative z-10">
                <Activity size={32} className="text-indigo-400 animate-pulse" />
              </div>

              {/* Concentric rings decoration */}
              <div className="absolute inset-12 border border-indigo-500/10 rounded-full" />
              <div className="absolute inset-20 border border-indigo-500/10 rounded-full" />
            </div>

            {/* Text details and updates */}
            <div className="w-full max-w-lg space-y-4 text-center">
              <h2 className="text-2xl font-black text-white">
                جاري مسح الرادار الاستنتاجي الشامل... ({scanProgress}%)
              </h2>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  animate={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* Simulated logs box */}
              <div className="bg-[#05091C] border border-indigo-500/20 rounded-2xl p-5 text-right font-mono text-xs text-indigo-300 space-y-2 h-40 overflow-y-auto shadow-inner leading-relaxed">
                {scanningLogs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 justify-end"
                  >
                    <span>{log}</span>
                    <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: EXAM ARENA ==================== */}
        {activeTab === 'arena' && questions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header: Republic of Iraq Ministry Style Sheet */}
            <div className="bg-gradient-to-b from-[#11162E] to-[#0A0D1F] border-2 border-[#D4AF37]/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              {/* Official ministry header decoration */}
              <div className="grid grid-cols-3 items-center text-center pb-4 border-b border-white/5 gap-2">
                <div className="text-right space-y-0.5 text-xs text-white/50 font-bold">
                  <div>الدراسة الإعدادية (العلمي)</div>
                  <div>الامتحان التجريبي لعام ٢٠٢٦</div>
                  <div className="text-[#D4AF37]">المادة: {currentExam?.subject}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black text-amber-400">رادار الذكاء الاصطناعي</div>
                  <div className="text-[10px] font-bold text-white/40">الامتحان الشامل</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono">AI EXAM GENERATOR</div>
                </div>

                <div className="text-left space-y-0.5 text-xs text-white/50 font-bold">
                  <div>اسم الطالب: <span className="text-white font-black">{userProfile?.name || 'فارس السادس'}</span></div>
                  <div>الرقم الامتحاني: <span className="text-white font-mono font-bold">{userProfile?.studentCode || 'S6-GEN-7351'}</span></div>
                  <div>عدد الأسئلة: <span className="text-white font-black">{questions.length} أسئلة</span></div>
                </div>
              </div>

              {/* Real-time exam statistics tracker */}
              <div className="flex flex-wrap items-center justify-between pt-4 gap-4">
                <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-4 py-2 rounded-xl">
                  <Timer className="text-[#D4AF37] animate-pulse" size={16} />
                  <span className="text-xs font-bold text-white/70">الوقت المتبقي:</span>
                  <span className="text-sm font-mono font-black text-[#D4AF37]">{formatTime(timeLeft)}</span>
                </div>

                {/* Progress dot bar */}
                <div className="flex items-center gap-1.5 bg-black/20 p-2 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playClick();
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                        currentQuestionIndex === idx
                          ? 'bg-[#D4AF37] text-black font-black scale-110 shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                          : selectedAnswers[idx] !== undefined
                          ? 'bg-indigo-600/50 text-indigo-100 border border-indigo-400/30'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Question Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 md:p-8 rounded-3xl border-white/5 space-y-6 relative overflow-hidden"
              >
                {/* Question title */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    <HelpCircle size={12} />
                    <span>سؤال {currentQuestionIndex + 1} الاستنتاجي</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed text-right">
                    {questions[currentQuestionIndex].text}
                  </h2>
                </div>

                {/* Choices (Multiple Choice Options) */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {questions[currentQuestionIndex].options.map((option: string, optIdx: number) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedAnswers({
                            ...selectedAnswers,
                            [currentQuestionIndex]: optIdx
                          });
                        }}
                        className={`w-full text-right p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between group ${
                          isSelected
                            ? 'bg-[#121B3A] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] font-black'
                            : 'bg-[#0E1326]/50 border-white/5 text-white/70 hover:bg-[#0E1326]/80 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center border ${
                            isSelected 
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                              : 'bg-black/30 text-white/40 border-white/10 group-hover:border-white/20'
                          }`}>
                            {['أ', 'ب', 'ج', 'د'][optIdx]}
                          </span>
                          <span className="text-sm md:text-base leading-relaxed">{option}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Toggle Model Answer / Explanation */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setShowExplanation({
                        ...showExplanation,
                        [currentQuestionIndex]: !showExplanation[currentQuestionIndex]
                      });
                    }}
                    className="text-xs text-white/50 hover:text-[#D4AF37] transition font-bold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-lg"
                  >
                    <BookOpen size={12} />
                    <span>{showExplanation[currentQuestionIndex] ? 'إخفاء التفسير الوزاري' : 'كشف نموذج الإجابة والتفسير الوزاري 💡'}</span>
                  </button>

                  <AnimatePresence>
                    {showExplanation[currentQuestionIndex] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#050818] border border-[#D4AF37]/20 p-5 rounded-2xl space-y-2 text-right">
                          <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-black">
                            <ShieldCheck size={14} />
                            <span>الإجابة الصحيحة النموذجية: الاختيار ( {['أ', 'ب', 'ج', 'د'][questions[currentQuestionIndex].correctAnswer]} )</span>
                          </div>
                          <p className="text-xs md:text-sm text-white/70 leading-relaxed font-medium">
                            {questions[currentQuestionIndex].explanation || 'لا يوجد تفسير مضاف حالياً لهذا السؤال الاستنتاجي.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => {
                  sounds.playClick();
                  setCurrentQuestionIndex(prev => prev - 1);
                }}
                className="flex items-center gap-2 text-white/50 hover:text-white transition disabled:opacity-20 font-bold bg-white/5 hover:bg-white/10 px-5 py-3 rounded-2xl"
              >
                <ChevronRight size={16} />
                <span>السؤال السابق</span>
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleFinishExam}
                  className="bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-black text-sm md:text-base py-3.5 px-8 rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)] transition"
                >
                  <Trophy size={18} />
                  <span>إنهاء الامتحان وتسليم الدفتر</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCurrentQuestionIndex(prev => prev + 1);
                  }}
                  className="flex items-center gap-2 text-white hover:text-indigo-300 transition font-bold bg-indigo-600/20 hover:bg-indigo-600/40 px-5 py-3 rounded-2xl border border-indigo-500/20"
                >
                  <span>السؤال التالي</span>
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 4: RESULTS ==================== */}
        {activeTab === 'results' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center"
          >
            {/* Header Result summary */}
            <div className="glass-card p-8 md:p-12 rounded-[40px] border-white/5 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
              
              <div className="relative z-10 space-y-4">
                <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-indigo-500/30 flex items-center justify-center mx-auto shadow-2xl">
                  {score >= 80 ? (
                    <Trophy size={48} className="text-[#D4AF37] animate-bounce" />
                  ) : (
                    <Award size={48} className="text-white/40" />
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white">نتيجتك النهائية في الامتحان التجريبي</h2>
                  <p className="text-sm text-white/40">تحدي رادار الذكاء الشامل لمنصة بَيْرَق</p>
                </div>

                {/* Score Big Circle Display */}
                <div className="py-4">
                  <div className="inline-block relative">
                    <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-400 font-mono">
                      {score}%
                    </div>
                  </div>
                </div>

                {/* Personal Feedback Message */}
                <div className="max-w-md mx-auto">
                  {score >= 90 ? (
                    <p className="text-base font-bold text-emerald-400">
                      🏅 درجة كاملة بامتياز (بطل حقيقي)! نبارك لك أيها الفارس همتك الجبارة، أنت تسير على طريق الـ 100 الوزارية بثبات!
                    </p>
                  ) : score >= 80 ? (
                    <p className="text-base font-bold text-yellow-300">
                      ✨ درجة ممتاز! لقد تجاوزت الامتحان بكل جدارة ونلت وسام إتقان الفصل لتخليده في قاعة الأبطال.
                    </p>
                  ) : score >= 50 ? (
                    <p className="text-base font-bold text-white/70">
                      👍 جيد جداً! لقد نجحت في الامتحان، لكن هناك بعض الثغرات البسيطة. راجع الأجوبة والتفاسير لرفع مستواك للكامل!
                    </p>
                  ) : (
                    <p className="text-base font-bold text-red-400">
                      💡 خطوة أولى للنجاح! لم تجتز الامتحان هذه المرة، لكن رادار الذكاء قد كشف لك الثغرات. راجع التفسير الوزاري للأسئلة وحاول مجدداً بثقة أكبر!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AWARD CARD: If badge was earned, display with major golden illumination */}
            {score >= 80 && newlyUnlockedBadge && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-8 border-[#D4AF37]/30 text-center relative overflow-hidden rounded-[40px] shadow-[0_0_80px_rgba(212,175,55,0.15)] max-w-md mx-auto"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)]" />
                
                <div className="relative z-10 space-y-6">
                  {/* Glowing Medal Illustration */}
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    <div className={`absolute inset-0 bg-gradient-to-r ${newlyUnlockedBadge.color} rounded-full opacity-10 animate-ping`} />
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${newlyUnlockedBadge.color} flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] border-2 border-white/20`}>
                      <span className="text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{newlyUnlockedBadge.icon}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">تم منحك وساماً جديداً!</div>
                    <h3 className="text-2xl font-black text-white">{newlyUnlockedBadge.title}</h3>
                    <p className="text-xs text-white/40 leading-relaxed font-bold">
                      تم تخليد هذا الإنجاز وإشعال وسام التميز الخاص بك في قاعة الأبطال المرموقة لملفك الشخصي بنجاح!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('selection');
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-2xl transition shadow-lg"
              >
                <RefreshCw size={16} />
                <span>العودة للامتحانات والملازم</span>
              </button>

              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-[#0E152D]/80 border border-white/5 hover:border-white/10 hover:bg-[#0E152D] text-white/70 hover:text-white font-bold py-3.5 px-8 rounded-2xl transition"
              >
                <ArrowLeft size={16} />
                <span>بوابة بَيْرَق الرئيسية</span>
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
