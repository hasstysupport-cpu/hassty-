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
  AvailableSlot
} from '../types';

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
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
  'البحيرة',
];

export const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  'القاهرة': ['مدينة نصر', 'المعادي', 'التجمع الخامس', 'مصر الجديدة', 'شبرا', 'حلوان', 'الزمالك', 'المقطم', 'عين شمس'],
  'الجيزة': ['الدقي', 'المهندسين', 'الشيخ زايد', '6 أكتوبر', 'الهرم', 'فيصل', 'العجوزة', 'العمرانية'],
  'الإسكندرية': ['سموحة', 'سيدي جابر', 'ستانلي', 'لوران', 'ميامي', 'العجمي', 'محرم بك', 'الإبراهيمية'],
  'الدقهلية': ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'السنبلاوين', 'بلقاس'],
  'الشرقية': ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس'],
  'القليوبية': ['بنها', 'شبرا الخيمة', 'طوخ', 'قليوب', 'العبور'],
  'الغربية': ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى'],
  'المنوفية': ['شبين الكوم', 'منوف', 'أشمون', 'قويسنا'],
  'بورسعيد': ['حي الشرق', 'حي العرب', 'حي المناخ', 'بورفؤاد'],
  'السويس': ['حي السويس', 'الأربعين', 'فيصل'],
  'الإسماعيلية': ['حي أول', 'حي ثان', 'التل الكبير', 'فايد'],
  'البحيرة': ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'رشيد'],
};

export const COMMISSION_TIERS: CommissionTier[] = [
  { range: '1 - 20 طالب', minStudents: 1, maxStudents: 20, percentage: 5.0, rate: '5.0%', example: 'مع 20 طالب بتدفع 5% فقط', benefit: 'تفعيل كامل لماسح الـ QR ولوحة المتابعة', tag: 'بداية الانطلاق' },
  { range: '21 - 50 طالب', minStudents: 21, maxStudents: 50, percentage: 4.0, rate: '4.0%', example: 'مع 40 طالب بتوفر 20% من العمولة', benefit: 'إرسال إشعارات واتساب غير محدودة لأولياء الأمور', tag: 'نمو سريع' },
  { range: '51 - 100 طالب', minStudents: 51, maxStudents: 100, percentage: 3.0, rate: '3.0%', example: 'مع 80 طالب بتوفر 40% من العمولة', benefit: 'دعم فني خاص وإحصائيات متقدمة للحضور', tag: 'المستوى الفضي' },
  { range: '101 - 200 طالب', minStudents: 101, maxStudents: 200, percentage: 2.0, rate: '2.0%', example: 'مع 150 طالب العمولة 2% فقط', benefit: 'ظهور مميز في صدارة نتائج البحث بالمحافظة', tag: 'المستوى الذهبي' },
  { range: '201 - 500 طالب', minStudents: 201, maxStudents: 500, percentage: 1.0, rate: '1.0%', example: 'مع 300 طالب بتدفع 1% فقط', benefit: 'شارة المعلم المعتمد النخبة وإدارة سناتر متعددة', tag: 'المستوى البلاتيني' },
  { range: 'أكثر من 500 طالب', minStudents: 501, maxStudents: null, percentage: 0.5, rate: '0.5%', example: 'أقل عمولة تعليمية في مصر 0.5%', benefit: 'مدير حساب مخصص وربط مخصص للسناتر الكبرى', tag: 'النخبة' },
];

export const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'math',
    name: 'الرياضيات',
    tutorCount: 480,
    iconName: 'Calculator',
    isFeatured: true,
    tag: 'الأعلى طلباً',
    description: 'جبر، هندسة، تفاضل وتكامل، وإحصاء لجميع المراحل'
  },
  {
    id: 'english',
    name: 'اللغة الإنجليزية',
    tutorCount: 420,
    iconName: 'Languages',
    isFeatured: true,
    tag: 'الأعلى طلباً',
    description: 'قواعد، محادثة، وترجمة لمناهج المدارس واللغات'
  },
  {
    id: 'arabic',
    name: 'اللغة العربية',
    tutorCount: 390,
    iconName: 'BookOpen',
    isFeatured: false,
    description: 'نحو، بلاغة، نصوص، وأدب للثانوية والإعدادي'
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    tutorCount: 310,
    iconName: 'Atom',
    isFeatured: false,
    description: 'شرح مبسط للتجارب والمسائل والقوانين الفيزيائية'
  },
  {
    id: 'chemistry',
    name: 'الكيمياء',
    tutorCount: 290,
    iconName: 'FlaskConical',
    isFeatured: false,
    description: 'كيمياء عضوية وغير عضوية وحل بنوك الأسئلة'
  },
  {
    id: 'science',
    name: 'العلوم',
    tutorCount: 280,
    iconName: 'Microscope',
    isFeatured: false,
    description: 'تأسيس علمي شامل للمرحلتين الابتدائية والإعدادية'
  },
  {
    id: 'biology',
    name: 'الأحياء',
    tutorCount: 260,
    iconName: 'Dna',
    isFeatured: false,
    description: 'تشريح، وراثة، وبيولوجيا جزيئية لطلاب العلمي'
  },
  {
    id: 'french',
    name: 'اللغة الفرنسية',
    tutorCount: 190,
    iconName: 'Globe',
    isFeatured: false,
    description: 'اللغة الثانية لمدارس العام واللغات مع تدريب على النطق'
  },
];

export const PROBLEM_SOLUTION_CARDS = [
  {
    id: '1',
    title: 'حساب واحد متكامل لكل احتياجاتك',
    description: 'بدل ما تتوه بين دفاتر المدرسين ومجموعات الواتساب، كل حصص أولادك ومواعيدهم في شاشة واحدة منظمة.'
  },
  {
    id: '2',
    title: 'تسجيل حضور فوري بكود QR',
    description: 'مسح ضوئي سريع عند دخول الحصة يوثق الحضور بالدقيقة، ويلغي الدفاتر اليدوية وسوء التفاهم نهائيًا.'
  },
  {
    id: '3',
    title: 'متابعة لحظية لولي الأمر',
    description: 'إشعار واتساب فوري يوصل لولي الأمر بمجرد مسح الكود يؤكد حضور الطالب أو غيابه في نفس اللحظة.'
  },
  {
    id: '4',
    title: 'عمولة عادلة للمدرسين',
    description: 'لا توجد أي اشتراكات شهرية ثابتة؛ المدرس يدفع فقط عمولة بسيطة تنخفض تلقائيًا كلما زاد عدد طلابه.'
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'سجل بياناتك',
    description: 'أنشئ حسابك كطالب أو ولي أمر بخطوات بسيطة واحصل على بطاقة QR الرقمية الخاصة بك فوراً.',
    iconName: 'UserCheck'
  },
  {
    number: 2,
    title: 'اختار مدرسينك',
    description: 'تصفح المدرسين الموثقين في محافظتك ومنطقتك، واطلع على تقييمات الطلاب الحقيقيين ومواعيد الحصص.',
    iconName: 'Search'
  },
  {
    number: 3,
    title: 'ثبت حضورك بكود QR',
    description: 'امسح كود الـ QR الخاص بالمدرس أو أظهر بطاقتك لتسجيل حضورك تلقائيًا وتصل رسالة فورية لولي أمرك.',
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
    description: 'اطّلع على تقييمات حقيقية وموثقة فقط من طلاب مسجلين فعلياً — مفيش أي تقييمات وهمية.',
    iconName: 'Star'
  },
  {
    number: 3,
    title: 'انضم بضغطة واحدة',
    description: 'انضم لمجموعة المدرس إما بمسح كود الـ QR أو بإدخال كود الانضمام المباشر.',
    iconName: 'UserPlus'
  },
  {
    number: 4,
    title: 'احجز حصتك',
    description: 'احجز المواعيد المتاحة أونلاين واختر المكان المناسب (سنتر أو أونلاين أو درس منزلي).',
    iconName: 'CalendarCheck'
  },
];

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: 'qr-attendance',
    title: 'حضور بكود QR',
    description: 'تسجيل آلي فوري للحضور بدون دفاتر ورقية وبدون أي فرصة للخطأ أو النزاع.',
    iconName: 'QrCode',
    highlight: 'توثيق فوري'
  },
  {
    id: 'online-booking',
    title: 'حجز إلكتروني',
    description: 'جدول مواعيد تفاعلي يتيح حجز الحصص والمجموعات المتاحة بمرونة وسهولة تامة.',
    iconName: 'Calendar',
    highlight: 'حجز منظم'
  },
  {
    id: 'whatsapp-alerts',
    title: 'تنبيهات واتساب',
    description: 'إشعارات آلية تصل لهاتف ولي الأمر فور تسجيل حضور ابنه أو غيابه بدون تأخير.',
    iconName: 'MessageSquare',
    highlight: 'متابعة لحظية'
  },
  {
    id: 'real-reviews',
    title: 'تقييمات حقيقية',
    description: 'نظام تقييم محكم يسمح فقط للطلاب الذين حضروا الحصص فعلياً بكتابة آرائهم.',
    iconName: 'ShieldCheck',
    highlight: '100% موثوق'
  },
  {
    id: 'payment-tracking',
    title: 'تتبع المدفوعات',
    description: 'سجل مالي شفاف وموحد لجميع حصص ومجموعات الأبناء مع إيصالات إلكترونية واضحة.',
    iconName: 'Receipt',
    highlight: 'شفافية مالية'
  },
  {
    id: 'nationwide-coverage',
    title: 'تغطية كل محافظات مصر',
    description: 'شبكة واسعة تضم آلاف المدرسين المعتمدين في 27 محافظة من القاهرة والإسكندرية لأسوان.',
    iconName: 'Map',
    highlight: '27 محافظة'
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
    description: 'تم توثيقها بنجاح عبر كود QR'
  },
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: '1',
    name: 'م. أشرف الشناوي',
    role: 'ولي أمر طالبين بالثانوية',
    governorate: 'القاهرة - التجمع الخامس',
    quote: 'أكتر حاجة مريحة في حصتي هي إشعار الواتساب اللي بيوصلني فوراً لما ابني يدخل سنتر الدرس. مبقتش محتاج اتصل بيه أو بالمدرس عشان اطمن، ودايماً عارف حسابات الحصص أول بأول.',
    rating: 5,
    avatar: '👨‍💼',
    relatedSubject: 'فيزياء ورياضيات'
  },
  {
    id: '2',
    name: 'نورهان طارق',
    role: 'طالبة بالصف الثالث الثانوي',
    governorate: 'الجيزة - الدقي',
    quote: 'كارنيه الـ QR بتاعي على الموبايل خلاني ادخل كل حصصي في ثانية من غير ما استنى في طابور السنتر للتسجيل. وكمان عرفت الاقي أفضل مدرس كيمياء في منطقتي بناء على تقييمات زميلاتي الحقيقية.',
    rating: 5,
    avatar: '👩‍🎓',
    relatedSubject: 'كيمياء ولغات'
  },
  {
    id: '3',
    name: 'أ. محمود عبد الرحمن',
    role: 'مدرس أول لغة إنجليزية',
    governorate: 'الإسكندرية - سموحة',
    quote: 'منصة حصتي ريحتني تماماً من مشكلة كشوفات الغياب ومشاكل الحسابات مع أولياء الأمور. الطلاب بيمسحوا الكود والحضور بيتسجل لوحده في لوحة التحكم، ونظام العمولة العادلة يشجع أي مدرس ينضم.',
    rating: 5,
    avatar: '👨‍🏫',
    relatedSubject: 'لغة إنجليزية'
  },
];

export const TEACHER_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'tt1',
    name: 'أ. محمد سليم',
    role: 'مدرس فيزياء للثانوية العامة (420 طالب)',
    governorate: 'القاهرة - مدينة نصر',
    quote: 'قبل حصتي كنت بضيع أول ثلث ساعة في كل حصة عشان انادي على أسماء الطلاب وأسجل الغياب. دلوقتي مسح الكود بياخد ثواني، وأولياء الأمور مرتاحين جداً.',
    rating: 5,
    avatar: '👨‍🏫',
  },
  {
    id: 'tt2',
    name: 'مس دينا الألفي',
    role: 'معلمة لغة فرنسية (280 طالب)',
    governorate: 'الجيزة - المهندسين',
    quote: 'نظام العمولة العادلة ممتاز جداً. كل ما زاد عدد طلابي قلت النسبة المستحقة، وخدمة المتابعة والدعم الفني على أعلى مستوى.',
    rating: 5,
    avatar: '👩‍🏫',
  },
  {
    id: 'tt3',
    name: 'مستر خالد البنا',
    role: 'معلم أول كيمياء (650 طالب)',
    governorate: 'الإسكندرية - لوران',
    quote: 'التحويل المالي والتقارير الشهرية أراحتني من تجميع المبالغ والمطابقات اليدوية. الطلاب بيحجزوا من المنصة وأنا مركز فقط في الشرح.',
    rating: 5,
    avatar: '👨‍🏫',
  }
];

const DEFAULT_SLOTS: AvailableSlot[] = [
  { id: 's1', day: 'الأحد', time: '04:00 م - 06:00 م', status: 'available', type: 'center' },
  { id: 's2', day: 'الأحد', time: '06:30 م - 08:30 م', status: 'booked', type: 'center', bookedByStudentName: 'أحمد محمود' },
  { id: 's3', day: 'الثلاثاء', time: '04:00 م - 06:00 م', status: 'available', type: 'center' },
  { id: 's4', day: 'الثلاثاء', time: '07:00 م - 09:00 م', status: 'available', type: 'online' },
  { id: 's5', day: 'الخميس', time: '03:30 م - 05:30 م', status: 'available', type: 'private' },
  { id: 's6', day: 'الجمعة', time: '10:00 ص - 12:00 م', status: 'available', type: 'center' },
];

export const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    studentName: 'أحمد محمود فتحي',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: 'منذ 3 أيام',
    comment: 'شرح مستر حسام للكيمياء العضوية فوق الممتاز، لأول مرة افهم معادلات الألكانات والألكينات بسهولة وأحل أسئلة بنك المعرفة بدون تردد.',
    tutorReply: 'شكراً يا أحمد يا بطل، فخور بالتزامك وتفوقك الدائم.',
    subject: 'الكيمياء'
  },
  {
    id: 'r2',
    studentName: 'مريم عادل الشريف',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: 'منذ أسبوع',
    comment: 'الامتحانات الدورية والواجبات بتساعدنا نراجع أول بأول، وكود الـ QR خلى تنظيم الحصص سهل وسريع جداً.',
    subject: 'الكيمياء'
  },
  {
    id: 'r3',
    studentName: 'عمر خالد الباز',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    rating: 4,
    date: 'منذ أسبوعين',
    comment: 'أستاذ متمكن جداً ويهتم بكل طالب في المجموعة، وخصوصاً وقت حل المسائل والتدريبات الصعبة.',
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
    levels: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'خبرة 14 عاماً في تدريس الكيمياء بمصر وتبسيط المعادلات والمفاهيم العضوية بأحدث أساليب بنك المعرفة ونماذج الوزارة.',
    experienceYears: 14,
    centers: ['سنتر الأهرام - مدينة نصر', 'أكاديمية التفوق - المعادي'],
    phone: '01098765432',
    email: 'hossam.chem@hassty.edu',
    education: 'بكالوريوس علوم وتربية - قسم كيمياء، دبلوم تدريس مناهج اللغات',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
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
    levels: ['الصف الثالث الإعدادي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'مؤلف سلسلة التفوق في الرياضيات وداعم استراتيجيات حل المسائل المعقدة في أقل وقت ممكن.',
    experienceYears: 11,
    centers: ['سنتر النور - الدقي', 'سنتر الأوائل - المهندسين'],
    phone: '01122334455',
    email: 'ahmed.essam@hassty.edu',
    education: 'بكالوريوس هندسة وماجستير مناهج تعليم الرياضيات الحديثة',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
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
    levels: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'متخصصة في شرح الوراثة والمناعة وتدريب الطلاب على نماذج الامتحانات النهائية للثانوية العامة.',
    experienceYears: 9,
    centers: ['سنتر النخبة - سموحة', 'مقر سيدي جابر التعليمي'],
    phone: '01234567890',
    email: 'dr.sara@hassty.edu',
    education: 'دكتوراه في علم الأحياء الدقيقة، كلية العلوم - جامعة الإسكندرية',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
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
    levels: ['المرحلة الإعدادية', 'المرحلة الثانوية'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'حاصل على شهادة CELTA من جامعة كامبريدج، أسلوب تفاعلي ممتع لتطوير مهارات الكتابة والاستماع.',
    experienceYears: 16,
    centers: ['سنتر المستقبل - المشاية المنصورة'],
    phone: '01011223344',
    email: 'waleed.farouk@hassty.edu',
    education: 'ليسانس ألسن لغة إنجليزية ودبلوم تدريس لغات',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
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
    levels: ['الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'تبسيط تجارب الفيزياء الحديثة والكهربية مع ورش حل مسائل دورية وأسئلة مستويات تفكير عليا.',
    experienceYears: 13,
    centers: ['سنتر الأندلس - الزقازيق'],
    phone: '01555667788',
    email: 'tarek.phys@hassty.edu',
    education: 'بكالوريوس علوم قسم فيزياء، عضو الجمعية المصرية للفيزياء',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
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
    email: 'heba.arabic@hassty.edu',
    education: 'ليسانس دار العلوم، دبلوم تربوي في مناهج اللغة العربية',
    reviews: SAMPLE_REVIEWS,
    availableSlots: DEFAULT_SLOTS
  }
];

// Current logged in mock user profiles
export const MOCK_CURRENT_STUDENT: StudentProfile = {
  id: 'std-2026-9812',
  name: 'زياد أحمد عبد الله',
  phone: '01012345678',
  governorate: 'القاهرة',
  city: 'مدينة نصر',
  area: 'مدينة نصر',
  stage: 'الصف الثالث الثانوي (علمي رياضة)',
  grade: 'الصف الثالث الثانوي',
  age: 17,
  studentIdNumber: 'HST-2026-09812',
  qrCode: 'HST-2026-09812',
  qrCodeValue: 'HASSTY://STD:HST-2026-09812?NAME=ZIAD_AHMED&STAGE=3SEC',
  parentPhone: '01198765432',
  joinedTutorIds: ['t1', 't2', 't5'],
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'
};

export const MOCK_STUDENT_LESSONS: LessonItem[] = [
  {
    id: 'ls-1',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    tutorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    subject: 'الكيمياء',
    topic: 'شرح الكيمياء الكهربية وبنك الأسئلة',
    date: '2026-08-16',
    day: 'الأحد',
    dayName: 'الأحد القادم',
    time: '04:30 م - 06:30 م',
    location: 'سنتر الأهرام - مدينة نصر',
    type: 'center',
    status: 'upcoming',
    price: 120
  },
  {
    id: 'ls-2',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    tutorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    subject: 'الرياضيات',
    topic: 'تطبيقات على التفاضل والتكامل',
    date: '2026-08-18',
    day: 'الثلاثاء',
    dayName: 'الثلاثاء القادم',
    time: '06:00 م - 08:00 م',
    location: 'سنتر النور - الدقي',
    type: 'center',
    status: 'upcoming',
    price: 140
  },
  {
    id: 'ls-3',
    tutorId: 't5',
    tutorName: 'أ. طارق عبد العليم',
    tutorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    subject: 'الفيزياء',
    topic: 'مسائل كيرشوف وقوانين الدوائر المغلقة',
    date: '2026-08-20',
    day: 'الخميس',
    dayName: 'الخميس القادم',
    time: '05:00 م - 07:00 م',
    location: 'أونلاين عبر المنصة',
    type: 'online',
    status: 'upcoming',
    price: 110
  }
];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'std-2026-9812',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    date: '2026-08-13',
    time: '04:32 م',
    status: 'present',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    location: 'سنتر الأهرام - مدينة نصر',
    center: 'سنتر الأهرام - مدينة نصر',
    qrVerifiedAt: '04:32:15 م'
  },
  {
    id: 'att-2',
    studentId: 'std-2026-9812',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    subject: 'الرياضيات',
    date: '2026-08-11',
    time: '06:05 م',
    status: 'present',
    groupName: 'مجموعة التفوق - تفاضل وتكامل',
    location: 'سنتر النور - الدقي',
    center: 'سنتر النور - الدقي',
    qrVerifiedAt: '06:05:40 م'
  },
  {
    id: 'att-3',
    studentId: 'std-2026-9812',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    tutorId: 't5',
    tutorName: 'أ. طارق عبد العليم',
    subject: 'الفيزياء',
    date: '2026-08-08',
    time: '05:00 م',
    status: 'absent',
    groupName: 'مجموعة أبطال الفيزياء - كهربائية',
    location: 'أونلاين عبر المنصة',
    center: 'أونلاين عبر المنصة'
  },
  {
    id: 'att-4',
    studentId: 'std-2026-9812',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    tutorId: 't1',
    tutorName: 'أ. حسام إبراهيم',
    subject: 'الكيمياء',
    date: '2026-08-06',
    time: '04:30 م',
    status: 'present',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    location: 'سنتر الأهرام - مدينة نصر',
    center: 'سنتر الأهرام - مدينة نصر',
    qrVerifiedAt: '04:29:50 م'
  },
  {
    id: 'att-5',
    studentId: 'std-2026-9812',
    studentName: 'زياد أحمد عبد الله',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    tutorId: 't2',
    tutorName: 'م. أحمد عصام',
    subject: 'الرياضيات',
    date: '2026-08-04',
    time: '06:00 م',
    status: 'present',
    groupName: 'مجموعة التفوق - تفاضل وتكامل',
    location: 'سنتر النور - الدقي',
    center: 'سنتر النور - الدقي',
    qrVerifiedAt: '05:58:12 م'
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
    period: 'شهر أغسطس 2026 (4 حصص)',
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
  remindPayments: true,
  remindUpcomingLessons: true,
  whatsappPhone: '01198765432'
};

export const MOCK_TEACHER_GROUPS: StudentGroup[] = [
  {
    id: 'grp-1',
    name: 'مجموعة الأحد والثلاثاء - 3 ثانوي (مدينة نصر)',
    subject: 'الكيمياء',
    level: 'الصف الثالث الثانوي',
    grade: 'الصف الثالث الثانوي',
    schedule: 'الأحد والثلاثاء 4:30 م - 6:30 م',
    location: 'سنتر الأهرام - قاعة 4',
    studentCount: 32,
    currentStudents: 32,
    maxCapacity: 35,
    studentIds: ['std-1', 'std-2', 'std-3']
  },
  {
    id: 'grp-2',
    name: 'مجموعة الخميس والجمعة - 2 ثانوي (المعادي)',
    subject: 'الكيمياء',
    level: 'الصف الثاني الثانوي',
    grade: 'الصف الثاني الثانوي',
    schedule: 'الخميس 5:00 م والجمعة 10:00 ص',
    location: 'أكاديمية التفوق - المعادي',
    studentCount: 28,
    currentStudents: 28,
    maxCapacity: 30,
    studentIds: ['std-4', 'std-5']
  },
  {
    id: 'grp-3',
    name: 'المجموعة الأونلاين التفاعلية - لغات',
    subject: 'الكيمياء',
    level: 'الصف الثالث الثانوي',
    grade: 'الصف الثالث الثانوي',
    schedule: 'الإثنين والأربعاء 7:00 م',
    location: 'أونلاين عبر المنصة',
    studentCount: 45,
    currentStudents: 45,
    maxCapacity: 50,
    studentIds: ['std-6', 'std-7']
  }
];

export const MOCK_TEACHER_STUDENTS = [
  {
    id: 'std-1',
    name: 'زياد أحمد عبد الله',
    grade: 'الصف الثالث الثانوي',
    phone: '01012345678',
    parentPhone: '01198765432',
    qrCode: 'HST-2026-09812',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    attendanceRate: 95,
    totalSessions: 20,
    attendedSessions: 19,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-01'
  },
  {
    id: 'std-2',
    name: 'مريم عادل الشريف',
    grade: 'الصف الثالث الثانوي',
    phone: '01099887766',
    parentPhone: '01144332211',
    qrCode: 'HST-2026-11420',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    attendanceRate: 100,
    totalSessions: 20,
    attendedSessions: 20,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-05'
  },
  {
    id: 'std-3',
    name: 'عمر خالد الباز',
    grade: 'الصف الثالث الثانوي',
    phone: '01233445566',
    parentPhone: '01055667788',
    qrCode: 'HST-2026-88410',
    groupName: 'مجموعة الأحد والثلاثاء - 3 ثانوي',
    attendanceRate: 88,
    totalSessions: 20,
    attendedSessions: 18,
    paymentStatus: 'pending' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-10'
  },
  {
    id: 'std-4',
    name: 'سلمى يوسف القاضي',
    grade: 'الصف الثاني الثانوي',
    phone: '01511223344',
    parentPhone: '01122334455',
    qrCode: 'HST-2026-55190',
    groupName: 'مجموعة الخميس والجمعة - 2 ثانوي',
    attendanceRate: 92,
    totalSessions: 20,
    attendedSessions: 18,
    paymentStatus: 'paid' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-15'
  },
  {
    id: 'std-5',
    name: 'كريم هاني عبد المنعم',
    grade: 'الصف الثاني الثانوي',
    phone: '01066778899',
    parentPhone: '01299887766',
    qrCode: 'HST-2026-44200',
    groupName: 'مجموعة الخميس والجمعة - 2 ثانوي',
    attendanceRate: 78,
    totalSessions: 20,
    attendedSessions: 15,
    paymentStatus: 'pending' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    joinedDate: '2026-07-20'
  }
];

export const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'إزاي بتضمن منصة حصتي صحة حضور الطالب؟',
    answer: 'كل طالب بيحصل على كود QR فريد ومشفر في بطاقته الرقمية. عند وصوله للسنتر أو بدء الحصة، بيتم مسح الكود من خلال تطبيق المدرس وبيتسجل الحضور بالدقيقة والثانية مع إشعار فوري على واتساب ولي الأمر.'
  },
  {
    id: 'faq-2',
    question: 'هل توجد أي اشتراكات أو رسوم شهرية على المدرسين؟',
    answer: 'لا، مفيش أي اشتراك شهري ثابت على الإطلاق. المدرس بيدفع فقط نسبة عمولة بسيطة وتنازلية (تبدأ من 5% وتقل حتى 0.5%) كل ما زاد عدد طلابه الفعليين.'
  },
  {
    id: 'faq-3',
    question: 'إزاي ولي الأمر بيتابع أكثر من ابن في نفس الحساب؟',
    answer: 'من خلال لوحة تحكم ولي الأمر، تقدر تضيف وتربط أكواد جميع أبنائك وتتابع سجلات حضور وغياب ومدفوعات كل ابن في شاشة واحدة وبضغطة زر.'
  },
  {
    id: 'faq-4',
    question: 'هل يمكن حجز حصص أونلاين وسناتر من نفس المنصة؟',
    answer: 'نعم، المنصة بتوفر للمدرسين إمكانية تحديد نوع الحصة (سنتر، أونلاين لايف، أو درس منزلي خاص) مع تفعيل نظام الحجز وإدارة المواعيد المتاحة لكل نوع.'
  },
  {
    id: 'faq-5',
    question: 'إزاي بيتم توثيق بيانات وتقييمات المدرسين؟',
    answer: 'فريق عمل حصتي بيراجع بطاقة الرقم القومي والمؤهلات الأكاديمية لكل مدرس قبل تفعيل شارة التوثيق (✓). والتقييمات مسموح بها فقط للطلاب الذين حضروا الحصص فعلياً لمنع أي تقييمات وهمية.'
  }
];
