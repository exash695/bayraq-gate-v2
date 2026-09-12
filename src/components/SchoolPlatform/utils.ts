export const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") console.log(...args);
};

export const debugError = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") console.error(...args);
};

export const debugWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") console.warn(...args);
};

// Firestore does not support nested arrays. This helper flattens or converts them.
export const sanitizeForFirestore = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (Array.isArray(item)) {
        const objForm: any = {};
        item.forEach((subItem, idx) => {
          objForm[`_${idx}`] = sanitizeForFirestore(subItem);
        });
        return objForm;
      } else if (item !== null && typeof item === "object") {
        return sanitizeForFirestore(item);
      }
      return item;
    });
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key]?.toDate && typeof obj[key].toDate === "function") {
        newObj[key] = obj[key];
      } else {
        newObj[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

// Web Audio API custom soundtrack synthesizer for Excellence Diaries (Success story ambient study tracks)
let storyAudioCtx: AudioContext | null = null;
export const initStoryAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass && !storyAudioCtx) {
    try {
      storyAudioCtx = new AudioContextClass();
    } catch (e) {}
  }
  if (storyAudioCtx?.state === "suspended") {
    storyAudioCtx.resume().catch(() => {});
  }
  return storyAudioCtx;
};
let storySynthGain: GainNode | null = null;
let storySequenceInterval: any = null;

export const stopStoryAudio = () => {
  if (storySequenceInterval) {
    clearInterval(storySequenceInterval);
    storySequenceInterval = null;
  }
  if (storySynthGain) {
    try {
      storySynthGain.gain.setValueAtTime(storySynthGain.gain.value, 0);
      storySynthGain.gain.exponentialRampToValueAtTime(0.0001, 0.2);

      setTimeout(() => {
        if (storySynthGain) {
          storySynthGain.disconnect();
          storySynthGain = null;
        }
      }, 250);
    } catch (e) {}
  }
};

export const playStoryAudio = (trackName: string) => {
  stopStoryAudio();
  if (!trackName || trackName === "none") return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!storyAudioCtx) {
      storyAudioCtx = new AudioContextClass();
    }

    if (storyAudioCtx.state === "suspended") {
      storyAudioCtx.resume().catch(() => {});
    }

    storySynthGain = storyAudioCtx.createGain();
    storySynthGain.gain.setValueAtTime(0.08, storyAudioCtx.currentTime);
    storySynthGain.connect(storyAudioCtx.destination);

    let step = 0;
    let notes: number[] = [];

    if (trackName === "heroes") {
      notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    } else if (trackName === "study") {
      notes = [220.0, 277.18, 329.63, 440.0];
    } else if (trackName === "victory") {
      notes = [329.63, 392.0, 523.25, 659.25, 523.25, 392.0];
    } else {
      return;
    }

    const playNote = (
      freq: number,
      duration: number,
      type: "sine" | "triangle" | "sawtooth",
    ) => {
      if (!storyAudioCtx || !storySynthGain) return;
      try {
        const osc = storyAudioCtx.createOscillator();
        const noteGain = storyAudioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, storyAudioCtx.currentTime);

        noteGain.gain.setValueAtTime(0.08, storyAudioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(
          0.0001,
          storyAudioCtx.currentTime + duration,
        );

        osc.connect(noteGain);
        noteGain.connect(storySynthGain);

        osc.start();
        osc.stop(storyAudioCtx.currentTime + duration);
      } catch (err) {}
    };

    storySequenceInterval = setInterval(
      () => {
        if (!storyAudioCtx || storyAudioCtx.state === "suspended") {
          storyAudioCtx?.resume();
        }

        if (trackName === "heroes") {
          const note = notes[step % notes.length];
          playNote(note, 0.7, "sine");
          if (step % 3 === 0) {
            playNote(note / 2, 1.4, "triangle");
          }
        } else if (trackName === "study") {
          const chord = [
            notes[step % notes.length],
            notes[(step + 2) % notes.length],
          ];
          chord.forEach((n) => playNote(n, 2.0, "sine"));
        } else if (trackName === "victory") {
          const note = notes[step % notes.length];
          playNote(note, 0.45, "triangle");
          if (step % 4 === 0) {
            playNote(note * 1.5, 0.3, "sine");
          }
        }
        step++;
      },
      trackName === "victory" ? 450 : trackName === "study" ? 1400 : 550,
    );
  } catch (err) {
    console.warn("Web Audio Context not initialized:", err);
  }
};

export const getSimulatedFileContent = (title: string, subject: string) => {
  const normSubject = (subject || "").replace(/[أإآ]/g, "ا");
  const normTitle = (title || "").replace(/[أإآ]/g, "ا");

  if (normSubject.includes("عربية") || normTitle.includes("عربية")) {
    return {
      subtitle: "ملخص القواعد الذهبية والوزاريات المرشحة للفرسان",
      sections: [
        {
          heading: "المبحث الأول: تقديم الخبر على المبتدأ وجوباً",
          body: `يُقدَّم الخبر على المبتدأ وجوباً في عدة مواضع لتلافي الأخطاء النحوية والتركيبية، ومن أهمها:
1. إذا كان في المبتدأ ضمير يعود على بعض الخبر: مثل (في الصدقِ نجاتُه). الهاء في (نجاته) تعود على الصدق وهو مضاف إليه الخبر. لو قيل (نجاته في الصدق) لعاد الضمير على متأخر لفظاً ورتبة وهو ممتنع.
2. إذا كان الخبر من الألفاظ التي لها الصدارة في الكلام: مثل أسماء الاستفهام الدالة على الزمان أو المكان أو الحال (متى، أين، كيف)، كقوله تعالى: (يسألونك عن الساعة أيان مرساها).
3. إذا كان الخبر مقصوراً على المبتدأ: بالقصر بـ (إنما) أو بالنفي والاستثناء المفرغ، مثل (إنما عادلٌ اللهُ) أو (ما شاعرٌ إلا المتنبي).`,
          hasReveal: true,
          revealLabel: "اضغط لعرض سؤال وزاري تطبيقي وحله النموذجي 📝",
          revealText: `س/ قال الشاعر: (ولي أملٌ وحيدٌ لستُ أثني ... على شيءٍ سواه وهو سؤلي)
ما حكم تقديم الخبر (لي) في الشطر الأول؟ ولماذا؟
ج/ حكم التقديم: جوازاً، لأن المبتدأ (أملٌ) نكرة مخصصة بالوصف (وحيدٌ).`,
        },
        {
          heading: "المبحث الثاني: أحكام النفي بـ (ليس) و (ما) الحجازية",
          body: `• ليس: فعل ماضٍ ناقص جامد يفيد النفي، يعمل دون قيد أو شرط (يرفع المبتدأ وينصب الخبر).
• ما الحجازية المشبهة بليس: تعمل عمل ليس بشَرطين:
1. ألا يتقدم خبرها على اسمها.
2. ألا ينتقض نفيها بـ (إلا).`,
          hasReveal: true,
          revealLabel: "اضغط لعرض ملاحظة وزارية دقيقة 💡",
          revealText: `فائدة وزارية: إذا انتقض نفي (ما) بـ (إلا)، بطل عملها وأصبحت (ما مهملة)، ويعرب ما بعدها مبتدأ وخبراً مرفوعين. مثال: (وما الحياةُ الدنيا إلا متاعُ الغرور).`,
        },
      ],
    };
  } else if (normSubject.includes("فيزياء") || normTitle.includes("فيزياء")) {
    return {
      subtitle: "المفاهيم الأساسية، القوانين المبرهنة، وحلول المسائل النموذجية",
      sections: [
        {
          heading: "الفصل الأول: المتسعات (Capacitors) والقوانين الرياضية",
          body: `المتسعة: جهاز يُستعمل لتخزين الشحنات الكهربائية والطاقة الكامنة في المجال الكهربائي، وتتألف من زوج أو أكثر من الصفائح الموصلة يفصل بينها عازل.
• سعة المتسعة: C = Q / ΔV (بالفاراد F).
• العوامل المؤثرة في سعة المتسعة ذات الصفيحتين المتوازيتين:
1. المساحة السطحية المتقابلة للصفيحتين (تناسب طردي).
2. البعد بين الصفيحتين (تناسب عكسي).
3. نوع الوسط العازل بين الصفيحتين (يزداد بإدخال عازل قطبي أو غير قطبي: Ck = K * C).`,
          hasReveal: true,
          revealLabel: "اضغط لعرض تعليل وزاري مكرر ⚡",
          revealText: `علل وزاري: يقل مقدار المجال الكهربائي بين صفيحتي متسعة عند إدخال مادة عازلة بين صفيحتيها؟
الجواب: لأن المجال الكهربائي المتولد في العازل (Ed) يعاكس باتجاهه المجال الأصلي بين الصفيحتين (E)، فيكون المجال المحصل: Ek = E - Ed، فيقل بنسبة ثابت العزل K.`,
        },
        {
          heading: "الطاقة المختزنة في المجال الكهربائي للمتسعة",
          body: `تُحسب الطاقة الكامنة الكهربائية المختزنة (PEelectric) بإحدى العلاقات الثلاث الآتية:
1. PE = 1/2 * Q * ΔV
2. PE = 1/2 * C * (ΔV)^2
3. PE = 1/2 * (Q^2) / C`,
          hasReveal: true,
          revealLabel: "اضغط لعرض قانون القدرة الكهربائية 🔋",
          revealText: `القدرة الكهربائية المستثمرة = الطاقة المختزنة / زمن التفريغ: Power = PE / t (بالواط Watt).`,
        },
      ],
    };
  } else if (normSubject.includes("كيمياء") || normTitle.includes("كيمياء")) {
    return {
      subtitle: "قوانين الثرموداينمك، الاتزان الكيميائي، والمسائل الوزارية",
      sections: [
        {
          heading: "الفصل الأول: الثرموداينمك وقانون هيس (Hess's Law)",
          body: `علم الثرموداينمك: علم يهتم بدراسة الطاقة وتحولاتها، ويهدف نحو تحويل أكبر قدر ممكن من الطاقة الحرارية الناتجة من احتراق الوقود إلى أنواع أخرى من الطاقات.
• قانون هيس: عند تحويل المتفاعلات إلى نواتج، فإن التغير في انثالبي التفاعل (ΔHr) هو نفسه سواء تم التفاعل في خطوة واحدة أو في سلسلة من الخطوات.`,
          hasReveal: true,
          revealLabel: "اضغط لعرض علاقة كبس (Gibbs Free Energy) ⚗️",
          revealText: `علاقة كبس لحساب تلقائية التفاعل: ΔG = ΔH - T * ΔS
• إذا كانت ΔG سالبة: التفاعل تلقائي.
• إذا كانت ΔG موجبة: التفاعل غير تلقائي.
• إذا كانت ΔG = 0: النظام في حالة اتزان.`,
        },
      ],
    };
  } else if (normSubject.includes("انجليزي") || normSubject.includes("english") || normTitle.includes("انجليزي")) {
    return {
      subtitle: "Comprehensive Grammar Summaries, Vocabulary & Ministerial Rules",
      sections: [
        {
          heading: "Unit 1: Past Simple vs. Past Continuous with Linking Words",
          body: `We use the Past Continuous for the longer background action, and the Past Simple for the shorter interrupting action.
• As / While + Past Continuous (was/were + v-ing), + Past Simple (v-ed / irregular).
Example: While I was studying, the phone rang.
• When / And + Past Simple, + Past Continuous.
Example: I was driving fast when a dog ran into the road.`,
          hasReveal: true,
          revealLabel: "Click to reveal Ministerial Practice Examples 🇬🇧",
          revealText: `Ministerial Exam Question:
1. She (tell) us to be quiet as we (make) too much noise. (Correct the verbs)
Answer: She told us to be quiet as we were making too much noise.`,
        },
        {
          heading: "Used to & Comparisons",
          body: `Used to is used to describe habits or states in the past that are no longer true today.
• Affirmative: Subject + used to + infinitive.
• Negative: Subject + didn't use to + infinitive.
• Question: Did + Subject + use to + infinitive?`,
          hasReveal: true,
          revealLabel: "Click to view comparison rules ✍️",
          revealText: `Example: Cities are more crowded now than they used to be. / Cities aren't as quiet as they used to be.`,
        },
      ],
    };
  } else {
    return {
      subtitle: "المحتوى الدراسي المعتمد - التلخيص الشامل والوزاريات النموذجية",
      sections: [
        {
          heading: "الملخص الشامل والمراجعة المركزة",
          body: `يحتوي هذا الملف على أهم القواعد والمفاهيم العلمية والوزارية الذهبية التي تم استخراجها وتدقيقها بنسبة 100% لتطابق النسخة المعتمدة.
يرجى التركيز على المراجعة المركزة للمواضيع الأساسية وحل الأسئلة الملحقة لضمان تحصيل الدرجة الكاملة في الامتحان النهائي.`,
          hasReveal: true,
          revealLabel: "اضغط لعرض وصية أستاذ المادة للتفوق 👑",
          revealText: `التفوق لا يأتي صدفة، بل هو نتاج تنظيم الوقت، والاعتماد على الملخصات المركزة، وحل جميع وزاريات المادة من عام 2015 وحتى العام الحالي بكل دقة وكتابة.`,
        },
      ],
    };
  }
};

export const generateQuestionsForDocument = (
  title: string,
  subject: string,
): any[] => {
  if (subject === "اللغة العربية") {
    return [
      {
        id: "q1",
        text: `ما حكم تقديم الخبر على المبتدأ وجوباً إذا كان في المبتدأ ضمير يعود على بعض الخبر؟`,
        options: [
          "تقديم واجب لتجنب عودة الضمير على متأخر لفظاً ورتبة",
          "تقديم جائز لأن المبتدأ معرفة",
          "تقديم واجب لأن المبتدأ نكرة غير مخصصة",
          "تقديم ممتنع لا يجوز",
        ],
        correctAnswer: 0,
      },
      {
        id: "q2",
        text: `في جملة (من ذا يعيرك عينه تبكي بها)، ما إعراب اسم الاستفهام (من ذا) معللاً؟`,
        options: [
          "مبتدأ لأن تلاه فعل متعدٍ استوفى مفعوله",
          "مفعول به مقدم وجوباً لأن تلاه فعل متعدٍ لم يستوفِ مفعوله",
          "خبر مقدم وجوباً لأن تلاه اسم معرفة",
          "مبتدأ أو خبر مقدم لأن تلاه اسم معرفة",
        ],
        correctAnswer: 0,
      },
    ];
  } else if (subject === "الفيزياء") {
    return [
      {
        id: "q1",
        text: `ماذا يحصل لمقدار المجال المغناطيسي والكهربائي بين لوحي متسعة مشحونة ومفصولة عن المصدر عند إدخال مادة عازلة ثابت عزلها K > 1؟`,
        options: [
          "يقل بنسبة ثابت العزل K نتيجة تولد مجال كهربائي داخل العازل معاكس للمجال الخارجي",
          "يزداد بنسبة ثابت العزل K نتيجة زيادة الشحنة",
          "يبقى ثابتاً لأن المتسعة مفصولة",
          "يصبح صفراً مباشرة",
        ],
        correctAnswer: 0,
      },
      {
        id: "q2",
        text: `ما الفائدة العملية من ربط المتسعات على التوازي في الدوائر الكهربائية؟`,
        options: [
          "زيادة السعة المكافئة للمجموعة لتخزين شحنة أكبر بفرق جهد ثابت",
          "تقليل السعة المكافئة لزيادة فرق الجهد وتحمل جهد أكبر",
          "منع مرور التيار المستمر في الدائرة",
          "توليد موجات راديوية عالية التردد",
        ],
        correctAnswer: 0,
      },
    ];
  } else if (subject === "الكيمياء") {
    return [
      {
        id: "q1",
        text: `على ماذا تنص قاعدة هوند في الكيمياء عند توزيع الإلكترونات في الأوربيتالات؟`,
        options: [
          "لا يحدث ازدواج بين إلكترونين في مستوى طاقة ثانوي إلا بعد أن تشغل أوربيتالاته فرادى أولاً",
          "لا يمكن لإلكترونين في نفس الذرة أن يكون لهما نفس أرقام الكم الأربعة",
          "طاقة التفاعل الكيميائي ثابتة سواء تم في خطوة واحدة أو عدة خطوات",
          "تزداد سرعة التفاعل بزيادة تركيز المواد المتفاعلة",
        ],
        correctAnswer: 0,
      },
      {
        id: "q2",
        text: `ما هي علاقة كبس الحرة (Gibbs Equation) لحساب تلقائية التفاعلات الكيميائية؟`,
        options: [
          "ΔG = ΔH - TΔS",
          "ΔH = ΔG + TΔS",
          "ΔS = ΔH / T",
          "ΔG = ΔH + TΔS",
        ],
        correctAnswer: 0,
      },
    ];
  } else if (subject === "اللغة الإنجليزية") {
    return [
      {
        id: "q1",
        text: `Which tense do we use to describe a continuous background action that was interrupted by a shorter action in the past?`,
        options: [
          "Past Continuous (was/were + v-ing)",
          "Past Simple (v-ed or irregular)",
          "Present Perfect",
          "Past Perfect",
        ],
        correctAnswer: 0,
      },
      {
        id: "q2",
        text: `Choose the correct option: While I (eat) breakfast, a bird (fly) into the kitchen.`,
        options: [
          "was eating / flew",
          "ate / was flying",
          "was eating / flied",
          "had eaten / flew",
        ],
        correctAnswer: 0,
      },
    ];
  } else {
    return [
      {
        id: "q1",
        text: `ما هي أهم طريقة للمراجعة المركزة قبل الامتحانات الوزارية لضمان الحفظ المتقن؟`,
        options: [
          "حل الأسئلة الوزارية للسنوات السابقة مكررة مع الكتابة اليدوية للحلول",
          "القراءة الشفوية السريعة دون تدوين الملاحظات",
          "حفظ الأجوبة دون فهم القواعد العلمية الأساسية",
          "تجنب حل الاختبارات والاعتماد على قراءة الملزمة فقط",
        ],
        correctAnswer: 0,
      },
      {
        id: "q2",
        text: `كيف يساهم رادار الذكاء الاصطناعي في تثبيت معلومات المنهج الدراسي للطلبة؟`,
        options: [
          "عبر استنتاج روابط بين الفصول واقتراح أسئلة تلامس الأخطاء الشائعة وتحفيز الفهم الفوري",
          "عبر إيجاد أجوبة جاهزة دون تفكير من الطالب",
          "عبر توفير ملازم مكررة ومطابقة تماماً للملازم القديمة دون تجديد",
          "عبر تقليص المنهج وحذف مواضيع حيوية مهمة وزراياً",
        ],
        correctAnswer: 0,
      },
    ];
  }
};

export const getSanitizedVideoUrl = (url: string) => {
  if (!url) return "";
  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  ) {
    return url;
  }
  if (url.includes("/api/video-proxy")) {
    return url;
  }
  return (
    window.location.origin +
    "/api/video-proxy?url=" +
    encodeURIComponent(url)
  );
};

export const formatLectureDescription = (description?: string | null, grade?: string | null): string => {
  const cleanGrade = (grade && grade !== "الكل" && grade !== "عام") ? grade.trim() : "";
  
  if (!description || description.trim() === "") {
    return cleanGrade 
      ? `محاضرة مرئية منشورة لفرسان ${cleanGrade} الأبطال`
      : "محاضرة مرئية منشورة لفرسان الصف الأبطال";
  }

  let text = description.trim();

  // If the description mentions "السادس" but the actual grade is different (e.g., "ثالث متوسط", "رابع علمي", etc.)
  if (cleanGrade && !cleanGrade.includes("سادس") && !cleanGrade.includes("السادس")) {
    text = text.replace(/لفرسان السادس الأبطال/g, `لفرسان ${cleanGrade} الأبطال`);
    text = text.replace(/لفرسان السادس/g, `لفرسان ${cleanGrade}`);
    text = text.replace(/صفوف السادس/g, `صفوف ${cleanGrade}`);
    text = text.replace(/فرسان السادس الأبطال/g, `فرسان ${cleanGrade} الأبطال`);
    text = text.replace(/فرسان السادس/g, `فرسان ${cleanGrade}`);
    text = text.replace(/يا فرسان السادس الأبطال/g, `يا فرسان ${cleanGrade} الأبطال`);
    text = text.replace(/يا فرسان السادس/g, `يا فرسان ${cleanGrade}`);
    text = text.replace(/طلبة السادس/g, `طلبة ${cleanGrade}`);
    text = text.replace(/لطلبة السادس/g, `لطلبة ${cleanGrade}`);
  }

  return text;
};

export const getStageHeaderForGrade = (gradeStr?: string | null): string => {
  const rawGrade = (gradeStr || "").trim();
  const g = rawGrade.toLowerCase();

  if (
    g.includes("ابتدائ") ||
    g.includes("ابتدائي") ||
    g.includes("اول ابتدائي") ||
    g.includes("أول ابتدائي") ||
    g.includes("ثاني ابتدائي") ||
    g.includes("ثالث ابتدائي") ||
    g.includes("رابع ابتدائي") ||
    g.includes("خامس ابتدائي") ||
    g.includes("سادس ابتدائي")
  ) {
    return rawGrade ? `الدراسة الابتدائية (${rawGrade})` : "الدراسة الابتدائية";
  }

  if (
    g.includes("متوسط") ||
    g.includes("متوسطة") ||
    g.includes("اول متوسط") ||
    g.includes("أول متوسط") ||
    g.includes("ثاني متوسط") ||
    g.includes("ثالث متوسط")
  ) {
    return rawGrade ? `الدراسة المتوسطة (${rawGrade})` : "الدراسة المتوسطة";
  }

  if (
    g.includes("اعداد") ||
    g.includes("إعداد") ||
    g.includes("علمي") ||
    g.includes("ادبي") ||
    g.includes("أدبي") ||
    g.includes("احيائي") ||
    g.includes("تطبيقي") ||
    g.includes("سادس") ||
    g.includes("خامس") ||
    g.includes("رابع")
  ) {
    let branch = "";
    if (g.includes("علمي") || g.includes("احيائي") || g.includes("تطبيقي")) {
      branch = " (العلمي)";
    } else if (g.includes("ادبي") || g.includes("أدبي")) {
      branch = " (الأدبي)";
    } else if (rawGrade) {
      branch = ` (${rawGrade})`;
    }
    return `الدراسة الإعدادية${branch}`;
  }

  if (rawGrade && rawGrade !== "عام" && rawGrade !== "الكل") {
    return `الدراسة الأكاديمية (${rawGrade})`;
  }

  return "الدراسة الإعدادية";
};

export const downloadDocumentFile = async (
  url: string,
  filename: string,
  fileId?: string,
  onNotify?: (msg: string, type: "info" | "success" | "error") => void,
  onProgress?: (progress: number) => void
) => {
  try {
    if (onNotify) onNotify("جاري تجهيز وتنزيل الملف... 📥", "info");

    const cleanFilename = filename.toLowerCase().endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;

    if (fileId) {
      try {
        fetch(`/api/school-files/${fileId}/download`, { method: "POST" }).catch(() => {});
      } catch (e) {}
    }

    // Handle Data URL (Base64)
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      const mime = parts[0]?.split(";")[0]?.split(":")[1] || "application/pdf";
      const byteCharacters = atob(parts[1] || "");
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      if (onProgress) onProgress(100);
      if (onNotify) onNotify("تم تنزيل وحفظ الملف بنجاح! ✅", "success");
      return;
    }

    // Handle Blob URL
    if (url.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = url;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onProgress) onProgress(100);
      if (onNotify) onNotify("تم تنزيل وحفظ الملف بنجاح! ✅", "success");
      return;
    }

    // Attempt direct blob download first with stream for progress
    try {
      const resp = await fetch(url, { mode: "cors" });
      if (resp.ok && resp.body) {
        const contentLength = resp.headers.get("content-length");
        const total = parseInt(contentLength || "0", 10);
        let loaded = 0;

        const reader = resp.body.getReader();
        const stream = new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                loaded += value.byteLength;
                if (total && onProgress) {
                  onProgress(Math.round((loaded / total) * 100));
                }
                controller.enqueue(value);
                push();
              });
            }
            push();
          }
        });
        const newResponse = new Response(stream);
        const blob = await newResponse.blob();
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        if (onProgress) onProgress(100);
        if (onNotify) onNotify("تم تنزيل وحفظ الملف بنجاح! ✅", "success");
        return;
      }
    } catch (directErr) {
      // CORS blocked or failed, fallback to server proxy
    }

    // Fallback: use server download proxy
    if (onProgress) onProgress(100);
    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}`;
    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = cleanFilename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) onNotify("تم بدء تنزيل الملف! ✅", "success");
  } catch (error) {
    console.error("Document download failed, fallback to window.open", error);
    window.open(url, "_blank");
    if (onNotify) onNotify("تم فتح الملف في نافذة جديدة للتنزيل", "info");
  }
};
