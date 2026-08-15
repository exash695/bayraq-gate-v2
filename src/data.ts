import { PageContent } from './types';

export const INITIAL_PAGES: PageContent[] = [
  {
    id: 1,
    title: "الماضي البسيط Past Simple",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "أهم الأزمنة التي نحتاجها بالوحدة الأولى هي: الماضي البسيط والماضي المستمر والمضارع البسيط", variant: 'blue' },
      { type: 'text', content: "الماضي البسيط Past Simple", variant: 'purple' },
      { type: 'text', content: "• نستعمله للحدث القصير يعني يصير وينتهي بدون الاستمرارية", variant: 'blue' },
      { type: 'text', content: "الفاعل (I, you, we, they, he, she, it) + فعل شاذ او يحتوي ed + تكملة", variant: 'purple' },
      { type: 'text', content: "• They fixed the window.", variant: 'blue' },
      { type: 'text', content: "النفي Negative: الفاعل + didn't + يكون الفعل مصدر مجرد لا شاذ و لا ed", variant: 'purple' },
      { type: 'text', content: "• They didn't fix the window.", variant: 'blue' },
      { type: 'text', content: "السؤال Question: Did + الفاعل + الفعل يكون مصدر مجرد + ?", variant: 'purple' },
      { type: 'text', content: "• Did they fix the window?", variant: 'blue' },
      { type: 'text', content: "• يعني بالنفي (didn't) او السؤال (did) يكون الفعل مصدر مجرد.", variant: 'warning' },
      { type: 'text', content: "ملاحظات إضافة الـ ed", variant: 'purple' },
      { type: 'text', content: "مهمة جدا بالذات بفرع الاملاء Q3/C Spelling", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "1 | اذا انتهى الفعل بحرف (e)", description: "نضع (d) فقط: use → used | arrive → arrived | live → lived | like → liked | love → loved" },
      { type: 'rule', icon: 'bulb', title: "2 | اذا انتهى الفعل بحرف صحيح قبله عله", description: "نكرر الأخير و نضع (ed): slip → slipped | stop → stopped | drop → dropped | spot → spotted | travel → travelled" },
      { type: 'rule', icon: 'sparkle', title: "تنبيه الأحرف التي لا تتكرر", description: "ديروا بالكم الاحرف التي لا تتكرر: x z w y" },
      { type: 'rule', icon: 'bulb', title: "3 | اذا انتهى الفعل بحرف (y) وقبله حرف عله", description: "(a e i o u) نضع (ed) فقط اما اذا قبله حرف صحيح يقلب الى i و نضع ed: play → played | stay → stayed | study → studied | try → tried" },
      { type: 'text', content: "e.g. act, acted ; stitch, ________ (2015/1)", variant: 'blue' },
      { type: 'text', content: "e.g. say, said ; slip, ________ (2017/ت)", variant: 'purple' },
      { type: 'text', content: "e.g. speak, spoken ; drop, ________ (2021/ت)", variant: 'blue' },
      { type: 'text', content: "اهم فعل (be) بالماضي يتحول اما (was) للمفرد او (were) للجمع", variant: 'warning' }
    ],
    solutions: [
      "الحل (2015/1): stitched",
      "الحل (2017/ت): slipped",
      "الحل (2021/ت): dropped"
    ],
    questions: [
      { id: 1001, isMinisterial: true, text: "ماذا نفعل للفعل إذا انتهى بحرف صحيح قبله حرف عله واحد عند إضافة ed؟", options: ["نضيف ed فقط", "نكرر الحرف الأخير ونضيف ed", "نحذف الحرف الأخير ونضيف ed", "لا نغير شيئاً"], correctAnswer: 1, difficulty: 'easy', explanation: "عندما ينتهي الفعل بحرف صحيح مسبوق بحرف علة واحد، نضاعف الحرف الصحيح الأخير قبل إضافة ed." },
      { id: 2002, text: "ما هو تصريف فعل (be) مع الجمع في الماضي البسيط؟", options: ["was", "were", "been", "is"], correctAnswer: 1, difficulty: 'easy', explanation: "فعل be في الماضي البسيط يتحول إلى was مع المفرد و were مع الجمع." },
      { id: 3003, text: "كيف نحول الفعل (study) إلى الماضي البسيط؟", options: ["studyed", "studied", "studiied", "studid"], correctAnswer: 1, difficulty: 'easy', explanation: "إذا انتهى الفعل بـ y وقبله حرف صحيح، يقلب الـ y إلى i ونضيف ed." },
      { id: 4004, text: "ما هو الماضي البسيط للفعل (stop)؟", options: ["stoped", "stopped", "stoppied", "stopid"], correctAnswer: 1, difficulty: 'easy' },
      { id: 5005, isMinisterial: true, text: "أي من هذه الأفعال لا نضاعف حرفه الأخير عند إضافة ed؟", options: ["slip", "stop", "fix", "drop"], correctAnswer: 2, difficulty: 'hard', explanation: "الأحرف x, z, w, y لا تتكرر عند إضافة ed." },
      { id: 6006, isMinisterial: true, text: "ما هي الصيغة الصحيحة لنفي الجملة: 'They fixed the window'؟", options: ["They didn't fixed", "They didn't fix", "They not fixed", "They don't fix"], correctAnswer: 1, difficulty: 'hard' },
      { id: 7007, text: "ما هو الماضي البسيط للفعل (arrive)؟", options: ["arrived", "arriveed", "arrivied", "arrivd"], correctAnswer: 0, difficulty: 'easy' },
      { id: 8008, text: "اختر الجملة الصحيحة في حالة السؤال:", options: ["Did they fixed?", "Did they fix?", "Do they fixed?", "Does they fix?"], correctAnswer: 1, difficulty: 'hard' }
    ]
  },
  {
    id: 2,
    title: "قائمة تصاريف الأفعال الشاذة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "قائمة تصاريف الأفعال الشاذة للمنهج كاملاً", variant: 'purple' },
      {
        type: 'table',
        rows: [
          { source: "Buy", arabic: "يشتري", past: "Bought", pastParticiple: "Bought" },
          { source: "Think", arabic: "يعتقد", past: "Thought", pastParticiple: "Thought" },
          { source: "Bring", arabic: "يجلب", past: "Brought", pastParticiple: "Brought" },
          { source: "Fight", arabic: "يقاتل", past: "Fought", pastParticiple: "Fought" },
          { source: "Seek", arabic: "يبحث", past: "Sought", pastParticiple: "Sought" },
          { source: "Drive", arabic: "يقود", past: "Drove", pastParticiple: "Driven" },
          { source: "Take", arabic: "يأخذ", past: "Took", pastParticiple: "Taken" },
          { source: "Break", arabic: "يكسر", past: "Broke", pastParticiple: "Broken" },
          { source: "Write", arabic: "يكتب", past: "Wrote", pastParticiple: "Written" },
          { source: "Drink", arabic: "يشرب", past: "Drank", pastParticiple: "Drunk" },
          { source: "Ring", arabic: "يرن", past: "Rang", pastParticiple: "Rung" },
          { source: "Run", arabic: "يركض", past: "Ran", pastParticiple: "Run" },
          { source: "Sit", arabic: "يجلس", past: "Sat", pastParticiple: "Sat" },
          { source: "Say", arabic: "يقول", past: "Said", pastParticiple: "Said" },
          { source: "Pay", arabic: "يدفع", past: "Paid", pastParticiple: "Paid" },
          { source: "Fly", arabic: "يطير", past: "Flew", pastParticiple: "Flown" },
          { source: "Sleep", arabic: "ينام", past: "Slept", pastParticiple: "Slept" },
          { source: "Spend", arabic: "يصرف", past: "Spent", pastParticiple: "Spent" },
          { source: "Hide", arabic: "يخفي", past: "Hid", pastParticiple: "Hidden" },
          { source: "Eat", arabic: "يأكل", past: "Ate", pastParticiple: "Eaten" },
          { source: "Ride", arabic: "يقود", past: "Rode", pastParticiple: "Ridden" },
          { source: "Fall", arabic: "يسقط", past: "Fell", pastParticiple: "Fallen" },
          { source: "Get", arabic: "يحصل", past: "Got", pastParticiple: "Got" },
          { source: "Do/does", arabic: "يفعل", past: "Did", pastParticiple: "Done" },
          { source: "steal", arabic: "يسرق", past: "Stole", pastParticiple: "Stolen" },
          { source: "Forget", arabic: "ينسى", past: "Forgot", pastParticiple: "Forgotten" },
          { source: "Wear", arabic: "يرتدي", past: "Wore", pastParticiple: "Worn" },
          { source: "Know", arabic: "يعرف", past: "Knew", pastParticiple: "Known" },
          { source: "See", arabic: "يرى", past: "Saw", pastParticiple: "Seen" },
          { source: "Wake", arabic: "يستيقظ", past: "Woke", pastParticiple: "Woken" },
          { source: "Choose", arabic: "يختار", past: "Chose", pastParticiple: "Chosen" },
          { source: "Bite", arabic: "يعض", past: "Bit", pastParticiple: "Bitten" },
          { source: "Speak", arabic: "يتكلم", past: "Spoke", pastParticiple: "Spoken" },
          { source: "Forgive", arabic: "يسامح", past: "Forgave", pastParticiple: "Forgiven" },
          { source: "Swim", arabic: "يسبح", past: "Swam", pastParticiple: "Swum" },
          { source: "Lend", arabic: "يقرض", past: "Lent", pastParticiple: "Lent" },
          { source: "Keep", arabic: "يحفظ", past: "Kept", pastParticiple: "Kept" },
          { source: "Send", arabic: "يرسل", past: "Sent", pastParticiple: "Sent" },
          { source: "Hear", arabic: "يسمع", past: "Heard", pastParticiple: "Heard" },
          { source: "Leave", arabic: "يغادر", past: "Left", pastParticiple: "Left" },
          { source: "Catch", arabic: "يصيد", past: "Caught", pastParticiple: "Caught" },
          { source: "Teach", arabic: "يتعلم", past: "Taught", pastParticiple: "Taught" },
          { source: "Read", arabic: "يقرأ", past: "Read", pastParticiple: "Read" },
          { source: "Put", arabic: "يضع", past: "Put", pastParticiple: "Put" },
          { source: "Hit", arabic: "يضرب", past: "Hit", pastParticiple: "Hit" },
          { source: "Set", arabic: "يضبط", past: "Set", pastParticiple: "Set" },
          { source: "Have", arabic: "يمتلك", past: "Had", pastParticiple: "Had" },
          { source: "Can", arabic: "يستطيع", past: "Could", pastParticiple: "Could" },
          { source: "Hold", arabic: "يحمل", past: "Held", pastParticiple: "Held" },
          { source: "Be", arabic: "يكون", past: "Was/were", pastParticiple: "Been" },
          { source: "Understand", arabic: "يفهم", past: "Understood", pastParticiple: "Understood" },
          { source: "Build", arabic: "يبني", past: "Built", pastParticiple: "Built" },
          { source: "Tell", arabic: "يخبر", past: "told", pastParticiple: "Told" },
          { source: "Make", arabic: "يعمل", past: "Made", pastParticiple: "Made" },
          { source: "Lose", arabic: "يخسر", past: "Lost", pastParticiple: "Lost" },
          { source: "Meet", arabic: "يقابل", past: "Met", pastParticiple: "Met" },
          { source: "Come", arabic: "يأتي", past: "Came", pastParticiple: "Come" },
          { source: "Become", arabic: "يصبح", past: "Became", pastParticiple: "Become" },
          { source: "Burn", arabic: "يحرق", past: "Burnt", pastParticiple: "Burnt" },
          { source: "feel", arabic: "يشعر", past: "Felt", pastParticiple: "Felt" },
          { source: "Grow", arabic: "ينمو", past: "Grew", pastParticiple: "Grown" },
          { source: "win", arabic: "يفوز", past: "Won", pastParticiple: "Won" },
          { source: "Begin", arabic: "يبدأ", past: "Began", pastParticiple: "Begun" },
          { source: "Hurt", arabic: "يؤلم", past: "Hurt", pastParticiple: "Hurt" },
          { source: "Find", arabic: "يعثر", past: "found", pastParticiple: "Found" },
          { source: "Bleed", arabic: "ينزف", past: "Bled", pastParticiple: "Bled" },
          { source: "Stand", arabic: "يقف", past: "Stood", pastParticiple: "Stood" },
          { source: "Sell", arabic: "يبيع", past: "Sold", pastParticiple: "Sold" },
          { source: "Flee", arabic: "يهرب", past: "Fled", pastParticiple: "Fled" },
          { source: "Go", arabic: "يذهب", past: "Went", pastParticiple: "Gone" },
          { source: "Sing", arabic: "يغني", past: "Sang", pastParticiple: "Sung" }
        ]
      }
    ],
    solutions: ["هذه القائمة للحفظ التام لضمان الدرجة الكاملة في القواعد والإملاء."],
    questions: [
      { id: 9001, text: "ما هو الماضي البسيط للفعل (Buy)؟", options: ["Bought", "Buyed", "Brought", "Thought"], correctAnswer: 0, difficulty: 'easy' },
      { id: 10002, text: "ما هو التصريف الثالث (P.P) للفعل (Drive)؟", options: ["Drove", "Driven", "Drived", "Droven"], correctAnswer: 1, difficulty: 'easy' },
      { id: 11003, isMinisterial: true, text: "ما هو التصريف الثالث لفعل (Write)؟", options: ["Wrote", "Written", "Writes", "Writing"], correctAnswer: 1, difficulty: 'easy', explanation: "التصريف الثالث لفعل Write هو Written." },
      { id: 12004, text: "ما هو الماضي البسيط لفعل (Fly)؟", options: ["Flown", "Flew", "Flyed", "Flies"], correctAnswer: 1, difficulty: 'easy', explanation: "الماضي البسيط لفعل Fly هو Flew." },
      { id: 13005, isMinisterial: true, text: "ما هو التصريف الثالث لفعل (steal)؟", options: ["Stole", "Stolen", "Stealed", "Steals"], correctAnswer: 1, difficulty: 'easy', explanation: "التصريف الثالث لفعل steal هو Stolen." },
      { id: 14006, text: "أي من هذه الأفعال لا يتغير شكله في الماضي والتصريف الثالث؟", options: ["Eat", "Read", "Go", "See"], correctAnswer: 1, difficulty: 'hard', explanation: "فعل Read يبقى بنفس الكتابة في الماضي والتصريف الثالث ولكن يتغير النطق." },
      { id: 15007, text: "أي فعل من هذه الأفعال ينتهي بـ (ought) في الماضي؟", options: ["Bring", "Think", "Catch", "كل ما سبق"], correctAnswer: 3, difficulty: 'hard' },
      { id: 16008, text: "ما هو الماضي للفعل (Swim)؟", options: ["Swum", "Swam", "Swimed", "Swiming"], correctAnswer: 1, difficulty: 'easy' }
    ]
  },
  {
    id: 3,
    title: "الماضي المستمر Past Continuous",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "الماضي المستمر Past Continuous", variant: 'purple' },
      { type: 'text', content: "• نستعمله للحدث الأطول يعني شي صار بالماضي و استمر لفترة معينة و بعدين هم انتهى", variant: 'blue' },
      { type: 'text', content: "I, she, he, it + was + v.ing", variant: 'purple' },
      { type: 'text', content: "• She was fixing the window.", variant: 'blue' },
      { type: 'text', content: "you, we, they + were + v.ing", variant: 'purple' },
      { type: 'text', content: "• They were cleaning the room.", variant: 'blue' },
      { type: 'text', content: "النفي Negative: الفاعل + wasn't, weren't + v.ing", variant: 'purple' },
      { type: 'text', content: "• She wasn't fixing the window.", variant: 'blue' },
      { type: 'text', content: "• They weren't cleaning the room.", variant: 'blue' },
      { type: 'text', content: "السؤال Question: Was, Were + الفاعل + v.ing + ?", variant: 'purple' },
      { type: 'text', content: "• Was she fixing the window?", variant: 'blue' },
      { type: 'text', content: "• Were they cleaning the room?", variant: 'blue' },
      { type: 'text', content: "ملاحظات إضافة الـ ing", variant: 'purple' },
      { type: 'text', content: "مهمة جدا بالذات بفرع الاملاء Q3/C Spelling", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "1 | اذا انتهى الفعل بحرف (e)", description: "يحذف و نضيف ing: make → making | write → writing | have → having | drive → driving" },
      { type: 'rule', icon: 'bulb', title: "عدا الفعل (dye يصبغ)", description: "يبقى e عند إضافة ing يصبح dyeing" },
      { type: 'rule', icon: 'sparkle', title: "2 | اذا انتهى الفعل بحرف صحيح قبله عله", description: "نكرر الأخير ونضع ing: run → running | swim → swimming | get → getting | travel → travelling" },
      { type: 'rule', icon: 'bulb', title: "نكرر اذا اكو حرف عله واحد", description: "اذا اكثر ما نكرر: clean → cleaning | wear → wearing | look → looking | cook → cooking" }
    ],
    solutions: [
      "تذكر: dyeing هي الحالة الشاذة الوحيدة التي لا نحذف فيها الـ e.",
      "تذكر: إذا وجد حرفا علة قبل الحرف الأخير، لا نكرر الحرف الأخير."
    ],
    questions: [
      { id: 17001, text: "ما هو الفعل المساعد المستخدم مع (She) في الماضي المستمر؟", options: ["was", "were", "is", "am"], correctAnswer: 0, difficulty: 'easy' },
      { id: 18002, isMinisterial: true, text: "كيف نحول الفعل (make) عند إضافة ing؟", options: ["makeing", "making", "makiing", "maked"], correctAnswer: 1, difficulty: 'easy', explanation: "إذا انتهى الفعل بـ e، نحذفه ونضيف ing." },
      { id: 19003, isMinisterial: true, text: "ما هو الماضي المستمر للفعل (swim) مع الضمير (They)؟", options: ["They was swimming", "They were swiming", "They were swimming", "They was swiming"], correctAnswer: 2, difficulty: 'hard', explanation: "نستخدم were مع They ونضاعف حرف m في swim قبل إضافة ing." },
      { id: 20004, text: "أي فعل من هذه الأفعال لا نحذف الـ e منه عند إضافة ing؟", options: ["have", "write", "dye", "drive"], correctAnswer: 2, difficulty: 'hard', explanation: "فعل dye (يصبغ) هو استثناء، تبقى الـ e عند إضافة ing." },
      { id: 21005, text: "ما هي الصيغة الصحيحة للسؤال في الماضي المستمر؟", options: ["Was she fixing...?", "Did she fixing...?", "Was she fix...?", "Were she fixing...?"], correctAnswer: 0, difficulty: 'easy' },
      { id: 22006, text: "ماذا نفعل للفعل (clean) عند إضافة ing؟", options: ["cleanning", "cleaning", "cleanied", "cleans"], correctAnswer: 1, difficulty: 'easy', explanation: "لا نضاعف الحرف الأخير لأن قبله حرفي علة." },
      { id: 23007, text: "ما هو نفي الجملة: 'They were cleaning'؟", options: ["They weren't cleaning", "They wasn't cleaning", "They didn't cleaning", "They not cleaning"], correctAnswer: 0, difficulty: 'easy' },
      { id: 24008, text: "اختر الجملة الصحيحة:", options: ["I were reading", "I was reading", "I was read", "I were read"], correctAnswer: 1, difficulty: 'easy' }
    ]
  },
  {
    id: 4,
    title: "المضارع البسيط Present Simple",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'rule', icon: 'sparkle', title: "3 | اذا انتهى الفعل ب (ie)", description: "يقلب الى y ونضيف ing: Lie → lying | tie → tying | die → dying" },
      { type: 'rule', icon: 'bulb', title: "4 | حرف y نهاية الفعل لا يقلب بإضافة ing", description: "(ما عدنا ويا مشكلة ان كان قبله صحيح او علة): play → playing | study → studying | try → trying | stay → staying" },
      { type: 'text', content: "e.g. play, playing; cut, ________ (2020/ت)", variant: 'blue' },
      { type: 'text', content: "المضارع البسيط Present Simple", variant: 'purple' },
      { type: 'text', content: "I, you, we, they + فعل مجرد مصدر -> they cook the food.", variant: 'blue' },
      { type: 'text', content: "He, She, It + فعل يحتوي إضافة s, es -> She cooks the food.", variant: 'blue' },
      { type: 'text', content: "النفي Negative", variant: 'purple' },
      { type: 'text', content: "I, you, we, they + don't + فعل مجرد مصدر -> they don't cook the food.", variant: 'blue' },
      { type: 'text', content: "He, She, It + doesn't + فعل مجرد مصدر -> she doesn't cook thee food.", variant: 'blue' },
      { type: 'text', content: "السؤال Question", variant: 'purple' },
      { type: 'text', content: "Do + I, you, we, they + فعل مجرد -> Do they cook the food?", variant: 'blue' },
      { type: 'text', content: "Does + He, She, It + فعل مجرد -> Does she cook the food?", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "تنبيه", description: "انتبهوا ابطالي بالنفي doesn't و السؤال does يكون الفعل مصدر مجرد بدون إضافة s" },
      { type: 'rule', icon: 'bulb', title: "تنبيه have", description: "الفعل have يتحول has من يكون الفاعل مفرد (he she it)" },
      { type: 'rule', icon: 'sparkle', title: "تنبيه be", description: "الفعل be يتحول is للفاعل المفرد و are للفاعل الجمع و am للفاعل I" },
      { type: 'text', content: "ملاحظات إضافة s الشخص الثالث للافعال", variant: 'purple' },
      { type: 'rule', icon: 'bulb', title: "1 | اذا انتهى الفعل بالأحرف (o, x, z, s, ss, sh, ch)", description: "نضع (es): wash → washes | watch → watches | pass → passes | fix → fixes" },
      { type: 'rule', icon: 'sparkle', title: "2 | اذا انتهى الفعل ب y", description: "قبله حرف عله نضع (s) فقط واذا صحيح يقلب ال (y) الى (i) ونضيف (es): say → says | study → studies | try → tries | play → plays" }
    ],
    solutions: [
      "الحل (2020/ت): cutting (نكرر الحرف الأخير لأن قبله علة واحد)"
    ],
    questions: [
      { id: 25007, isMinisterial: true, text: "كيف يتحول الفعل (die) عند إضافة ing؟", options: ["dieing", "dying", "dies", "died"], correctAnswer: 1, explanation: "الأفعال المنتهية بـ ie تقلب إلى y قبل إضافة ing." },
      { id: 26008, text: "ماذا نستخدم مع (He, She, It) في نفي المضارع البسيط؟", options: ["don't", "doesn't", "didn't", "isn't"], correctAnswer: 1, explanation: "نستخدم doesn't مع الفاعل المفرد في المضارع البسيط." }
    ]
  },
  {
    id: 5,
    title: "ملاحظات اس الجمع S",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "مهمة بالاملاء Q3/C Spelling", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "1 | تجمع الأسماء باضافة (s) الى نهايتها", description: "Pen → Pens | Apple → Apples | Book → Books" },
      { type: 'rule', icon: 'bulb', title: "2 | اذا انتهى الأسم ب (y)", description: "قبله عله نضع (s) فقط واذا قبله صحيح يقلب الى (i) ونضع (es): fly → flies | baby → babies | key → keys | day → days | Boy → boys" },
      { type: 'rule', icon: 'sparkle', title: "3 | اذا انتهى الأسم ب (f او fe)", description: "نضع v و es: knife → knives | leaf → leaves | loaf → loaves | wife → wives | Thief → thieves" },
      { type: 'rule', icon: 'bulb', title: "4 | اذا انتهى الأسم ب (z, x, s, ss, sc, ch)", description: "نضع (es): watch → watches | Class → Classes | Bus → Busses | Box → Boxes" },
      { type: 'rule', icon: 'sparkle', title: "5 | الجمع الشاذ", description: "child → children | teeth → teeth | Foot → Feet | Woman → Women | Man → Men | louse → lice | mouse → mice | goose → geese | oasis → oases" },
      { type: 'text', content: "e.g. job, jobs; bar, ________ (2020/1)", variant: 'blue' },
      { type: 'text', content: "e.g. boy, boys; church, ________ (2014/2)", variant: 'purple' },
      { type: 'text', content: "e.g. car, cars; town, ________ (2020/ت)", variant: 'blue' },
      {
        type: 'table',
        rows: [
          { source: "I", arabic: "ضمائر الفاعل", past: "My (صفات تملك)", pastParticiple: "mine (ضمائر تملك)" },
          { source: "You", arabic: "You", past: "Your", pastParticiple: "Yours" },
          { source: "We", arabic: "Us (مفعول به)", past: "Our", pastParticiple: "Ours" },
          { source: "They", arabic: "Them", past: "Their", pastParticiple: "Theirs" },
          { source: "He", arabic: "Him", past: "His", pastParticiple: "His" },
          { source: "She", arabic: "Her", past: "Her", pastParticiple: "Hers" },
          { source: "it", arabic: "it", past: "its", pastParticiple: "Its" }
        ]
      }
    ],
    solutions: [
      "الحل (2020/1): bars",
      "الحل (2014/2): churches",
      "الحل (2020/ت): towns"
    ],
    questions: [
      { id: 27009, text: "ما هو جمع كلمة (Thief)؟", options: ["Thiefs", "Thieves", "Thiefes", "Thiefies"], correctAnswer: 1, explanation: "الأسماء المنتهية بـ f أو fe تقلب إلى v ونضيف es عند الجمع." },
      { id: 28010, text: "ما هو جمع كلمة (Foot)؟", options: ["Foots", "Feets", "Feet", "Footes"], correctAnswer: 2, explanation: "Foot هي جمع شاذ وتصبح Feet." }
    ]
  },
  {
    id: 6,
    title: "اصبع قدمي ينزف My toe is bleeding",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "بعد ما كملنا الأساسيات وكل شي نحتاجه ضمن الوحدة الأولى وباقي الوحدات نتوكل على الله ونبلش بالوحدة الأولى", variant: 'blue' },
      { type: 'text', content: "نبدأ الوحدة الأولى ب 14 جملة موجودة بكتاب الطالب (الملون) جدا مهمات كمعاني وراح تخليكم ابطال بالإسقاطات Q3/A (الجمل ليست حفظ على الغيب لكن مهمات كمعاني)", variant: 'purple' },
      { type: 'text', content: "1 | My shoulder hurts. I did it playing tennis. (كتفي يؤلمني اذيته اثناء لعب التنس)", variant: 'blue' },
      { type: 'text', content: "2 | I burnt my finger on the oven. (أحرقت إصبعي على الفرن)", variant: 'blue' },
      { type: 'text', content: "3 | I've broken leg. I fractured it in a motor bike accident. (كسرت ساقي كسرتها في حادث دراجة)", variant: 'blue' },
      { type: 'text', content: "4 | I feel dizzy. I need to lie down. (اشعر بالدوار احتاج ان استلقي)", variant: 'blue' },
      { type: 'text', content: "5 | I've got a pain in my knee. it's really swollen. (لدي الم في ركبتي و انه متورم جدا)", variant: 'blue' },
      { type: 'text', content: "6 | I've got a terrible headache. Can I have some painkiller? (لدي صداع فضيع هل لي ببعض المسكنات؟)", variant: 'blue' },
      { type: 'text', content: "7 | I've got a sore throat. It hurts so much that I can't swallow. (لدي تقرح في الحنجرة انه يؤلمني لدرجة لا استطيع البلع)", variant: 'blue' },
      { type: 'text', content: "8 | I have a temperature of 39. (درجة حرارتي 39)", variant: 'blue' },
      { type: 'text', content: "9 | I have a very bad cold. I can't stop sneezing. (لدي زكام شديد لا استطيع التوقف عن العطاس)", variant: 'blue' },
      { type: 'text', content: "10 | I need bucket because I think I'm going to be sick. (احتاج لهذا الدلو اعتقد بأنني سأتقيأ)", variant: 'blue' },
      { type: 'text', content: "11 | I've got a bad wrist. I sprained it lifting weights. (لدي رسغ ضعيف لويته اثناء رفع الاوزان)", variant: 'blue' },
      { type: 'text', content: "12 | I twisted my ankle playing football. (لويت كاحلي اثناء لعب الكرة)", variant: 'blue' },
      { type: 'text', content: "13 | My toe is bleeding I cut it on a piece of glass on the beach. (اصبع قدمي ينزف جرحته بقطعة زجاج على الشاطئ)", variant: 'blue' },
      { type: 'text', content: "14 | My lips are really dry and sore. (شفاهي جافة جدا ومتقرحة)", variant: 'blue' },
      { type: 'text', content: "الفرق بين المفردات hurt, sore, pain (للفهم والاطلاع ليس للحفظ)", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "Hurt", description: "فعل يبقى نفسه بالماضي والتصريف الثالث معناه (يؤلم): My back hurts today. it also hurt yesterday. my feet hurt today. They hurt yesterday as well. ويكون قبله فاعل (اسم او ضمير او جزء من اجزاء الجسم)" },
      { type: 'rule', icon: 'bulb', title: "Sore", description: "صفة معناها (مؤلم، متقرح) يكون قبلها فعل مساعد (is, are, was, were): My back is sore. my feet are also sore. they weren't sore yesterday" }
    ],
    solutions: [],
    questions: [
      { id: 29011, text: "ما هو الفرق القواعدي بين Hurt و Sore؟", options: ["Hurt فعل و Sore صفة", "Hurt صفة و Sore فعل", "كلاهما أفعال", "كلاهما صفات"], correctAnswer: 0, explanation: "Hurt هو فعل (Verb) بينما Sore هي صفة (Adjective) تأتي بعد أفعال المساعدة." },
      { id: 30012, text: "أي جملة صحيحة قواعدياً؟", options: ["My back is hurt.", "My back hurts.", "My back sore.", "My back is hurts."], correctAnswer: 1, explanation: "نستخدم الفعل hurts مع الفاعل المفرد (My back)." }
    ]
  },
  {
    id: 7,
    title: "Pain (اسم) والمفردات المهمة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "Pain (اسم معناه الم)", variant: 'purple' },
      { type: 'text', content: "• I Have a pain in my stomach. معدة. Have you taken any medicine دواء for the pain? Yes. I took some painkillers an half hour ago. Do you have anywhere else?", variant: 'blue' },
      { type: 'text', content: "و يكون قبله a, the", variant: 'warning' },
      {
        type: 'table',
        rows: [
          { source: "Shoulder", arabic: "كتف", past: "sore", pastParticiple: "متألم او تقرح" },
          { source: "burnt", arabic: "احرق", past: "throat", pastParticiple: "حنجرة" },
          { source: "fractured", arabic: "كسر", past: "swallow", pastParticiple: "يبتلع" },
          { source: "dizzy", arabic: "دوار", past: "temperature", pastParticiple: "درجة حرارة" },
          { source: "pain", arabic: "الم", past: "cold", pastParticiple: "برد او زكام" },
          { source: "knee", arabic: "ركبة", past: "sneeze", pastParticiple: "يعطس" },
          { source: "swollen", arabic: "متورم", past: "bucket", pastParticiple: "دلو" },
          { source: "headache", arabic: "صداع", past: "sick", pastParticiple: "متقزز" },
          { source: "sprained", arabic: "يلوي", past: "twisted", pastParticiple: "يلوي" },
          { source: "ankle", arabic: "كاحل", past: "toe", pastParticiple: "اصبع القدم" },
          { source: "lips", arabic: "شفاه", past: "dry", pastParticiple: "جاف" },
          { source: "wrist", arabic: "رسغ", past: "painkiller", pastParticiple: "مسكن الام" }
        ]
      },
      { type: 'rule', icon: 'sparkle', title: "تنبيه هام", description: "تمرين الكتاب P.2(AB)A يحتوي على اربع خانات كل الخانات مهمات بالإملاء Q3/C Spelling يعني حفظ على الغيب عدا خانة الأفعال تكون للمعاني" },
      { type: 'text', content: "• Treatment: bandage, cream, pills, medicine, plaster (لاصق)", variant: 'blue' },
      { type: 'text', content: "• Joints: ankle, knee, wrist, shoulder, elbow (مرفق)", variant: 'purple' },
      { type: 'text', content: "• Inside the body: blood, bones, heart, stomach (معدة)", variant: 'blue' },
      { type: 'text', content: "• Outside the body: skin (بشرة)", variant: 'purple' },
      { type: 'text', content: "• Verbs: breathe, sneeze, swallow, faint (يفقد الوعي), cough (يسعل)", variant: 'blue' },
      { type: 'text', content: "المفاصل تنقسم الى in the arm و الى في الساق in the leg:", variant: 'warning' },
      { type: 'text', content: "• Joints in the arm: shoulder, elbow, wrist", variant: 'blue' },
      { type: 'text', content: "• Joints in the leg: ankle, knee", variant: 'purple' },
      { type: 'text', content: "شيئين في العلاج يستعمل كغطاء للجرح: To cover a cut: bandage, plaster", variant: 'warning' }
    ],
    solutions: [],
    questions: [
      { id: 31013, text: "أي من الكلمات التالية تعتبر من الـ Treatment؟", options: ["Ankle", "Plaster", "Breathe", "Heart"], correctAnswer: 1, explanation: "Plaster هو لاصق جروح ويعتبر من العلاجات (Treatment)." },
      { id: 32014, text: "ما هو المفصل الموجود في الساق (Leg)؟", options: ["Wrist", "Elbow", "Knee", "Shoulder"], correctAnswer: 2, explanation: "Knee (الركبة) هي مفصل في الساق." }
    ]
  },
  {
    id: 8,
    title: "الوزاريات حصتكم من الواجبات",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "الوزاريات حصتكم من الواجبات", variant: 'purple' },
      { type: 'text', content: "1 | joint in the arm, w... (2014/1)(2017/2)(2019/3)(2020/2021/1)(2020/2)(2020/1)(ت)", variant: 'blue' },
      { type: 'text', content: "2 | joint in the leg, k... (2015/1)(2018/1)(2020/1)", variant: 'purple' },
      { type: 'text', content: "3 | ankle, joint; bandage, ________ (2016/1)", variant: 'blue' },
      { type: 'text', content: "4 | joint in the arm, e... (2019/2)(2016/2)(2020/1)", variant: 'purple' },
      { type: 'text', content: "5 | joint in the leg, a... (2017/3)(2016/3)(1/2019)", variant: 'blue' },
      { type: 'text', content: "6 | inside the body, h... (2017/1)", variant: 'purple' },
      { type: 'text', content: "7 | ankles and knees are joints in the ________ (2/2017)", variant: 'blue' },
      { type: 'text', content: "8 | joint in the arm, ________ (1/2019)(1/2018)(2018/ت)", variant: 'purple' },
      { type: 'text', content: "9 | joint in the leg, ________ (2024/1)(2023/ت)(2018/2)", variant: 'blue' },
      { type: 'text', content: "10 | Inside the body b ________ (2024/2)", variant: 'purple' },
      { type: 'text', content: "تمارين اسقاطات الدرس الأول في كتاب التمارين (كتاب النشاط)", variant: 'warning' },
      { type: 'text', content: "P.3 A.B C - Complete each sentence with a word from the box:", variant: 'purple' },
      { type: 'text', content: "Bleeding, broken, hurts, pain, sneeze, sore, dizzy, sick", variant: 'blue' },
      { type: 'text', content: "1 | Have you got a cold? no, I always ________ when I put pepper on my food. اضع الفلفل على طعامي", variant: 'blue' },
      { type: 'text', content: "2 | He was ________ three times in the night. I think the food at the restaurant where he ate wasn't very fresh. الطعام لم يكن طازج", variant: 'blue' },
      { type: 'text', content: "3 | She cut her hand جرحت يدها while she was chopping تقطع vegetables. it was a very deep عميق cut and it was ________ a lot, so she had to go to hospital and have it stitched. تخيطه", variant: 'blue' },
      { type: 'text', content: "4 | My back ________ all the time it only feels ok when I am lying down. عندما استلقي", variant: 'blue' },
      { type: 'text', content: "5 | She can't play tennis. she has ________ her right arm. ذراعها الأيمن", variant: 'blue' },
      { type: 'text', content: "6 | I went swimming yesterday and now my eyes are ________ from the chemicals مواد كيميائية in the pool.", variant: 'blue' },
      { type: 'text', content: "7 | Where exactly اين بالضبط is the ________ and how long have you had it?", variant: 'blue' },
      { type: 'text', content: "8 | It was a very hot day يوم حار and she hadn't eaten or drunk anything all day. That's why she suddenly فجأة went pale شاحبة and felt ________ during the lesson.", variant: 'blue' }
    ],
    solutions: [
      "حلول الوزاريات: 1-wrist, 2-knee, 3-treatment, 4-elbow, 5-ankle, 6-heart, 7-leg, 8-shoulder/elbow/wrist, 9-ankle/knee, 10-blood/bones/heart/stomach",
      "حلول الإسقاطات: 1-sneeze, 2-sick, 3-Bleeding, 4-hurts, 5-broken, 6-sore, 7-pain, 8-dizzy"
    ],
    questions: [
      { id: 33015, isMinisterial: true, text: "ما هي الكلمة المناسبة للفراغ: I always ________ when I put pepper on my food.", options: ["Sneeze", "Cough", "Faint", "Bleed"], correctAnswer: 0, explanation: "الفلفل يسبب العطاس (Sneeze)." },
      { id: 34016, text: "ما هي الكلمة المناسبة للفراغ: My eyes are ________ from the chemicals in the pool.", options: ["Broken", "Sore", "Dizzy", "Sick"], correctAnswer: 1, explanation: "المواد الكيميائية في المسبح تجعل العيون متقرحة (Sore)." }
    ]
  },
  {
    id: 9,
    title: "أدوات الربط والتمارين المهمة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.19 A.B B - write the correct words", variant: 'purple' },
      { type: 'text', content: "• name three joint in the arm: w..., e..., s...", variant: 'blue' },
      { type: 'text', content: "• name to joints in the leg: k..., a...", variant: 'purple' },
      { type: 'text', content: "• name tow things for covering a cut: pl..., ba...", variant: 'blue' },
      { type: 'text', content: "P.19 A.B C - complete the words", variant: 'warning' },
      { type: 'text', content: "throat, sneezes, pills, faint, cream, temperature, coughs, skin", variant: 'blue' },
      { type: 'text', content: "1 | I feel dizzy. I think I'm going to ________", variant: 'blue' },
      { type: 'text', content: "2 | I can't swallow لا استطيع الابتلاع. I have a sore ________ and a ________ of 39 degrees.", variant: 'blue' },
      { type: 'text', content: "3 | You have to take two of these ________ three times a day.", variant: 'blue' },
      { type: 'text', content: "4 | The ________ on my leg is very dry جاف so I have to put this ________ on every day.", variant: 'blue' },
      { type: 'text', content: "5 | We often say \"bless you\" عافاك الله when someone ________ but we don't say it if someone ________", variant: 'blue' },
      { type: 'text', content: "أدوات الربط بين الماضي البسيط و الماضي المستمر", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "موقع الأدوات", description: "يكون لهذه الادوات موقعين اما وسط او بداية الجملة و and وسط الجملة فقط و تجيكم بالقواعد Q2/A Q2/B النمط الوزاري: Q2/A) Correct the verb, Q2/A) put one verb in past simple and one in past continuous, Q2/B) Choose" },
      { type: 'rule', icon: 'bulb', title: "القاعدة الذهبية", description: "بعد when/and ماضي بسيط او الحدث الأقصر دائما و بعد while/as ماضي مستمر او الحدث الأطول دائما" },
      { type: 'text', content: "• When + past simple, past continuous", variant: 'blue' },
      { type: 'text', content: "• past continuous + When, and + past simple", variant: 'purple' },
      { type: 'text', content: "• While, as + past continuous, past simple", variant: 'blue' },
      { type: 'text', content: "• past simple + While, as + past continuous", variant: 'purple' }
    ],
    solutions: [
      "حلول التمرين: 1-faint, 2-throat, temperature, 3-pills, 4-skin, cream, 5-sneezes, coughs"
    ],
    questions: [
      { id: 35017, text: "ماذا يأتي دائماً بعد While و As؟", options: ["ماضي بسيط", "ماضي مستمر", "مضارع بسيط", "مستقبل"], correctAnswer: 1, explanation: "بعد While و As نستخدم دائماً الماضي المستمر (الحدث الأطول)." },
      { id: 36018, text: "أين تأتي الأداة (and) في الجملة؟", options: ["في البداية فقط", "في الوسط فقط", "في البداية والوسط", "في النهاية"], correctAnswer: 1, explanation: "الأداة and تأتي دائماً في وسط الجملة فقط." }
    ]
  },
  {
    id: 10,
    title: "أفعال الشواذ وتمارين الربط",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "قبل لا نبلش بتمرين الكتاب حضروا أفعال الشواذ حتى تكونون جاهزين ابطالي:", variant: 'warning' },
      {
        type: 'table',
        rows: [
          { source: "Ring", arabic: "يرن", past: "rang", pastParticiple: "" },
          { source: "find", arabic: "يجد", past: "found", pastParticiple: "" },
          { source: "run", arabic: "يركض", past: "ran", pastParticiple: "" },
          { source: "take", arabic: "يأخذ", past: "took", pastParticiple: "" },
          { source: "tell", arabic: "يخبر", past: "told", pastParticiple: "" },
          { source: "hide", arabic: "يخفي", past: "hid", pastParticiple: "" },
          { source: "break", arabic: "يكسر", past: "broke", pastParticiple: "" },
          { source: "hear", arabic: "يسمع", past: "heard", pastParticiple: "" },
          { source: "see", arabic: "يرى", past: "saw", pastParticiple: "" }
        ]
      },
      { type: 'text', content: "P.5 A.B B - Put one verb in past continues and one in past simple", variant: 'purple' },
      { type: 'text', content: "1 | I (think) about you and then you (ring) me.", variant: 'blue' },
      { type: 'text', content: "2 | While Ali (have) a shower, somebody (knock) on the front door.", variant: 'blue' },
      { type: 'text', content: "3 | I (clean) my room and I (find) 30£ under bed.", variant: 'blue' },
      { type: 'text', content: "4 | Luckily, sharifa (not drive) very fast when the child (run) into the road.", variant: 'blue' },
      { type: 'text', content: "5 | A thief (take) our clothes while we (swim).", variant: 'blue' },
      { type: 'text', content: "6 | She (tell) us to be quiet as we (make) too much noise.", variant: 'blue' },
      { type: 'text', content: "7 | My sister (hide) my purse under bed while I (not look).", variant: 'blue' },
      { type: 'text', content: "8 | As she (carry) the shopping from the car, my grandmother (slip) and (break) her ankle.", variant: 'blue' },
      { type: 'text', content: "نمط وزاري ورد في السنوات السابقة", variant: 'warning' },
      { type: 'text', content: "• She didn't drive fast. the childe ran into the road (join with \"when\") (2016/1)(2023/ت)", variant: 'purple' },
      { type: 'text', content: "• She wasn't driving fast when the child ran into the road.", variant: 'blue' },
      { type: 'text', content: "أمثلة إضافية من عندي على نفس الفكرة:", variant: 'warning' },
      { type: 'text', content: "1 | He played football. he broken his ankle. (join with \"while\") -> While he was playing football, he broke his ankle.", variant: 'blue' },
      { type: 'text', content: "2 | My sister told us to be quite. we made too much noise (join with \"as\") -> My sister told us to be quite as we were making too much noise.", variant: 'blue' }
    ],
    solutions: [
      "حلول التمرين: 1-was thinking, rang | 2-was having, knocked | 3-was cleaning, found | 4-wasn't driving, ran | 5-took, were swimming | 6-told, were making | 7-hid, wasn't looking | 8-was carrying, slipped, broke"
    ],
    questions: [
      { id: 37019, text: "ما هو الماضي البسيط لفعل (Ring)؟", options: ["Ringed", "Rang", "Rung", "Rings"], correctAnswer: 1, explanation: "Ring هو فعل شاذ وماضيه هو Rang." },
      { id: 38020, isMinisterial: true, text: "صحح الفعل: While Ali (have) a shower...", options: ["had", "was having", "is having", "has"], correctAnswer: 1, explanation: "بعد While نستخدم الماضي المستمر، وبما أن Ali مفرد نستخدم was having." }
    ]
  },
  {
    id: 11,
    title: "اختيارات وتمارين الربط المتقدمة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "فكرة الاختيارات Q2/B Choose: (انتبهوا على موقع الأداة واختاروا)", variant: 'warning' },
      { type: 'text', content: "1 | As I (walked / was walking). I fell down.", variant: 'blue' },
      { type: 'text', content: "2 | When I (opened / was opening) the window, they were playing in the garden.", variant: 'blue' },
      { type: 'text', content: "3 | While we were sitting in the park, we (meet / met) an old friend.", variant: 'blue' },
      { type: 'text', content: "ننتقل للوحدة الرابعة عدنا تمرين مراجعة عن أدوات الربط و بنمط جديد و هو وضع الأفعال بأماكنهم ثم نحولهم للأزمنة الصحيحة:", variant: 'purple' },
      { type: 'text', content: "P.77 A.B C - Put in the correct tense: past continuous or past simple.", variant: 'warning' },
      { type: 'text', content: "1 | I ________ in the park when somebody ________ a ball at me. (sit / kick)", variant: 'blue' },
      { type: 'text', content: "2 | We ________ to the beach when we ________ aloud crash. (hear / drive)", variant: 'blue' },
      { type: 'text', content: "3 | They ________ in the desert when they ________ a large snake. (camp / see)", variant: 'blue' },
      { type: 'text', content: "4 | When I ________ her at the airport, Muna ________ a long blue dress. (meet / wear)", variant: 'blue' },
      { type: 'text', content: "5 | Khaled ________ football when he ________ his ankle. (play / break)", variant: 'blue' },
      { type: 'text', content: "P.6 A.B C - complete the sentence with your own ideas. put the verbs in the past simple.", variant: 'purple' },
      { type: 'text', content: "1 | I was running and ________", variant: 'blue' },
      { type: 'text', content: "2 | I wasn't looking where I was going and ________", variant: 'blue' },
      { type: 'text', content: "3 | I was getting ready to school when ________", variant: 'blue' },
      { type: 'text', content: "4 | My little brother was playing football when ________", variant: 'blue' },
      { type: 'text', content: "5 | I was thinking about you and you rang me when the teacher suddenly ________", variant: 'blue' },
      { type: 'text', content: "6 | While I was waiting for the bus ________", variant: 'blue' }
    ],
    solutions: [
      "حلول الاختيارات: 1-was walking, 2-opened, 3-met",
      "حلول تمرين P.77: 1-was sitting, kicked | 2-were driving, heard | 3-were camping, saw | 4-met, was wearing | 5-was playing, broke"
    ],
    questions: [
      { id: 39021, text: "اختر الإجابة الصحيحة: As I (walked / was walking), I fell down.", options: ["walked", "was walking"], correctAnswer: 1, explanation: "بعد As نستخدم الماضي المستمر." },
      { id: 40022, text: "صحح الفعل: When I (meet) her, Muna was wearing...", options: ["met", "was meeting", "meets", "meet"], correctAnswer: 0, explanation: "بعد When نستخدم الماضي البسيط." }
    ]
  },
  {
    id: 12,
    title: "أمثلة وزارية عن أدوات الربط",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "أمثلة وزارية عن أدوات الربط", variant: 'purple' },
      { type: 'text', content: "1 | As she (carry) the shopping, my grandmother slipped and broke her ankle. (2020)", variant: 'blue' },
      { type: 'text', content: "2 | Khalid was playing football when he (break) his ankle. (2020)(2018/ت)", variant: 'blue' },
      { type: 'text', content: "3 | A thief took our clothes while we (swim). (2020)(2014/1)(2017/ت)", variant: 'blue' },
      { type: 'text', content: "4 | My sister hid my purse under bed while I (not look). (2020)", variant: 'blue' },
      { type: 'text', content: "5 | She (walked/ was walking) home from school when she heard the police siren. (2014/3)", variant: 'blue' },
      { type: 'text', content: "6 | She (tell) us to be quite as we (make) too much noise. (2015/1)(2018/2)", variant: 'blue' },
      { type: 'text', content: "7 | We were speeding when we (see) the police car. (2021/ت)", variant: 'blue' },
      { type: 'text', content: "8 | I (clean) my room and I (find) $30 under bed. (2014/3)(2017/ت)", variant: 'blue' },
      { type: 'text', content: "9 | She (tell) us to be quiet as we (make) too much noise. (2015/1)(2024/1)", variant: 'blue' },
      { type: 'text', content: "10 | luckily, Sharifa didn't drive very fast. The child ran into the road. (Join use \"when\") (2016/1)", variant: 'blue' },
      { type: 'text', content: "11 | My phone rang while we (watch) the film. (2016/3)", variant: 'blue' },
      { type: 'text', content: "12 | While Salam was driving too fast, a boy (run) on the road. (2016/2)", variant: 'blue' },
      { type: 'text', content: "13 | While Ali was having a shower, someone (knock) at the front door. (2017/3)", variant: 'blue' },
      { type: 'text', content: "14 | He (fall) over as he (come) down the stairs. (2017/ت)", variant: 'blue' },
      { type: 'text', content: "15 | They (camp) in the dessert when they saw a large snake. (2019/1)", variant: 'blue' },
      { type: 'text', content: "16 | I was driving to hospital when my phone (ring). (2021/1)", variant: 'blue' },
      { type: 'text', content: "17 | A bee flew in the kitchen through the open window while I (make) a birthday cake. (2021/ت)", variant: 'blue' },
      { type: 'text', content: "18 | While I was eating breakfast, a bird (fly) into the kitchen. (2021/ت)", variant: 'blue' },
      { type: 'text', content: "19 | While my baggage (go) through the X-ray machine, I walked through the metal detector. (2015/2)", variant: 'blue' },
      { type: 'text', content: "20 | When I (meet) her at the airport, Muna (wear) a long blue dress.", variant: 'blue' }
    ],
    solutions: [
      "1-was carrying, 2-broke, 3-were swimming, 4-wasn't looking, 5-was walking, 6-told, were making, 7-saw, 8-was cleaning, found, 9-told, were making, 10-Sharifa wasn't driving fast when the child ran into the road, 11-were watching, 12-ran, 13-knocked, 14-fell, was coming, 15-were camping, 16-rang, 17-was making, 18-flew, 19-was going, 20-met, was wearing"
    ],
    questions: [
      { id: 41023, text: "صحح الفعل: A thief took our clothes while we (swim).", options: ["swam", "were swimming", "was swimming", "swimming"], correctAnswer: 1, explanation: "بعد while نستخدم الماضي المستمر، والفاعل we يأخذ were swimming." },
      { id: 42024, text: "صحح الفعل: My phone rang while we (watch) the film.", options: ["watched", "were watching", "was watching", "watch"], correctAnswer: 1, explanation: "بعد while نستخدم الماضي المستمر." }
    ]
  },
  {
    id: 13,
    title: "الصفات التي تنتهي بـ ing أو ed",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "الصفات التي تنتهي بـ ing أو ed", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "النمط القواعدي Q2/B Choose", description: "• نختار الصفة التي تنتهي بـ (ed) للتعبير عن الشعور بالصفة (للعاقل فقط)\n• نختار الصفة التي تنتهي بـ (ing) لوصف الأشياء أو الأشخاص (لغير العاقل او للعاقل)" },
      { type: 'rule', icon: 'bulb', title: "ملاحظات تنفعكم اذا ما عرفتوا تترجمون المثال:", description: "1 | ببساطة اذا وجد اسم عاقل (I you we they she he) او ضمير عاقل (everybody, children, the man) و بعدها احد هذه الافعال المساعدة (is, am, are, was, were) نختار الصفة التي تنتهي بـ ed\n2 | اذا اجت أدوات النكرة (a, an) قبل الاختيارات نختار الصفة التي تنتهي بـ ing لان راح توصف الاسم الموجود بعد الاقواس حتى لو انطبق شرط العاقل نختار ing دام وجدت أدوات التنكير (a, an) قبل الاختيارات" },
      {
        type: 'table',
        rows: [
          { source: "Interested", arabic: "مهتم", past: "interesting", pastParticiple: "ممتع" },
          { source: "Bored", arabic: "يشعر بالملل", past: "boring", pastParticiple: "ممل" },
          { source: "Tired", arabic: "تعبان", past: "tiring", pastParticiple: "متعب" },
          { source: "Surprised", arabic: "مندهش", past: "surprising", pastParticiple: "مفاجئ" },
          { source: "excited", arabic: "متحمس", past: "exciting", pastParticiple: "مثير" },
          { source: "frightened", arabic: "خائف", past: "frightening", pastParticiple: "مخيف" },
          { source: "annoyed", arabic: "منزعج", past: "annoying", pastParticiple: "مزعج" },
          { source: "worried", arabic: "قلق", past: "worrying", pastParticiple: "مقلق" }
        ]
      },
      { type: 'text', content: "P.8 A.B E - underline the correct word.", variant: 'warning' },
      { type: 'text', content: "1 | She is not very (interested/ interesting) in fashion. she prefers books and music.", variant: 'blue' },
      { type: 'text', content: "2 | I saw a very (excited/ exciting) film on TV last night.", variant: 'blue' },
      { type: 'text', content: "3 | This book is very (bored/boring) I fell asleep whenever I try to read it.", variant: 'blue' },
      { type: 'text', content: "4 | We were very (frightened/ frightening) when our car broke down in the desert.", variant: 'blue' },
      { type: 'text', content: "5 | He is a very (interested/ interesting) person. He has a lot of great stories to tell.", variant: 'blue' }
    ],
    solutions: [
      "1-interested, 2-exciting, 3-boring, 4-frightened, 5-interesting"
    ],
    questions: [
      { id: 43025, text: "متى نستخدم الصفة المنتهية بـ ed؟", options: ["لوصف مسبب الشعور", "للتعبير عن الشعور بالصفة", "لوصف الأشياء فقط", "لوصف المستقبل"], correctAnswer: 1, explanation: "نستخدم ed للتعبير عن شعور الشخص بالصفة." },
      { id: 44026, text: "اختر الإجابة: I saw a very (excited/ exciting) film.", options: ["excited", "exciting"], correctAnswer: 1, explanation: "نصف الفيلم (مسبب الشعور) فنستخدم ing." }
    ]
  },
  {
    id: 14,
    title: "أمثلة وزارية و الصفات والظروف",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "امثلة وزارية غير موجودة بتمارين الكتاب", variant: 'purple' },
      { type: 'text', content: "1 | (interesting / interested) books usually have pictures. (2017/2)", variant: 'blue' },
      { type: 'text', content: "2 | Everybody was (surprised / surprising) that he passed the exam. (2023/احيائي)", variant: 'blue' },
      { type: 'text', content: "3 | My flight رحلتي was (tiring / tired) because it was a twelve - hours flight. (2016/3)", variant: 'blue' },
      { type: 'text', content: "4 | What's the most (excited / exciting) thing, you have ever done? (2016/2)", variant: 'blue' },
      { type: 'text', content: "5 | I've got some very (excited / exciting) news for you. (2016/2)", variant: 'blue' },
      { type: 'text', content: "6 | It was the most (frightened / frightening) day of my life. (2014/1)(2019)", variant: 'blue' },
      { type: 'text', content: "7 | He's a very (interested / interesting) man. He's travelled all around the world. (2021/1)", variant: 'blue' },
      { type: 'text', content: "8 | The lecture المحاضرة was (boring / bored) that I almost fell asleep. (2021/احيائي)", variant: 'blue' },
      { type: 'text', content: "9 | She was very (annoyed / annoying) with him for not telling her the truth. (2021/تطبيقي)", variant: 'blue' },
      { type: 'text', content: "10 | He was (frightened / frightening) when he saw the spider. (2017/1)", variant: 'blue' },
      { type: 'text', content: "11 | I'm (interested / interesting) in joining the club. (2023/ادبي/1)", variant: 'blue' },
      { type: 'text', content: "12 | Have you seen the film? It's really (frightened / frightening). (2021/1)", variant: 'blue' },
      { type: 'text', content: "13 | The children were very (frightened / frightening) when our car broke down in the desert. (2015/2)(2018/خ)(2022/احيائي)(2020/2)", variant: 'blue' },
      { type: 'text', content: "الصفات Adjectives-ful و الظروف Adverbs-fully", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "النمط القواعدي Q2/B Choose", description: "• نستخدم الصفات (ful) لوصف الاسماء و نستخدم الظروف (fully) لوصف الافعال" },
      {
        type: 'table',
        rows: [
          { source: "Beautiful", arabic: "جميل", past: "beautifully", pastParticiple: "بجمال" },
          { source: "Peaceful", arabic: "مسالم", past: "peacefully", pastParticiple: "بسلام" },
          { source: "Wonderful", arabic: "رائع", past: "wonderfully", pastParticiple: "بروعة" },
          { source: "Respectful", arabic: "محترم", past: "respectfully", pastParticiple: "باحترام" },
          { source: "careful", arabic: "حذر", past: "carefully", pastParticiple: "بحذر" },
          { source: "successful", arabic: "مجهد", past: "successfully", pastParticiple: "بجهد" },
          { source: "skillful", arabic: "ماهر", past: "skillfully", pastParticiple: "بمهارة" },
          { source: "painful", arabic: "مؤلم", past: "painfully", pastParticiple: "بألم" }
        ]
      }
    ],
    solutions: [
      "حلول الوزاريات: 1-interesting, 2-Surprised, 3-Tiring, 4-Exciting, 5-Exciting, 6-Frightening, 7-Interesting, 8-Boring, 9-Annoyed, 10-Frightened, 11-Interested, 12-Frightening, 13-Frightened"
    ],
    questions: [
      { id: 45027, text: "اختر الإجابة: Everybody was (surprised / surprising) that he passed.", options: ["surprised", "surprising"], correctAnswer: 0, explanation: "نصف شعور الناس (عاقل) فنستخدم ed." },
      { id: 46028, text: "متى نستخدم الظرف المنتهي بـ fully؟", options: ["لوصف الاسم", "لوصف الفعل", "لوصف الزمن", "لوصف المكان"], correctAnswer: 1, explanation: "نستخدم fully لوصف كيفية حدوث الفعل." }
    ]
  },
  {
    id: 15,
    title: "ملاحظات الموضوع ful و fully",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "ملاحظات الموضوع", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "متى نختار fully؟", description: "• اذا وجد فعل رئيسي قبل الاختيارات او مباشرة نختار الظرف (fully)\n• اذا لم يأتي الفعل الرئيسي لا قبل الاختيارات و لا بعد الاختيارات نختار الصفة (ful)\n• ابطالي الأفعال الرئيسية تعرف بكونها (مجردة، ماضية، تحوي ing، تصاريف ثالثة، تحوي s الشخص الثالث)\n• اهم أفعال المنهج: write, paint, live, drive, lift, float, direct" },
      { type: 'text', content: "1 | We hope that we can live (peaceful / peacefully) together. (2016/ت)", variant: 'blue' },
      { type: 'text', content: "2 | The story was (beautiful / beautifully) written. (2017/ت)(2020/نط)(2021/ت)(2023/ت)", variant: 'blue' },
      { type: 'text', content: "3 | The story was (beautiful / beautifully).", variant: 'blue' },
      { type: 'text', content: "4 | He drives his car (careful / carefully) (2017/3)", variant: 'blue' },
      { type: 'text', content: "5 | Sara (careful / carefully) lifted the box. (2018/1)", variant: 'blue' },
      { type: 'text', content: "6 | We all dream of living (peaceful / peacefully) together. (2016/2)", variant: 'blue' },
      { type: 'text', content: "7 | The film is (wonderful / wonderfully) directed. (2016/خ)", variant: 'blue' },
      { type: 'text', content: "8 | The picture was (beautiful / beautifully) painted. (2020/احيائي/1)", variant: 'blue' },
      { type: 'text', content: "9 | Tariq was floating (peaceful / peacefully). (2024/ادبي/1)", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "تنبيه هام جداً", description: "ديروا بالكم من الصفة (good) تتحول الى (well) بالظرف و تجيكم بفرع الاملاء Q3/C Spelling\ne.g. Careful, carefully; good, well" },
      { type: 'text', content: "P.9 A.B F - Choose the correct word to complete the sentences", variant: 'purple' },
      { type: 'text', content: "Example: Marwa sings (beautiful / beautifully). مروة تغني بروعة", variant: 'blue' },
      { type: 'text', content: "1 | This is a very (peaceful / peacefully) area of town. انها منطقة مسالمة من المدينة", variant: 'blue' },
      { type: 'text', content: "2 | You should always speak (respectful / respectfully) to older people. يجب ان تتكلم باحترام مع الأكبر منك", variant: 'blue' },
      { type: 'text', content: "3 | Be (careful / carefully) when you cycle on the road. كن حذر عند ركوب الدراجة الهوائية", variant: 'blue' },
      { type: 'text', content: "4 | After many tries, we managed to do the experiment (successful / successfully) بعد محاولات عدة، تمكنا من القيام من التجربة بنجاح", variant: 'blue' }
    ],
    solutions: [
      "حلول الوزاريات: 1-peacefully, 2-beautifully, 3-beautiful, 4-carefully, 5-carefully, 6-peacefully, 7-wonderfully, 8-beautifully, 9-peacefully",
      "حلول التمرين P.9: 1-peaceful, 2-respectfully, 3-careful, 4-successfully"
    ],
    questions: [
      { id: 47029, text: "ما هو ظرف الصفة (good)؟", options: ["goodly", "well", "gooded", "better"], correctAnswer: 1, explanation: "الصفة good هي صفة شاذة وظرفها هو well." },
      { id: 48030, text: "اختر الإجابة: The story was (beautiful / beautifully) written.", options: ["beautiful", "beautifully"], correctAnswer: 1, explanation: "بما أن هناك فعل (written) فنحن نصف كيفية الكتابة باستخدام الظرف beautifully." }
    ]
  },
  {
    id: 16,
    title: "مراجعة الصفات والظروف وحقائق التدخين",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.23 A.B G - Choose the correct option to complete the sentences.", variant: 'purple' },
      { type: 'text', content: "هذا التمرين مراجعة للصفات ed/ing و الصفات ful و الظروف fully", variant: 'warning' },
      { type: 'text', content: "1 | My dad wasn't very (interested / interesting) in the film and fell asleep on the sofa. والدي لم يكن مهتم بالفيلم و سقط نائما على الاريكة", variant: 'blue' },
      { type: 'text', content: "2 | Please lift that vase very (careful / carefully). It was my great-grandmother's. رجاء ضع هذه المزهرية بحذر، لقد كانت لجدتي", variant: 'blue' },
      { type: 'text', content: "3 | Why is Zaid always interrupting me? He's so (annoyed / annoying)! (لماذا يقاطعني زيد دائماً؟ انه مزعج جداً! لاحظوا ابطالي هنا المثال ينحل على الترجمة ما تفيد الملاحظة)", variant: 'blue' },
      { type: 'text', content: "4 | Hamed is such a (helpful / helpfully) boy. He's always doing jobs around the house. حامد فتى خدوم. هو دائما يقوم بالأعمال في البيت.", variant: 'blue' },
      { type: 'text', content: "5 | This is a bit (embarrassed / embarrassing), but I'm afraid I forgot my books! هذا نوعا ما محرج، لكني اخشى بأنني نسيت كتبي!", variant: 'blue' },
      { type: 'text', content: "P.9 S.B G - most smokers take it up as teenagers معظم المدخنين يبدؤون بها عندما كانوا مراهقين", variant: 'purple' },
      { type: 'text', content: "مقالة ليست للحفظ لكن نعرف منها معاني ممكن تجيكم بالاسقاطات Q3/A:", variant: 'warning' },
      { type: 'text', content: "1 | Most smokers take up يبدؤون smoking as teenagers كمراهقين", variant: 'blue' },
      { type: 'text', content: "2 | Most people start smoking يبدؤون التدخين when they are teenagers.", variant: 'blue' },
      { type: 'text', content: "3 | Every day at the United Kingdom المملكة المتحدة approximately 450 تقريبا young people start smoking", variant: 'blue' },
      { type: 'text', content: "4 | Its illegal غير قانوني to sell cigarettes بيع السكائر to children under the age of 18.", variant: 'blue' },
      { type: 'text', content: "5 | In Britain, smoking is highest in 20-24 age group. مجموعة عمرية", variant: 'blue' },
      { type: 'text', content: "6 | The British government الحكومة البريطانية spends 30 million pounds a year on the anti-smoking حملات توعية ضد التدخين education campaigns.", variant: 'blue' },
      { type: 'text', content: "7 | Every year, around 114,000 smokers in the United Kingdom die from their habit يموتون من عادتهم.", variant: 'blue' },
      { type: 'text', content: "8 | Many smokers take up the habit يبدؤون العادة when they are teenagers.", variant: 'blue' },
      { type: 'text', content: "9 | More people in Britain die from smoking than from road accidents حوادث الطريق poisoning التسمم and AIDS الايدز.", variant: 'blue' }
    ],
    solutions: [
      "حلول التمرين G: 1-interested, 2-carefully, 3-annoying, 4-helpful, 5-embarrassing"
    ],
    questions: [
      { id: 49031, text: "لماذا اخترنا annoying في الجملة الثالثة؟", options: ["لأن الفاعل عاقل", "لأننا نصف مسبب الإزعاج (زيد)", "لأنها تأتي بعد الفعل", "لأنها صفة شعور"], correctAnswer: 1, explanation: "في هذه الجملة نصف زيد بأنه هو مسبب الإزعاج، لذا نستخدم ing." },
      { id: 50032, text: "ما هو العمر القانوني لبيع السجائر في بريطانيا؟", options: ["16", "18", "21", "25"], correctAnswer: 1, explanation: "من غير القانوني بيع السجائر للأطفال تحت سن 18." }
    ]
  },
  {
    id: 17,
    title: "الأفعال المركبة phrasal verbs",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "نمطها الوزاري Q2/A put in the correct order ترتيب او Q2/B Choose اختيارات", variant: 'warning' },
      { type: 'text', content: "ملاحظات الموضوع و خطوات الحل و الترتيب", variant: 'purple' },
      { type: 'text', content: "• تتكون الافعال المركبة من فعل رئيسي وحرف جر", variant: 'blue' },
      {
        type: 'table',
        rows: [
          { source: "turn", arabic: "turned", past: "gave", pastParticiple: "give" },
          { source: "took", arabic: "take", past: "tried", pastParticiple: "try" },
          { source: "threw", arabic: "throw", past: "find", pastParticiple: "found" },
          { source: "pick", arabic: "picked", past: "carry", pastParticiple: "carried" }
        ]
      },
      { type: 'text', content: "حر جر مثل: up, down, in, on, away, out, off, after", variant: 'warning' },
      { type: 'text', content: "النمط الوزاري يعطيكم فعل مركب ومفعول به ويطلب منك ترتيب (correct المفعول به اما يجيكم اسم او يجيكم ضمير", variant: 'blue' },
      { type: 'text', content: "مفعول اسم مثل: TV, television, music, stamp-collecting, shoes, trousers", variant: 'blue' },
      { type: 'text', content: "مفعول به ضمير مثل: it, them, him, her, us, you, me", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "طريقة الترتيب", description: "الفعل يكون دائما اول شيء إذا كان المفعول به اسم نكدر نخليه قبل حرف الجر (بالنص) او بعد حرف الجر (بالأخير).\nاما اذا كان المفعول به ضمير لازم فقط قبل حرف الجر (بالنص)." },
      { type: 'text', content: "• فعل + مفعول به اسم + حرف جر -> e.g. Gave smoking up", variant: 'blue' },
      { type: 'text', content: "• فعل + حرف جر + مفعول به اسم -> e.g. Gave up smoking", variant: 'blue' },
      { type: 'text', content: "• فعل + مفعول به ضمير + حرف جر -> e.g. Gave it up", variant: 'purple' },
      { type: 'text', content: "اخواني و اخواتي بالوزاري يريد منكم حل واحد لذلك خل نعتمد اني وياكم مبدأ (أي شي يجي اخليه بالوسط اسم او ضمير)", variant: 'warning' },
      { type: 'text', content: "• فعل + مفعول به اسم او ضمير + حرف جر -> e.g. gave (it/ smoking) up", variant: 'blue' },
      { type: 'text', content: "P.11 A.B B - write the sentences putting the verbs and objects in the correct order. Where two answers are possible, write them both.", variant: 'purple' },
      { type: 'text', content: "1 | Can you/ turn on/ the television?", variant: 'blue' },
      { type: 'text', content: "2 | I've already / turned on/ it.", variant: 'blue' },
      { type: 'text', content: "3 | Smoking is terrible. you should/ give up/it.", variant: 'blue' },
      { type: 'text', content: "4 | When did you / take up/ stamp-collection?", variant: 'blue' },
      { type: 'text', content: "5 | I can't remember when I / took up/ it.", variant: 'blue' },
      { type: 'text', content: "6 | I like these shoes. can I / try on / them?", variant: 'blue' },
      { type: 'text', content: "7 | Can you / turn down/ the music?", variant: 'blue' },
      { type: 'text', content: "8 | i'll/ turn down/ it/ in a minute.", variant: 'blue' }
    ],
    solutions: [],
    questions: [
      { id: 51033, text: "أين نضع المفعول به إذا كان ضميراً (مثل it)؟", options: ["قبل حرف الجر فقط", "بعد حرف الجر فقط", "قبل أو بعد حرف الجر", "في بداية الجملة"], correctAnswer: 0, explanation: "إذا كان المفعول به ضميراً، يجب وضعه بين الفعل وحرف الجر." },
      { id: 52034, text: "رتب الجملة: (turn on / it)", options: ["turn on it", "turn it on", "it turn on", "on it turn"], correctAnswer: 1, explanation: "الترتيب الصحيح هو فعل + مفعول به ضمير + حرف جر." }
    ]
  },
  {
    id: 18,
    title: "تمارين الأفعال المركبة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "حلول تمرين P.11 A.B B:", variant: 'purple' },
      { type: 'text', content: "1 | Turn on the television / turn the television on", variant: 'blue' },
      { type: 'text', content: "2 | turned it on", variant: 'blue' },
      { type: 'text', content: "3 | give it up", variant: 'blue' },
      { type: 'text', content: "4 | take up stamp-collecting / take stamp-collecting up", variant: 'blue' },
      { type: 'text', content: "5 | took it up", variant: 'blue' },
      { type: 'text', content: "6 | try them on", variant: 'blue' },
      { type: 'text', content: "7 | turn down the music / turn the music down", variant: 'blue' },
      { type: 'text', content: "8 | turn it down", variant: 'blue' },
      { type: 'text', content: "P.22 A.B A - Complete the sentences with the correct phrasal verbs. Choose one word from each box.", variant: 'purple' },
      { type: 'text', content: "[carry find give look pick turn] [after off on out up (x2)]", variant: 'warning' },
      { type: 'text', content: "Give up استسلم , pick up توصلي - تقلني , look after اعتني\ncarry on تواصل , turn off تطفئ , find out اكتشف", variant: 'blue' },
      { type: 'text', content: "1 | This puzzle is too difficult! I think I'm just going to give up. هذه الاحجية صعبة جدا، اعتقد بأنني سأستسلم", variant: 'blue' },
      { type: 'text', content: "2 | Dad, can you pick me up from football practice today? بابا، هل يمكنك ان تقلني من تدريب كرة القدم اليوم؟", variant: 'blue' },
      { type: 'text', content: "3 | I need you to look after your little sister for a couple of hours tonight. OK? احتاج منك ان تعتني بأختك الصغيرة لكم ساعة اليوم. اوكي؟", variant: 'blue' },
      { type: 'text', content: "4 | Halfway through the race, Aysha was already really tired, but she decided to carry on running. في منتصف طريق السباق، عيشه كانت متعبة جدا، لكن قررت ان تواصل الركض", variant: 'blue' },
      { type: 'text', content: "5 | Can you turn off the TV, please? I'm trying to study! هل يمكن ان تطفئ التلفاز، رجاء؟ أحاول ان ادرس", variant: 'blue' },
      { type: 'text', content: "6 | I don't know what happened, but I'm going to find out. لا اعرف ماذا حصل، لكن سوف اكتشف", variant: 'blue' },
      { type: 'text', content: "فكرة وزارية لطيفة:", variant: 'warning' },
      { type: 'text', content: "e.g. Stamp-collecting is a nice hobby, when did you (it/ up/ take) (2014)(2017/ت)", variant: 'blue' },
      { type: 'text', content: "نمط الاختيارات:", variant: 'purple' },
      { type: 'text', content: "1 | I like these shoes. Can I (try on them / try them on)? (2016/ت)", variant: 'blue' },
      { type: 'text', content: "2 | Can you (turn it down / turn down it)? (2016/3)", variant: 'blue' },
      { type: 'text', content: "3 | I can't remember when ( I took up it / took it up) (2021/ت)", variant: 'blue' },
      { type: 'text', content: "4 | I'll (turn down it / turn it down) in a minute. (2021/اد)", variant: 'blue' },
      { type: 'text', content: "5 | I need a calculator. I can't (work out it / work it out) in my head. (2023/احيائي/1)", variant: 'blue' }
    ],
    solutions: [
      "حل الفكرة الوزارية: take it up",
      "حلول الاختيارات: 1-try them on, 2-turn it down, 3-took it up, 4-turn it down, 5-work it out"
    ],
    questions: [
      { id: 53035, text: "ما معنى الفعل المركب (Give up)؟", options: ["يستمر", "يستسلم", "يعتني", "يجد"], correctAnswer: 1, explanation: "Give up تعني يستسلم أو يترك عادة ما." },
      { id: 54036, text: "اختر الترتيب الصحيح: I can't (work out it / work it out).", options: ["work out it", "work it out"], correctAnswer: 1, explanation: "المفعول به it ضمير فيجب أن يأتي قبل حرف الجر out." }
    ]
  },
  {
    id: 19,
    title: "البادئات النافية the prefixes meaning not",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "عبارة عن مقاطع يتم وضعها قبل الصفة لنفيها (un, in, ir, il, im) من ثوابت الاملاء Q3/C Spelling راح انطيكم الملاحظات و صفات المنهج و انتوا تحلون ويايه", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "1 | الصفات التي تبدأ بـ (M/P) تعكس بإضافة im", description: "Moral → immoral | possible → impossible\npatient → impatient | pure → impure\npolite → impolite | movable → immovable" },
      { type: 'rule', icon: 'bulb', title: "عدا هذه الصفات تعكس بإضافة un", description: "popular → unpopular | pleasant → unpleasant | paved → unpaved" },
      { type: 'rule', icon: 'sparkle', title: "2 | الصفات التي تبدأ بـ (L) تعكس بإضافة il", description: "legal → illegal | literate → illiterate" },
      { type: 'rule', icon: 'bulb', title: "عدا صفة luckily تعكس بإضافة un", description: "luckily → unluckily" },
      { type: 'rule', icon: 'sparkle', title: "3 | الصفات التي تبدأ بـ (R) تعكس بإضافة ir", description: "responsible → irresponsible | regular → irregular" },
      { type: 'rule', icon: 'sparkle', title: "4 | الصفات التي تبدأ بـ (A C E D) تعكس بإضافة in", description: "correct → incorrect | convenient → inconvenient | efficient → inefficient\nexpensive → inexpensive | accurate → inaccurate | complete → incomplete\nadvisable → inadvisable | direct → indirect | dependent → independent" },
      { type: 'rule', icon: 'bulb', title: "عدا الصفات الآتية:", description: "Formal → informal | conscious → unconscious | able → unable | countable → uncountable" },
      { type: 'rule', icon: 'sparkle', title: "باقي الصفات (كل الاحرف الأخرى) تعكس بإضافة un", description: "Happy → unhappy | fortunate → unfortunate | intelligent → unintelligent\nfair → unfair | healthy → unhealthy | usual → unusual | kind → unkind" },
      { type: 'text', content: "P.23 A.B F - Complete the words with the correct prefix: il-, im-, un- or in-.", variant: 'purple' },
      { type: 'text', content: "هذا التمرين هو إضافة لموضوع البادئات النافية", variant: 'warning' },
      { type: 'text', content: "1 | Go and say hello. Don't be ________ polite. (impolite)", variant: 'blue' },
      { type: 'text', content: "2 | This exercise isn't ________ possible, but it's very hard. (impossible)", variant: 'blue' },
      { type: 'text', content: "3 | It's not ________ usual to see birds like that around here. (unusual)", variant: 'blue' },
      { type: 'text', content: "4 | I'm afraid your answer is ________ correct. Try again. (incorrect)", variant: 'blue' },
      { type: 'text', content: "5 | It's ________ legal to sell cigarettes to teenagers. (illegal)", variant: 'blue' }
    ],
    solutions: [],
    questions: [
      { id: 55037, text: "ما هي البادئة المستخدمة لنفي كلمة (Regular)؟", options: ["un-", "in-", "ir-", "im-"], correctAnswer: 2, explanation: "الكلمات التي تبدأ بحرف R تأخذ البادئة ir." },
      { id: 56038, text: "ما هو نفي كلمة (Popular)؟", options: ["impopular", "unpopular", "inpopular", "ilpopular"], correctAnswer: 1, explanation: "Popular هي حالة شاذة تأخذ un رغم أنها تبدأ بـ P." }
    ]
  },
  {
    id: 20,
    title: "نصائح الصحة والبادئات",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.24 A.B B - Use prefixes to complete the sentences with the opposite of the words in brackets.", variant: 'purple' },
      { type: 'text', content: "1 | Our next English test is on (regular) ________ verbs. Irregular.", variant: 'blue' },
      { type: 'text', content: "2 | You've finished tidying your room already? That's (possible) ________ impossible", variant: 'blue' },
      { type: 'text', content: "3 | It's (legal) ________ to use your phone while driving. Illegal", variant: 'blue' },
      { type: 'text', content: "4 | I think people who don't take care of their health are (responsible) ________ irresponsible", variant: 'blue' },
      { type: 'text', content: "5 | I need to get back to the gym. I'm feeling very (fit) ________ unfit", variant: 'blue' },
      { type: 'text', content: "6 | I can't believe Talal has hidden my phone again. He's so (mature) ________ immature", variant: 'blue' },
      { type: 'text', content: "P.10 S.B For Keeping Healthy", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "النصائح الـ 10 نمطها الوزاري الثابت Q2/A Use an imperative to give advice", description: "الكلام المكتوب بالاسود ثابت و يجي كما هو بالضبط الطالب لازم يحفظ الكلام المكتوب بالاحمر فقط على الغيب و ممكن تجي منه اسقاطات لبعض المفردات صيغته الوزارية الثابتة:" },
      { type: 'text', content: "1 | Get enough sleep نم كفاية an average of eight hours a night is about right", variant: 'blue' },
      { type: 'text', content: "2 | Eat a balanced diet كل غذاء متزن make sure you eat a plenty of fresh fruit and vegetables. avoid تجنب excessive amounts كميات of salt, sugar and animal fat.", variant: 'blue' },
      { type: 'text', content: "3 | Never miss breakfast لا تفوت الافطار it's the most important meal وجبة اهم of the day", variant: 'blue' },
      { type: 'text', content: "4 | Take some exercise every day قم ببعض التمرين كل يوم ideally do sports ثلاث مرات three times a week for an hour if you hate تكره sports, go for a 20 minute walk every day", variant: 'blue' },
      { type: 'text', content: "5 | Drink plenty of water اشرب وفرة من الماء at least a liter لتر and a half نص every day tea coffee, and soft drinks are NOT water", variant: 'blue' },
      { type: 'text', content: "6 | See the dentist for a regular checkups اذهب لطبيب الاسنان للفحوصات and brush اغسل your teeth اسنانك three times a day", variant: 'blue' },
      { type: 'text', content: "7 | Don't drink a too much coffee لا تشرب كثيرا قهوة tea is better افضل for heart قلبك and can even lower your blood pressure يخفض ضغط دمك", variant: 'blue' },
      { type: 'text', content: "8 | Don't smoke لا تدخن if you do ask a doctor for help with giving it up يساعدك بتركها", variant: 'blue' }
    ],
    solutions: [],
    questions: [
      { id: 57039, text: "ما هي النصيحة المناسبة لـ (eight hours a night)؟", options: ["Eat a balanced diet", "Get enough sleep", "Never miss breakfast", "Don't smoke"], correctAnswer: 1, explanation: "النصيحة الخاصة بثمان ساعات نوم هي Get enough sleep." },
      { id: 58040, text: "ما هو نفي كلمة (Mature)؟", options: ["unmature", "inmature", "immature", "irmature"], correctAnswer: 2, explanation: "الكلمات التي تبدأ بـ M تأخذ im." }
    ]
  },
  {
    id: 21,
    title: "تعبيرات الكمية Quantity",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "9 | Look after your eyes اعتن بعيونك get them tested once year افحصها مرة بالسنة", variant: 'blue' },
      { type: 'text', content: "10 | Be safe when you travel كن امنا عند السفر make sure you are up to date with vacations لقاحات and take malaria medication علاج الملاريا if necessary", variant: 'blue' },
      { type: 'text', content: "P.12 A.B Expressions of quantity التعبيرات عن الكمية المعدود و غير المعدود", variant: 'purple' },
      { type: 'text', content: "النمط الوزاري اختيارات فقط Q2/B Choose", variant: 'warning' },
      { type: 'text', content: "يوجد مجموعة عبارات مع الكميات المعدودة و غير المعدودة (مو مهمات) و بعض العبارات مع المعدود فقط و غير المعدود فقط (مهمات جدا)", variant: 'blue' },
      { type: 'text', content: "كمية كافية enough , وفرة من plenty of , كثير من a lot of , اي any , بعض Some", variant: 'purple' },
      { type: 'text', content: "جميع هذه العبارات تأتي مع الاسماء المعدودة وغير المعدودة.", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "الأدوات التي تستعمل مع المعدود فقط:", description: "كثير many , قليل a few : نختارهم اذا بعدهم اسم جمع (ينعرف بكونه ينتهي ب S الجمع) عدا الجمع الشاذ:\n(people ناس , children اطفال , oases بركات مياه , feet اقدام , teeth اسنان , oxen ثيران , men رجال , women نساء)" },
      { type: 'rule', icon: 'bulb', title: "الأدوات التي تستعمل مع غير المعدود فقط او الكميات:", description: "كثير much , قليل a little : نختارهم اذا بعدهم أسماء كميات (سهلة أي اسم ما ينتهي ب S الجمع) مثلا:\nsugar سكر , coffee قهوة , milk حليب , orange juice عصير , time وقت , exercise تمرين , sleep نوم , food طعام , money مال , fruit فاكهه , oil زيت , butter زبدة" },
      { type: 'text', content: "ابطالي قبل لا بالتمارين حل خلوا ببالكم هل كم شغلة:", variant: 'warning' },
      { type: 'text', content: "1 | تجيكم اختيارات بين (many / much) او (a few / a little)", variant: 'blue' },
      { type: 'text', content: "2 | قبل (few / little) لازم تجي (a)", variant: 'blue' },
      { type: 'text', content: "3 | لا تعتمدون على كلمة (more) بعد الاختيارات لان تجي مع الكميات غير المعدودة و الجمع اعتمدوا على الكلمة البعدها مثلا:\nQ/ I need a (little / few) more fruit.\nQ/ I need a (little / few) more oranges.", variant: 'blue' },
      { type: 'text', content: "4 | أداة الاستفهام (How) تجي فقط مع (many / much)", variant: 'blue' }
    ],
    solutions: [
      "حل المثال الأول: little (لأن fruit غير معدود)",
      "حل المثال الثاني: few (لأن oranges معدود)"
    ],
    questions: [
      { id: 59041, text: "أي من الكلمات التالية تعتبر جمعاً شاذاً (معدود)؟", options: ["Sugar", "People", "Milk", "Money"], correctAnswer: 1, explanation: "People هي جمع شاذ لكلمة person وتعتبر معدودة." },
      { id: 60042, text: "ماذا نستخدم مع كلمة (Time)؟", options: ["many", "much", "few", "a few"], correctAnswer: 1, explanation: "Time (وقت) غير معدود فنستخدم much." }
    ]
  },
  {
    id: 22,
    title: "تمارين تعبيرات الكمية",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "ابطالي راح اعطيكم ملاحظة جدا مهمة تفيدكم بهيج امثلة : (many / a few) اثنينهم مع المعدود او (much / a little) اثنينهم مع غير المعدود : عندما يكون المثال منفي : (isn't, aren't, wasn't, weren't) يكون الاختيار : (many او much)", variant: 'warning' },
      { type: 'text', content: "P.12 A.B C - Complete the questions with much or many.", variant: 'purple' },
      { type: 'text', content: "1 | How ________ food do we need to bring on the picnic?", variant: 'blue' },
      { type: 'text', content: "2 | How ________ apples do we need?", variant: 'blue' },
      { type: 'text', content: "3 | How ________ meals do you eat a day?", variant: 'blue' },
      { type: 'text', content: "4 | How ________ sleep did you get last night?", variant: 'blue' },
      { type: 'text', content: "5 | How ________ exercise does he take a week?", variant: 'blue' },
      { type: 'text', content: "6 | How ________ hours' sleep did you get the night before?", variant: 'blue' },
      { type: 'text', content: "7 | How ________ time do you spend on your homework?", variant: 'blue' },
      { type: 'text', content: "8 | How ________ times a week do you wash your hair?", variant: 'blue' },
      { type: 'text', content: "P.13 A.B D - Complete the sentences with a few or a little.", variant: 'purple' },
      { type: 'text', content: "1 | There were only ________ people at the party.", variant: 'blue' },
      { type: 'text', content: "2 | I've got ________ Work to finish, so can you wait a minute?", variant: 'blue' },
      { type: 'text', content: "3 | You'll have to wait ________ minutes.", variant: 'blue' },
      { type: 'text', content: "4 | There's only ________ orange juice left in the bottle.", variant: 'blue' },
      { type: 'text', content: "5 | How much money have you got left? Just ________", variant: 'blue' },
      { type: 'text', content: "6 | I've met her ________ times.", variant: 'blue' },
      { type: 'text', content: "7 | Put your case in the car. There's still ________ space left.", variant: 'blue' },
      { type: 'text', content: "8 | We need ________ more oranges.", variant: 'blue' }
    ],
    solutions: [
      "حلول تمرين C: 1-much, 2-many, 3-many, 4-much, 5-much, 6-many, 7-much, 8-many",
      "حلول تمرين D: 1-a few, 2-a little, 3-a few, 4-a little, 5-a little, 6-a few, 7-a little, 8-a few"
    ],
    questions: [
      { id: 61043, text: "لماذا استخدمنا many مع (times) في السؤال الثامن؟", options: ["لأنها تعني وقت", "لأنها تنتهي بـ s الجمع (مرات)", "لأن الجملة منفية", "لأنها غير معدودة"], correctAnswer: 1, explanation: "كلمة times تعني مرات وهي معدودة، بينما time تعني وقت وهي غير معدودة." },
      { id: 62044, text: "ماذا نختار لـ (orange juice)؟", options: ["a few", "a little"], correctAnswer: 1, explanation: "العصير غير معدود فنستخدم a little." }
    ]
  },
  {
    id: 23,
    title: "تمارين الكمية والوزاريات",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.26 A.B F - Complete the sentences with much, many, few or little.", variant: 'purple' },
      { type: 'text', content: "1 | Hurry up. There isn't ________ time before the bus leaves.", variant: 'blue' },
      { type: 'text', content: "2 | Can you lend me a ________ money? I've left my purse at home.", variant: 'blue' },
      { type: 'text', content: "3 | How ________ times do I have to tell you my phones number?", variant: 'blue' },
      { type: 'text', content: "4 | We need a ________ more fruit to take on the picnic.", variant: 'blue' },
      { type: 'text', content: "5 | I don't think I can fit in that parking place. There isn't ________ space.", variant: 'blue' },
      { type: 'text', content: "6 | There weren't ________ people at the meeting. I think quite a ________ had left.", variant: 'blue' },
      { type: 'text', content: "امثلة وزارية غير موجودة بتمارين الكتاب:", variant: 'warning' },
      { type: 'text', content: "1 | There are (many / much) children in our neighborhood. (2023/ت)", variant: 'blue' },
      { type: 'text', content: "2 | we need a (few / little) butter for this cake. (2018/1)", variant: 'blue' },
      { type: 'text', content: "3 | Hurry up. There isn't ________ time before the bus leaving. (little/ much). (2021)(2024/1)(2015/ت)", variant: 'blue' },
      { type: 'text', content: "P.23 A.B E - Complete the table with the expressions of quantity from the box.", variant: 'purple' },
      { type: 'text', content: "a few , a little , a lot of , any , enough , plenty of", variant: 'warning' },
      {
        type: 'table',
        rows: [
          { source: "Only with countable nouns", arabic: "Only with uncountable nouns", past: "With both countable and uncountable nouns", pastParticiple: "" },
          { source: "Many", arabic: "Much", past: "Some", pastParticiple: "" },
          { source: "A few", arabic: "A little", past: "A lot of", pastParticiple: "" },
          { source: "________", arabic: "________", past: "Any", pastParticiple: "" },
          { source: "________", arabic: "________", past: "Enough", pastParticiple: "" },
          { source: "________", arabic: "________", past: "Plenty of", pastParticiple: "" }
        ]
      }
    ],
    solutions: [
      "حلول تمرين F: 1-much, 2-little, 3-many, 4-little, 5-much, 6-many / few",
      "حلول الوزاريات: 1-many, 2-little, 3-much"
    ],
    questions: [
      { id: 63045, text: "ماذا نستخدم مع كلمة (Space)؟", options: ["many", "much", "few", "a few"], correctAnswer: 1, explanation: "Space (مساحة) غير معدودة فنستخدم much." },
      { id: 64046, text: "أي من هذه الأدوات تستخدم مع المعدود وغير المعدود معاً؟", options: ["Many", "Much", "A few", "Any"], correctAnswer: 3, explanation: "Any تستخدم مع كلا النوعين." }
    ]
  },
  {
    id: 24,
    title: "قاعدة Used to",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.11 (S.B) Teachers used to be stricter المعلمون اعتادوا ان يكونوا اكثر صرامة", variant: 'purple' },
      { type: 'text', content: "P.14 (A.B) Used to اعتاد على", variant: 'warning' },
      { type: 'text', content: "• للتعبير عن شخص اعتاد ان يفعل شيء ما لكن الان او سابقا تغيرت هذه العادة نمطها الوزاري Q2/A Use \"used to\" / Q2/B Choose", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "بحالة الاثبات", description: "فاعل + used to + فعل مجرد\nيكون موقع الأداة مباشرة بعد الفاعل و الفعل بين الاقواس يبقى كما هو مجرد" },
      { type: 'text', content: "1 | Families used to be bigger. اعتادت العوائل ان تكون اكبر", variant: 'blue' },
      { type: 'text', content: "2 | Young people used to have less freedom. اعتاد الشباب ان يمتلكوا حرية اقل", variant: 'blue' },
      { type: 'text', content: "3 | The health service used to be better. اعتادت خدمة الصحة ان تكون افضل", variant: 'blue' },
      { type: 'text', content: "4 | There used to be more poverty. اعتاد ان يكون فقر اقل", variant: 'blue' },
      { type: 'text', content: "5 | People used to die younger. اعتاد الناس ان يموتوا اصغر", variant: 'blue' },
      { type: 'text', content: "6 | People used to get a better education. اعتاد الناس على ان يحصلوا على تعليم افضل", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "بحالة النفي (negative \"not\")", description: "فاعل + didn't use to + فعل مجرد\nنستخدم الأداة (didn't) بعد الفاعل و نكتب (use to) بدون (D)" },
      { type: 'text', content: "1 | There didn't use to be so much pollution in the cities. لم يعتد ان يكون الكثير من التلوث في المدن", variant: 'blue' },
      { type: 'text', content: "2 | Children didn't use to be so rude. لم يعتد الأطفال ان يكونوا وقحين كثيرا", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "بحالة السؤال (question \"?\")", description: "Did + فاعل + use to + فعل مجرد\nنقدم (Did) على الفاعل و هم نكتب (use to) بدون (D)" },
      { type: 'text', content: "1 | Did you use to be angry? هل اعتدت ان تكون غاضب؟", variant: 'blue' },
      { type: 'text', content: "2 | Did people use to travel a lot? هل اعتاد الناس ان يسافروا كثيرا؟", variant: 'blue' },
      { type: 'text', content: "3 | Where did they use to work? اين اعتادوا ان يعملوا؟", variant: 'blue' },
      { type: 'text', content: "4 | Did you use to fight with your brother or sister when you were little? هل اعتدت ان تتشاجر مع اخوك او اختك عندما كنت صغيرا", variant: 'blue' },
      { type: 'text', content: "5 | What did you use to fight about? على ماذا اعتدت ان تتشاجر؟", variant: 'blue' },
      { type: 'rule', icon: 'bulb', title: "تنبيه هام", description: "ابطالي تذكروا بوجود (Did, didn't) نكتب (use to) بلا (D)" }
    ],
    solutions: [],
    questions: [
      { id: 65047, text: "ما هو الشكل الصحيح لـ Used to في حالة النفي؟", options: ["didn't used to", "didn't use to", "not used to", "don't use to"], correctAnswer: 1, explanation: "عند النفي نستخدم didn't ونحذف حرف d من used." },
      { id: 66048, text: "أكمل الجملة: She ________ (have) short hair.", options: ["used to have", "use to have", "used to having", "is used to have"], correctAnswer: 0, explanation: "في حالة الإثبات نستخدم used to + فعل مجرد." }
    ]
  },
  {
    id: 25,
    title: "تمارين Used to",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.14 (A.B) A - Complete the conversation between Huda and her grandmother with the correct form of used to.", variant: 'purple' },
      { type: 'text', content: "1 | Which TV programs (you/watch) when you were little?", variant: 'blue' },
      { type: 'text', content: "2 | We (do) things.", variant: 'blue' },
      { type: 'text', content: "3 | We (not sit) around watching TV.", variant: 'blue' },
      { type: 'text', content: "4 | What (you/do)?", variant: 'blue' },
      { type: 'text', content: "5 | We (help) mother with housework and cooking.", variant: 'blue' },
      { type: 'text', content: "6 | How (you/have) fun?", variant: 'blue' },
      { type: 'text', content: "7 | We (play) the drums and sing and dance.", variant: 'blue' },
      { type: 'text', content: "8 | Families (have) real conversation.", variant: 'blue' },
      { type: 'text', content: "9 | (You/go out) with your friends?", variant: 'blue' },
      { type: 'text', content: "10 | We (go) shopping in the souqs.", variant: 'blue' },
      { type: 'text', content: "11 | Then we all (come) home for tea and cakes.", variant: 'blue' },
      { type: 'text', content: "12 | We (talk) about everything.", variant: 'blue' },
      { type: 'text', content: "13 | We (not walk) around talking on these silly mobile things.", variant: 'blue' },
      { type: 'text', content: "حلول تمرين A:", variant: 'warning' },
      { type: 'text', content: "1-did you use to watch, 2-we used to do, 3-we didn't use to sit, 4-did you use to do, 5-we used to help, 6-did you use to have, 7-we used to play, 8-families used to have, 9-did you use to go out, 10-we used to go, 11-used to come, 12-we used to talk, 13-We didn't use to walk.", variant: 'blue' },
      { type: 'text', content: "P.22 A.B C B - Rewrite the sentences with the correct form of used to while giving the same meaning.", variant: 'purple' },
      { type: 'text', content: "فكرة التمرين هو تكوين جمل عن used to استنادا على الجمل المكتوبة بحيث تطابق المعنى", variant: 'warning' },
      { type: 'text', content: "1 | Do you remember Manar? She was a student at our school. هل تتذكر منار؟ لقد كانت طالبة في مدرستنا.\nDo you remember Manar? She used to be study at our school.", variant: 'blue' },
      { type: 'text', content: "2 | I didn't talk much to Hazem before, but now we're good friends. لم أتكلم مع حازم كثيرا بالسابق، لكن الان نحن أصدقاء جيدين\nI didn't use to talk much to Hazem before, but now we're good friends.", variant: 'blue' },
      { type: 'text', content: "3 | There was a café here before, but now there's a shoe shop. كان هناك مقهى هنا بالسابق، لكن الان هو محل احذية.\nThis used to be a café, but now it's a shoe shop.", variant: 'blue' },
      { type: 'text', content: "4 | Was your hair this short last year? هل كان شعرك بهذا القصر السنة الفائتة؟\nDid your hair use to be this short last year?", variant: 'blue' },
      { type: 'text', content: "5 | I play this game a lot now, but I didn't before. انا العب هذه اللعبة كثيرا الان، لكن لم افعل بالسابق.\nI didn't use play this game a lot before, but now I do.", variant: 'blue' }
    ],
    solutions: [],
    questions: [
      { id: 67049, text: "حول الجملة للسؤال: (They / live in Baghdad)", options: ["Did they used to live in Baghdad?", "Did they use to live in Baghdad?", "They used to live in Baghdad?", "Do they use to live in Baghdad?"], correctAnswer: 1, explanation: "في السؤال نستخدم Did ونحذف d من used." },
      { id: 68050, text: "أكمل: We ________ (not have) computers.", options: ["didn't used to have", "didn't use to have", "not used to have", "don't used to have"], correctAnswer: 1, explanation: "النفي الصحيح هو didn't use to." }
    ]
  },
  {
    id: 26,
    title: "اختيارات Used to والصحة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "Q2/B Choose فكرة الاختيارات", variant: 'purple' },
      { type: 'text', content: "1 | Did you (used to/ use to) fight with your brothers when you were little? (2021/اد)", variant: 'blue' },
      { type: 'text', content: "2 | There didn't (used to/ use to) be many cars.", variant: 'blue' },
      { type: 'text', content: "3 | She didn't used to (cook / cooks) our meals.", variant: 'blue' },
      { type: 'text', content: "4 | There didn't use to (are/be) many accidents.", variant: 'blue' },
      { type: 'text', content: "حلول الاختيارات: 1-use to, 2-use to, 3-cook, 4-be", variant: 'warning' },
      { type: 'text', content: "مثال و فكرة اتركه الكم :\nQ/ There isn't much pollution. (used to).................................................................................................................", variant: 'blue' },
      { type: 'text', content: "P.12(S.B) Let's start with diet فلنبدأ بالحمية", variant: 'purple' },
      { type: 'text', content: "يجب ان يكونوا الناس مسؤولين عن صحتهم People should take responsibility for their own health", variant: 'warning' },
      { type: 'text', content: "1 | In Britain the number of diabetics عدد مرضى السكر goes up يرتفع every year. (2015/2)(2020)", variant: 'blue' },
      { type: 'text', content: "2 | Every year the government الحكومة spends millions of pounds in health care عناية الصحة on people who have brought يجلبون their illnesses مرضهم on themselves لنفسهم.", variant: 'blue' },
      { type: 'text', content: "3 | As a result كنتيجة of the unhealthy diet, 60 per cent of British people are overweight بدينين.", variant: 'blue' },
      { type: 'text', content: "4 | Smokers generally need more medical attention عناية طبية than non-smokers من غير المدخنون.", variant: 'blue' },
      { type: 'text', content: "5 | Government should not give لا يجب ان تعطى free health care عناية مجانية to people who don't take care of themselves.", variant: 'blue' },
      { type: 'text', content: "P.16/A. B A - Circle the correct sentence ending based on page 12 of the Student's Book.", variant: 'purple' },
      { type: 'text', content: "1 | The government spends millions on ملايين:\na | anti-smoking campaigns. حملات ضد التدخين\nb | people who have made themselves ill. الناس الذين يجعلون انفسهم مرضى\nc | people who never take exercise. الناس الذين لا يتمرنون", variant: 'blue' },
      { type: 'text', content: "2 | Because of their bad diet, 60% of British people\na | are diabetic مرضى بالسكري\nb | are overweight and could get diabetes بدينين و ممكن ان يصابوا بالسكر\nc | are very unhealthy غير صحيين", variant: 'blue' }
    ],
    solutions: [
      "حل تمرين A: 1-b, 2-b"
    ],
    questions: [
      { id: 69051, text: "ما هي نسبة البريطانيين الذين يعانون من زيادة الوزن؟", options: ["40%", "50%", "60%", "70%"], correctAnswer: 2, explanation: "حسب النص، 60% من البريطانيين يعانون من زيادة الوزن." },
      { id: 70052, text: "لماذا يحتاج المدخنون عناية طبية أكثر؟", options: ["لأنهم لا يتمرنون", "لأن التدخين يسبب الأمراض", "لأنهم يأكلون كثيراً", "لأنهم كبار في السن"], correctAnswer: 1, explanation: "المدخنون يحتاجون عناية طبية أكثر من غير المدخنين بسبب آثار التدخين الصحية." }
    ]
  },
  {
    id: 27,
    title: "إكمال الجمل عن الصحة",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "3 | people\na | no longer take enough exercise. لا يتدربون كفاية\nb | watch TV all day long. يشاهدون تلفاز طوال اليوم\nc | should stop using their cars. يجب ان يتوقفوا عن استخدام سياراتهم", variant: 'blue' },
      { type: 'text', content: "4 | smoking\na | is a dirty habit عادة قذرة\nb | is a very expensive habit عادة غالية\nc | is destroying a lot of people's health. تدمر صحة الناس", variant: 'blue' },
      { type: 'text', content: "5 | The government shouldn't pay لا يجب تدفع for people's health care.\na | unless they take proper care of themselves. الا اذا اعتنوا بصحتهم\nb | unless they have children. الا اذا لديهم اطفال\nc | unless they and their children are unhealthy. الا اذا هم و اطفالهم غير صحيين", variant: 'blue' },
      { type: 'text', content: "P.17 A.B C - Complete the sentences with a word or number from the text on page 12 of the Student's Book.", variant: 'purple' },
      { type: 'text', content: "هذا التمرين هو اسقاطات عن مقالة الدايت في الكتاب الملون صفحة 12 بالكتاب التمرين بلا صندوق لذلك راح نسوي عليه صندوق كلمات", variant: 'warning' },
      { type: 'text', content: "Diabetic مرض السكر - smoking تدخين - illnesses امراض - heart قلب\nhealthcare العناية الصحية - walk مشي - 60", variant: 'purple' },
      { type: 'text', content: "1 | Dr Ramzi argues that يزعم ان many ________ are due to bad habits. بسبب العادات السيئة", variant: 'blue' },
      { type: 'text', content: "2 | There are more and more الكثير هناك ________ in the UK every year.", variant: 'blue' },
      { type: 'text', content: "3 | ________ percent بالمئة of British people are at risk بخطورة of becoming diabetics. التعرض للسكر", variant: 'blue' },
      { type: 'text', content: "4 | Dr Ramzi says that, in the past في الماضي, people used to ________ or cycle more. يركبون الدراجة", variant: 'blue' },
      { type: 'text', content: "5 | He argues that exercise التمرين keeps يبقي your ________ in good shape. بحالة جيدة", variant: 'blue' },
      { type: 'text', content: "6 | He believes يؤمن that ________ is the worst habit اسوء عادة for your health. لصحتك", variant: 'blue' },
      { type: 'text', content: "7 | He argues that those who don't take care of themselves الذين لا يهتمون بصحتهم should pay يجب ان يدفعوا for their own ________", variant: 'blue' }
    ],
    solutions: [
      "حلول تمرين C: 1-illness, 2-Diabetic, 3-60, 4-Walk, 5-Heart, 6-Smoking, 7-Healthcare",
      "حلول تمرين A (تكملة): 3-a, 4-c, 5-a"
    ],
    questions: [
      { id: 71053, text: "ما هي أسوأ عادة للصحة حسب دكتور رمزي؟", options: ["الأكل", "التدخين", "النوم", "المشي"], correctAnswer: 1, explanation: "التدخين (Smoking) هو أسوأ عادة للصحة." },
      { id: 72054, text: "ماذا يجب أن يفعل الناس الذين لا يهتمون بصحتهم؟", options: ["يدفعوا ثمن علاجهم", "يتوقفوا عن الأكل", "يناموا أكثر", "يسافروا"], correctAnswer: 0, explanation: "دكتور رمزي يرى أنهم يجب أن يدفعوا ثمن عنايتهم الصحية (Healthcare)." }
    ]
  },
  {
    id: 28,
    title: "تعاريف ومحادثة صحية",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.17 A.B C - Complete the definitions with words from the text on page 12:", variant: 'purple' },
      { type: 'text', content: "هذا التمرين فكرته جديدة يريد منكم تنطون كلمة بالفراغ حسب المطلب", variant: 'warning' },
      { type: 'text', content: "1 | ________ (noun) = what you eat شيء تأكله (diet)", variant: 'blue' },
      { type: 'text', content: "2 | ________ (adjective) = weighing more than you should اكتساب وزن اكثر من المفروض (Overweight)", variant: 'blue' },
      { type: 'text', content: "3 | ________ (adjective) = when you do something often عندما تفعل شيء بين الحين والاخر (Habit)", variant: 'blue' },
      { type: 'text', content: "4 | ________ (noun) = the part of your body responsible for breathing. عضو في جسدك مسؤول عن التنفس (Lungs)", variant: 'blue' },
      { type: 'text', content: "5 | ________ (noun) = people who don't smoke. الناس الذين لا يدخنون (Non-smokers)", variant: 'blue' },
      { type: 'text', content: "6 | ________ (phrasal verb) = to raise (children) لتربية (الأطفال) (Bring up)", variant: 'blue' },
      { type: 'text', content: "P.17 A.B E - Two people are discussing Dr Ramzi's article. Complete the gaps with one word.", variant: 'purple' },
      { type: 'text', content: "بهذا التمرين يريدنا نكمل المحادثة بالكلمة الصحيحة المناسبة", variant: 'warning' },
      { type: 'text', content: "Maryam: In my opinion, Dr Ramzi is completely right. في رأيي د. رمزي محق تماما", variant: 'blue' },
      { type: 'text', content: "Hamzah: I don't agree. Many people have unhealthy lifestyles as a result of other things, not just because they don't want to be healthy. لا اتفق. العديد من الناس نظامهم غير صحي كنتيجة لأشياء أخرى، ليس بسبب انهم لا يريدوا ان يكونوا صحيين", variant: 'blue' },
      { type: 'text', content: "Maryam: Maybe, but generally speaking, it's their fault. ربما، لكن عامة القول، هذا خطأهم", variant: 'blue' },
      { type: 'text', content: "Hamzah: In the first place, nobody's perfect, we all make bad decisions. On top of that, people who buy cigarettes, for example, already pay extra tax on them. أولا، لا يوجد احد مثالي، جميعنا نعمل قرارات سيئة. على قمة ذلك الناس الذين يشترون السكائر على سبيل المثال، يدفعون بالفعل ضريبة إضافية عليها", variant: 'blue' },
      { type: 'text', content: "Maryam: As they should. Our health system is under a lot of pressure, and this is caused by people not caring about themselves. كما يجب عليهم. نظامنا الصحي يعاني من ضغط كبير، و هذا سببه الناس الذين لا يهتمون بصحتهم.", variant: 'blue' }
    ],
    solutions: [
      "حلول تمرين C (التعاريف): 1-diet, 2-Overweight, 3-Habit, 4-Lungs, 5-Non-smokers, 6-Bring up"
    ],
    questions: [
      { id: 73055, text: "ما هو العضو المسؤول عن التنفس؟", options: ["Heart", "Lungs", "Stomach", "Brain"], correctAnswer: 1, explanation: "Lungs (الرئتان) هي العضو المسؤول عن التنفس." },
      { id: 74056, text: "ما معنى الفعل المركب (Bring up)؟", options: ["يخفض", "يربي", "يترك", "يصعد"], correctAnswer: 1, explanation: "Bring up تعني يربي (الأطفال)." }
    ]
  },
  {
    id: 29,
    title: "استخدام الهاتف والقيادة (Essay A)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.22 A.B Complete the text with the words from the box.", variant: 'purple' },
      { type: 'text', content: "فكرة التمرين هو نص قصير يريد من عدنا نكمل صح من المفردات بالصندوق", variant: 'warning' },
      { type: 'text', content: "[ addition بالإضافة - because بسبب - firstly اولا - least اخرا - opinion رأي - reason سبب - result نتيجة - secondly ثانيا - speaking قول ]", variant: 'purple' },
      { type: 'text', content: "In my opinion everyone should go jogging للهروة for many reasons. لعدة اسباب Firstly it's great for your heart مفيد لقلبك Because of its pace الخطوات - not too slow ليست بطيئة جدا, but not too fast either و لا سريعة جدا كذلك Secondly it also helps with your mental well-being ممتاز للصحة الذهنية. One Addition is that it reduces stress يقلل التوتر. In speaking it's the perfect activity فعالية مثالية to do with friends. You're not out of breath نفس the whole time, and as a result you can have a chat while you are jogging. Last but not least it's really easy! Generally speaking, most people can start jogging today!", variant: 'blue' },
      { type: 'text', content: "حلول تمرين P.22 A.B:", variant: 'warning' },
      { type: 'text', content: "1-opinion, 2-Firstly, 3-Because, 4-Secondly, 5-Reason, 6-Addition, 7-Result, 8-Least, 9-Speaking", variant: 'blue' },
      { type: 'text', content: "P.13 S.B Using your phone behind the wheel. استخدام الموبايل خلف عجلة القيادة.", variant: 'purple' },
      { type: 'text', content: "الفكرة من هاي المقالة نتعلم على مفردات جديدة تجي بالإسقاطات ونتعلم من خلالها كيفية كتابة انشاء تقليل حوادث السيارات", variant: 'warning' },
      { type: 'text', content: "مفردات مهمة من المقالة Important terms from Essay A:", variant: 'purple' },
      { type: 'text', content: "• Argued: يمكن القول | • Licence: رخصة\n• Circumstance: ظرف | • Distracted: غير منتبه او (ملتهي)\n• Accidents: حوادث | • Satnav: جهاز ملاحة\n• Punished: يعاقب", variant: 'blue' },
      { type: 'text', content: "Essay A:\nIt could be argued that we shouldn't be allowed to use our phones under any circumstance when driving, but in my opinion, when used correctly, they can be extremely useful and even prevent accidents from happening. Of course, we should never take our eyes off the road to text or check our emails, and people who break the law and do that should be punished, even by losing their licence. However, hands-free phones can be safely used to talk, without them having to look at the phone. Naturally, you may get a little distracted, but surely the same can be said of someone talking to the driver in the car? In addition, map apps on mobile phones can help people drive in areas they don't know well if their cars don't have a satnav. Consequently, they are less likely to cause an accident as a result of not knowing where they are going.", variant: 'blue' }
    ],
    solutions: [],
    questions: [
      { id: 75057, text: "ماذا يمكن أن يحدث لمن يستخدم الهاتف أثناء القيادة؟", options: ["يحصل على جائزة", "يعاقب وربما يفقد رخصته", "يسافر مجاناً", "لا شيء"], correctAnswer: 1, explanation: "حسب النص، من يخالف القانون يجب أن يعاقب (punished) وربما يفقد رخصته (licence)." },
      { id: 76058, text: "ما هي فائدة تطبيقات الخرائط في الهاتف؟", options: ["تزيد الحوادث", "تساعد الناس في المناطق التي لا يعرفونها", "تستهلك البطارية", "تشتت السائق دائماً"], correctAnswer: 1, explanation: "تساعد تطبيقات الخرائط السائقين في المناطق غير المعروفة مما يقلل احتمالية وقوع حوادث." }
    ]
  },
  {
    id: 30,
    title: "مخاطر الهاتف والقيادة (Essay B)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "ترجمة Essay A:", variant: 'warning' },
      { type: 'text', content: "يمكن القول إنه لا ينبغي لنا استخدام هواتفنا تحت أي ظرف من الظروف أثناء القيادة، ولكن في رأيي، عندما تُستخدم بشكل صحيح، يمكن أن تكون مفيدة للغاية بل وتمنع الحوادث من الحدوث. بالطبع، يجب ألا نرفع أعيننا عن الطريق لنرسل رسائل نصية أو نراجع بريدنا الإلكتروني، والأشخاص الذين يخالفون القانون ويفعلون ذلك يجب أن يُعاقبوا، حتى وإن وصل الأمر إلى سحب رخصتهم. ومع ذلك، يمكن استخدام الهواتف التي تعمل دون الحاجة للإمساك بها بأمان لإجراء محادثات، دون الحاجة للنظر إلى الهاتف. من الطبيعي أن يتشتت السائق قليلاً، ولكن الشيء نفسه يمكن أن يقال عن شخص يتحدث مع السائق في السيارة. بالإضافة إلى ذلك، تطبيقات الخرائط على الهواتف المحمولة يمكن أن تساعد الناس على القيادة في مناطق لا يعرفونها إذا لم تكن سياراتهم مزودة بجهاز ملاحة. وبالتالي، فإن احتمال تسببهم في حادث نتيجة لعدم معرفتهم إلى أين يذهبون يكون أقل.", variant: 'blue' },
      { type: 'text', content: "مفردات مهمة من المقالة Important terms from Essay B:", variant: 'purple' },
      { type: 'text', content: "• Solution: حل | • Crash: حادث\n• Attention: انتباه | • Risks: الخطورة\n• Lack: قلة | • Banned: يمنعون\n• Prone: معرض", variant: 'blue' },
      { type: 'text', content: "Essay B:\nIn my point of view, mobile phones and cars don't go together at all. Some people claim that hands-free phones are a good solution, but many accidents are caused by lack of attention, and even if your hands are not holding your phone, you're still distracted and more prone to causing an accident. Even reading a map can be risky because looking at the map could be enough to take your eyes off the road for a few seconds. That is enough to cause a crash. It may seem easy to send a quick text message, but it is still extremely dangerous, and most people don't realize the risks. To me, using a mobile phone in a car is like drinking alcohol before driving. In my mind, drivers should definitely put their phones away before they go behind the wheel. Those who are caught texting while driving should be permanently banned from driving.", variant: 'blue' },
      { type: 'text', content: "ترجمة Essay B:", variant: 'warning' },
      { type: 'text', content: `من وجهة نظري، لا يمكن الجمع بين الهواتف المحمولة والسيارات على الإطلاق. بعض الناس يدعون أن الهواتف التي تعمل دون الحاجة للإمساك بها حل جيد، ولكن الكثير من الحوادث تحدث بسبب قلة الانتباه، وحتى لو لم تكن يداك تمسكان بالهاتف، فإنك تظل مشتتاً وأكثر عرضة للتسبب في حادث. حتى قراءة خريطة قد تكون خطيرة، لأن النظر إلى الخريطة قد يكفي لبضع ثوانٍ لوقوع حادث. قد يبدو إرسال رسالة قصيرة أمراً سهلاً، ولكنه يظل خطيراً للغاية، ومعظم الناس لا يدركون المخاطر. بالنسبة لي، فإن استخدام الهاتف المحمول في السيارة يشبه شرب الكحول قبل القيادة. في رأيي، يجب على السائقين بالتأكيد وضع هواتفهم جانباً قبل أن يجلسوا خلف عجلة القيادة. أما أولئك الذين يتم القبض عليهم وهم يرسلون رسائل نصية أثناء القيادة فيجب منعهم نهائياً من القيادة.`, variant: 'blue' }
    ],
    solutions: ["تمت ترجمة المقالة بنجاح."],
    questions: [
      { id: 77301, text: "ما هو رأي الكاتب في استخدام الهاتف أثناء القيادة؟", options: ["يجب منعه نهائياً", "مسموح في حالات معينة", "مسموح دائماً", "لا يشكل خطراً"], correctAnswer: 0, explanation: "الكاتب يرى أنه يجب منعهم نهائياً (permanently banned)." }
    ]
  },
  {
    id: 31,
    title: "P.22(A.B) Used to + but لكن",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "بهذا النمط يجيكم فعلين و الأداة (but) بالوسط الفعل الأول قبل (but) دائماً تحلوا بالـ (used to) و اذا نفي (didn't use to)", variant: 'warning' },
      { type: 'text', content: "الفعل الثاني يكون اما مضارع بسيط present simple او ماضي بسيط past simple حسب الظروف و طبعا مشروحات بالأساسيات النمط الوزاري :", variant: 'warning' },
      { type: 'text', content: "Q2/A | Use the correct form of \"used to\" and past or present simple", variant: 'purple' },
      { type: 'text', content: "(ظروف PAST) : (yesterday/ago/last)", variant: 'blue' },
      { type: 'text', content: "(ظروف PRESENT) : (today/now/never/always/often/usually/ sometimes)", variant: 'blue' },
      { type: 'text', content: "1 | He (have) his hair cut at the hairdresser's, but now his wife (cut) it for him.", variant: 'blue' },
      { type: 'text', content: "2 | I (have) a bicycle, but someone (steal) it last month.", variant: 'blue' },
      { type: 'text', content: "3 | He (like) going out, but now he always (want) to stay at home.", variant: 'blue' },
      { type: 'text', content: "4 | She (wear) glasses, but now she (have) contact lenses.", variant: 'blue' },
      { type: 'text', content: "5 | She (not/ talk) so much, but now she never (stop) .", variant: 'blue' },
      { type: 'text', content: "6 | There (be) a house here, but they (knock) it down two years ago.", variant: 'blue' },
      { type: 'text', content: "7 | She (not / be) so thin, but she (get) very ill last year and (lose) a lot of weight.", variant: 'blue' }
    ],
    solutions: [
      "1 used to have __ cuts",
      "2 used to have __ stolen",
      "3 used to like __ wants",
      "4 used to wear __ has",
      "5 didn't use to talk __ stops",
      "6 used to be __ knocked",
      "7 didn't use to be __ got, lost"
    ],
    questions: []
  },
  {
    id: 32,
    title: "امثلة وزارية غير موجودة بتمارين الكتاب",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "امثلة وزارية غير موجودة بتمارين الكتاب", variant: 'warning' },
      { type: 'text', content: "1 | Sawla (eat) meat, but now she (be) a vegetarian. (2018/1)", variant: 'blue' },
      { type: 'text', content: "2 | She (smoke), but she (give) up a few years ago. (2022/احيائي)", variant: 'blue' },
      { type: 'text', content: "3 | I (play) football a lot, but I (not/play) very much now. (2023/تطبيقي وادبي)", variant: 'blue' },
      { type: 'text', content: "4 | I (live) in a big town, but I (move) to a smaller house last year. (2023/3)", variant: 'blue' },
      { type: 'text', content: "5 | Ahmed (walk) to work, but now he no longer (do). (2024/2)", variant: 'blue' }
    ],
    solutions: [
      "1 used to eat __ is",
      "2 used to smoke __ gave",
      "3 used to play __ don't play",
      "4 used to live __ moved",
      "5 used to walk __ does"
    ],
    questions: [
    ]
  },
  {
    id: 33,
    title: "P22.A.B A - Choose the correct word",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P22.A.B A - Choose the correct word from the box to complete each sentence.", variant: 'purple' },
      { type: 'text', content: "(ينحل هذا تمرين الاسقاطات و ينفهم بعد الانتهاء من قطعة عمار بالذات)", variant: 'warning' },
      { type: 'text', content: "blood pressure ضغط الدم , check-ups فحوصات , exoskeleton هيكل خارجي , swollen متورم , physical therapy علاج طبيعي , in plaster بالشريط اللاصق", variant: 'purple' },
      { type: 'text', content: "1 | After he twisted his ankle, Tom's foot became very .........................................", variant: 'blue' },
      { type: 'text', content: "بعد ان لوى كاحله، أصبحت قدم توم جداً", variant: 'blue' },
      { type: 'text', content: "2 | Her leg is ......................................... after she broke it in a car accident.", variant: 'blue' },
      { type: 'text', content: "ساقها بالـ ......................................... بعد ان كسرتها بحادث سيارة", variant: 'blue' },
      { type: 'text', content: "3 | After the surgery, I needed ......................................... to strengthen my muscles.", variant: 'blue' },
      { type: 'text', content: "بعد العملية الجراحية، احتجت ......................................... لتقوية عضلاتي.", variant: 'blue' },
      { type: 'text', content: "4 | Scientists are developing an advanced ......................................... to help paralyzed patients to walk.", variant: 'blue' },
      { type: 'text', content: "العلماء يطورون ......................................... متقدم لمساعدة مرضى الشلل", variant: 'blue' },
      { type: 'text', content: "5 | Regular ......................................... with the doctor can help detect health problems early.", variant: 'blue' },
      { type: 'text', content: "المنتظمة مع الطبيب ممكن ان يساعد بكشف المشاكل الصحية بسهولة.", variant: 'blue' },
      { type: 'text', content: "6 | High ......................................... can increase the risk of heart disease.", variant: 'blue' },
      { type: 'text', content: "المرتفع ممكن ان يرفع خطر امراض القلب.", variant: 'blue' }
    ],
    solutions: [
      "1 swollen",
      "2 in plaster",
      "3 physical therapy",
      "4 exoskeleton",
      "5 checkups",
      "6 blood pressure"
    ],
    questions: []
  },

  {
    id: 34,
    title: "الأسئلة الاستنتاجية الإضافية",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "الأسئلة الاستنتاجية الإضافية", variant: 'purple' },
      { type: 'text', content: "Q1 | Where did Ammar wake up after the accident? أين استيقظ عمار بعد الحادث؟\n- In the hospital. في المستشفى.", variant: 'blue' },
      { type: 'text', content: "Q2 | What did his father tell him about the river? ماذا أخبره والده عن النهر؟\n- That it wasn't deep enough and he hit the bottom. أنه لم يكن عميقاً بما يكفي فاصطدم بالقاع.", variant: 'blue' },
      { type: 'text', content: "Q3 | Ammar was part of the football team. (True / False) كان عمار عضواً في فريق كرة القدم.", variant: 'blue' },
      { type: 'text', content: "Q4 | Ammar's accident happened when he jumped from a bridge. (True / False) وقع حادث عمار عندما قفز من جسر.", variant: 'blue' },
      { type: 'text', content: "Q5 | The doctors were sure Ammar would never walk again. (True / False) كان الأطباء متأكدين أن عمار لن يمشي أبداً.", variant: 'blue' },
      { type: 'text', content: "Q6 | Ammar used a wheelchair before the exoskeleton. (True / False) استخدم عمار الكرسي المتحرك قبل الهيكل الخارجي.", variant: 'blue' },
      { type: 'text', content: "Q7 | Ammar climbed up the bridge carefully and looked down صعد عمار الجسر بحذر ونظر للاسفل", variant: 'blue' },
      { type: 'text', content: "Q8 | When Ammar woke up, his parents were sitting next to him. عندما استيقظ عمار كان والداه جالسين بجانبه", variant: 'blue' },
      { type: 'text', content: "Q9 | Ammar hurt his back very seriously. أصيب عمار بجروح خطيرة في ظهره", variant: 'blue' },
      { type: 'text', content: "Q10 | Physical therapy turned days into weeks and weeks into months حوّل العلاج الطبيعي الأيام إلى اسابيع والأسابيع إلى اشهر", variant: 'blue' },
      { type: 'text', content: "Q11 | The exoskeleton is a machine that helps patients to stand up and walk الهيكل الخارجي آلة تساعد المرضى على الوقوف و المشي", variant: 'blue' },
      { type: 'text', content: "Q13 | What was last thing Ammar did before jumping from the bridge? ماذا كان اخر شيء فعله عمار قبل ان يقفز من الجسر؟\n- He closed his eyes. غمض عينيه.", variant: 'blue' },
      { type: 'text', content: "Q14 | After he fully recovered, he went back to playing football (True / false). بعد ان تعافى عمار بشكل كامل، عاد ليلعب كرة القدم مرة أخرى. (صح / خطأ)", variant: 'blue' }
    ],
    solutions: [
      "Q3-False (basketball), Q4-True, Q5-False (they said might not walk), Q6-True, Q12-True, Q14-False (basketball)"
    ],
    questions: []
  },

  {
    id: 35,
    title: "أسباب حوادث السيارات (Notes)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.18 A.B A - Complete the following essay on some of the causes of car accidents using the notes below:", variant: 'purple' },
      { type: 'text', content: "بتمرين الكتاب عن مقالة استعمال الهاتف اثناء القيادة يريد من عدنا نقرأ الملاحظات المكتوبة ثم نحل الفراغات وهل فراغات ممكن تجي بالإسقاطات Q3/A", variant: 'warning' },
      { type: 'text', content: "• Thousands of car accidents a year. الاف حوادث السيارات كل عام", variant: 'blue' },
      { type: 'text', content: "• These cause serious injuries / deaths. هذه تسبب إصابات خطرة / وفيات", variant: 'blue' },
      { type: 'text', content: "• Most car accidents caused by: معظم حوادث السيارات سببها:", variant: 'blue' },
      { type: 'rule', title: "1 | driver driving too fast السائق يقود بسرعة عالية", description: "Studies: most drivers don't realize time to stop vehicle | دراسات: معظم السائقين لا يدركون الوقت اللازم لإيقاف المركبة", icon: 'sparkle' },
      { type: 'rule', title: "2 | driver not concentrating السائق لا يركز", description: "e.g., using mobile phone (text messages), changing music from a playlist | مثلا استخدام الهاتف (رسائل نصية) تغيير الموسيقى من قائمة التشغيل", icon: 'sparkle' },
      { type: 'rule', title: "3 | driver doesn't obey road signs السائق لا يلتزم بإشارات المرور", description: "(e.g., stop signals, red lights, etc.). Rules ensure safety drivers + pedestrians | (مثلا، إشارات التوقف، الإشارات الحمراء، الخ). القوانين تضمن سلامة السائقين + المشاة", icon: 'sparkle' },
      { type: 'rule', title: "2 | badly maintained car سيارات غير مصانة جيدا", description: "(e.g., bad brakes) | (فرامل سيئة)", icon: 'sparkle' },
      { type: 'text', content: "What should the government do about it? more traffic police? more speed cameras? more checks on cars? heavier fines? stricter driving tests?", variant: 'warning' }
    ],
    solutions: [],
    questions: [
      { id: 78064, text: "ماذا يعني driver driving too fast؟", options: ["السائق يقود ببطء", "السائق يقود بسرعة عالية", "السائق لا يركز", "السائق نائم"], correctAnswer: 1, explanation: "Too fast تعني بسرعة عالية جداً." }
    ]
  },
  {
    id: 36,
    title: "إكمال مقالة حوادث السيارات",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "There are (1) thousands of car accidents a year, which cause serious injuries. هناك الآلاف من حوادث السيارات سنوياً، والتي تسبب إصابات خطيرة.", variant: 'blue' },
      { type: 'text', content: "Most of these accidents have one of the (2) many following causes. معظم هذه الحوادث لها أحد الأسباب الكثيرة التالية.", variant: 'blue' },
      { type: 'text', content: "Firstly, the driver is driving (3) too fast and can't stop the vehicle in time. أولاً، السائق يقود بسرعة كبيرة ولا يستطيع إيقاف المركبة في الوقت المناسب.", variant: 'blue' },
      { type: 'text', content: "Or sometimes, the driver is distracted by their (4) mobile phone or is changing the music in the car. أو أحياناً يكون السائق مشتتاً بسبب هاتفه المحمول أو يقوم بتغيير الموسيقى في السيارة.", variant: 'blue' },
      { type: 'text', content: "A third cause of accidents is when the driver doesn't follow the (5) road signs, like the stop signal and red lights. والسبب الثالث للحوادث هو عندما لا يلتزم السائق بإشارات المرور، مثل إشارة التوقف والإشارات الحمراء.", variant: 'blue' },
      { type: 'text', content: "Last but not least, cars are often badly maintained. It can be especially dangerous if the (6) brakes don't work properly, for example. وأخيراً وليس آخراً، غالباً ما تكون السيارات غير مصانة جيداً. وقد يكون ذلك خطيراً بشكل خاص إذا لم تعمل المكابح بشكل صحيح، على سبيل المثال.", variant: 'blue' },
      { type: 'text', content: "There are several ways (7) the government could deal with this problem. هناك عدة طرق يمكن أن تتعامل بها الحكومة مع هذه المشكلة.", variant: 'blue' },
      { type: 'text', content: "Firstly, they could increase the number of traffic police officers and (8) put more speed cameras on the streets and highways. أولاً، يمكنهم زيادة عدد ضباط شرطة المرور ووضع كاميرات سرعة في الشوارع والطرق السريعة.", variant: 'blue' },
      { type: 'text', content: "Furthermore, they could make (9) driving tests harder to pass and impose (10) heavier fines on those who break the law. علاوة على ذلك، يمكنهم جعل اختبارات القيادة أصعب للنجاح فيها وفرض غرامات أشد على من يخالف القانون.", variant: 'blue' }
    ],
    solutions: [
      "الفراغات المطلوبة: 1-thousands, 2-many, 3-too fast, 4-mobile phone, 5-road signs, 6-brakes, 7-the government, 8-put more speed cameras, 9-driving tests, 10-heavier fines"
    ],
    questions: [
      { id: 79065, text: "ما هو الحل المقترح لزيادة الالتزام بالقانون؟", options: ["تقليل الغرامات", "فرض غرامات أشد (heavier fines)", "إلغاء الاختبارات", "تسهيل القيادة"], correctAnswer: 1, explanation: "النص يقترح فرض غرامات أشد (impose heavier fines)." }
    ]
  },
  {
    id: 37,
    title: "المقارنة بإضافة er",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "معرفة ملاحظات المقارنة مهمة بالإملاء Q3/C Spelling و المقارنة مع used to + than", variant: 'warning' },
      { type: 'rule', title: "1 | لتحويل الصفة الى مقارنة نضع (er)", description: "hard → harder | fast → faster | slow → slower | quiet → quieter | small → smaller | cheap → cheaper | clean → cleaner", icon: 'sparkle' },
      { type: 'rule', title: "2 | نضع (r) فقط اذا انتهت الصفات بـ (e)", description: "Safe → safer | nice → nicer", icon: 'sparkle' },
      { type: 'rule', title: "3 | اذا انتهت الصفة بـ (y) يقلب الى (i) ونضع (er)", description: "Easy → easier | funny → funnier | dirty → dirtier | noisy → noisier | happy → happier", icon: 'sparkle' },
      { type: 'rule', title: "4 | اذا انتهت الصفة بحرف صحيح (صوت صحيح) قبله حرف علة واحد نكرر الأخير (الصحيح) ونضع (er)", description: "Big → bigger | hot → hotter | wet → wetter", icon: 'sparkle' },
      { type: 'text', content: "(انتبهوا ابطالي اذا قبله حرفين علة ما نكرر مثل: cheap, clean)", variant: 'warning' },
      { type: 'text', content: "(انتبهوا ابطالي اكو احرف لا تتكرر مثل: w, z, x, y)", variant: 'warning' },
      { type: 'rule', title: "5 | اذا كانت الصفة اكثر من مقطع نضع قبل الصفة (more)", description: "Boring → more boring | violent → more violent | romantic → more romantic | dangerous → more dangerous | expensive → more expensive | polluted → more polluted | crowded → more crowded", icon: 'sparkle' },
      { type: 'rule', title: "6 | بعض الصفات الشاذة", description: "Good, Well → better | Bad → Worse | Far → Farther | Little, Few → less | well-trained → better-trained", icon: 'sparkle' }
    ],
    solutions: [],
    questions: [
      { id: 80066, text: "ما هي مقارنة كلمة happy؟", options: ["happyer", "happier", "more happy", "hapy"], correctAnswer: 1, explanation: "الصفة المنتهية بـ y نقلبها إلى i ونضيف er." }
    ]
  },
  {
    id: 38,
    title: "تطبيقات المقارنة و used to + than",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "1 | big, bigger ; funny, ________ (2014/2)(2016/2)(2019/ت)(2020/1)", variant: 'blue' },
      { type: 'text', content: "2 | fast, faster ; safe, ________ (2014/3)(2021/ت)", variant: 'purple' },
      { type: 'text', content: "3 | small, smaller ; good, ________ (2021/1)(2019/1)(2015/3)", variant: 'blue' },
      { type: 'text', content: "4 | big, bigger ; dangerous, ________ (2018/1)", variant: 'purple' },
      { type: 'text', content: "5 | fast, faster ; cheap, ________ (2018/2)", variant: 'blue' },
      { type: 'text', content: "6 | small, smaller ; boring, ________ (2019/3)", variant: 'purple' },
      { type: 'text', content: "P.14 A.B B - Ruba's grandfather is talking to her about his childhood. Complete the text below with the correct form of the adjectives in brackets.", variant: 'purple' },
      { type: 'text', content: "Life was (difficult) more difficult back then. We had to work (hard) harder than teenagers today because we used to study and help our parents earn money. Families were much (big) bigger than now. I had six brothers and four sisters! We didn't use to have mobile phones or things like that, so we were (active) more active and we used to spend a lot of time playing outside. Maybe life is (interesting) more interesting now, but I think life used to be (good) better than today. We didn't use to have much, but we had each other.", variant: 'blue' },
      { type: 'rule', title: "الموضوع يجي فقط مع الصفات (used to + than)", description: "الاسم + (is, are) + صفة المقارنة + now than + (it, they) + used to be.\n• is للمفرد و are للجمع\n• it للـ is و they للـ are", icon: 'sparkle' },
      { type: 'rule', title: "المقارنة مع (as ... as)", description: "الاسم + (isn't, aren't) + as + صفة تبقى كما هي + as + (it, they) + used to be.\n• بالـ as ... as لازم نفي (isn't, aren't)\n• هنا تبقى الصفة كما هي", icon: 'sparkle' }
    ],
    solutions: ["1-funnier, 2-safer, 3-better, 4-more dangerous, 5-cheaper, 6-more boring"],
    questions: [
      { id: 81067, text: "ما هي مقارنة كلمة good؟", options: ["gooder", "better", "best", "more good"], correctAnswer: 1, explanation: "good صفة شاذة تصبح better في المقارنة." }
    ]
  },
  {
    id: 39,
    title: "تمارين المقارنة ونمط الاختيارات",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.15 A.B B - Compare life today with life 50 years ago. Write pairs of sentences using one of the adjectives in brackets each time.", variant: 'purple' },
      { type: 'text', content: "1 | life (easy/ hard/ slow/ fast)\n- Life is faster now than it used to be. | Life isn't as easy as it used to be.", variant: 'blue' },
      { type: 'text', content: "2 | films (funny/ boring/ violent/ romantic)", variant: 'blue' },
      { type: 'text', content: "3 | doctors (good/ expensive/ cheap/ well-trained)", variant: 'blue' },
      { type: 'text', content: "4 | streets (noisy/ quiet/ clean/ dirty/ safe/ dangerous)", variant: 'blue' },
      { type: 'text', content: "e.g. (education/ good) (compare education today with education 50 years ago. Use {than}) (2017/1)", variant: 'purple' },
      { type: 'text', content: "e.g. (Film/ funny/ used to be) (use : as....as to make a comparison) (2014/2)", variant: 'purple' },
      { type: 'text', content: "Q2/B Choose نمط الاختيارات", variant: 'warning' },
      { type: 'text', content: "1 | Life is (fast/faster) now than it used to be. (2020)", variant: 'blue' },
      { type: 'text', content: "2 | Families are not as (big/bigger) as before. (2016/2)", variant: 'blue' },
      { type: 'text', content: "3 | Schools aren't as (far/ farther) as they used to be.", variant: 'blue' },
      { type: 'text', content: "4 | doctors are (good/ better) trained than they used to be. (2017/1)(2021/ت)", variant: 'blue' },
      { type: 'text', content: "5 | streets are (dangerous / more dangerous) than they used to be. (2023/1)", variant: 'blue' }
    ],
    solutions: ["1-faster, 2-big, 3-far, 4-better, 5-more dangerous"],
    questions: [
      { id: 82068, text: "في قاعدة as...as، هل نستخدم صفة مقارنة أم صفة مجردة؟", options: ["صفة مقارنة (er)", "صفة مجردة كما هي", "صفة تفضيل (est)", "نضيف more"], correctAnswer: 1, explanation: "في قاعدة as...as تبقى الصفة كما هي بدون أي إضافات." }
    ]
  },

  {
    id: 40,
    title: "ملاحظات used to + but",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "بنمط الاختيارات على (used to + but) لازم تكون جملة مثبتة و الأخرى منفية حتى يطلع المعنى صح، لذلك ننتبه على الجملة الثانية اذا كانت منفية نختار الصيغة المثبتة و اذا مثبتة نختار الصيغة المنفية :", variant: 'warning' }
    ],
    solutions: [],
    questions: [
      { id: 83100, text: "بنمط الاختيارات على (used to + but) لازم تكون جملة مثبتة و الأخرى منفية حتى يطلع المعنى صح، لذلك ننتبه على الجملة الثانية اذا كانت منفية نختار الصيغة المثبتة و اذا مثبتة نختار الصيغة المنفية :", options: ["1 | She (doesn't use to talk/ didn't use to talk) much, but now she never stops. (2016/اسلامية)", "2 | We (didn't use to have / used to have) cameras, but now we have six of them.", "3 | I (used to like / didn't use to like) traveling, but now I don't like it anymore."], correctAnswer: 0, explanation: "هذه ملاحظة ونماذج للاختيارات" }
    ]
  },
  {
    id: 41,
    title: "P22.A.B A - Choose the correct word",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P22.A.B A - Choose the correct word from the box to complete each sentence.", variant: 'purple' },
      { type: 'text', content: "(ينحل هذا تمرين الاسقاطات و ينفهم بعد الانتهاء من قطعة عمار بالذات)", variant: 'warning' },
      { type: 'text', content: "blood pressure ضغط الدم , check-ups فحوصات , exoskeleton هيكل خارجي , swollen متورم , physical therapy علاج طبيعي , in plaster بالشريط اللاصق", variant: 'purple' },
      { type: 'text', content: "1 | After he twisted his ankle, Tom's foot became very .........................................", variant: 'blue' },
      { type: 'text', content: "بعد ان لوى كاحله، أصبحت قدم توم جداً", variant: 'blue' },
      { type: 'text', content: "2 | Her leg is ......................................... after she broke it in a car accident.", variant: 'blue' },
      { type: 'text', content: "ساقها بالـ ......................................... بعد ان كسرتها بحادث سيارة", variant: 'blue' },
      { type: 'text', content: "3 | After the surgery, I needed ......................................... to strengthen my muscles.", variant: 'blue' },
      { type: 'text', content: "بعد العملية الجراحية، احتجت ......................................... لتقوية عضلاتي.", variant: 'blue' },
      { type: 'text', content: "4 | Scientists are developing an advanced ......................................... to help paralyzed patients to walk.", variant: 'blue' },
      { type: 'text', content: "العلماء يطورون ......................................... متقدم لمساعدة مرضى الشلل", variant: 'blue' },
      { type: 'text', content: "5 | Regular ......................................... with the doctor can help detect health problems early.", variant: 'blue' },
      { type: 'text', content: "المنتظمة مع الطبيب ممكن ان يساعد بكشف المشاكل الصحية بسهولة.", variant: 'blue' },
      { type: 'text', content: "6 | High ......................................... can increase the risk of heart disease.", variant: 'blue' },
      { type: 'text', content: "المرتفع ممكن ان يرفع خطر امراض القلب.", variant: 'blue' }
    ],
    solutions: [
      "1 swollen",
      "2 in plaster",
      "3 physical therapy",
      "4 exoskeleton",
      "5 checkups",
      "6 blood pressure"
    ],
    questions: []
  },
  {
    id: 42,
    title: "P.23.A.B D & P.25/A.B D",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.23.A.B D - Complete the text with the past simple or past continuous form of the verbs in brackets.", variant: 'purple' },
      { type: 'text', content: "فكرة هذا التمرين تكملة الفراغات باستعمال الماضي البسيط و الماضي المستمر حسب الحدث الأقصر و الحدث الأطول", variant: 'warning' },
      { type: 'text', content: "Yesterday, I (skateboard) 1. ......................................... with my friends, when I (have) 2. ......................................... a small accident. I (try) 3. ......................................... hard to do something really difficult, and one time, I (fall off) 4. ......................................... and (hit) 5. ......................................... my hand on the ground. I (not feel) 6. ......................................... much at the time, but a couple of hours later, my hand (hurt) 7. ......................................... a lot. My dad (take) 8. ......................................... me to the hospital. Luckily, it (not be) 9. ......................................... busy: only a couple of people (wait) 10. ......................................... there, so the doctor (see) 11. ......................................... me quickly. She (tell) 12. ......................................... me that I had broken a couple of bones in my hand.", variant: 'blue' },
      { type: 'text', content: "حل تمرين D صفحة 23:", variant: 'warning' },
      { type: 'text', content: "1 was skateboarding, 2 had, 3 was trying, 4 fell over, 5 hit, 6 didn't feel, 7 hurt, 8 took, 9 wasn't, 10 were waiting, 11 saw, 12 told", variant: 'blue' },
      { type: 'text', content: "P.25/A.B D - Put the verbs in brackets into past continuous and past simple tense.", variant: 'purple' },
      { type: 'text', content: "(التمرين يعتبر نشاط صفي ليس وزاري عبارة عن قصة قصيرة نستعمل بيها الماضي البسيط و الماضي المستمر)", variant: 'warning' },
      { type: 'text', content: `Last year, my friend Zeina (1) ......................................... (get) hurt in a car accident. This is how it (2) ......................................... (happen). She and her brother Salam and her sister Khaleda had spent the afternoon at Zubair, and they (3) ......................................... (return) to Basra. Salam (4) ......................................... (drive) and Khaleda (5) ......................................... (sit) next to him in front. Salam (6) ......................................... (go) quite fast. Suddenly, a little boy (7) ......................................... (run) on to the road. Salam (8) ......................................... (put) his foot on the brake really hard and the car (9) ......................................... (stop) dead. Luckily, he (10) ......................................... (not hit) the little boy. Salam and Khaleda (11) ......................................... (wear) seat belts so they (12) ......................................... (not get) hurt. But Zeina, who (13) ......................................... (sit) in the back, (14) she ......................................... (not wear) hers. Because of the sudden braking, Zeina (15) ......................................... (fall) sideways and (16) ......................................... (hit) her face hard against the window. She (17) ......................................... (break) a tooth and (18) ......................................... (cut) her face and hand. There (19) ......................................... (be) a lot of blood. After the accident, they (20) ......................................... (be) all very shocked. They (21) ......................................... (get) out of the car. Salam's legs (22) ......................................... (shake) so they (23) ......................................... (decide) to wait a bit before driving home. Khaleda (24) ......................................... (look) for her mobile to phone their father when a passing car (25) ......................................... (slow) down. Zeina (26) ......................................... (recognize) the driver. It was a family friend, Dr Latifa Mahmoud, from Haidari Medical Complex. She (27) ......................................... (tell) Zeina to get in the car with her and she (28) ......................................... (drive) her to the Accident and Emergency Department. They immediately (29) ......................................... (stich) the cuts on her face and (30) ......................................... (put) a bandage on her hand. Unfortunately, Zeina still has some scars on her face, and a broken tooth.`, variant: 'blue' }
    ],
    solutions: [
      "1 got, 2 happened, 3 were returning, 4 was driving, 5 was sitting, 6 was going, 7 ran, 8 put, 9 stopped, 10 didn't hit, 11 were wearing, 12 didn't get, 13 was sitting, 14 wasn't wearing, 15 fell, 16 hit, 17 broke, 18 cut, 19 was, 20 were, 21 got, 22 were shaking, 23 decided, 24 was looking, 25 slowed, 26 recognized, 27 told, 28 drove, 29 stitched, 30 put"
    ],
    questions: []
  },
  {
    id: 43,
    title: "قسم قطع كتاب الوحدة الأولى",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "قسم قطع كتاب الوحدة الأولى", variant: 'purple' },
      { type: 'text', content: "ابطالي نظام القطع بهذه الملزمة مدروس بأحكام\nأولاً: كل قطعة راح نأخذ مفرداتها الجديدة و المهمة و هذا الشيء راح يطوركم هواي\nثانياً: نأخذ النص المكتوب بالمنهج و نقراه و نترجمه و نفهم النص\nثالثاً: ننتقل للأسئلة الموضوعة بتمارين النشاط ثم الأسئلة الاستنتاجية المضافه", variant: 'warning' },
      { type: 'text', content: "P.8 S.B My friends were all watching, so I didn't want to give up.", variant: 'purple' },
      { type: 'text', content: "جميع اصدقائي كانوا يشاهدون لذا لم ارد ان استسلم", variant: 'purple' },
      { type: 'text', content: "Important terms مفردات مهمة:", variant: 'warning' },
      {
        type: 'table',
        rows: [
          { source: "River", arabic: "نهر", past: "", pastParticiple: "" },
          { source: "Basket ball", arabic: "كرة السلة", past: "", pastParticiple: "" },
          { source: "Bottom", arabic: "قاع النهر", past: "", pastParticiple: "" },
          { source: "Wheelchair", arabic: "كرسي المقعدين او كرسي متحرك", past: "", pastParticiple: "" },
          { source: "Decision", arabic: "قرار", past: "", pastParticiple: "" },
          { source: "New technology", arabic: "تكنولوجيا جديدة", past: "", pastParticiple: "" },
          { source: "Physical Therapy", arabic: "علاج فيزيائي", past: "", pastParticiple: "" },
          { source: "Exoskeleton", arabic: "هيكل خارجي", past: "", pastParticiple: "" },
          { source: "Progress", arabic: "تقدم", past: "", pastParticiple: "" },
          { source: "Motivated", arabic: "دافع", past: "", pastParticiple: "" }
        ]
      }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 44,
    title: "قصة عمار (Ammar's Story)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "When I was 16, life was great! I was finally part of the school basketball team and had loads of friends. But one day, everything changed. I was swimming in a river with my friends. It was a sunny day and we were all having lots of fun. I decided to jump off a bridge above us. I climbed up carefully and looked down. It seemed a lot higher than when looking up from the water. It was a bit scary, but my friends were all watching, so I couldn't give up now. I closed my eyes and jumped. That was the last thing I remember.", variant: 'blue' },
      { type: 'text', content: "عندما كنت في السادسة عشرة من عمري، كانت الحياة رائعة! انضممتُ أخيراً إلى فريق كرة السلة في المدرسة، وكان لديّ الكثير من الأصدقاء. ولكن في يوم من الأيام، تغير كل شيء. كنت أسبح في نهر مع أصدقائي. كان يوماً مشمساً، وكنا جميعاً نستمتع كثيراً. قررتُ القفز من جسر فوقنا. صعدتُ بحذر ونظرتُ إلى الأسفل. بدا الجسر أعلى بكثير مما كان عليه عندما نظرتُ إليه من الماء. كان الأمر مخيفاً بعض الشيء، لكن جميع أصدقائي كانوا يراقبون، لذلك لم أستطع الاستسلام الآن. أغمضت عيني وقفزتُ. كان هذا آخر ما أتذكره.", variant: 'blue' },
      { type: 'text', content: "I woke up in hospital. My parents were sitting next to me. My father told me what happened: the river wasn't deep enough and I hit the bottom when I dived.", variant: 'blue' },
      { type: 'text', content: "استيقظتُ في المستشفى. كان والداي يجلسان بجانبي. أخبرني والدي بما حدث: لم يكن عمق النهر كافياً، وسقطتُ في القاع عندما غصتُ.", variant: 'blue' },
      { type: 'text', content: "I hurt my back very seriously. Luckily, I was alive, but the doctors said I might not walk again. While my father was talking to me, I was thinking about that moment and how one decision changed my whole life. I decided then to do everything I could to walk again.", variant: 'blue' },
      { type: 'text', content: "أُصبتُ بآلام بالغة في ظهري. لحسن الحظ، كنتُ على قيد الحياة، لكن الأطباء قالوا إنني قد لا أتمكن من المشي مجدداً. بينما كان والدي يحدثني، كنتُ أفكر في تلك اللحظة وكيف غير قرار واحد حياتي بأكملها. قررتُ حينها أن أفعل كل ما بوسعي لأتمكن من المشي مجدداً.", variant: 'blue' },
      { type: 'text', content: "After a few days, I started doing physical therapy. The days turned into weeks, the weeks into months, and I was feeling very upset because I wasn't making enough progress. I could have a regular life with my wheelchair: go to school, hang out with friends, that kind of thing. But I wanted to stand up, walk, and more than anything, go back to playing basketball.", variant: 'blue' },
      { type: 'text', content: "بعد بضعة أيام، بدأتُ العلاج الطبيعي. تحولت الأيام إلى أسابيع، ثم إلى أشهر، وشعرتُ بضيق شديد لعدم إحراز تقدم كافٍ. كان بإمكاني أن أعيش حياة طبيعية بكرسيي المتحرك: الذهاب إلى المدرسة، والخروج مع الأصدقاء، وما إلى ذلك، لكنني كنتُ أرغب في الوقوف والمشي، والأهم من ذلك كله، العودة إلى لعب كرة السلة.", variant: 'blue' },
      { type: 'text', content: "That was when the doctors told me they were trying a new technology for patients like me: an exoskeleton. It is a machine that needs to be worn and would help me to not only stand up, but also to walk. I couldn't believe it! The week after, we tried it out. The feeling was absolutely amazing: after nearly six months, I was walking again!", variant: 'blue' },
      { type: 'text', content: "حينها أخبرني الأطباء أنهم يجربون تقنية جديدة لمرضى مثلي: هيكل خارجي. إنه جهاز يُلبس ليساعدني ليس فقط على الوقوف، بل على المشي أيضاً. لم أصدق ذلك! في الأسبوع التالي، جربناه. كان الشعور مذهلاً: بعد قرابة ستة أشهر، عدتُ للمشي!", variant: 'blue' },
      { type: 'text', content: "I continued my treatment, even more motivated than before. Now I'm completely recovered, thanks to the amazing technology and medical professionals. They believe one day exoskeletons will replace wheelchairs completely. And yes, I'm back to playing basketball!", variant: 'blue' },
      { type: 'text', content: "واصلتُ علاجي، وكنتُ أكثر حماساً من ذي قبل. والآن تعافيتُ تماماً بفضل التكنولوجيا الرائعة والأطباء المتخصصين. يعتقدون أن الهياكل الخارجية ستحل محل الكراسي المتحركة يوماً ما. نعم، لقد عدتُ إلى لعب كرة السلة!", variant: 'blue' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 45,
    title: "P.8.A.B/A & P.8.A.B/B",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.8.A.B/A Read the blog post on page 8 of the student's book and answer the questions", variant: 'purple' },
      { type: 'text', content: "1 | What was Ammar's life like when he was 16? Why?\nكيف كانت حياة عمار عندما كان 16 من العمر؟ لماذا؟\n- Great, because he was finally part of the basketball team and had load of friends.\nرائعة لأنه انضم أخيراً لفريق كرة السلة ولديه الكثير من الأصدقاء", variant: 'blue' },
      { type: 'text', content: "2 | How did Ammar hurt himself ?\nكيف تعرض عمار للأذى ؟\n- Ammar hurt himself when he jumped off a bridge and hit the bottom of the river, which was not deep enough.\nتعرض عمار للأذى عندما قفز من اعلى الجسر وضرب قاع النهر، الذي لم يكن عميق", variant: 'blue' },
      { type: 'text', content: "3 | How did Ammar feel about his progress in therapy? Why?\nكيف شعر عمار حول التقدم في العلاج؟ لماذا؟\n- Ammar felt \"very upset\" and wasn't feeling enough progress.\nشعر عمار \"بأستياء شديد\" ولم يشعر بأحراز أي تقدم", variant: 'blue' },
      { type: 'text', content: "4 | What technology did the doctors want to try with Ammar?\nما التكنولوجيا الذي أراد استخدامها الأطباء مع عمار؟\n- An exoskeleton هيكل خارجي", variant: 'blue' },
      { type: 'text', content: "5 | Why did Ammar feel more motivated to continue his treatment?\nلماذا شعر عمار بدافع قوي لاكمال علاجه؟\n- Because he was making a great progress لأنه كان يعمل تقدم جيد", variant: 'blue' },
      { type: 'text', content: "6 | What do Ammar's doctors think will happen in the future?\nما الذي يتوقعه أطباء عمار ان يحدث في المستقبل؟\n- Exoskeletons will replace wheelchairs الهياكل الخارجية تستبدل الكراسي المتحركة", variant: 'blue' },
      { type: 'text', content: "P.8.A.B/B Read the blog post again and choose the correct option to complete each sentence:", variant: 'purple' },
      { type: 'text', content: "1 | Ammar decided to jump off the bridge because قرر عمار ان يقفز من اعلى الجسر لأنه\na | It didn't look very high looking down from above اعتقد ان المسافة لم تكن عالية من منظوره\nb | He didn't want to feel embarrassed in front of his friends لم يكن يريد ان يشعر بالأحراج امام أصدقائه\nc | He was a good swimmer and wasn't scared of high places كان سباح ماهر ولم يكن خائف من المرتفعات", variant: 'blue' },
      { type: 'text', content: "2 | Ammar hurt his back because تعرض ظهر عمار للأذى\na | He fell into the water in a bad position لأنه سقط في الماء بوضعية خاطئة\nb | He hit the side of the bridge when he fell ضرب حافة الجسر عندما قفز\nc | He hit the bottom of the river when he dived ضرب قاع النهر عندما غطس", variant: 'blue' },
      { type: 'text', content: "3 | On the day he woke up in the hospital, Ammar باليوم الذي استيقظ به عمار بالمستشفى\na | Was told he would wear an exoskeleton قيل له انه سيلبس هيكل خارجي\nb | Knew he would never be able to walk again كان يعرف انه لن يتمكن من المشي مجددا\nc | Realised how one choice could change the rest of his life ادرك ان كيف لقرار واحد يمكن ان يغير حياته بالكامل", variant: 'blue' },
      { type: 'text', content: "4 | The thing Ammar most wanted to do was اكثر شيء أراد ان يفعله عمار كان\na | Play basketball again ان يلعب كرة السلة مجددا\nb | Hang out with his friends again ان يتسكع مع أصدقائه\nc | Go back to school ان يرجع الى المدرسة", variant: 'blue' },
      { type: 'text', content: "5 | On the day Ammar tried the exoskeleton, he was able to باليوم الذي جرب به عمار الهيكل الخارجي، تمكن من\na | Only stand up الوقوف فقط\nb | Stand up and walk الوقوف و المشي\nc | Play basketball لعب كرة السلة", variant: 'blue' }
    ],
    solutions: ["1-b, 2-c, 3-c, 4-a, 5-b"],
    questions: []
  },

  {
    id: 46,
    title: "Against all odds. ضد كل الصعاب",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.14 S.B Against all odds. ضد كل الصعاب", variant: 'purple' },
      {
        type: 'table',
        rows: [
          { source: "Patiently", arabic: "بصبر", past: "", pastParticiple: "" },
          { source: "Racket", arabic: "المضرب", past: "", pastParticiple: "" },
          { source: "Disaster struck", arabic: "وقعت الكارثة", past: "", pastParticiple: "" },
          { source: "Skilled", arabic: "ماهرة", past: "", pastParticiple: "" },
          { source: "Health care system", arabic: "نظام الرعاية الصحية", past: "", pastParticiple: "" },
          { source: "Salary", arabic: "راتب", past: "", pastParticiple: "" },
          { source: "Longed", arabic: "اشتاقت", past: "", pastParticiple: "" },
          { source: "Prostheses", arabic: "أطراف اصطناعية", past: "", pastParticiple: "" },
          { source: "Table tennis", arabic: "تنس الطاولات", past: "", pastParticiple: "" }
        ]
      },
      { type: 'text', content: "Najla Imad Lafta was a happy little Iraqi girl who waited patiently at her doorstep for her father, Mr Imad Lafta, to come home from work. One day, however, when Najla was only three years old, disaster struck: a bomb attached to her father's car went off when Najla Imad Lafta was nearby. She was rushed to hospital and survived the shameless attack, but she lost much of her right arm and both legs.", variant: 'blue' },
      { type: 'text', content: "كانت نجلاء عماد لفتة فتاة عراقية صغيرة سعيدة، تنتظر بصبر على عتبة منزلها عودة والدها، السيد عماد لفتة من العمل. ولكن في أحد الأيام، عندما كانت نجلاء في الثالثة من عمرها فقط، وقعت كارثة: انفجرت قنبلة مثبتة في سيارة والدها عندما كانت نجلاء لفتة بالقرب منها. نُقلت نجلاء إلى المستشفى ونجت من الهجوم السافر، لكنها فقدت جزءاً كبيراً من ذراعها اليمنى وساقيها.", variant: 'blue' },
      { type: 'text', content: "With the love of her parents and siblings, and the support of the Iraqi healthcare system, which provided the necessary treatments and medication to help her, Najla Imad Lafta grew up and adjusted to life in a wheelchair. She went to school and did most things other girls her age did, but still longed to run around like the other children.", variant: 'blue' },
      { type: 'text', content: "بفضل حب والديها وإخوتها، ودعم نظام الرعاية الصحية العراقي الذي وفر لها العلاجات والأدوية اللازمة، نشأت نجلاء عماد لفتة وتأقلمت مع الحياة على كرسي متحرك. ذهبت إلى المدرسة وفعلت معظم ما تفعله الفتيات في سنها، لكنها مع ذلك كانت تتوق إلى الركض كغيرها من الأطفال.", variant: 'blue' },
      { type: 'text', content: "At the age of ten, her life would change a second time, when she discovered table tennis. Even though she had to train to use her left hand to hold the racket (she was born right-handed), she practised tirelessly and soon became very skilled at the sport.", variant: 'blue' },
      { type: 'text', content: "في سن العاشرة، تغيرت حياتها للمرة الثانية عندما اكتشفت رياضة تنس الطاولة. ورغم أنها اضطرت للتدرب على استخدام يدها اليسرى للإمساك بالمضرب (لأنها وُلدت يمنى)، إلا أنها تدربت بلا كلل وسرعان ما أصبحت ماهرة جداً في هذه الرياضة.", variant: 'blue' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 47,
    title: "Najla's Story (Continued) & P.20 A.B/A",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "Najla started taking part in competitions, and, with hard daily practice, she continued improving her game. She earned a place in the Iraqi Paralympic team aged only 12, when she started receiving support like a small salary and equipment, including prostheses. These proved useful for her because she was able to play standing, which made a big difference to her game. At the age of 16, Najla became the youngest table tennis player to qualify for the Tokyo 2020 Paralympics and won gold at the 2022 Asian Para Games.", variant: 'blue' },
      { type: 'text', content: "بدأت نجلاء بالمشاركة في المسابقات، ومع التدريب اليومي المكثف، واصلت تحسين أدائها. حصلت على مكان في الفريق البارالمبي العراقي في سن الثانية عشرة فقط، عندما بدأت تتلقى الدعم، كراتب بسيط ومعدات، بما في ذلك أطراف اصطناعية. وقد أثبتت هذه المعدات فائدتها لأنها تمكنت من اللعب واقفة، مما أحدث فرقاً كبيراً في أدائها. في سن الثالثة عشرة، أصبحت نجلاء أصغر لاعبة تنس طاولة تتأهل لدورة الألعاب البارالمبية طوكيو 2020، وفازت بالميدالية الذهبية في دورة الألعاب الآسيوية البارالمبية 2022.", variant: 'blue' },
      { type: 'text', content: "In 2024, at just 19 years old, she faced her biggest sporting moment: the Paris 2024 Paralympics. She played skillfully, defeating the main names in the sport, and reaching the final against Tokyo 2020 champion Maryna Lytovchenko from Ukraine. In an exciting match, Najla successfully beat her opponent by three sets to one, winning the gold medal she had wanted so much and writing her name in the history books.", variant: 'blue' },
      { type: 'text', content: "في عام 2024، وفي التاسعة عشرة من عمرها فقط، واجهت نجلاء أعظم لحظاتها الرياضية: دورة الألعاب البارالمبية في باريس 2024. لعبت بمهارة، وهزمت أسماء لامعة في هذه الرياضة، ووصلت إلى النهائي ضد بطلة طوكيو 2020، الأوكرانية مارينا ليتوفتشينكو. في مباراة مثيرة، تغلبت نجلاء بنجاح على خصمتها بثلاث مجموعات مقابل مجموعة واحدة، محرزة الميدالية الذهبية التي لطالما حلمت بها، ومسجلة اسمها في سجلات التاريخ.", variant: 'blue' },
      { type: 'text', content: "In an interview before setting off to Paris, Najla said 'Never stop, nothing is impossible. With our determination and resolve, we can achieve what we want and make our dreams a reality.'\nفي مقابلة قبل انطلاقها إلى باريس، قالت نجلاء: \"لا تتوقفوا، لا شيء مستحيل. بعزيمتنا وإصرارنا، نستطيع تحقيق ما نريده وتحويل أحلامنا إلى واقع\".", variant: 'blue' },
      { type: 'text', content: "P.20 A.B A- Read the article on page 14 of the student's book and answer the questions.", variant: 'purple' },
      { type: 'text', content: "1 | What did Najla like to do as a little girl?\nماذا كانت نجلاء تحب أن تفعل عندما كانت صغيرة؟\n- Najla liked to wait at her doorstep for her father to come home from work.\nنجلاء كانت تحب ان تنتظر والدها عند عتبة الباب ليعود من العمل", variant: 'blue' },
      { type: 'text', content: "2 | What happened to Najla as a result of the bomb attack?\nماذا حدث لنجلاء نتيجة للهجوم بالقنبلة؟\n- She lost much of her right arm and both legs.\nفقدت ناجلا معظم ذراعها اليمنى وكلتا ساقيها.", variant: 'blue' },
      { type: 'text', content: "3 | How did the Iraqi healthcare system help Najla?\nكيف ساعد النظام الصحي العراقي نجلاء ؟\n- It provided treatments, medication.\nالنظام الصحي العراقي قدّم لها العلاج والدواء.", variant: 'blue' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 48,
    title: "P.20 A.B/A & P.20 A.B/B",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "4 | How did Najla's life change a second time?\nكيف تغيرت حياة نجلاء للمرة الثانية؟\n- she discovered table tennis. اكتشفت تنس الطاولة.", variant: 'blue' },
      { type: 'text', content: "5 | Why did the prostheses help Najla play better?\nلماذا ساعدت الأطراف الصناعية نجلاء على اللعب بشكل أفضل؟\n- Because she could play standing. لأنها استطاعت اللعب واقفة.", variant: 'blue' },
      { type: 'text', content: "6 | How did Najla win the Paralympic gold medal?\nكيف فازت نجلاء بالميدالية الذهبية البارالمبية؟\n- she beat the Tokyo champion 3-1. غلبت بطلة طوكيو 3 - 1.", variant: 'blue' },
      { type: 'text', content: "7 | What did Najla say in an interview before the Paralympics?\nماذا قالت نجلاء في مقابلة قبل الألعاب البارالمبية؟\n- that we can do anything with determination and resolve.\nبأننا نستطيع عمل أي شئ بالعزيمة والإصرار.", variant: 'blue' },
      { type: 'text', content: "P.20 A.B B - Read the article again and choose the correct answer.", variant: 'purple' },
      { type: 'text', content: "1 | What did Najla want to do but couldn't anymore?\nماذا أرادت نجلاء أن تفعل ولكنها لم تستطع بعد ذلك؟\na | go to school الذهاب الى المدرسة\nb | Run around الركض\nc | Use a wheelchair استخدام الكرسي المتحرك", variant: 'blue' },
      { type: 'text', content: "2 | How old was Najla when she started playing table tennis?\nكم كان عمر نجلاء عندما بدأت تلعب تنس الطاولة؟\na | 10\nb | 16\nc | 19", variant: 'blue' },
      { type: 'text', content: "3 | When Najla earned a place in the Iraqi Paralympic team, she started receiving\nعندما حصلت نجلاء على مكان في الفريق البارالمبي العراقي بدأت بالحصول على:\na | financial support دعم مالي\nb | Educational support دعم دراسي\nc | Support from the Paralympic team دعم من الفريق البارالمبي", variant: 'blue' },
      { type: 'text', content: "4 | The prostheses allowed Najla to\nسمحت الأطراف الاصطناعية لنجلاء بأن:\na | Play in a different position تلعب بمركز آخر\nb | Hold the racket with her other hand تمسك المضرب بيدها الأخرى\nc | Take part in competitions تشارك في المنافسات", variant: 'blue' },
      { type: 'text', content: "5 | Najla won the Paris Paralympic gold medal in\nفازت نجلاء بالميدالية الذهبية في بارالمبياد باريس عام:\na | 2020\nb | 2022\nc | 2024", variant: 'blue' }
    ],
    solutions: [
      "1-b, 2-a, 3-a, 4-a, 5-c"
    ],
    questions: []
  },
  {
    id: 49,
    title: "P.21 A.B/B & الأسئلة الاستنتاجية",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.21 A.B B - Read the article again and choose the correct answer.", variant: 'purple' },
      { type: 'text', content: "1 | Najla was only three years old when a bomb changed her life forever.\nكان عمر نجلاء ثلاثة سنوات عندما غيرت قنبلة حياتها للأبد.", variant: 'blue' },
      { type: 'text', content: "2 | Najla had to learn to live in a wheelchair.\nاضطرت نجلاء بأن تتعلم أن تعيش على كرسي متحرك.", variant: 'blue' },
      { type: 'text', content: "3 | When Najla start playing table tennis, she had to learn how to hold the racket in her left hand.\nعندما بدأت نجلاء لعب تنس الطاولة، كان عليها أن تتعلم كيفية حمل المضرب بيدها اليسرى.", variant: 'blue' },
      { type: 'text', content: "4 | Najla joined the Iraqi Paralympic team when she was 12.\nانضمت نجلاء إلى الفريق البارالمبي العراقي عندما كانت 12.", variant: 'blue' },
      { type: 'text', content: "5 | At 16, she won the gold medal in the 2022 Asian Para Games.\nفي سن السادسة عشر فازت بالميدالية الذهبية في دورة الألعاب الآسيوية البارالمبية 2022.", variant: 'blue' },
      { type: 'text', content: "6 | Her opponent in the final match of the Paris Paralympics had won first place in the Games in Tokyo 2020.\nوكان خصمها في المباراة النهائية لدورة البارالمبية في باريس قد فازت بالمركز الأول في دورة الألعاب في طوكيو 2020.", variant: 'blue' },
      { type: 'text', content: "الأسئلة الاستنتاجية الإضافية", variant: 'purple' },
      { type: 'text', content: "Q1 | What happened to Najla Imad Lafta when she was three years old?\nماذا حدث لـ نجلاء عماد لفتة عندما كانت بعمر الثالثة؟\n- A bomb attached to her father's car went off, leaving her badly injured.\nانفجرت قنبلة ملتصقة في سيارة والدها وتركتها متألماً بشكل بليغ.", variant: 'blue' },
      { type: 'text', content: "Q2 | Why did Najla have to train to use her left hand in table tennis?\nلماذا تدربت نجلاء باستخدام يدها اليسرى في لعبة تنس الطاولة؟\n- Because she was born right handed but she lost most of her right arm.\nلأنها ولدت يمنى لكنها خسرت معظم يدها اليمين.", variant: 'blue' },
      { type: 'text', content: "Q3 | Najla lost her left arm and one leg in the explosion. (False / true)\nنجلة فقدت ذراعها الأيسر وساقاً واحدة.", variant: 'blue' },
      { type: 'text', content: "Q4 | She discovered table tennis at the age of ten. (True / false)\nاكتشفت نجلة لعبة تنس الطاولة في سن العاشرة.", variant: 'blue' },
      { type: 'text', content: "Q5 | Najla was naturally left-handed, so learning to play table tennis was easy for her. (False / true)\nكانت نجلاء تستخدم يدها اليسرى لأنها أعسر، لذا تعلم لعب رياضة تنس الطاولة كان سهل بالنسبة لها.", variant: 'blue' }
    ],
    solutions: [
      "Q3-False (Right arm and both legs), Q4-True, Q5-False (She was born right-handed)"
    ],
    questions: []
  },
  {
    id: 50,
    title: "الأسئلة الاستنتاجية (Continued)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "Q6 | Najla became the youngest table tennis player to qualify for the Tokyo 2020 Paralympics. (True / false)\nأصبحت نجلة أصغر لاعبة تنس طاولة تتأهل إلى دورة الألعاب البارالمبية طوكيو 2020.", variant: 'blue' },
      { type: 'text', content: "Q7 | She earned a place in the Iraqi Paralympic team when she was 15 years old. (False / true)\nانضمت نجلاء الى الفريق البارالمبي العراقي في الخامسة عشرة من عمرها.", variant: 'blue' },
      { type: 'text', content: "Q8 | Najla received prostheses and equipment as support when she joined the team. (True / false)\nحصلت نجلاء على أطراف اصطناعية ومعدات كدعم عندما انضمت إلى الفريق.", variant: 'blue' },
      { type: 'text', content: "Q9 | In 2024, Najla lost in the final of the Paralympics. (False / true)\nفي عام 2024 خسرت نجلاء في النهائي.", variant: 'blue' },
      { type: 'text', content: "Q10 | At the age of ten Najla discovered table tennis.\nفي عمر العاشرة اكتشفت نجلاء رياضة تنس الطاولة.", variant: 'blue' },
      { type: 'text', content: "Q11 | She grew up with the help of her parents, siblings, and the Iraqi healthcare system. (True / false)\nنشأت نجلة بدعم من والديها وإخوتها والنظام الصحي العراقي.", variant: 'blue' },
      { type: 'text', content: "Q12 | Najla's story shows that with determination, people can achieve what they want. (True / false)\nقصة نجلة تُظهر أنه بالعزيمة يمكن للناس تحقيق ما يريدون.", variant: 'blue' }
    ],
    solutions: [
      "Q6-True, Q7-False (She was 12), Q8-True, Q9-False (She won gold), Q11-True, Q12-True"
    ],
    questions: []
  },
  {
    id: 51,
    title: "انشاء الوحدة الأولى (Cigarettes Advertising)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "انشاء الوحدة الأولى", variant: 'purple' },
      { type: 'rule', title: "أشياء مهمة لازم تعرفوها قبل كتابة أي انشاء", description: "1 | كتابة العنوان بالدفتر الوزاري 2M\n2 | الأخطاء الاملائية 2M\n3 | الأخطاء القواعدية 2M\n4 | الانشاء لازم يكون بحدود 100-120 كلمة\n5 | مو شرط تحفظ الانشاء او تتقيد بمفرداته تكدر تستعمل مرادفات او تعبر انت\n6 | اهم شي فهم فكرة الانشاء قبل لا تبدي تحفظ", icon: 'sparkle' },
      { type: 'text', content: "“ Cigarettes advertising should be illegal اعلانات السكائر يجب ان تكون غير قانونية ”", variant: 'warning' },
      { type: 'text', content: "فكرة الانشاء: نتكلم بهذا الانشاء أولا عن مضار التدخين و التأثير السلبي له على صحتنا ، ثم ننتقل لاهم عامل يشجع على التدخين و هو الإعلانات و الفئة العمرية المتأثرة بهذه الإعلانات بعد هذا نتكلم عن الأماكن المحتملة لرؤية الإعلانات بها و نختم بوضع حلول لإيقاف هذه الإعلانات في المجتمع.", variant: 'blue' },
      { type: 'text', content: "Smoking is dangerous to health both for active and passive smokers, it harms the lungs and can cause many diseases like cancer. Cigarette advertising is one of the most major reasons for starting smoking among young and children.", variant: 'blue' },
      { type: 'text', content: "لتدخين مضر على صحة المدخن الايجابي و السلبي، انه يؤذي الرئات و يسبب امراض عديدة مثل السرطان. اعلان التدخين احد اهم الاسباب لبدأ التدخين بين الشباب و الاطفال.", variant: 'blue' },
      { type: 'text', content: "We can see this advertising in many different places, we can see it on TV, on buildings walls, on the top of high buildings and even on some clothes.", variant: 'blue' },
      { type: 'text', content: "يمكن رؤية هذه الإعلانات بأماكن مختلفة، على التلفاز، على جدران البنايات، على قمة البنايات وعلى بعض الملابس.", variant: 'blue' },
      { type: 'text', content: "Young and children are not mature enough to know what is right and what is wrong, so they can be cheated by this advertising, more over most of them are hero-worshiping and like to do what their heroes do.", variant: 'blue' },
      { type: 'text', content: "الشباب و الاطفال ليسوا بالغين بما فيه الكفاية ليعرفوا الصواب والخطأ لذلك يمكن ان يخدعوا بهذه الاعلانات و معظمهم يحبون ابطالهم على التلفاز و يحبون ان يقلدوهم.", variant: 'blue' },
      { type: 'text', content: "so this illegal advertising put lives of people in trouble, so we have to stop smoking advertising and make it less Socially acceptable in order to live in a smoke free society. For that my opinion is smoking advertising should be illegal.", variant: 'blue' },
      { type: 'text', content: "لذلك الاعلان غير القانوني يضع حياة الناس في مشكلة لذلك علينا ايقاف اعلان التدخين وجعله اقل مجتمعيا لنعيش في مجتمع خال من التدخين لذلك رأيي بإعلان لذلك يجب ان تكون غير قانونية.", variant: 'blue' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 52,
    title: "انشاء تقليل حوادث السيارات (Car Accidents)",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "P.19A.B How to reduce the number of car accidents كيف نقلل من حوادث السيارات", variant: 'purple' },
      { type: 'text', content: "انشاء تقليل حوادث السيارات المضاف للوحدة الأولى مع انشاء إعلانات السكائر", variant: 'warning' },
      { type: 'text', content: "طلابي واخوتي الابطال كلنا متفقين على ان الانشاء فكرة والفكرة تنفهم لذلك لازم نفهم بالبداية الانشاء من العنوان\nيبدي الانشاء بالتكلم عن خطورة حوادث السيارات المسببة للحوادث الخطرة او الوفيات ثم نتكلم عن أسباب الحوادث و كيفية إمكانية تقليلها نت خلال عدة أمور", variant: 'blue' },
      { type: 'text', content: "Car accidents are one of the leading causes of injuries and deaths worldwide. Many people make car accidents because they don't drive carefully or they get distracted by a lot of things.", variant: 'blue' },
      { type: 'text', content: "تعدّ حوادث السيارات من الأسباب الرئيسية للإصابات والوفيات حول العالم. الكثير من الناس يتسببون بالحوادث لأنهم لا يقودون بشكل حذر او يتشتتون بأشياء كثيرة.", variant: 'blue' },
      { type: 'text', content: "There are many different ways to reduce the number of car accidents, drivers must first respect traffic rules and speed limits.", variant: 'blue' },
      { type: 'text', content: "هنالك العديد من الطرق لتقليل عدد حوادث السيارات، السائقون عليهم أولا ان يحترموا قوانين المرور والالتزام بالسرعة المحدودة.", variant: 'blue' },
      { type: 'text', content: "Moreover, they should avoid using their phones while driving, as distractions are a major cause of accidents and serious injuries not only to them but to other drivers.", variant: 'blue' },
      { type: 'text', content: "علاوة على ذلك، يجب عليهم تجنب استخدام هواتفهم أثناء القيادة، حيث أن التشتيت هو السبب الرئيسي للحوادث والإصابات الخطيرة ليس فقط لهم بل للسائقين الآخرون.", variant: 'blue' },
      { type: 'text', content: "Roads also need regular maintenance, and clear road signs must be installed to guide drivers properly. In addition, governments should organize public lessons to teach people about safe driving habits.", variant: 'blue' },
      { type: 'text', content: "تحتاج الطرق أيضًا إلى صيانة دورية، ويجب تركيب لافتات طرقية واضحة لإرشاد السائقين. بالإضافة إلى ذلك، ينبغي على الحكومات تنظيم دروس عامة لتعليم الناس حول عادات القيادة الآمنة.", variant: 'blue' },
      { type: 'text', content: "Finally, to prevent accidents, drivers should always wear seatbelts, keep a safe distance from other vehicles, and never drive under the influence of alcohol. Taking these precautions can save many lives.", variant: 'blue' },
      { type: 'text', content: "وأخيرًا، لتجنب الحوادث، يُنصح السائقون بارتداء حزام الأمان دائمًا، والحفاظ على مسافة آمنة من المركبات الأخرى، وعدم القيادة تحت تأثير الكحول. اتخاذ هذه الاحتياطات يُنقذ أرواحاً كثيرة.", variant: 'blue' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 53,
    title: "🎉 تهانينا! نهاية الوحدة الأولى",
    unit: "الوحدة الاولى Unit 1",
    items: [
      { type: 'text', content: "لقد أتممت الوحدة الأولى بنجاح باهر! 🏆", variant: 'warning' },
      { type: 'text', content: "أنت الآن تمتلك أساساً قوياً في قواعد الماضي البسيط والمستمر، أدوات الربط، الصفات، الأفعال العبارية، ومفردات طبية هامة. كما اطلعت على قصص ملهمة مثل قصة نجلاء وعمار.", variant: 'blue' },
      { type: 'rule', title: "رسالة تحفيزية لك يا بطل/بطلة", description: "تذكر دائماً أن 'المستحيل هو مجرد كلمة في قاموس العاجزين'. لقد قطعت شوطاً كبيراً، وكل صفحة درستها هي خطوة أقرب نحو حلمك في السادس الإعدادي. استمر بنفس العزيمة، ونحن معك في كل خطوة.", icon: 'sparkle' },
      { type: 'text', content: "استعد للوحدة الثانية.. الرحلة مستمرة والنجاح حليفك! ✨", variant: 'purple' }
    ],
    solutions: [],
    questions: []
  },
  {
    id: 100,
    title: "بداية المسار الشامل - الوحدة الثانية",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "أهلاً بكِ في محطة الوحدة الثانية", variant: 'purple' },
      { type: 'text', content: "هذه الوحدة تركز على القانون والنظام، القواعد العسكرية، والطلبات المؤدبة. استعدي لرحلة تعليمية ممتعة ومنظمة.", variant: 'blue' },
      { type: 'rule', icon: 'sparkle', title: "تنبيه", description: "سيتم إدراج القواعد والتمارين والوزاريات هنا بالتسلسل كما في الملزمة." }
    ],
    solutions: ["ابدئي الرحلة الآن!"],
    questions: [
      { id: 85001, text: "هل أنتِ مستعدة للبدء بالوحدة الثانية؟", options: ["نعم، بكل تأكيد", "سأراجع الوحدة الأولى أولاً"], correctAnswer: 0, explanation: "الوحدة الثانية تتطلب تركيزاً عالياً وإصراراً كبيراً." }
    ]
  },
  {
    id: 101,
    title: "القانون والنظام law and order",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "law and order القانون والنظام", variant: 'purple' },
      { type: 'text', content: "P.18 S.B | معاني مهمة تأتي توصيل", variant: 'warning' },
      {
        type: 'table',
        rows: [
          { source: "footprint", arabic: "بصمة القدم" },
          { source: "fingerprint", arabic: "بصمة الاصبع" },
          { source: "radar speed gun", arabic: "رادار كاشف السرعة" },
          { source: "metal detector", arabic: "كاشف معادن" },
          { source: "X-ray machine", arabic: "ماكنة الاشعة السينية السونار" },
          { source: "Speeding ticket", arabic: "غرامة السرعة" },
          { source: "Conveyor belt", arabic: "الحزام الناقل بالمطار" },
          { source: "security camera", arabic: "كاميرا مراقبة" },
          { source: "crime scene", arabic: "مسرح الجريمة" },
          { source: "speed limit", arabic: "حد السرعة" },
          { source: "security guard", arabic: "حارس امني" },
          { source: "seat belt", arabic: "حزام الأمان" },
          { source: "traffic light", arabic: "إشارة المرور" }
        ]
      },
      { type: 'text', content: "Q Match", variant: 'blue' },
      { type: 'text', content: "1 Seat | b Belt", variant: 'purple' },
      { type: 'text', content: "2 Finger | f Print", variant: 'purple' },
      { type: 'text', content: "3 Speed | c Limit", variant: 'purple' },
      { type: 'text', content: "4 Security | e Camera", variant: 'purple' },
      { type: 'text', content: "5 Metal | a Detector", variant: 'purple' },
      { type: 'text', content: "6 X-ray | d Machine", variant: 'purple' },
      { type: 'text', content: "P.29 A.B | B - Complete each sentence with a word or phrase from the box", variant: 'warning' },
      { type: 'text', content: "هذا التمرين يعتبر مراجعة قواعدية لبعض مواضيع الوحدة الأولى :", variant: 'blue' },
      { type: 'text', content: "1 I used to like travelling, but I don't like it anymore.", variant: 'purple' },
      { type: 'text', content: "2 We were speeding when we saw the police car.", variant: 'purple' },
      { type: 'text', content: "3 While my baggage was going through the X-ray machine, I walked through the metal detector.", variant: 'purple' },
      { type: 'text', content: "4 We didn't use to have security camera, but now we have six of them.", variant: 'purple' },
      { type: 'text', content: "5 I didn't have my passport, so they didn't let me get on the plane.", variant: 'purple' },
      { type: 'text', content: "6 She was walking home when she heard the police siren.", variant: 'purple' },
      { type: 'text', content: "7 I used to watch action films on TV, but now I prefer documentaries.", variant: 'purple' },
      { type: 'text', content: "8 The security guard saw the thieves because he was watching the screen.", variant: 'purple' }
    ],
    solutions: ["تم إكمال التمرين بنجاح."],
    questions: [
      { id: 86011, text: "ما هو معنى fingerprint؟", options: ["بصمة الاصبع", "بصمة القدم", "كاميرا مراقبة", "حد السرعة"], correctAnswer: 0, explanation: "fingerprint تعني بصمة الاصبع." }
    ]
  },

  {
    id: 102,
    title: "Have to | need to | must",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "Have to | need to | must", variant: 'purple' },
      { type: 'text', content: "موضوع الضرورة و عدم الضرورة و المنع مجموعة أدواته : have to , need to, must نمطها الوزاري اختيارات Q2/B Choose", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "التعبير عن شيء ضروري فعله obligation (اجبار)", description: "الفاعل + (have to, need to, must) + مصدر مجرد" },
      { type: 'text', content: "كل الأدوات معناهم (يجب) لضرورة عمل شيء ما لكن (must) تجي اجبار على عمل شيء ما و كل الأدوات يكون الفعل بعدهم مصدر (مجرد)", variant: 'blue' },
      { type: 'rule', icon: 'bulb', title: "التعبير عن شيء غير ضروري فعله it's not necessary to do something او عدم الضرورة non-necessity او غياب الاجبار lack of obligation", description: "الفاعل + (don't have to, needn't) + مصدر مجرد" },
      { type: 'text', content: "الأدوات معناهم (لا يجب) لعدم ضرورة فعل شيء ما. انتبهوا ابطالي هنا من ننفي (need to) نكتبها (needn't) بلا (to)", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "التعبير عن شيء من المهم عدم فعله it's important not to do something او للمنع prohibition و الوقاية prevention نستخدم نفي الأداة (must)", description: "الفاعل + mustn't + مصدر مجرد (ممنوع)" },
      { type: 'text', content: "الأداة (mustn't) محدودة الاستعمال فقط مع الأشياء الخطرة او الممنوعة و بالإمكان الاعتماد على وجود هذه المفردات كدليل عليها: (smoke, angry, dangerous, jump red signals)", variant: 'blue' },
      { type: 'text', content: "P.31 A.B | E", variant: 'warning' },
      { type: 'text', content: "1 Use mustn't to say it's important not to do something.", variant: 'purple' },
      { type: 'text', content: "2 Use needn't and don't have to to say it's not necessary to do something.", variant: 'purple' },
      { type: 'text', content: "3 Use have to, need to and must to say it's necessary to do something.", variant: 'purple' }
    ],
    solutions: ["يجب حفظ استخدامات كل أداة."],
    questions: [
      { id: 87021, text: "ماذا نستخدم للتعبير عن المنع (Prohibition)؟", options: ["mustn't", "needn't", "don't have to", "must"], correctAnswer: 0, explanation: "نستخدم mustn't للمنع." }
    ]
  },
  {
    id: 103,
    title: "تمارين الضرورة والمنع P.31",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "P.31 A.B | F - Use mustn't, have to, don't have to, need to, and needn't to complete the sentences", variant: 'purple' },
      { type: 'text', content: "بنمط تمرين الكتاب ممكن نستعمل اكثر من أداة بالفراغ الواحد المهم فهم الجمل", variant: 'blue' },
      { type: 'text', content: "1 When you get in a car, you (must / have to / need to) put on your seatbelt.", variant: 'purple' },
      { type: 'text', content: "2 There's petrol in the car, so you (don't have to / needn't) go to the petrol station.", variant: 'purple' },
      { type: 'text', content: "3 You're driving too fast! You (must / have to / need to) slow down.", variant: 'purple' },
      { type: 'text', content: "4 Please put out your cigarette. You (mustn't) smoke in the police station.", variant: 'purple' },
      { type: 'text', content: "5 You (don't have to / needn't) pick me up in the car. I'll get the bus.", variant: 'purple' },
      { type: 'text', content: "6 Police officers (must / have to / need to) prevent crimes.", variant: 'purple' },
      { type: 'text', content: "7 I (mustn't) be back later than 8 o'clock tonight or my parents will be angry.", variant: 'purple' },
      { type: 'text', content: "8 Drivers (mustn't) go over the speed limit at any point.", variant: 'purple' },
      { type: 'text', content: "9 Detectives in many counties (don't have to / needn't) wear a uniform, but traffic officers usually do.", variant: 'purple' },
      { type: 'text', content: "10 If you see an accident, you (must / have to / need to) go to the police station and give a statement as a witness.", variant: 'purple' }
    ],
    solutions: ["الحلول موجودة داخل الأقواس."],
    questions: [
      { id: 88031, text: "في جملة التدخين في مركز الشرطة، ماذا نستخدم؟", options: ["mustn't", "needn't", "don't have to", "must"], correctAnswer: 0, explanation: "التدخين في مركز الشرطة ممنوع، لذا نستخدم mustn't." }
    ]
  },
  {
    id: 104,
    title: "امثلة وزارية - الضرورة والمنع",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "امثلة وزارية غير موجودة بتمارين الكتاب", variant: 'purple' },
      { type: 'text', content: "1 You mustn't (drive) without your seatbelt. (correct) -> drive", variant: 'blue' },
      { type: 'text', content: "2 Please put out your cigarette, you (must / mustn't) smoke in the hospital. (2015/3)(2016/1)", variant: 'purple' },
      { type: 'text', content: "3 Hiba (needn't / mustn't) go to the supermarket today because Dana went yesterday. (2020)(2016/2)", variant: 'purple' },
      { type: 'text', content: "4 Abla (need to / needn't) go to the supermarket today because Dana went yesterday. (2020/2)", variant: 'purple' },
      { type: 'text', content: "5 Abla needn't (go / to go) to the supermarket today because Dana went yesterday. (needn't + فعل مجرد بلا to)", variant: 'purple' },
      { type: 'text', content: "6 The car mustn't (have / has) broken lights. (mustn't + فعل مصدر) (2023/3)", variant: 'purple' },
      { type: 'text', content: "7 You (mustn't / don't have to) speak to the driver when the bus is moving. It is dangerous.", variant: 'purple' },
      { type: 'text', content: "8 Drivers (mustn't / don't have to) jump red signals. (2016/2)", variant: 'purple' },
      { type: 'text', content: "9 You (mustn't / don't have to) give me a lift. I'll take the bus. (1/2019)", variant: 'purple' },
      { type: 'text', content: "10 There's food in the fridge. You (need to / needn't) go to the store. (1/2018)", variant: 'purple' },
      { type: 'text', content: "11 We have plentey of time, we (needn't / need to) hurry. (1/2023)", variant: 'purple' },
      { type: 'text', content: "12 I'll be alright, you (needn't / needn't to) worry about me. (1/2024)", variant: 'purple' },
      { type: 'text', content: "P.47 A.B | E - Complete the second sentence so that it has the same meaning as the first", variant: 'warning' },
      { type: 'text', content: "1 It's not necessary for you to pick me up. I'll get a taxi. (not have) -> You don't have to pick me up. I'll get a taxi.", variant: 'blue' },
      { type: 'text', content: "2 You must remember to turn on the alarm. (must not) -> You mustn't forget to turn on the alarm.", variant: 'blue' },
      { type: 'text', content: "3 It's necessary for Basim to pay more attention when he's driving. (need) -> Basim needs to pay more attention when he's driving.", variant: 'blue' }
    ],
    solutions: ["تم إدراج الحلول مع الأمثلة."],
    questions: [
      { id: 89041, text: "ما هو تصحيح الفعل بعد mustn't؟", options: ["مصدر مجرد", "فعل ينتهي بـ ing", "فعل في الماضي", "فعل ينتهي بـ s"], correctAnswer: 0, explanation: "بعد mustn't نستخدم دائماً مصدراً مجرداً." }
    ]
  },
  {
    id: 105,
    title: "تكملة تمارين الضرورة والتعاريف",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "تكملة تمرين P.47", variant: 'purple' },
      { type: 'text', content: "4 It's not necessary for a security guard to carry a gun. (not need) -> A security guard doesn't need a gun.", variant: 'blue' },
      { type: 'text', content: "5 We need to check these radar speed guns once a month. (must) -> These radar speed guns must be checked once a month.", variant: 'blue' },
      { type: 'text', content: "6 It's necessary for Malik to join the military service when he turns 18. (has) -> Malik has to join the military service when he turns 18.", variant: 'blue' },
      { type: 'text', content: "P.32 A.B | A - Match the words and the definitions. Write the words.", variant: 'warning' },
      { type: 'text', content: "من التمارين الي ممكن تجيكم اسقاط Q3/A او توصيل Q3/B و النقاط (3,4) مهمات بالإملاء Q3/C spelling", variant: 'blue' },
      { type: 'text', content: "1 without someone looking after it = unattended (بدون ان يراقبه احد = غير مراقب)", variant: 'purple' },
      { type: 'text', content: "2 bags and suitcases that carry your possessions on a journey = baggage (الحقائب والشنط التي تحمل امتعتك في رحلة = الأمتعة)", variant: 'purple' },
      { type: 'text', content: "3 there is nothing in it = empty (لا يوجد شيء بداخله = فارغ)", variant: 'purple' },
      { type: 'text', content: "4 throw away/get rid of = dispose of (يرمي بعيداً / يتخلص من = يتخلص منه)", variant: 'purple' },
      { type: 'text', content: "5 say you are carrying something you need to pay duty on = declare (قل انك تحمل شيئاً يجب دفع رسوم جمركية عليه = يُصرح / يعلن)", variant: 'purple' },
      { type: 'text', content: "6 when passengers or bags are inspected = screening (عندما يتم تفتيش الركاب او الحقائب = التفتيش الأمني)", variant: 'purple' },
      { type: 'text', content: "7 the amount of liquid people are allowed to carry in their bags = liquids rule (كمية السوائل المسموح للناس بحملها في حقائبهم = قواعد السوائل)", variant: 'purple' },
      { type: 'text', content: "8 they are responsible for regulating international trade = customs (هم المسؤولون عن تنظيم التجارة الدولية = الجمارك)", variant: 'purple' }
    ],
    solutions: ["يجب حفظ هذه التعاريف جيداً."],
    questions: [
      { id: 90051, text: "ما معنى كلمة unattended؟", options: ["غير مراقب", "الأمتعة", "فارغ", "الجمارك"], correctAnswer: 0, explanation: "unattended تعني بدون مراقبة." }
    ]
  },
  {
    id: 106,
    title: "الطلب المؤدب Polite request",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "الطلب المؤدب Polite request", variant: 'purple' },
      { type: 'text', content: "كلهم مواضيع قواعدية بالـ Q2/A يجي واحد منهم بالدور الواحد كل موضوع يحتوي على أدوات كل عنوان لازم تحفظون ادواته", variant: 'warning' },
      { type: 'rule', icon: 'sparkle', title: "Polite request", description: "Can you / Could you / Would you + مصدر + please? | May I + مصدر + please?" },
      { type: 'text', content: "اذا حدد الكم الأداة مجبورين تستعملون الأداة المحددة و اذا ما حدد استعملوا أي أداة صح عدا (may I) بيها شرط و هو فقط مع الفعل (see, get, borrow)", variant: 'blue' },
      { type: 'text', content: "الأمثلة الوزارية و غير الوزارية الموجودة ضمن المنهج اترك الحل الكم فقط تستخدمون أداة معينة و تنزل الجملة كاملة بلا تغيير", variant: 'warning' },
      { type: 'text', content: "1 Give me your passport. (Polite request) -> Could you give me your passport, please?", variant: 'purple' },
      { type: 'text', content: "2 Show me your passport. (Make a request) -> Can you show me your passport, please?", variant: 'purple' },
      { type: 'text', content: "3 See your ticket (passport). (Polite request) -> May I see your ticket, please?", variant: 'purple' },
      { type: 'text', content: "4 Get me a drink of water. (polite request)(use \"would\") -> Would you get me a drink of water, please?", variant: 'purple' },
      { type: 'text', content: "5 Put your bags on the conveyor belt. (polite request) -> Could you put your bags on the conveyor belt, please?", variant: 'purple' },
      { type: 'text', content: "6 Empty your pockets. (polite request) -> Would you empty your pockets, please?", variant: 'purple' },
      { type: 'text', content: "7 Get me an orange soda. (polite request) -> Can you get me an orange soda, please?", variant: 'purple' }
    ],
    solutions: ["تذكر دائماً وضع كلمة please في نهاية الطلب المؤدب."],
    questions: [
      { id: 91061, text: "أي أداة نستخدمها مع الفعل see في الطلب المؤدب؟", options: ["May I", "Can you", "Would you", "Could you"], correctAnswer: 0, explanation: "يفضل استخدام May I مع الفعل see." }
    ]
  },
  {
    id: 107,
    title: "العرض والاقتراح Offer & Suggestion",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "Offer العرض", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "Offer", description: "I'll + مصدر | Shall I + مصدر? | Would you like me to + مصدر? | Would you like + a/an + اسم?" },
      { type: 'text', content: "أي أداة تستعملوها صح اذا ما حدد الكم عدا الأخيرة بيها شرط و هو الشيء المعروض يكون اسم و نعرفه يكون قبله (a, an, some, the)", variant: 'blue' },
      { type: 'text', content: "1 Help you with your homework. (offer) -> I'll help you with your homework.", variant: 'purple' },
      { type: 'text', content: "2 Help your friend with his baggage. (2023/تمهيدي) -> Shall I help you with your baggage? (نحول صفات التملك)", variant: 'purple' },
      { type: 'text', content: "3 Open the window. (offer use: \"shall.\") -> Shall I open the window?", variant: 'purple' },
      { type: 'text', content: "4 Offer to drive your brother to the match. -> Shall I drive you to the match?", variant: 'purple' },
      { type: 'text', content: "5 stay here with the bags if you want. (offer) -> I'll stay here with the bags if you want.", variant: 'purple' },
      { type: 'text', content: "6 Offer to your friend a glass of water. -> Would you like a glass of water?", variant: 'purple' },
      { type: 'text', content: "Suggestion الاقتراح", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "Suggestion", description: "Let's + مصدر | We could + مصدر | Shall we + مصدر?" },
      { type: 'text', content: "اذا ما حدد الكم أداة عادي تستعملون أي أداة صح", variant: 'blue' },
      { type: 'text', content: "1 Take a taxi to the airport. (Make suggestion) -> Let's take a taxi to the airport.", variant: 'purple' },
      { type: 'text', content: "2 Go to the shop before the plane leaves. (Make suggestion) -> We could go to the shop before the plane leaves.", variant: 'purple' },
      { type: 'text', content: "3 Buy some magazine before boarding the plane. (Make suggestion) -> Shall we buy some magazine before boarding the plane?", variant: 'purple' },
      { type: 'text', content: "4 Meet at 3.00 in the departure lounge. (Make suggestion) -> Let's meet at 3.00 in the departure lounge.", variant: 'purple' },
      { type: 'text', content: "5 Let's (watch / watched) the film. (2020/3) -> watch", variant: 'blue' },
      { type: 'text', content: "6 Let's (take / taking) a taxi to the airport. (2023/1) -> take", variant: 'blue' },
      { type: 'text', content: "7 Watch the new film. (Suggestion use: \"shall...\") -> Shall we watch the new film?", variant: 'purple' }
    ],
    solutions: ["انتبه لتحويل الضمائر عند العرض لصديقك."],
    questions: [
      { id: 92071, text: "ما هي أداة الاقتراح التي تنتهي بعلامة استفهام؟", options: ["Shall we", "Let's", "We could", "I'll"], correctAnswer: 0, explanation: "Shall we تستخدم للاقتراح بصيغة سؤال." }
    ]
  },
  {
    id: 108,
    title: "النصيحة Advice و مراجعة شاملة",
    unit: "الوحدة الثانية Unit 2",
    items: [
      { type: 'text', content: "Advice النصيحة", variant: 'purple' },
      { type: 'rule', icon: 'sparkle', title: "Advice", description: "You + Should / shouldn't + مصدر مجرد" },
      { type: 'text', content: "Q2 | A - Give advice الوزاري المطلوب (keeping your home safe)", variant: 'warning' },
      { type: 'text', content: "عبارة عن تسعة جمل ثابتة بالمنهج عن امان المنزل:", variant: 'blue' },
      { type: 'text', content: "1 Keep your passport in a safe place. (give advice) -> You should keep your passport in a safe place.", variant: 'purple' },
      { type: 'text', content: "2 Leave lights on when going out after dark. (give advice) -> You should leave lights on when going out after dark.", variant: 'purple' },
      { type: 'text', content: "3 Give a family member a key. (give advice) -> You should give a family member a key.", variant: 'purple' },
      { type: 'text', content: "4 Ask a neighbour to collect mail. (give advice) -> You should ask a neighbour to collect mail.", variant: 'purple' },
      { type: 'text', content: "5 Tell your neighbors if you are going on holiday. (give advice) -> You should tell your neighbors if you are going on holiday.", variant: 'purple' },
      { type: 'text', content: "6 Always have your baggage with you. (give advice) -> You should always have your baggage with you.", variant: 'purple' },
      { type: 'text', content: "7 Keep keys on a hook by the window. (give advice) -> You shouldn't keep keys on a hook by the window.", variant: 'purple' },
      { type: 'text', content: "8 Keep keys in a flowerpot by the door. (give advice) -> You shouldn't keep keys in a flowerpot by the door.", variant: 'purple' },
      { type: 'text', content: "9 Tell strangers when you will be away. (give advice) -> You shouldn't tell strangers when you will be away.", variant: 'purple' },
      { type: 'text', content: "P.20 S.B | مراجعة شاملة للأنواع الأربعة", variant: 'warning' },
      { type: 'text', content: "1 Would you put your bags on the conveyor belt, please? (polite request)", variant: 'purple' },
      { type: 'text', content: "2 Could you empty your pockets, please? (polite request)", variant: 'purple' },
      { type: 'text', content: "3 Shall we get some magazines before boarding? (suggestion)", variant: 'purple' },
      { type: 'text', content: "4 Let's get some drinks too. (suggestion)", variant: 'purple' },
      { type: 'text', content: "5 I'll stay here with the bags if you want. (offer)", variant: 'purple' },
      { type: 'text', content: "6 Can you get me an orange soda? (polite request)", variant: 'purple' },
      { type: 'text', content: "7 You should always have your baggage with you. (advice)", variant: 'purple' }
    ],
    solutions: ["تم تحديد نوع كل جملة."],
    questions: [
      { id: 93081, text: "ماذا نستخدم لإعطاء نصيحة بعدم فعل شيء؟", options: ["You shouldn't", "You should", "Let's", "Shall we"], correctAnswer: 0, explanation: "نستخدم shouldn't للنصيحة السلبية." }
    ]
  },
];
