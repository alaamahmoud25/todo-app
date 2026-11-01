// Arabic dictionary. This is the reference: add every new key here first.
export const ar = {
  appTitle: 'مهامي',
  switchLang: 'English',
  loading: 'جاري التحميل...',
  serverError: 'مش قادر أوصل للسيرفر، اتأكد إن Django شغال',
  noTasks: 'مفيش مهام هنا 🎉',
  noDueDate: 'من غير ميعاد',
  allCategories: 'كل التصنيفات',
  allPriorities: 'كل الأولويات',
  overdueBadge: 'متأخرة',
  darkMode: 'الوضع الليلي',
  lightMode: 'الوضع النهاري',
  search: 'دوّر على مهمة...',

  auth: {
    login: 'تسجيل الدخول',
    register: 'حساب جديد',
    username: 'اسم المستخدم',
    password: 'الباسورد',
    confirmPassword: 'أكّد الباسورد',
    submitLogin: 'دخول',
    submitRegister: 'اعمل الحساب',
    logout: 'خروج',
    welcome: 'أهلًا بيك 👋',
    subtitle: 'نظّم يومك ومتنساش ولا مهمة',
    passwordHint: '8 حروف على الأقل، ومش أرقام بس',
    errors: {
      invalid_credentials: 'اسم المستخدم أو الباسورد غلط',
      username_short: 'اسم المستخدم لازم يبقى 3 حروف على الأقل',
      username_taken: 'اسم المستخدم ده موجود، اختار اسم تاني',
      weak_password: 'الباسورد ضعيف: لازم 8 حروف على الأقل، ومش أرقام بس، ومش سهل التخمين',
      password_mismatch: 'الباسوردين مش زي بعض',
      required: 'اكتب اسم المستخدم والباسورد',
    },
  },

  nav: {
    tasks: 'المهام',
    stats: 'الإحصائيات',
  },

  summary: {
    today: 'النهارده',
    overdue: 'متأخرة',
    pending: 'لسه مخلصتش',
    doneToday: 'خلصت النهارده',
  },

  views: {
    all: 'الكل',
    today: 'النهارده',
    overdue: 'المتأخرة',
    upcoming: 'الجاية',
    done: 'اللي خلصت',
  },

  priority: {
    high: 'عالية 🔴',
    medium: 'متوسطة 🟡',
    low: 'منخفضة 🟢',
  },

  repeat: {
    none: 'مرة واحدة',
    daily: 'يوميًا',
    weekly: 'أسبوعيًا',
  },

  form: {
    addTask: 'مهمة جديدة',
    editTask: 'تعديل المهمة',
    title: 'العنوان',
    titlePlaceholder: 'مثلًا: أدفع فاتورة النت',
    description: 'تفاصيل',
    descriptionPlaceholder: 'اختياري',
    category: 'التصنيف',
    noCategory: 'من غير تصنيف',
    priority: 'الأولوية',
    dueAt: 'الميعاد (تاريخ وساعة)',
    clearDate: 'شيل الميعاد',
    quickInHour: 'بعد ساعة',
    quickTonight: 'النهارده 9 م',
    quickTomorrow: 'بكره 9 ص',
    remind: 'التذكير',
    repeat: 'التكرار',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    confirmDelete: 'متأكد إنك عايز تحذف المهمة دي؟',
    saving: 'جاري الحفظ...',
    repeatNeedsDate: 'المهمة المتكررة لازم يكون ليها ميعاد',
    titleRequired: 'العنوان مطلوب',
  },

  remindOptions: {
    none: 'من غير تذكير',
    m0: 'في نفس الميعاد',
    m5: 'قبلها بـ 5 دقايق',
    m15: 'قبلها بربع ساعة',
    m30: 'قبلها بنص ساعة',
    m60: 'قبلها بساعة',
    m1440: 'قبلها بيوم',
  },

  notifications: {
    enable: 'شغّل الإشعارات',
    enabled: 'الإشعارات شغالة',
    blocked: 'الإشعارات مقفولة من إعدادات المتصفح',
    reminderTitle: '🔔 تذكير',
    dueAt: 'الميعاد',
    dismiss: 'تمام',
  },

  stats: {
    title: 'الإحصائيات',
    last7Days: 'آخر 7 أيام',
    done: 'خلصت',
    due: 'كان ميعادها',
    byCategory: 'المهام الباقية حسب التصنيف',
    byPriority: 'المهام الباقية حسب الأولوية',
    completionRate: 'نسبة الإنجاز',
    completionHint: 'من كل المهام اللي سجلتها',
    uncategorized: 'من غير تصنيف',
    empty: 'لسه مفيش بيانات كفاية',
  },
};

// Dictionary shape: every other language must have exactly the same keys
export type Dictionary = typeof ar;
