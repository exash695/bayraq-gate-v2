export interface CollegeInfo {
  id: string;
  name: string;
  branch: 'scientific' | 'literary' | 'both';
  minGpa: number;
  category: 'medical' | 'engineering' | 'science' | 'humanities' | 'administration';
}

export interface UniversityInfo {
  id: string;
  name: string;
  location: string;
  colleges: CollegeInfo[];
}

export const IRAQ_UNIVERSITIES: UniversityInfo[] = [
  {
    id: 'u_baghdad',
    name: 'جامعة بغداد',
    location: 'بغداد',
    colleges: [
      { id: 'u_baghdad_med_main', name: 'كلية الطب', branch: 'scientific', minGpa: 101.41, category: 'medical' },
      { id: 'u_baghdad_med_kindi', name: 'كلية طب الكندي', branch: 'scientific', minGpa: 100.77, category: 'medical' },
      { id: 'u_baghdad_dentistry', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.43, category: 'medical' },
      { id: 'u_baghdad_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 99.14, category: 'medical' },
      { id: 'u_baghdad_eng_arch', name: 'كلية الهندسة - قسم العمارة والتصميم', branch: 'scientific', minGpa: 98.43, category: 'engineering' },
      { id: 'u_baghdad_biomedical', name: 'كلية الهندسة الخوارزمي - الطب الحياتي', branch: 'scientific', minGpa: 97.57, category: 'engineering' },
      { id: 'u_baghdad_petroleum', name: 'كلية الهندسة - قسم النفط والغاز', branch: 'scientific', minGpa: 97.57, category: 'engineering' },
      { id: 'u_baghdad_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 96.71, category: 'engineering' },
      { id: 'u_baghdad_aviation', name: 'كلية الهندسة - قسم الطيران والملاحة', branch: 'scientific', minGpa: 96.71, category: 'engineering' },
      { id: 'u_baghdad_computer', name: 'كلية الهندسة - هندسة الحاسبات', branch: 'scientific', minGpa: 95.43, category: 'engineering' },
      { id: 'u_baghdad_electrical', name: 'كلية الهندسة - قسم الكهرباء', branch: 'scientific', minGpa: 93.57, category: 'engineering' },
      { id: 'u_baghdad_electronics', name: 'كلية الهندسة - قسم الالكترونيك والاتصالات', branch: 'scientific', minGpa: 93.29, category: 'engineering' },
      { id: 'u_baghdad_chemical', name: 'كلية الهندسة - قسم الكيمياوية الحيوية', branch: 'scientific', minGpa: 92.43, category: 'engineering' },
      { id: 'u_baghdad_science_biotech', name: 'كلية العلوم - التقنيات الإحيائية والدقيقة', branch: 'scientific', minGpa: 86.20, category: 'science' },
      { id: 'u_baghdad_law_sci', name: 'كلية القانون (للعلمي)', branch: 'scientific', minGpa: 92.86, category: 'humanities' },
      { id: 'u_baghdad_law_lit', name: 'كلية القانون (للأدبي)', branch: 'literary', minGpa: 86.14, category: 'humanities' },
      { id: 'u_baghdad_admin_sci', name: 'كلية الإدارة والاقتصاد (للعلمي)', branch: 'scientific', minGpa: 68.14, category: 'administration' },
      { id: 'u_baghdad_admin_lit', name: 'كلية الإدارة والاقتصاد (للأدبي)', branch: 'literary', minGpa: 62.57, category: 'administration' },
      { id: 'u_baghdad_english_sci', name: 'كلية التربية ابن رشد - قسم اللغة الانكليزية (علمي)', branch: 'scientific', minGpa: 90.00, category: 'humanities' },
      { id: 'u_baghdad_english_lit', name: 'كلية التربية ابن رشد - قسم اللغة الانكليزية (أدبي)', branch: 'literary', minGpa: 81.71, category: 'humanities' },
      { id: 'u_baghdad_eng_khwarizmi_biochemical', name: 'كلية الهندسة الخوارزمي - قسم الهندسة الكيميائية الإحيائية', branch: 'scientific', minGpa: 92.57, category: 'engineering' },
      { id: 'u_baghdad_eng_khwarizmi_info_comm', name: 'كلية الهندسة الخوارزمي - قسم هندسة المعلومات والاتصالات', branch: 'scientific', minGpa: 92.03, category: 'engineering' }
    ]
  },
  {
    id: 'u_mustansiriya',
    name: 'الجامعة المستنصرية',
    location: 'بغداد',
    colleges: [
      { id: 'u_must_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.29, category: 'medical' },
      { id: 'u_must_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.28, category: 'medical' },
      { id: 'u_must_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.63, category: 'medical' },
      { id: 'u_must_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 97.90, category: 'engineering' },
      { id: 'u_must_eng_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 95.29, category: 'engineering' },
      { id: 'u_must_eng_comp', name: 'كلية الهندسة - قسم الحاسوب والشبكات', branch: 'scientific', minGpa: 92.90, category: 'engineering' },
      { id: 'u_must_law_sci', name: 'كلية القانون (فرع علمي)', branch: 'scientific', minGpa: 91.29, category: 'humanities' },
      { id: 'u_must_law_lit', name: 'كلية القانون (فرع أدبي)', branch: 'literary', minGpa: 80.00, category: 'humanities' },
      { id: 'u_must_admin_sci', name: 'كلية الإدارة والاقتصاد (علمي)', branch: 'scientific', minGpa: 66.71, category: 'administration' },
      { id: 'u_must_admin_lit', name: 'كلية الإدارة والاقتصاد (أدبي)', branch: 'literary', minGpa: 60.43, category: 'administration' },
      { id: 'u_must_english_sci', name: 'كلية التربية - قسم اللغة الانكليزية (علمي)', branch: 'scientific', minGpa: 88.26, category: 'humanities' },
      { id: 'u_must_english_lit', name: 'كلية التربية - قسم اللغة الانكليزية (أدبي)', branch: 'literary', minGpa: 76.29, category: 'humanities' }
    ]
  },
  {
    id: 'u_alnahrain',
    name: 'جامعة النهرين',
    location: 'بغداد',
    colleges: [
      { id: 'u_nahrain_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.71, category: 'medical' },
      { id: 'u_nahrain_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.71, category: 'medical' },
      { id: 'u_nahrain_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 98.03, category: 'engineering' },
      { id: 'u_nahrain_eng_biomed', name: 'كلية الهندسة - الطب الحياتي والذكاء الاصطناعي', branch: 'scientific', minGpa: 97.43, category: 'engineering' },
      { id: 'u_nahrain_cyber', name: 'كلية هندسة المعلومات - الأمن السيبراني والشبكات', branch: 'scientific', minGpa: 96.46, category: 'engineering' },
      { id: 'u_nahrain_ai_robotics', name: 'كلية الهندسة - الذكاء الاصطناعي والإنسان الآلي', branch: 'scientific', minGpa: 96.00, category: 'engineering' },
      { id: 'u_nahrain_law_sci', name: 'كلية الحقوق والقانون (علمي)', branch: 'scientific', minGpa: 88.86, category: 'humanities' },
      { id: 'u_nahrain_law_lit', name: 'كلية الحقوق والقانون (أدبي)', branch: 'literary', minGpa: 79.57, category: 'humanities' },
      { id: 'u_nahrain_admin_sci', name: 'كلية اقتصاديات الأعمال (علمي)', branch: 'scientific', minGpa: 73.29, category: 'administration' },
      { id: 'u_nahrain_admin_lit', name: 'كلية اقتصاديات الأعمال (أدبي)', branch: 'literary', minGpa: 63.29, category: 'administration' },
      { id: 'u_nahrain_eng_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 95.86, category: 'engineering' },
      { id: 'u_nahrain_eng_laser', name: 'كلية الهندسة - قسم هندسة الليزر', branch: 'scientific', minGpa: 95.71, category: 'engineering' },
      { id: 'u_nahrain_eng_prosthetics', name: 'كلية الهندسة - قسم الأطراف والمساند الصناعية', branch: 'scientific', minGpa: 95.29, category: 'engineering' },
      { id: 'u_nahrain_info_automation', name: 'كلية هندسة المعلومات - قسم الأتمتة والذكاء الاصطناعي', branch: 'scientific', minGpa: 95.00, category: 'engineering' },
      { id: 'u_nahrain_eng_computer', name: 'كلية الهندسة - قسم هندسة الحاسوب', branch: 'scientific', minGpa: 94.43, category: 'engineering' }
    ]
  },
  {
    id: 'u_karbala',
    name: 'جامعة كربلاء',
    location: 'كربلاء المقدسة',
    colleges: [
      { id: 'u_karbala_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.66, category: 'medical' },
      { id: 'u_karbala_dentistry', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.00, category: 'medical' },
      { id: 'u_karbala_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.51, category: 'medical' },
      { id: 'u_karbala_eng_oil', name: 'كلية الهندسة - قسم النفط', branch: 'scientific', minGpa: 97.71, category: 'engineering' },
      { id: 'u_karbala_eng_arch', name: 'كلية الهندسة - قسم العمارة والتصميم الحضري', branch: 'scientific', minGpa: 97.61, category: 'engineering' },
      { id: 'u_karbala_eng_biomed', name: 'كلية الهندسة - الطب الحياتي وعلم الأجنة الكهرومغناطيسي', branch: 'scientific', minGpa: 97.42, category: 'engineering' },
      { id: 'u_karbala_eng_civil', name: 'كلية الهندسة - قسم المدني والإنشائية', branch: 'scientific', minGpa: 93.86, category: 'engineering' },
      { id: 'u_karbala_law_sci', name: 'كلية الحقوق والقانون', branch: 'scientific', minGpa: 84.57, category: 'humanities' },
      { id: 'u_karbala_eng_prosthetics', name: 'كلية الهندسة - قسم الأطراف والمساند الصناعية', branch: 'scientific', minGpa: 94.95, category: 'engineering' },
      { id: 'u_karbala_eng_electrical_electronics', name: 'كلية الهندسة - قسم الكهرباء والالكترونيك', branch: 'scientific', minGpa: 93.00, category: 'engineering' }
    ]
  },
  {
    id: 'u_babylon',
    name: 'جامعة بابل',
    location: 'بابل',
    colleges: [
      { id: 'u_bab_med_main', name: 'كلية الطب', branch: 'scientific', minGpa: 100.57, category: 'medical' },
      { id: 'u_bab_med_hammurabi', name: 'كلية طب حمورابي', branch: 'scientific', minGpa: 100.00, category: 'medical' },
      { id: 'u_bab_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.00, category: 'medical' },
      { id: 'u_bab_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.51, category: 'medical' },
      { id: 'u_bab_eng_arch', name: 'كلية الهندسة - قسم تصميم العمارة والمجسمات', branch: 'scientific', minGpa: 97.47, category: 'engineering' },
      { id: 'u_bab_eng_civil', name: 'كلية الهندسة - قسم المدني والترسيم الإنشائي', branch: 'scientific', minGpa: 93.68, category: 'engineering' },
      { id: 'u_bab_eng_biomed', name: 'كلية الهندسة - قسم الطب الحياتي', branch: 'scientific', minGpa: 95.86, category: 'engineering' },
      { id: 'u_bab_english_sci', name: 'كلية التربية للعلوم الإنسانية - قسم اللغة الانكليزية (علمي)', branch: 'scientific', minGpa: 88.86, category: 'humanities' }
    ]
  },
  {
    id: 'u_kufa',
    name: 'جامعة الكوفة',
    location: 'النجف الأشرف',
    colleges: [
      { id: 'u_kufa_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.57, category: 'medical' },
      { id: 'u_kufa_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.29, category: 'medical' },
      { id: 'u_kufa_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.72, category: 'medical' },
      { id: 'u_kufa_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 97.47, category: 'engineering' },
      { id: 'u_kufa_eng_civil', name: 'كلية الهندسة - قسم المدني والإنشائي الأقوى', branch: 'scientific', minGpa: 93.71, category: 'engineering' },
      { id: 'u_kufa_law_sci', name: 'كلية القانون للعلوم الإنسانية (علمي)', branch: 'scientific', minGpa: 86.29, category: 'humanities' },
      { id: 'u_kufa_law_lit', name: 'كلية القانون (أدبي)', branch: 'literary', minGpa: 70.00, category: 'humanities' },
      { id: 'u_kufa_admin_sci', name: 'كلية الإدارة والاقتصاد', branch: 'scientific', minGpa: 63.00, category: 'administration' },
      { id: 'u_kufa_nursing', name: 'كلية التمريض التخصصي', branch: 'scientific', minGpa: 94.72, category: 'medical' }
    ]
  },
  {
    id: 'u_mosul',
    name: 'جامعة الموصل',
    location: 'نينوى',
    colleges: [
      { id: 'u_mosul_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.57, category: 'medical' },
      { id: 'u_mosul_batool', name: 'كلية طب البتول', branch: 'scientific', minGpa: 99.57, category: 'medical' },
      { id: 'u_mosul_dentistry', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.71, category: 'medical' },
      { id: 'u_mosul_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.29, category: 'medical' },
      { id: 'u_mosul_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 97.29, category: 'engineering' },
      { id: 'u_mosul_civil', name: 'كلية الهندسة - قسم المدني والإنشاء', branch: 'scientific', minGpa: 93.25, category: 'engineering' },
      { id: 'u_mosul_law_sci', name: 'كلية الحقوق وقانون اللجان (علمي)', branch: 'scientific', minGpa: 80.00, category: 'humanities' },
      { id: 'u_mosul_law_lit', name: 'كلية الحقوق وقانون اللجان (أدبي)', branch: 'literary', minGpa: 70.00, category: 'humanities' },
      { id: 'u_mosul_nursing', name: 'كلية التمريض (للذكور)', branch: 'scientific', minGpa: 95.14, category: 'medical' },
      { id: 'u_mosul_oil_mining', name: 'كلية هندسة النفط والتعدين - قسم النفط والتكرير', branch: 'scientific', minGpa: 93.14, category: 'engineering' }
    ]
  },
  {
    id: 'u_kirkuk',
    name: 'جامعة كركوك',
    location: 'كركوك',
    colleges: [
      { id: 'u_kir_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.43, category: 'medical' },
      { id: 'u_kir_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.98, category: 'medical' },
      { id: 'u_kir_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.43, category: 'medical' },
      { id: 'u_kirkuk_eng_oil', name: 'كلية الهندسة - قسم النفط', branch: 'scientific', minGpa: 95.71, category: 'engineering' }
    ]
  },
  {
    id: 'u_iraqia',
    name: 'الجامعة العراقية',
    location: 'بغداد',
    colleges: [
      { id: 'u_iraqia_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.13, category: 'medical' },
      { id: 'u_iraqia_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.00, category: 'medical' },
      { id: 'u_iraqia_eng_cyber', name: 'كلية الهندسة - قسم الشبكات والأمن السيبراني', branch: 'scientific', minGpa: 94.43, category: 'engineering' },
      { id: 'u_iraqia_eng_civil', name: 'كلية الهندسة - قسم هندسة المدني', branch: 'scientific', minGpa: 94.43, category: 'engineering' },
      { id: 'u_iraqia_eng_ai', name: 'كلية الهندسة - قسم الذكاء الاصطناعي والإنسان الآلي', branch: 'scientific', minGpa: 92.86, category: 'engineering' }
    ]
  },
  {
    id: 'u_ibn_sina',
    name: 'جامعة ابن سينا للعلوم الطبية والصيدلانية',
    location: 'بغداد',
    colleges: [
      { id: 'u_ibn_sina_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.10, category: 'medical' },
      { id: 'u_ibn_sina_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.86, category: 'medical' }
    ]
  },
  {
    id: 'u_dhiqar',
    name: 'جامعة ذي قار',
    location: 'ذي قار',
    colleges: [
      { id: 'u_dhi_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.04, category: 'medical' },
      { id: 'u_dhi_dentistry', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.29, category: 'medical' },
      { id: 'u_dhi_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.53, category: 'medical' },
      { id: 'u_dhi_eng_oil', name: 'كلية الهندسة - قسم النفط والغاز', branch: 'scientific', minGpa: 96.43, category: 'engineering' },
      { id: 'u_dhi_eng_biomed', name: 'كلية الهندسة - قسم الطب الحياتي التخصصي', branch: 'scientific', minGpa: 95.43, category: 'engineering' },
      { id: 'u_dhi_eng_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 93.57, category: 'engineering' },
      { id: 'u_dhi_law_lit', name: 'كلية القانون والعلوم السياسية (أدبي)', branch: 'literary', minGpa: 70.00, category: 'humanities' },
      { id: 'u_dhi_admin', name: 'كلية الإدارة والاقتصاد التنموي والمالية العامة', branch: 'scientific', minGpa: 64.14, category: 'administration' }
    ]
  },
  {
    id: 'u_jaber_bin_hayan',
    name: 'جامعة جابر بن حيان للعلوم الطبية والصيدلانية',
    location: 'النجف الأشرف',
    colleges: [
      { id: 'u_jaber_med', name: 'كلية الطب', branch: 'scientific', minGpa: 100.00, category: 'medical' },
      { id: 'u_jaber_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.57, category: 'medical' }
    ]
  },
  {
    id: 'u_basrah',
    name: 'جامعة البصرة',
    location: 'البصرة',
    colleges: [
      { id: 'u_basrah_med_main', name: 'كلية الطب', branch: 'scientific', minGpa: 99.86, category: 'medical' },
      { id: 'u_basrah_med_zahraa', name: 'كلية طب الزهراء', branch: 'scientific', minGpa: 99.71, category: 'medical' },
      { id: 'u_basrah_dentist', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.14, category: 'medical' },
      { id: 'u_basrah_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.57, category: 'medical' },
      { id: 'u_basrah_eng_arch_dept', name: 'كلية الهندسة - قسم العمارة والتخطيط', branch: 'scientific', minGpa: 97.43, category: 'engineering' },
      { id: 'u_basrah_eng_oil_gas', name: 'كلية الهندسة - قسم النفط والغاز', branch: 'scientific', minGpa: 97.91, category: 'engineering' },
      { id: 'u_basrah_eng_chemical', name: 'كلية الهندسة - قسم الهندسة الكيماوية', branch: 'scientific', minGpa: 95.29, category: 'engineering' },
      { id: 'u_basrah_eng_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 94.86, category: 'engineering' },
      { id: 'u_basrah_eng_elec', name: 'كلية الهندسة - قسم الكهرباء', branch: 'scientific', minGpa: 93.43, category: 'engineering' },
      { id: 'u_basrah_eng_mech', name: 'كلية الهندسة - قسم الميكانيك', branch: 'scientific', minGpa: 93.29, category: 'engineering' },
      { id: 'u_basrah_eng_comp', name: 'كلية الهندسة - قسم هندسة الحاسبات والأجهزة', branch: 'scientific', minGpa: 94.00, category: 'engineering' },
      { id: 'u_basrah_law_sci', name: 'كلية القانون (علمي)', branch: 'scientific', minGpa: 90.86, category: 'humanities' },
      { id: 'u_basrah_law_lit', name: 'كلية القانون (أدبي)', branch: 'literary', minGpa: 79.14, category: 'humanities' },
      { id: 'u_basrah_admin_sci', name: 'كلية الإدارة والاقتصاد (علمي)', branch: 'scientific', minGpa: 70.00, category: 'administration' },
      { id: 'u_basrah_admin_lit', name: 'كلية الإدارة والاقتصاد (أدبي)', branch: 'literary', minGpa: 60.71, category: 'administration' },
      { id: 'u_basrah_eng_mechatronics', name: 'كلية الهندسة - قسم هندسة الميكاترونكس', branch: 'scientific', minGpa: 93.71, category: 'engineering' },
      { id: 'u_basrah_eng_materials', name: 'كلية الهندسة - قسم هندسة المواد', branch: 'scientific', minGpa: 92.14, category: 'engineering' }
    ]
  },
  {
    id: 'u_muthanna',
    name: 'جامعة المثنى',
    location: 'المثنى',
    colleges: [
      { id: 'u_muthanna_med_local', name: 'كلية الطب (أبناء المحافظة)', branch: 'scientific', minGpa: 99.86, category: 'medical' },
      { id: 'u_muthanna_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.83, category: 'medical' },
      { id: 'u_muthanna_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.86, category: 'medical' },
      { id: 'u_muthanna_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.43, category: 'medical' },
      { id: 'u_muthanna_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 96.43, category: 'engineering' }
    ]
  },
  {
    id: 'u_fallujah',
    name: 'جامعة الفلوجة',
    location: 'الأنبار',
    colleges: [
      { id: 'u_fallujah_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.86, category: 'medical' }
    ]
  },
  {
    id: 'u_diyala',
    name: 'جامعة ديالى',
    location: 'ديالى',
    colleges: [
      { id: 'u_diy_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.86, category: 'medical' },
      { id: 'u_diy_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.71, category: 'medical' },
      { id: 'u_diy_eng_arch', name: 'كلية الهندسة - تصميم العمارة والبناء المتكامل', branch: 'scientific', minGpa: 96.14, category: 'engineering' }
    ]
  },
  {
    id: 'u_wasit',
    name: 'جامعة واسط',
    location: 'واسط',
    colleges: [
      { id: 'u_was_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.86, category: 'medical' },
      { id: 'u_was_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.96, category: 'medical' },
      { id: 'u_was_eng_arch', name: 'كلية الهندسة - قسم هندسة العمارة للأكاديمية والتربية', branch: 'scientific', minGpa: 96.29, category: 'engineering' },
      { id: 'u_was_eng_civil', name: 'كلية الهندسة - قسم المدني والإنشائي التجريبي', branch: 'scientific', minGpa: 93.71, category: 'engineering' }
    ]
  },
  {
    id: 'u_qadisiya',
    name: 'جامعة القادسية',
    location: 'القادسية',
    colleges: [
      { id: 'u_qadisiya_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.86, category: 'medical' },
      { id: 'u_qadisiya_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.00, category: 'medical' },
      { id: 'u_qadisiya_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.48, category: 'medical' },
      { id: 'u_qadisiya_eng_civil', name: 'كلية الهندسة - قسم المدني', branch: 'scientific', minGpa: 94.29, category: 'engineering' }
    ]
  },
  {
    id: 'u_anbar',
    name: 'جامعة الأنبار',
    location: 'الأنبار',
    colleges: [
      { id: 'u_anb_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.71, category: 'medical' },
      { id: 'u_anb_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.71, category: 'medical' },
      { id: 'u_anb_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.43, category: 'medical' },
      { id: 'u_anb_eng_civil', name: 'كلية الهندسة - قسم المدني البيئي والمستدام', branch: 'scientific', minGpa: 94.57, category: 'engineering' }
    ]
  },
  {
    id: 'u_ninavah',
    name: 'جامعة نينوى',
    location: 'نينوى',
    colleges: [
      { id: 'u_ninavah_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.71, category: 'medical' },
      { id: 'u_ninavah_pharmacy', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.29, category: 'medical' },
      { id: 'u_ninavah_eng_biomed', name: 'كلية هندسة الالكترونيات - قسم الطب الحياتي', branch: 'scientific', minGpa: 94.43, category: 'engineering' }
    ]
  },
  {
    id: 'u_maysan',
    name: 'جامعة ميسان',
    location: 'ميسان',
    colleges: [
      { id: 'u_may_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.71, category: 'medical' },
      { id: 'u_may_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 99.00, category: 'medical' },
      { id: 'u_may_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.43, category: 'medical' },
      { id: 'u_maysan_pharmacy_local', name: 'كلية الصيدلة (أبناء المحافظة)', branch: 'scientific', minGpa: 97.14, category: 'medical' },
      { id: 'u_may_med_local', name: 'كلية الطب (أبناء المحافظة)', branch: 'scientific', minGpa: 98.43, category: 'medical' },
      { id: 'u_may_dent_local', name: 'كلية طب الأسنان (أبناء المحافظة)', branch: 'scientific', minGpa: 97.86, category: 'medical' },
      { id: 'u_may_eng_oil', name: 'كلية الهندسة - قسم النفط وتكنولوجيا الآبار والبحار', branch: 'scientific', minGpa: 96.86, category: 'engineering' },
      { id: 'u_may_eng_civil', name: 'كلية الهندسة - قسم المدني والمنشآت الترابية المتطورة', branch: 'scientific', minGpa: 93.43, category: 'engineering' },
      { id: 'u_may_eng_elec', name: 'كلية الهندسة - قسم الميكاترونكس والتحكم بالتيار المبرمج', branch: 'scientific', minGpa: 92.29, category: 'engineering' },
      { id: 'u_may_eng_chem', name: 'كلية الهندسة - قسم الهندسة الكيماوية', branch: 'scientific', minGpa: 94.43, category: 'engineering' },
      { id: 'u_may_eng_biomed', name: 'كلية الهندسة - قسم الطب الحياتي', branch: 'scientific', minGpa: 92.86, category: 'engineering' }
    ]
  },
  {
    id: 'u_sumer',
    name: 'جامعة سومر',
    location: 'ذي قار',
    colleges: [
      { id: 'u_sumer_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.69, category: 'medical' }
    ]
  },
  {
    id: 'u_tikrit',
    name: 'جامعة تكريت',
    location: 'صلاح الدين',
    colleges: [
      { id: 'u_tik_med', name: 'كلية الطب', branch: 'scientific', minGpa: 99.57, category: 'medical' },
      { id: 'u_tik_med_local', name: 'كلية الطب (أبناء المحافظة)', branch: 'scientific', minGpa: 99.29, category: 'medical' },
      { id: 'u_tik_dent', name: 'كلية طب الأسنان', branch: 'scientific', minGpa: 98.67, category: 'medical' },
      { id: 'u_tik_phar', name: 'كلية الصيدلة', branch: 'scientific', minGpa: 98.29, category: 'medical' },
      { id: 'u_tik_law_lit', name: 'كلية القانون (أدبي)', branch: 'literary', minGpa: 70.00, category: 'humanities' },
      { id: 'u_tikrit_oil_processes_refining', name: 'كلية هندسة العمليات النفطية - قسم تكرير النفط والغاز', branch: 'scientific', minGpa: 93.71, category: 'engineering' }
    ]
  },
  {
    id: 'u_basrah_oil_gas',
    name: 'جامعة البصرة للنفط والغاز',
    location: 'البصرة',
    colleges: [
      { id: 'u_bas_oil_eng_oil', name: 'هندسة النفط والغاز - قسم النفط والإنتاج الوزاري', branch: 'scientific', minGpa: 98.14, category: 'engineering' },
      { id: 'u_bas_oil_eng_chem_refining', name: 'هندسة النفط والغاز - قسم تكرير النفط والصناعات الكيمياوية', branch: 'scientific', minGpa: 97.14, category: 'engineering' },
      { id: 'u_bas_oil_eng_petro', name: 'هندسة النفط والغاز - الهندسة البتروكهرمائية وغاز التكرير', branch: 'scientific', minGpa: 96.29, category: 'engineering' },
      { id: 'u_bas_oil_eng_gas_process', name: 'هندسة عمليات الغاز والبتروكيمياويات', branch: 'scientific', minGpa: 96.29, category: 'engineering' }
    ]
  },
  {
    id: 'u_tech_middle',
    name: 'جامعة الفرات الأوسط التقنية / الوسطى',
    location: 'بغداد والوسط',
    colleges: [
      { id: 'u_tech_mid_anesthesia', name: 'المعهد التقني الطبي - قسم تقنيات التخدير لغرف الرعايا', branch: 'scientific', minGpa: 96.00, category: 'medical' },
      { id: 'u_tech_mid_anesthesia_male', name: 'المعهد التقني الطبي - قسم تقنيات تخدير الرعاية الصارمة (ذكور)', branch: 'scientific', minGpa: 90.29, category: 'medical' },
      { id: 'u_tech_mid_nurse', name: 'المعهد التقني الطبي - قسم تقنيات التمريض والمتابعة التامة', branch: 'scientific', minGpa: 89.29, category: 'medical' },
      { id: 'u_tech_mid_optics', name: 'الكلية التقنية الصحية والطبية بغداد - قسم صحية البصريات الدقيقة', branch: 'scientific', minGpa: 97.00, category: 'medical' },
      { id: 'u_tech_mid_anest_baghdad', name: 'الكلية التقنية الصحية والطبية بغداد - قسم تقنيات التخدير المباشرة', branch: 'scientific', minGpa: 93.86, category: 'medical' }
    ]
  },
  {
    id: 'u_tech',
    name: 'الجامعة التكنولوجية',
    location: 'بغداد',
    colleges: [
      { id: 'u_tech_comp_networks', name: 'هندسة تكنولوجيا المعلومات والاتصالات والشبكات', branch: 'scientific', minGpa: 94.00, category: 'engineering' },
      { id: 'u_tech_comp_ai', name: 'قسم علوم الحاسوب - الذكاء الاصطناعي والأمن السيبراني', branch: 'scientific', minGpa: 92.50, category: 'engineering' },
      { id: 'u_tech_architecture', name: 'هندسة العمارة والتصميم المعماري الحديث', branch: 'scientific', minGpa: 93.00, category: 'engineering' },
      { id: 'u_tech_control', name: 'هندسة السيطرة والنظم والمحاكاة الذكية', branch: 'scientific', minGpa: 91.20, category: 'engineering' },
      { id: 'u_tech_chemical', name: 'هندسة تكرير النفط والصناعات الكيمياوية والغاز', branch: 'scientific', minGpa: 91.80, category: 'engineering' },
      { id: 'u_tech_applied_sci', name: 'العلوم التطبيقية - قسم فيزياء الليزر والمواد الكهروضوئية', branch: 'scientific', minGpa: 83.50, category: 'science' },
      { id: 'u_tech_arch_design', name: 'كلية هندسة العمارة - قسم التصميم المعماري الأساسي', branch: 'scientific', minGpa: 97.71, category: 'engineering' },
      { id: 'u_tech_arch_urban', name: 'كلية هندسة العمارة - قسم التصميم الحضري', branch: 'scientific', minGpa: 97.29, category: 'engineering' },
      { id: 'u_tech_biomedical', name: 'كلية هندسة الطب الحياتي - قسم الأجهزة الطبية الحيوية', branch: 'scientific', minGpa: 96.57, category: 'engineering' },
      { id: 'u_tech_oil_gas', name: 'كلية هندسة النفط والغاز - قسم النفط والتكرير', branch: 'scientific', minGpa: 96.57, category: 'engineering' },
      { id: 'u_tech_chem_poly', name: 'الهندسة الكيميائية - قسم تكرير الغاز وتكنولوجيا النفط', branch: 'scientific', minGpa: 94.71, category: 'engineering' },
      { id: 'u_tech_cybersecurity', name: 'هندسة الحاسوب - قسم الشبكات والأمن السيبراني', branch: 'scientific', minGpa: 94.29, category: 'engineering' },
      { id: 'u_tech_intelligent_sys', name: 'هندسة الذكاء الاصطناعي - قسم الحوسبة الذكية والأمن', branch: 'scientific', minGpa: 94.00, category: 'engineering' },
      { id: 'u_tech_gas_oil_natgas', name: 'كلية هندسة النفط والغاز - قسم الغاز الطبيعي', branch: 'scientific', minGpa: 94.57, category: 'engineering' },
      { id: 'u_tech_biomed_biomechanics', name: 'كلية هندسة الطب الحياتي - قسم الميكانيك الحيوي', branch: 'scientific', minGpa: 94.47, category: 'engineering' },
      { id: 'u_tech_civil_structural', name: 'كلية الهندسة المدنية - قسم الهندسة الإنشائية', branch: 'scientific', minGpa: 94.14, category: 'engineering' },
      { id: 'u_tech_laser_optics', name: 'كلية هندسة الليزر والالكترونيات البصرية - قسم الليزر', branch: 'scientific', minGpa: 94.14, category: 'engineering' },
      { id: 'u_tech_civil_management', name: 'كلية الهندسة المدنية - قسم البناء وإدارة المشاريع الإنشائية', branch: 'scientific', minGpa: 94.14, category: 'engineering' },
      { id: 'u_tech_laser_electro_optics', name: 'كلية هندسة الليزر والالكترونيات البصرية - قسم الالكترونيات البصرية', branch: 'scientific', minGpa: 92.71, category: 'engineering' },
      { id: 'u_tech_comp_engineering', name: 'كلية هندسة الحاسوب - قسم هندسة الحاسوب والبرمجيات', branch: 'scientific', minGpa: 92.36, category: 'engineering' },
      { id: 'u_tech_civil_roads_geotech', name: 'كلية الهندسة المدنية - قسم الطرق والجيوتكينك', branch: 'scientific', minGpa: 92.29, category: 'engineering' },
      { id: 'u_tech_intelligent_robotics', name: 'كلية هندسة الذكاء الاصحناعي - قسم الإنسان الآلي الذكي', branch: 'scientific', minGpa: 92.19, category: 'engineering' }
    ]
  },
  {
    id: 'u_samarra',
    name: 'جامعة سامراء',
    location: 'صلاح الدين',
    colleges: [
      { id: 'u_samarra_eng_arch', name: 'كلية الهندسة - قسم العمارة', branch: 'scientific', minGpa: 96.11, category: 'engineering' }
    ]
  }
];
