import {
  SubjectItem,
  TutorProfile,
  TestimonialItem,
  StatItem,
  FeatureItem,
  StepItem,
  LessonItem,
  AttendanceRecord,
  PaymentRecord,
  StudentGroup,
  StudentProfile,
  ParentSettings,
  CommissionTier,
  ReviewItem,
  AvailableSlot,
  BookingRequest,
  ParentLinkedChild,
  MakeupSessionRequest,
  SafetyReport,
  AttendanceDisputeTicket,
  TeacherCancellationLog,
  RevisionSessionItem
} from '../types';

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
  'البحيرة',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
];

export const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  'القاهرة': [
    'مدينة نصر', 'مصر الجديدة', 'التجمع الخامس والقاهرة الجديدة', 'المعادي', 'المقطم', 'الزمالك', 'وسط البلد',
    'شبرا', 'عين شمس', 'المرج', 'حلوان', 'الرحاب', 'مدينتي', 'الشروق', 'بدر', 'العاصمة الإدارية', 'العباسية',
    'الزيتون', 'حدائق القبة', 'المطرية', 'روض الفرج', 'السيدة زينب', 'البساتين', 'دار السلام', 'التبين'
  ],
  'الجيزة': [
    'الدقي', 'المهندسين', 'العجوزة', '6 أكتوبر', 'الشيخ زايد', 'الهرم', 'فيصل', 'العمرانية', 'بولاق الدكرور',
    'الوراق', 'إمبابة', 'الحوامدية', 'البدرشين', 'العياط', 'الصف', 'أطفيح', 'أوسيم', 'منشأة القناطر', 'الواحات البحرية'
  ],
  'الإسكندرية': [
    'سموحة', 'سيدي جابر', 'ستانلي', 'لوران', 'جليم', 'سيدي بشر', 'ميامي', 'العصافرة', 'المندرة', 'المنتزه',
    'المعمورة', 'العجمي', 'البيطاش', 'الهانوفيل', 'العامرية', 'برج العرب', 'محرم بك', 'الإبراهيمية', 'كليوباترا',
    'الشاطبي', 'الرمل', 'بحري والأنفوشي', 'اللبان', 'كرموز'
  ],
  'القليوبية': [
    'بنها', 'شبرا الخيمة', 'طوخ', 'قليوب', 'العبور', 'الخانكة', 'شبين القناطر', 'القناطر الخيرية', 'كفر شكر', 'قها'
  ],
  'الدقهلية': [
    'المنصورة', 'طلخا', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس', 'شربين', 'المنزلة', 'منية النصر', 'أجا',
    'نبروه', 'جمصة', 'بني عبيد', 'تمى الأمديد', 'ميت سلسيل', 'الجمالية', 'المطرية'
  ],
  'الشرقية': [
    'الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'أبو حماد', 'أبو كبير', 'ههيا', 'كفر صقر',
    'أولاد صقر', 'الحسينية', 'ديرب نجم', 'مشتول السوق', 'الإبراهيمية', 'القرين', 'الصالحية الجديدة'
  ],
  'المنوفية': [
    'شبين الكوم', 'منوف', 'أشمون', 'قويسنا', 'بركة السبع', 'تلا', 'الشهداء', 'مدينة السادات', 'سرس الليان', 'الباجور'
  ],
  'الغربية': [
    'طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة', 'سمنود', 'بسيون', 'قطور'
  ],
  'كفر الشيخ': [
    'كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'بلطيم', 'سيدي سالم', 'الرياض', 'بيلا', 'الحامول', 'قلين', 'برج البرلس'
  ],
  'البحيرة': [
    'دمنهور', 'كفر الدوار', 'إيتاي البارود', 'رشيد', 'أبو حمص', 'حوش عيسى', 'الدلنجات', 'كوم حمادة', 'شبراخيت',
    'المحمودية', 'إدكو', 'أبو المطامير', 'وادي النطرون', 'بدر', 'النوبارية الجديدة'
  ],
  'دمياط': [
    'دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا', 'كفر سعد', 'كفر البطيخ', 'عزبة البرج', 'ميت أبو غالب', 'السرو'
  ],
  'بورسعيد': [
    'حي الشرق', 'حي العرب', 'حي المناخ', 'حي الضواحي', 'حي الزهور', 'حي الجنوب', 'حي غرب', 'بورفؤاد'
  ],
  'الإسماعيلية': [
    'حي أول', 'حي ثان', 'حي ثالث', 'فايد', 'القنطرة غرب', 'القنطرة شرق', 'التل الكبير', 'أبو صوير', 'القصاصين'
  ],
  'السويس': [
    'حي السويس', 'حي الأربعين', 'حي فيصل', 'حي عتاقة', 'حي الجناين', 'العين السخنة'
  ],
  'بني سويف': [
    'بني سويف', 'بني سويف الجديدة', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا', 'سمسطا', 'الفشن'
  ],
  'الفيوم': [
    'الفيوم', 'الفيوم الجديدة', 'سنورس', 'إطسا', 'طامية', 'يوسف الصديق', 'أبشواي'
  ],
  'المنيا': [
    'المنيا', 'المنيا الجديدة', 'مغاغة', 'بني مزار', 'مطاي', 'سمالوط', 'أبو قرقاص', 'ملوي', 'دير مواس', 'العدوة'
  ],
  'أسيوط': [
    'أسيوط', 'أسيوط الجديدة', 'ديروط', 'القوصية', 'أبنوب', 'منفلوط', 'أبو تيج', 'الغنايم', 'ساحل سليم', 'البداري', 'صدفا', 'الفتح'
  ],
  'سوهاج': [
    'سوهاج', 'سوهاج الجديدة', 'أخميم', 'جرجا', 'طهطا', 'المراغة', 'طما', 'البلينا', 'المنشأة', 'دار السلام', 'ساقلتة', 'جهينة'
  ],
  'قنا': [
    'قنا', 'قنا الجديدة', 'نجع حمادي', 'دشنا', 'قوص', 'أبو تشت', 'فرشوط', 'فقط', 'نقادة', 'الوقف'
  ],
  'الأقصر': [
    'الأقصر', 'إسنا', 'أرمنت', 'البياضية', 'الزينية', 'الطود', 'القرنة'
  ],
  'أسوان': [
    'أسوان', 'أسوان الجديدة', 'كوم أمبو', 'إدفو', 'نصر النوبة', 'دراو', 'أبو سمبل'
  ],
  'البحر الأحمر': [
    'الغردقة', 'الجونة', 'سفاجا', 'القصير', 'مرسى علم', 'رأس غارب', 'شلاتين', 'حلايب'
  ],
  'الوادي الجديد': [
    'الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط'
  ],
  'مطروح': [
    'مرسى مطروح', 'العلمين', 'العلمين الجديدة', 'الحمام', 'الضبعة', 'سيدي عبد الرحمن', 'النجيلة', 'براني', 'السلوم', 'سيوة'
  ],
  'شمال سيناء': [
    'العريش', 'بئر العبد', 'الشيخ زويد', 'رفح', 'الحسنة', 'نخل'
  ],
  'جنوب سيناء': [
    'شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'طور سيناء', 'رأس سدر', 'سانت كاترين', 'أبو رديس', 'أبو زنيمة'
  ],
};

// ==========================================
// EGYPTIAN EDUCATIONAL STAGES & GRADES
// ==========================================
export interface StageInfo {
  id: string;
  name: string;
  grades: string[];
}

export const EGYPT_STAGES: StageInfo[] = [
  {
    id: 'primary',
    name: 'المرحلة الابتدائية',
    grades: [
      'الصف الأول الابتدائي',
      'الصف الثاني الابتدائي',
      'الصف الثالث الابتدائي',
      'الصف الرابع الابتدائي',
      'الصف الخامس الابتدائي',
      'الصف السادس الابتدائي'
    ]
  },
  {
    id: 'prep',
    name: 'المرحلة الإعدادية',
    grades: [
      'الصف الأول الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الثالث الإعدادي (الشهادة الإعدادية)'
    ]
  },
  {
    id: 'secondary',
    name: 'المرحلة الثانوية',
    grades: [
      'الصف الأول الثانوي',
      'الصف الثاني الثانوي (علمي)',
      'الصف الثاني الثانوي (أدبي)',
      'الصف الثالث الثانوي (علمي علوم)',
      'الصف الثالث الثانوي (علمي رياضة)',
      'الصف الثالث الثانوي (أدبي)'
    ]
  }
];

export const ALL_EGYPT_GRADES = EGYPT_STAGES.flatMap(s => s.grades);

export const COMMISSION_TIERS: CommissionTier[] = [
  { range: '1 - 20 طالب', minStudents: 1, maxStudents: 20, percentage: 5.0, rate: '5.0%', example: 'مع 20 طالب بتدفع 5% فقط', benefit: 'تفعيل كامل لماسح الـ QR ولوحة المتابعة', tag: 'بداية الانطلاق' },
  { range: '21 - 50 طالب', minStudents: 21, maxStudents: 50, percentage: 4.0, rate: '4.0%', example: 'مع 40 طالب بتوفر 20% من العمولة', benefit: 'إرسال إشعارات واتساب غير محدودة لأولياء الأمور', tag: 'نمو سريع' },
  { range: '51 - 100 طالب', minStudents: 51, maxStudents: 100, percentage: 3.0, rate: '3.0%', example: 'مع 80 طالب بتوفر 40% من العمولة', benefit: 'دعم فني خاص وإحصائيات متقدمة للحضور', tag: 'المستوى الفضي' },
  { range: '101 - 200 طالب', minStudents: 101, maxStudents: 200, percentage: 2.0, rate: '2.0%', example: 'مع 150 طالب العمولة 2% فقط', benefit: 'ظهور مميز في صدارة نتائج البحث بالمحافظة', tag: 'المستوى الذهبي' },
  { range: '201 - 500 طالب', minStudents: 201, maxStudents: 500, percentage: 1.0, rate: '1.0%', example: 'مع 300 طالب بتدفع 1% فقط', benefit: 'شارة المعلم المعتمد النخبة وإدارة سناتر متعددة', tag: 'المستوى البلاتيني' },
  { range: 'أكثر من 500 طالب', minStudents: 501, maxStudents: null, percentage: 0.5, rate: '0.5%', example: 'أقل عمولة تعليمية في مصر 0.5%', benefit: 'مدير حساب مخصص وربط مخصص للسناتر الكبرى', tag: 'النخبة' },
];

// ==========================================
// ALL EGYPTIAN CURRICULUM SUBJECTS
// ==========================================
export const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'arabic',
    name: 'اللغة العربية',
    tutorCount: 520,
    iconName: 'BookOpen',
    isFeatured: true,
    tag: 'مادة أساسية',
    description: 'النحو، البلاغة، القراءة، النصوص والأدب لجميع المراحل الدراسية',
    stageCategory: 'all'
  },
  {
    id: 'math',
    name: 'الرياضيات',
    tutorCount: 490,
    iconName: 'Calculator',
    isFeatured: true,
    tag: 'الأعلى طلباً',
    description: 'الجبر، الهندسة، التفاضل والتكامل، الاستاتيكا والديناميكا، والإحصاء',
    stageCategory: 'all'
  },
  {
    id: 'english',
    name: 'اللغة الإنجليزية',
    tutorCount: 460,
    iconName: 'Languages',
    isFeatured: true,
    tag: 'الأعلى طلباً',
    description: 'قواعد، محادثة، وترجمة لمناهج المدارس الحكومية واللغات والتجريبي',
    stageCategory: 'all'
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    tutorCount: 340,
    iconName: 'Atom',
    isFeatured: true,
    tag: 'ثانوية عامة',
    description: 'شرح مبسط للتجارب والمسائل والقوانين الفيزيائية لطلاب العلمي',
    stageCategory: 'secondary'
  },
  {
    id: 'chemistry',
    name: 'الكيمياء',
    tutorCount: 310,
    iconName: 'FlaskConical',
    isFeatured: true,
    tag: 'ثانوية عامة',
    description: 'كيمياء عضوية وغير عضوية ومفاهيم بنك الأسئلة والوزارة',
    stageCategory: 'secondary'
  },
  {
    id: 'biology',
    name: 'الأحياء',
    tutorCount: 280,
    iconName: 'Dna',
    isFeatured: false,
    tag: 'علمي علوم',
    description: 'تشريح، وراثة، بيولوجيا جزيئية ومناعة لطلاب الثانوية',
    stageCategory: 'secondary'
  },
  {
    id: 'geology',
    name: 'الجيولوجيا وعلوم البيئة',
    tutorCount: 160,
    iconName: 'Compass',
    isFeatured: false,
    tag: 'علمي علوم',
    description: 'تراكيب جيولوجية، حفريات، دورة الصخور والبيئة للثانوية العامة',
    stageCategory: 'secondary'
  },
  {
    id: 'science',
    name: 'العلوم',
    tutorCount: 290,
    iconName: 'Microscope',
    isFeatured: false,
    tag: 'ابتدائي وإعدادي',
    description: 'تأسيس علمي متكامل لصفوف المرحلة الابتدائية والمرحلة الإعدادية',
    stageCategory: 'prep'
  },
  {
    id: 'social-studies',
    name: 'الدراسات الاجتماعية',
    tutorCount: 240,
    iconName: 'Globe',
    isFeatured: false,
    tag: 'ابتدائي وإعدادي',
    description: 'جغرافيا مصر والعالم وتاريخ الحضارة المصرية والإسلامية',
    stageCategory: 'prep'
  },
  {
    id: 'history',
    name: 'التاريخ',
    tutorCount: 220,
    iconName: 'Award',
    isFeatured: false,
    tag: 'أدبي ثانوية',
    description: 'تاريخ مصر الحديث والمعاصر والتاريخ العربي والعالمي',
    stageCategory: 'secondary'
  },
  {
    id: 'geography',
    name: 'الجغرافيا',
    tutorCount: 210,
    iconName: 'MapPin',
    isFeatured: false,
    tag: 'أدبي ثانوية',
    description: 'الجغرافيا السياسية والاقتصادية والتضاريس للثانوية العامة',
    stageCategory: 'secondary'
  },
  {
    id: 'philosophy',
    name: 'الفلسفة والمنطق',
    tutorCount: 180,
    iconName: 'Sparkles',
    isFeatured: false,
    tag: 'أدبي ثانوية',
    description: 'قضايا الفلسفة الأخلاقية وقواعد المنطق والاستدلال الرياضي',
    stageCategory: 'secondary'
  },
  {
    id: 'psychology',
    name: 'علم النفس والاجتماع',
    tutorCount: 175,
    iconName: 'Users',
    isFeatured: false,
    tag: 'أدبي ثانوية',
    description: 'نظريات التعلم، الشخصية، والظواهر والعلاقات الاجتماعية',
    stageCategory: 'secondary'
  },
  {
    id: 'french',
    name: 'اللغة الفرنسية',
    tutorCount: 230,
    iconName: 'Globe',
    isFeatured: false,
    tag: 'لغة ثانية',
    description: 'اللغة الثانية لمدارس العام واللغات مع تدريب على النطق والكتابة',
    stageCategory: 'all'
  },
  {
    id: 'german',
    name: 'اللغة الألمانية (Deutsch)',
    tutorCount: 150,
    iconName: 'Languages',
    isFeatured: false,
    tag: 'لغة ثانية',
    description: 'منهج اللغة الألمانية كلغة أجنبية ثانية وتدريبات الصوتيات',
    stageCategory: 'secondary'
  },
  {
    id: 'italian',
    name: 'اللغة الإيطالية (Italiano)',
    tutorCount: 120,
    iconName: 'Languages',
    isFeatured: false,
    tag: 'لغة ثانية',
    description: 'شرح قواعد ومفردات اللغة الإيطالية للثانوية العامة',
    stageCategory: 'secondary'
  },
  {
    id: 'ict',
    name: 'تكنولوجيا المعلومات والحاسب الآلي (ICT)',
    tutorCount: 195,
    iconName: 'Cpu',
    isFeatured: false,
    tag: 'تكنولوجي',
    description: 'مناهج الحاسب الآلي والـ ICT لجميع المراحل المدرسية والتأسيس الرقمي',
    stageCategory: 'all'
  },
  {
    id: 'islamic-religion',
    name: 'التربية الدينية الإسلامية',
    tutorCount: 140,
    iconName: 'BookOpen',
    isFeatured: false,
    description: 'القرآن الكريم، التفسير، الحديث النبوي، والعقيدة والأخلاق',
    stageCategory: 'all'
  },
  {
    id: 'christian-religion',
    name: 'التربية الدينية المسيحية',
    tutorCount: 95,
    iconName: 'BookOpen',
    isFeatured: false,
    description: 'دراسات الكتاب المقدس، الكنيسة وتاريخ الإيمان لجميع المراحل',
    stageCategory: 'all'
  },
  {
    id: 'skills',
    name: 'المهارات المهنية',
    tutorCount: 110,
    iconName: 'Award',
    isFeatured: false,
    description: 'الأنشطة العملية والتطبيقية لصفوف المرحلة الابتدائية الجديدة',
    stageCategory: 'primary'
  }
];

export const PROBLEM_SOLUTION_CARDS = [
  {
    id: '1',
    title: 'حساب واحد متكامل لكل احتياجاتك',
    description: 'بدل ما تتوه بين دفاتر المدرسين ومجموعات الواتساب، كل حصص أولادك ومواعيدهم في شاشة واحدة منظمة.'
  },
  {
    id: '2',
    title: 'تسجيل حضور موثق بالدقيقة',
    description: 'مسح ضوئي ذكي بنافذة زمنية عادلة توثق الحضور بالدقيقة وتلغي الدفاتر اليدوية والنزاعات نهائياً.'
  },
  {
    id: '3',
    title: 'متابعة تعليمية وتنبيهات فورية',
    description: 'إشعار واتساب لولي الأمر فور وصول الطالب، ومتابعة الواجبات وملاحظات شرح الدرس بعد كل حصة.'
  },
  {
    id: '4',
    title: 'عمولة عادلة ونظام موازٍ للمدرس',
    description: 'لا توجد اشتراكات شهرية، ونظام متوازن يحفظ حقوق الطلاب وأولياء الأمور والمعلمين بكل شفافية.'
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'سجل بياناتك',
    description: 'أنشئ حسابك كطالب أو ولي أمر بخطوات بسيطة واحصل على بطاقتك الرقمية وكود الحضور فوراً.',
    iconName: 'UserCheck'
  },
  {
    number: 2,
    title: 'اختار مدرسينك',
    description: 'تصفح المدرسين الموثقين في محافظتك ومنطقتك، واطلع على تقييمات الطلاب الحقيقية ومواعيد الحصص.',
    iconName: 'Search'
  },
  {
    number: 3,
    title: 'ثبت حضورك وتابع تقدمك',
    description: 'امسح الكود عند بدء الحصة لتسجيل الحضور وتصل رسالة فورية لولي أمرك مع تقرير الواجبات والشرح.',
    iconName: 'QrCode'
  },
];

export const FIND_TUTOR_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'دور بالمادة والمحافظة',
    description: 'حدد المادة الدراسية، المحافظة والمنطقة القريبة منك لتصل لأفضل المدرسين في محيطك.',
    iconName: 'MapPin'
  },
  {
    number: 2,
    title: 'قارن بين المدرسين',
    description: 'اطّلع على تقييمات حقيقية وموثقة فقط من طلاب مسجلين فعلياً ونسب استمرار الطلاب.',
    iconName: 'Star'
  },
  {
    number: 3,
    title: 'أرسل طلب الحجز',
    description: 'احجز الموعد المناسب ليرسل الطلب للمدرس مباشرة لاعتماده مع إشعار فوري.',
    iconName: 'CalendarCheck'
  },
  {
    number: 4,
    title: 'حضور منظم ومتابعة',
    description: 'احضر في موعدك وسجل وصولك مع استلام متابعة الواجبات بانتظام.',
    iconName: 'CheckCircle2'
  },
];

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: 'qr-attendance',
    title: 'حضور موثق ونافذة زمنية عادلة',
    description: 'تسجيل آلي فوري للحضور مع تمييز دقيق بين الحاضر بالموعد والمتأخر والغياب بدون ظلم.',
    iconName: 'Clock',
    highlight: 'نافذة ذكية'
  },
  {
    id: 'booking-approval',
    title: 'نظام حجز بموافقة مسبقة',
    description: 'طلبات الحجز تصل للمدرس فوراً للموافقة أو الاعتذار مع إشعار واتساب تلقائي.',
    iconName: 'CalendarCheck',
    highlight: 'تنظيم المجموعات'
  },
  {
    id: 'educational-notes',
    title: 'متابعة الدروس والواجبات',
    description: 'المدرس يكتب سطور المتابعة والواجب بعد كل حصة لتصل مباشرة لولي الأمر والطالب.',
    iconName: 'BookOpen',
    highlight: 'متابعة حقيقية'
  },
  {
    id: 'multi-child',
    title: 'ربط متعدد للأبناء',
    description: 'ولي الأمر يربط جميع أبنائه برمز تحقق مؤكد ويتابعهم من لوحة تحكم واحدة وسهلة.',
    iconName: 'Users',
    highlight: 'حساب موحد'
  },
  {
    id: 'safety-protection',
    title: 'حماية وإبلاغ فوري',
    description: 'زر إبلاغ سريع للأهالي والطلاب لمراجعة أي سلوك غير لائق من خلال إدارة المنصة فوراً.',
    iconName: 'ShieldCheck',
    highlight: 'بيئة آمنة'
  },
  {
    id: 'makeup-sessions',
    title: 'حصص تعويضية وقوائم انتظار',
    description: 'إمكانية طلب حصة تعويضية للأعذار المقبولة والتسجيل بقوائم الانتظار للمجموعات المكتملة.',
    iconName: 'RefreshCw',
    highlight: 'مرونة كاملة'
  },
];

export const STATS_DATA: StatItem[] = [
  {
    value: '+2,400',
    label: 'مدرس موثّق',
    description: 'تم التحقق من هوياتهم ومؤهلاتهم'
  },
  {
    value: '+15,000',
    label: 'طالب',
    description: 'يتعلمون بانتظام عبر المنصة'
  },
  {
    value: '27',
    label: 'محافظة',
    description: 'تغطية جغرافية كاملة في مصر'
  },
  {
    value: '+50,000',
    label: 'تسجيل حضور',
    description: 'تم توثيقها بنجاح مع إشعارات واتساب'
  },
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: '1',
    name: 'م. أشرف الشناوي',
    role: 'ولي أمر طالبين (ثانوية وإعدادي)',
    governorate: 'القاهرة - التجمع الخامس',
    quote: 'أكتر حاجة مريحة في حصتي هي إشعار الواتساب اللي بيوصلني فوراً لما ابني يوصل السنتر، مع ملاحظات الواجب بعد الحصة. وجميل إني بتابع ابني التاني في الإعدادي من نفس الشاشة.',
    rating: 5,
    avatar: '👨‍💼',
    relatedSubject: 'فيزياء ورياضيات'
  },
  {
    id: '2',
    name: 'نورهان طارق',
    role: 'طالبة بالصف الثالث الثانوي',
    governorate: 'الجيزة - الدقي',
    quote: 'البطاقة الرقمية وكود الحضور خلاني ادخل كل حصصي في ثانية. ولما غبت بسبب دور برد قدمت طلب حصة تعويضية وماتحسبش عليا غياب ولا أثر على تقييمي.',
    rating: 5,
    avatar: '👩‍🎓',
    relatedSubject: 'كيمياء ولغات'
  },
  {
    id: '3',
    name: 'أ. حسام إبراهيم',
    role: 'مدرس أول كيمياء',
    governorate: 'القاهرة - مدينة نصر',
    quote: 'نظام نافذة الحضور وطلبات الحجز ريحني جداً من دوشة الواتساب ودخول طلاب بدون تسجيل مسبق، ومتابعة الواجبات بتربطني بأولياء الأمور باحترافية عالية.',
    rating: 5,
    avatar: '👨‍🏫',
    relatedSubject: 'كيمياء الثانوية'
  }
];

export const DEFAULT_SLOTS: AvailableSlot[] = [
  { id: 's1', day: 'الأحد', time: '04:30 م', status: 'available', type: 'center', location: 'سنتر الأهرام' },
  { id: 's2', day: 'الأحد', time: '06:30 م', status: 'full', type: 'center', location: 'سنتر الأهرام', waitlistCount: 3 },
  { id: 's3', day: 'الثلاثاء', time: '04:30 م', status: 'available', type: 'center', location: 'سنتر الأهرام' },
  { id: 's4', day: 'الخميس', time: '05:00 م', status: 'available', type: 'center', location: 'أكاديمية التفوق' },
  { id: 's5', day: 'الجمعة', time: '10:00 ص', status: 'available', type: 'online', location: 'أونلاين لايف' },
  { id: 's6', day: 'الجمعة', time: '06:00 م', status: 'available', type: 'center', location: 'سنتر النخبة', isRevisionSession: true, revisionPrice: 150 },
];

export const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: 'منذ يومين',
    createdAtTimestamp: Date.now() - 24 * 3600 * 1000,
    canEditUntilTimestamp: Date.now() + 24 * 3600 * 1000, // Still editable
    comment: 'شرح ممتاز جداً وأسلوب منظم في مراجعة بنوك الأسئلة والنماذج الوزارية وتوضيح أدق التفاصيل.',
    subject: 'الكيمياء',
    verified: true,
    reply: {
      author: 'أ. حسام إبراهيم',
      content: 'شكراً يا زياد، بالتوفيق دائماً ومستواك في تقدم مستمر.',
      date: 'منذ يوم'
    }
  },
  {
    id: 'r2',
    studentName: 'مريم عادل الشريف',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: 'منذ 5 أيام',
    comment: 'أفضل مدرس كيمياء بلا منازع، المذكرات شاملة والمتابعة مستمرة بعد كل حصة.',
    subject: 'الكيمياء'
  },
  {
    id: 'r3',
    studentName: 'عمر خالد الباز',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    rating: 4,
    date: 'منذ أسبوعين',
    comment: 'أستاذ متمكن ويهتم بكل طالب في المجموعة، وخصوصاً وقت حل المسائل الصعبة.',
    subject: 'الكيمياء'
  }
];

export const SAMPLE_TUTORS: TutorProfile[] = [
  {
    id: 't1',
    name: 'أ. حسام إبراهيم',
    title: 'مدرس أول كيمياء للثانوية العامة واللغات',
    subject: 'الكيمياء',
    governorate: 'القاهرة',
    area: 'مدينة نصر',
    rating: 4.9,
    reviewsCount: 142,
    studentsCount: 310,
    pricePerSession: 120,
    isVerified: true,
    joinCode: 'CHEM-402',
    levels: ['الصف الأول الثانوي', 'الصف الثاني الثانوي (علمي)', 'الصف الثالث الثانوي (علمي علوم)', 'الصف الثالث الثانوي (علمي رياضة)'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'خبرة 14 عاماً في تدريس الكيمياء بمصر وتبسيط المعادلات والمفاهيم العضوية بأحدث أساليب بنك المعرفة ونماذج الوزارة.',
    experienceYears: 14,
    centers: ['سنتر الأهرام - مدينة نصر', 'أكاديمية التفوق - المعادي'],
    phone: '01098765432',
    email: 'hossam.chem@hassty.edu',
    education: 'بكالوريوس علوم وتربية - قسم كيمياء، دبلوم تدريس مناهج اللغات',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 96,
      churnRate: 4,
      attendanceAvg: 95,
      cancelRate: 0.8
    }
  },
  {
    id: 't2',
    name: 'م. أحمد عصام',
    title: 'خبير الرياضيات البحتة والتطبيقية',
    subject: 'الرياضيات',
    governorate: 'الجيزة',
    area: 'الدقي',
    rating: 5.0,
    reviewsCount: 218,
    studentsCount: 450,
    pricePerSession: 140,
    isVerified: true,
    joinCode: 'MATH-881',
    levels: ['الصف الثالث الإعدادي (الشهادة الإعدادية)', 'الصف الأول الثانوي', 'الصف الثاني الثانوي (علمي)', 'الصف الثالث الثانوي (علمي رياضة)'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'مؤلف سلسلة التفوق في الرياضيات وداعم استراتيجيات حل المسائل المعقدة في أقل وقت ممكن لطلاب الثانوية والإعدادية.',
    experienceYears: 11,
    centers: ['سنتر النور - الدقي', 'سنتر الأوائل - المهندسين'],
    phone: '01122334455',
    email: 'ahmed.essam@hassty.edu',
    education: 'بكالوريوس هندسة وماجستير مناهج تعليم الرياضيات الحديثة',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 98,
      churnRate: 2,
      attendanceAvg: 97,
      cancelRate: 0.5
    }
  },
  {
    id: 't3',
    name: 'د. سارة عبد العزيز',
    title: 'دكتوراه في العلوم البيولوجية والأحياء',
    subject: 'الأحياء',
    governorate: 'الإسكندرية',
    area: 'سموحة',
    rating: 4.9,
    reviewsCount: 95,
    studentsCount: 185,
    pricePerSession: 130,
    isVerified: true,
    joinCode: 'BIO-209',
    levels: ['الصف الأول الثانوي', 'الصف الثاني الثانوي (علمي)', 'الصف الثالث الثانوي (علمي علوم)'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'متخصصة في شرح الوراثة والمناعة وتدريب الطلاب على نماذج الامتحانات النهائية للثانوية العامة.',
    experienceYears: 9,
    centers: ['سنتر النخبة - سموحة', 'مقر سيدي جابر التعليمي'],
    phone: '01234567890',
    email: 'dr.sara@hassty.edu',
    education: 'دكتوراه في علم الأحياء الدقيقة، كلية العلوم - جامعة الإسكندرية',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 94,
      churnRate: 6,
      attendanceAvg: 93,
      cancelRate: 1.0
    }
  },
  {
    id: 't4',
    name: 'مستر وليد فاروق',
    title: 'كبير معلمي اللغة الإنجليزية والترجمة',
    subject: 'اللغة الإنجليزية',
    governorate: 'الدقهلية',
    area: 'المنصورة',
    rating: 4.8,
    reviewsCount: 160,
    studentsCount: 380,
    pricePerSession: 100,
    isVerified: true,
    joinCode: 'ENG-733',
    levels: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'حاصل على شهادة CELTA من جامعة كامبريدج، أسلوب تفاعلي ممتع لتطوير مهارات الكتابة والاستماع.',
    experienceYears: 16,
    centers: ['سنتر المستقبل - المشاية المنصورة'],
    phone: '01011223344',
    email: 'waleed.farouk@hassty.edu',
    education: 'ليسانس ألسن لغة إنجليزية ودبلوم تدريس لغات',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 95,
      churnRate: 5,
      attendanceAvg: 94,
      cancelRate: 1.1
    }
  },
  {
    id: 't5',
    name: 'أ. طارق عبد العليم',
    title: 'معلم خبير فيزياء الثانوية العامة',
    subject: 'الفيزياء',
    governorate: 'الشرقية',
    area: 'الزقازيق',
    rating: 4.9,
    reviewsCount: 184,
    studentsCount: 290,
    pricePerSession: 110,
    isVerified: true,
    joinCode: 'PHYS-512',
    levels: ['الصف الأول الثانوي', 'الصف الثاني الثانوي (علمي)', 'الصف الثالث الثانوي (علمي علوم)', 'الصف الثالث الثانوي (علمي رياضة)'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'تبسيط تجارب الفيزياء الحديثة والكهربية مع ورش حل مسائل دورية وأسئلة مستويات تفكير عليا.',
    experienceYears: 13,
    centers: ['سنتر الأندلس - الزقازيق'],
    phone: '01555667788',
    email: 'tarek.phys@hassty.edu',
    education: 'بكالوريوس علوم قسم فيزياء، عضو الجمعية المصرية للفيزياء',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 97,
      churnRate: 3,
      attendanceAvg: 96,
      cancelRate: 0.7
    }
  },
  {
    id: 't6',
    name: 'أ. هبة مصطفى',
    title: 'معلمة لغة عربية وبلاغة ونقد',
    subject: 'اللغة العربية',
    governorate: 'القليوبية',
    area: 'بنها',
    rating: 4.9,
    reviewsCount: 112,
    studentsCount: 220,
    pricePerSession: 95,
    isVerified: true,
    joinCode: 'ARB-118',
    levels: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bio: 'أسلوب شيق في تدريس قواعد النحو وتذوق النصوص الأدبية لضمان الدرجات النهائية في امتحانات الثانوية.',
    experienceYears: 10,
    centers: ['سنتر الإيمان - بنها'],
    phone: '01222446688',
    email: 'heba.arb@hassty.edu',
    education: 'ليسانس دار العلوم، دبلوم تربوي عام',
    accountStatus: 'active',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS,
    qualityMetrics: {
      retentionRate: 96,
      churnRate: 4,
      attendanceAvg: 95,
      cancelRate: 0.6
    }
  }
];

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: 'std-1',
  name: 'زياد أحمد عبد الله',
  phone: '01012345678',
  governorate: 'القاهرة',
  city: 'مدينة نصر',
  area: 'حي السفارات',
  stage: 'المرحلة الثانوية',
  grade: 'الصف الثالث الثانوي (علمي علوم)',
  age: 17,
  studentIdNumber: '2026-HST-09812',
  qrCode: 'HST-2026-09812',
  qrCodeValue: 'HST-STUDENT-2026-09812-ZIAD-CAIRO',
  parentPhone: '01198765432',
  emergencyParentPhone: '01099887766',
  joinedTutorIds: ['t1', 't2', 't5'],
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  isSubscriptionPaused: false
};

// ==========================================
// MULTI-CHILDREN UNDER PARENT ACCOUNT
// ==========================================
export const MOCK_PARENT_LINKED_CHILDREN: ParentLinkedChild[] = [
  {
    id: 'link-1',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    qrCode: 'HST-2026-09812',
    governorate: 'القاهرة',
    area: 'مدينة نصر',
    status: 'linked',
    linkedAt: '2026-07-01',
    attendanceRate: 95,
    upcomingLessonCount: 3
  },
  {
    id: 'link-2',
    studentId: 'std-sarah',
    studentName: 'سارة أحمد عبد الله',
    grade: 'الصف الأول الإعدادي',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    qrCode: 'HST-2026-33910',
    governorate: 'القاهرة',
    area: 'مدينة نصر',
    status: 'linked',
    linkedAt: '2026-07-15',
    attendanceRate: 100,
    upcomingLessonCount: 2
  }
];

// ==========================================
// BOOKING REQUESTS AWAITING TEACHER APPROVAL
// ==========================================
export const MOCK_BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: 'req-101',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    studentPhone: '01012345678',
    parentPhone: '01198765432',
    studentGrade: 'الصف الثالث الثانوي (علمي علوم)',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    day: 'الأحد القادم',
    time: '04:30 مساءً',
    sessionType: 'center',
    location: 'سنتر الأهرام - مدينة نصر',
    price: 120,
    status: 'pending',
    createdAt: 'منذ ساعتين',
    notes: 'طالب متفوق يرغب بالانضمام لمجموعة الأحد والثلاثاء'
  },
  {
    id: 'req-102',
    studentId: 'std-youssef',
    studentName: 'يوسف مصطفى النجار',
    studentPhone: '01155443322',
    parentPhone: '01066554433',
    studentGrade: 'الصف الثالث الثانوي (علمي علوم)',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    day: 'الخميس القادم',
    time: '05:00 مساءً',
    sessionType: 'center',
    location: 'أكاديمية التفوق - المعادي',
    price: 120,
    status: 'pending',
    createdAt: 'منذ 4 ساعات'
  },
  {
    id: 'req-103',
    studentId: 'std-nour',
    studentName: 'نور الدين سامح',
    studentPhone: '01299887711',
    parentPhone: '01599887766',
    studentGrade: 'الصف الثالث الثانوي (علمي رياضة)',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    day: 'الجمعة',
    time: '10:00 صباحاً',
    sessionType: 'online',
    location: 'أونلاين لايف',
    price: 100,
    status: 'approved',
    createdAt: 'أمس'
  }
];

export const MOCK_LESSONS: LessonItem[] = [
  {
    id: 'les-1',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    tutorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    subject: 'الكيمياء',
    topic: 'الكيمياء العضوية: الهيدروكربونات الأليفاتية وميكانيكا التفاعلات',
    date: '2026-08-16',
    day: 'الأحد',
    dayName: 'الأحد',
    time: '04:30 م - 06:30 م',
    location: 'سنتر الأهرام — مدينة نصر (قاعة 4)',
    type: 'center',
    status: 'upcoming',
    price: 120,
    homework: 'حل تدريبات بنك الأسئلة من صـ 42 إلى 50 بمذكرة الواجب',
    teacherNotes: 'يرجى إحضار جدول العناصر والتركيز على معادلات الألكانات'
  },
  {
    id: 'les-2',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    tutorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    subject: 'الرياضيات',
    topic: 'التفاضل والتكامل: الاشتقاق الضمني والبارامتري وتطبيقات المعدلات الزمنية',
    date: '2026-08-18',
    day: 'الثلاثاء',
    dayName: 'الثلاثاء',
    time: '06:00 م - 08:00 م',
    location: 'سنتر النور — الدقي (قاعة 2)',
    type: 'center',
    status: 'upcoming',
    price: 140,
    homework: 'حل مسائل 1 إلى 20 من بنك أسئلة الوزارة',
    teacherNotes: 'امتحان قصير 15 دقيقة في بداية الحصة'
  },
  {
    id: 'les-3',
    tutorId: 't5',
    tutorName: 'أ. طارق عبد العليم',
    tutorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    subject: 'الفيزياء',
    topic: 'الفيزياء الكهربية: قوانين كيرشوف وتطبيقات الدوائر المعقدة',
    date: '2026-08-20',
    day: 'الخميس',
    dayName: 'الخميس',
    time: '05:00 م - 07:00 م',
    location: 'أونلاين تفاعلي عبر منصة حصتي',
    type: 'online',
    status: 'upcoming',
    price: 110,
    homework: 'شيت مسائل كيرشوف ومسائل الأعوام السابقة'
  },
  {
    id: 'les-rev-1',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    tutorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    subject: 'الكيمياء',
    topic: 'ليلة الامتحان الشاملة: مراجعة الباب الأول والثاني والاتزان الكيميائي',
    date: '2026-08-25',
    day: 'الثلاثاء',
    dayName: 'الثلاثاء',
    time: '07:00 م - 10:00 م',
    location: 'مسرح سنتر الأهرام الكبرى',
    type: 'center',
    status: 'upcoming',
    price: 150,
    isRevision: true,
    teacherNotes: 'توزيع مذكرة المراجعة الذهبية ونماذج إجابات الوزارة'
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-001',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    date: '2026-08-12',
    time: '04:32 م',
    sessionStartTime: '04:30 م',
    scanTime: '04:32 م',
    status: 'present',
    timeWindowStatus: 'on_time',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    location: 'سنتر الأهرام - مدينة نصر',
    center: 'سنتر الأهرام',
    qrVerifiedAt: '12-08-2026 16:32:14 (موثق)',
    sessionNotes: 'تم شرح الجزء الأول من الكيمياء العضوية، ومشاركة ممتازة من الطالب في حل التمارين.',
    homeworkAssigned: 'واجب صـ 30 إلى 35 في مذكرة الشرح'
  },
  {
    id: 'att-002',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    subject: 'الرياضيات',
    date: '2026-08-10',
    time: '06:48 م',
    sessionStartTime: '06:30 م',
    scanTime: '06:48 م',
    status: 'late',
    timeWindowStatus: 'late_window',
    groupName: 'مجموعة التفوق - الدقي',
    location: 'سنتر النور - الدقي',
    center: 'سنتر النور',
    qrVerifiedAt: '10-08-2026 18:48:02 (حاضر متأخر 18 دقيقة)',
    sessionNotes: 'حضر الطالب متأخراً 18 دقيقة بسبب المواصلات، وتم تعويضه بالملخص وتدوين الواجب.',
    homeworkAssigned: 'حل التمارين الفردية صـ 78'
  },
  {
    id: 'att-003',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    tutorId: 't5',
    tutorName: 'أ. طارق عبد العليم',
    subject: 'الفيزياء',
    date: '2026-08-08',
    time: '05:00 م',
    sessionStartTime: '05:00 م',
    status: 'absent',
    timeWindowStatus: 'absent_window',
    groupName: 'مجموعة الفيزياء الحديثة',
    location: 'أونلاين عبر المنصة',
    center: 'أونلاين',
    sessionNotes: 'لم يسجل الطالب حضور في الموعد المحدد وتم إرسال تنبيه واتساب لولي الأمر.',
    homeworkAssigned: 'مراجعة تسجيل الحصة والحل مع الحصة التعويضية'
  },
  {
    id: 'att-004',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    date: '2026-08-05',
    time: '04:31 م',
    sessionStartTime: '04:30 م',
    scanTime: '04:31 م',
    status: 'present',
    timeWindowStatus: 'on_time',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    location: 'سنتر الأهرام',
    center: 'سنتر الأهرام',
    qrVerifiedAt: '05-08-2026 16:31:00 (موثق)',
    sessionNotes: 'شرح مبسط للتحليل الحجمي وحسابات المعايرة وحل مسائل متقدمة.',
    homeworkAssigned: 'شيت المعايرة الشامل'
  }
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    date: '2026-08-01',
    amount: 480,
    status: 'paid',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    studentName: 'زياد أحمد عبد الله',
    subject: 'الكيمياء',
    period: 'شهر أغسطس 2026 (4 حصص سنتر)',
    month: 'أغسطس 2026',
    invoiceNumber: 'INV-2026-8801'
  },
  {
    id: 'pay-002',
    date: '2026-08-01',
    amount: 560,
    status: 'paid',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    studentName: 'زياد أحمد عبد الله',
    subject: 'الرياضيات',
    period: 'شهر أغسطس 2026 (4 حصص)',
    month: 'أغسطس 2026',
    invoiceNumber: 'INV-2026-8802'
  },
  {
    id: 'pay-003',
    date: '2026-08-15',
    amount: 440,
    status: 'pending',
    tutorId: 't5',
    tutorName: 'أ. طارق عبد العليم',
    studentName: 'زياد أحمد عبد الله',
    subject: 'الفيزياء',
    period: 'شهر أغسطس 2026 (4 حصص أونلاين)',
    month: 'أغسطس 2026',
    invoiceNumber: 'INV-2026-8803'
  }
];

export const MOCK_PARENT_SETTINGS: ParentSettings = {
  notifyOnAttendance: true,
  notifyOnAbsence: true,
  notifyOnLateArrival: true,
  remindPayments: true,
  remindUpcomingLessons: true,
  whatsappPhone: '01198765432',
  emergencyPhone: '01099887766'
};

export const MOCK_TEACHER_GROUPS: StudentGroup[] = [
  {
    id: 'grp-1',
    name: 'مجموعة الأحد والثلاثاء - 3 ثانوي (مدينة نصر)',
    subject: 'الكيمياء',
    level: 'الصف الثالث الثانوي (علمي علوم)',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    schedule: 'الأحد والثلاثاء 4:30 م - 6:30 م',
    scheduleSlots: [
      { id: 'slot-1', day: 'Sunday', dayArabic: 'الأحد', startTime: '16:30', endTime: '18:30' },
      { id: 'slot-2', day: 'Tuesday', dayArabic: 'الثلاثاء', startTime: '16:30', endTime: '18:30' },
    ],
    location: 'سنتر الأهرام - قاعة 4',
    studentCount: 32,
    currentStudents: 32,
    maxCapacity: 35,
    studentIds: ['std-1', 'std-2', 'std-3'],
    waitlist: ['std-w1', 'std-w2'],
    billingType: 'per_session',
    priceAmount: 120,
    commissionRate: 2, // 2% fixed on per-session billing
  },
  {
    id: 'grp-2',
    name: 'مجموعة الخميس والجمعة - 2 ثانوي (المعادي)',
    subject: 'الكيمياء',
    level: 'الصف الثاني الثانوي (علمي)',
    grade: 'الصف الثاني الثانوي (علمي)',
    schedule: 'الخميس 5:00 م والجمعة 10:00 ص',
    scheduleSlots: [
      { id: 'slot-3', day: 'Thursday', dayArabic: 'الخميس', startTime: '17:00', endTime: '19:00' },
      { id: 'slot-4', day: 'Friday', dayArabic: 'الجمعة', startTime: '10:00', endTime: '12:00' },
    ],
    location: 'أكاديمية التفوق - المعادي',
    studentCount: 28,
    currentStudents: 28,
    maxCapacity: 30,
    studentIds: ['std-4', 'std-5'],
    billingType: 'monthly',
    priceAmount: 480,
    commissionRate: 1.2, // Tiered monthly rate (e.g. 1.2%)
  },
  {
    id: 'grp-3',
    name: 'المجموعة الأونلاين التفاعلية - لغات',
    subject: 'الكيمياء',
    level: 'الصف الثالث الثانوي (علمي)',
    grade: 'الصف الثالث الثانوي (علمي)',
    schedule: 'الإثنين والأربعاء 7:00 م',
    scheduleSlots: [
      { id: 'slot-5', day: 'Monday', dayArabic: 'الإثنين', startTime: '19:00', endTime: '21:00' },
      { id: 'slot-6', day: 'Wednesday', dayArabic: 'الأربعاء', startTime: '19:00', endTime: '21:00' },
    ],
    location: 'أونلاين عبر المنصة',
    studentCount: 45,
    currentStudents: 45,
    maxCapacity: 50,
    studentIds: ['std-6', 'std-7'],
    billingType: 'monthly',
    priceAmount: 400,
    commissionRate: 1.0, // Top tier monthly rate (1%)
  }
];

export const MOCK_TEACHER_STUDENTS = [
  {
    id: 'std-1',
    name: 'زياد أحمد عبد الله',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    phone: '01012345678',
    parentPhone: '01198765432',
    qrCode: 'HST-2026-09812',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي (مدينة نصر)',
    attendanceRate: 95,
    totalSessions: 20,
    attendedSessions: 19,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-01',
    status: 'active' as const
  },
  {
    id: 'std-2',
    name: 'مريم عادل الشريف',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    phone: '01099887766',
    parentPhone: '01144332211',
    qrCode: 'HST-2026-11420',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي (مدينة نصر)',
    attendanceRate: 100,
    totalSessions: 20,
    attendedSessions: 20,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-05',
    status: 'active' as const
  },
  {
    id: 'std-3',
    name: 'عمر خالد الباز',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    phone: '01233445566',
    parentPhone: '01055667788',
    qrCode: 'HST-2026-88410',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي (مدينة نصر)',
    attendanceRate: 88,
    totalSessions: 20,
    attendedSessions: 18,
    paymentStatus: 'pending' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-10',
    status: 'active' as const
  },
  {
    id: 'std-4',
    name: 'سلمى يوسف القاضي',
    grade: 'الصف الثاني الثانوي (علمي)',
    phone: '01511223344',
    parentPhone: '01122334455',
    qrCode: 'HST-2026-55190',
    groupName: 'مجموعة الخميس والجمعة - 2 ثانوي (المعادي)',
    attendanceRate: 92,
    totalSessions: 20,
    attendedSessions: 18,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-15',
    status: 'active' as const
  },
  {
    id: 'std-5',
    name: 'كريم هاني عبد المنعم',
    grade: 'الصف الثاني الثانوي (علمي)',
    phone: '01066778899',
    parentPhone: '01299887766',
    qrCode: 'HST-2026-44200',
    groupName: 'مجموعة الخميس والجمعة - 2 ثانوي (المعادي)',
    attendanceRate: 78,
    totalSessions: 20,
    attendedSessions: 15,
    paymentStatus: 'pending' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-20',
    status: 'active' as const
  }
];

// ==========================================
// MAKEUP (COMPENSATORY) SESSIONS REQUESTS
// ==========================================
export const MOCK_MAKEUP_REQUESTS: MakeupSessionRequest[] = [
  {
    id: 'mkp-1',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    tutorId: 't5',
    subject: 'الفيزياء',
    missedDate: '2026-08-08',
    missedSessionTopic: 'قوانين كيرشوف وتطبيقات الدوائر المعقدة',
    excuseReason: 'ظرف صحي طارئ (نزلة برد حادة)',
    medicalProofAttached: true,
    requestedSlotText: 'الجمعة 10:00 ص (أونلاين لايف)',
    status: 'pending',
    createdAt: 'منذ يومين'
  }
];

// ==========================================
// ATTENDANCE DISPUTES (تظلمات الحضور)
// ==========================================
export const MOCK_DISPUTE_TICKETS: AttendanceDisputeTicket[] = [
  {
    id: 'dsp-201',
    studentId: 'std-1',
    studentName: 'زياد أحمد عبد الله',
    attendanceRecordId: 'att-003',
    sessionDate: '2026-08-08',
    subject: 'الفيزياء',
    teacherName: 'أ. طارق عبد العليم',
    disputeReason: 'تم فتح البث أونلاين ولكن حدث انقطاع في خادم الماسح وتم التواصل مع المشرف في السنتر.',
    status: 'under_review',
    createdAt: '2026-08-09'
  }
];

// ==========================================
// REVISION SESSIONS / EXAM NIGHTS
// ==========================================
export const MOCK_REVISION_SESSIONS: RevisionSessionItem[] = [
  {
    id: 'rev-1',
    title: 'المراجعة النهائية ليلة الامتحان - الباب الأول والثاني',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    grade: 'الصف الثالث الثانوي (علمي)',
    date: '2026-08-25',
    time: '07:00 م - 10:00 م',
    location: 'مسرح سنتر الأهرام الكبرى - مدينة نصر',
    pricePerStudent: 150,
    totalSeats: 120,
    bookedSeats: 94,
    isExamNight: true
  },
  {
    id: 'rev-2',
    title: 'ورشة حل 500 مسألة تفاضل وتكامل متوقعة',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    subject: 'الرياضيات',
    grade: 'الصف الثالث الثانوي (علمي رياضة)',
    date: '2026-08-28',
    time: '05:00 م - 09:00 م',
    location: 'قاعة المؤتمرات الكبرى - الدقي',
    pricePerStudent: 180,
    totalSeats: 150,
    bookedSeats: 140,
    isExamNight: true
  }
];

// ==========================================
// SAFETY REPORTS / INAPPROPRIATE CONDUCT
// ==========================================
export const MOCK_SAFETY_REPORTS: SafetyReport[] = [
  {
    id: 'sft-1',
    reporterRole: 'parent',
    reporterName: 'م. أشرف الشناوي',
    reporterPhone: '01198765432',
    targetTeacherId: 't-test',
    targetTeacherName: 'أ. مدرس تجريبي',
    category: 'absence_no_notice',
    description: 'تم إلغاء الحصة بدون إشعار مسبق ولم يتم الرد على استفسارات أولياء الأمور.',
    createdAt: '2026-08-01',
    status: 'resolved'
  }
];

export const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'إزاي بتضمن منصة حصتي صحة حضور الطالب ونافذة التسجيل العادلة؟',
    answer: 'كل طالب يمتلك بطاقة رقمية بكود QR فريد. في بداية الحصة يمسح الكود، فإذا كان خلال أول 15 دقيقة يسجل حاضر (أخضر)، وإذا حضر بين 15 دقيقة ومنتصف الحصة يسجل حاضر متأخر (برتقالي) حتى لا يظلم بحساب غياب كامل، بينما إذا تجاوز نصف الحصة يسجل غياب (أحمر) مع إرسال إشعار واتساب تلقائي لولي الأمر.'
  },
  {
    id: 'faq-2',
    question: 'إزاي ولي الأمر بيتابع أكتر من ابن في حساب واحد؟',
    answer: 'من لوحة تحكم ولي الأمر، يمكنك إضافة أبنائك وإرسال طلب تأكيد للطالب للتحقق من صلة القرابة، ثم التبديل بينهم بنقرة زر لمتابعة الحضور والغياب والواجبات والمصروفات.'
  },
  {
    id: 'faq-3',
    question: 'هل يحق للطالب طلب حصة تعويضية لو غاب بعذر طبي أو طارئ؟',
    answer: 'نعم، المنصة تتيح للطالب أو ولي أمره تقديم طلب حصة تعويضية مع توضيح العذر، ليتم توجيهه لمجموعة موازية بنفس الأسبوع دون التأثير سلباً على سجل انتظامه.'
  },
  {
    id: 'faq-4',
    question: 'إيه اللي بيحصل لو المدرس ألغى الحصة؟',
    answer: 'النظام موازٍ وعادل: إذا ألغى المدرس بمهلة كافية (> 3 ساعات) يتم إرسال تنبيه واتساب فوري للجميع دون تأثير على تقييمه، أما الإلغاء المتأخر فيسجل كغياب معلم ويؤثر على مؤشر الموثوقية بالمنصة.'
  },
  {
    id: 'faq-5',
    question: 'هل يمكن تقديم شكوى أو إبلاغ في حالة وجود تصرف غير لائق؟',
    answer: 'نعم بكل تأكيد، توجد ميزة إبلاغ آمنة وسريعة للطلاب وأولياء الأمور تضمن مراجعة الشكوى من إدارة منصة حصتي خلال ساعتين واتخاذ الإجراءات القانونية والإدارية اللازمة فوراً.'
  }
];

// Convenience Aliases for Pages
export const MOCK_CURRENT_STUDENT = MOCK_STUDENT_PROFILE;
export const MOCK_STUDENT_LESSONS = MOCK_LESSONS;
export const MOCK_ATTENDANCE_RECORDS = MOCK_ATTENDANCE;
export const MOCK_PARENT_CHILDREN = [
  {
    id: 'child-1',
    name: 'زياد أحمد عبد الله',
    grade: 'الصف الثالث الثانوي (علمي علوم)',
    qrCode: 'HST-2026-09812',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    attendanceRate: 95,
    tutorsCount: 3,
    totalSessions: 20,
    presentOnTime: 18,
    presentLate: 1,
    absentCount: 1,
    verified: true
  },
  {
    id: 'child-2',
    name: 'سارة أحمد عبد الله',
    grade: 'الصف الأول الإعدادي',
    qrCode: 'HST-2026-33910',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    attendanceRate: 100,
    tutorsCount: 2,
    totalSessions: 16,
    presentOnTime: 16,
    presentLate: 0,
    absentCount: 0,
    verified: true
  }
];

export const MOCK_ATTENDANCE_TIME_WINDOW_STATS = {
  onTimeCount: 88,
  lateCount: 8,
  absentCount: 4,
  onTimePercentage: 88,
  latePercentage: 8,
  absentPercentage: 4,
  averageDelayMinutes: 4.2
};


