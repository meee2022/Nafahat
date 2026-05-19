// نماذج البيانات الأساسية للتطبيق

export interface Surah {
  id: number;            // 1..114
  nameAr: string;        // الفاتحة
  nameEn: string;        // Al-Fatihah
  nameTranslit: string;  // Al-Fatihah
  versesCount: number;
  revelationType: 'meccan' | 'medinan';
  pageStart: number;     // أول صفحة (1..604)
  juzStart: number;      // أول جزء (1..30)
  hizbStart: number;
}

export interface Ayah {
  surahId: number;
  number: number;        // ضمن السورة
  text: string;          // نص الآية بالرسم العثماني
  page: number;
  juz: number;
  translation?: string;
  tafsir?: string;
}

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  countryAr: string;
  style: 'مرتل' | 'مجود' | 'معلم';
  bitrate: number;
  cdnBase: string;       // قاعدة مسار التحميل
  popular?: boolean;
  /**
   * 🎯 ID القارئ في Quran Foundation API.
   *   يُستخدم لجلب التوقيتات الدقيقة الخاصة بهذا القارئ تحديداً.
   *   لو غير محدّد، نستخدم العفاسي (ID 7) كمرجع - بيـ drift مع الوقت
   *   لو القارئ ذو إيقاع مختلف.
   */
  qcfRecitationId?: number;
}

export interface Bookmark {
  id: string;
  surahId: number;
  ayahNumber: number;
  page: number;
  note?: string;
  /** 🆕 folder id لتجميع المرجعيات (مثلاً: "للحفظ"، "آيات تأمّل"، "آيات الرحمة"). undefined = افتراضي */
  folder?: string;
  createdAt: number;
}

/** 🆕 Bookmark folder للتنظيم */
export interface BookmarkFolder {
  id: string;
  nameAr: string;
  /** أيقونة من lucide-react-native */
  iconName?: string;
  /** لون hex للأيقونة */
  color?: string;
  createdAt: number;
}

export interface Note {
  id: string;
  surahId: number;
  ayahNumber: number;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type MemorizationStrength = 'weak' | 'medium' | 'strong';
export type MemorizationStatus = 'new' | 'learning' | 'memorized' | 'review';

export interface MemorizationTask {
  id: string;
  surahId: number;
  ayahFrom: number;
  ayahTo: number;
  status: MemorizationStatus;
  strength: MemorizationStrength;
  lastReviewedAt?: number;
  nextReviewAt?: number;     // جدولة المراجعة (Spaced Repetition)
  reviewIntervalDays: number;
  repetitions: number;
}

export interface MemorizationPlan {
  id: string;
  title: string;
  unit: 'ayah' | 'page' | 'hizb';
  dailyAmount: number;       // عدد الوحدات في اليوم
  startSurah: number;
  endSurah: number;
  daysPerWeek: number;
  reminderTime: string;      // "07:30"
  createdAt: number;
  active: boolean;
}

export interface TasmeeSession {
  id: string;
  startedAt: number;
  durationSec: number;
  surahId: number;
  ayahFrom: number;
  ayahTo: number;
  mistakes: number;
  score: number;             // 0..100
  notes?: string;
  recordingUri?: string;
}

export interface ReadingSession {
  id: string;
  startedAt: number;
  durationSec: number;
  pagesRead: number;
  surahId: number;
  lastAyah: number;
}

export type DhikrCategory =
  // الفئات الأساسية
  | 'morning' | 'evening' | 'after-prayer' | 'sleep' | 'wake' | 'general'
  // فئات حصن المسلم الكاملة
  | 'home'         // أذكار البيت (الدخول/الخروج)
  | 'eating'       // أذكار الأكل والشرب
  | 'mosque'       // أذكار المسجد
  | 'purification' // أذكار الطهارة (الوضوء/الخلاء)
  | 'sneezing'     // ما يقال عند العطاس والتثاؤب
  | 'protection'   // التعوذ من السحر والعين والحسد
  | 'travel'       // أذكار السفر
  | 'illness'      // المرض والهم والكرب
  | 'fasting'      // أذكار الصيام
  | 'fear'         // الخوف والفزع
  | 'family'       // الزواج والأسرة
  | 'nature'       // الظواهر الكونية (المطر/الرعد)
  | 'death'        // الموت والحياة
  | 'hajj'         // الحج والعمرة
  | 'money'        // المال والبيع والتجارة
  | 'social'       // الأذكار الاجتماعية
  | 'tasbeeh'      // فضل التسبيح والتهليل والتكبير
  | 'istighfar'    // الاستغفار والتوبة
  | 'ruqya'        // الرقية والتعوذ من الفتن
  | 'clothing'     // اللباس والزينة
  | 'misc';        // أذكار متفرقة

export interface DhikrItem {
  id: string;
  category: DhikrCategory;
  title: string;
  body: string;
  count: number;
  source?: string;
  benefit?: string;
  /** هل النص آية/آيات قرآنية - يُعرض بأسلوب المصحف (إطار ذهبي + رصائع). */
  quranic?: boolean;
}

export interface TasbeehItem {
  id: string;
  text: string;
  goal: number;
  current: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;          // 0..1
  target: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startsAt: number;
  endsAt: number;
  goal: number;
  progress: number;
  rewardLabel: string;
}

export interface KhatmaPlan {
  id: string;
  title: string;
  totalDays: number;
  startDate: number;
  pagesPerDay: number;
  completedPages: number;
  active: boolean;
}

export interface TajweedLesson {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  title: string;
  summary: string;
  body: string;
  example?: string;
  estimatedMinutes: number;
  completed?: boolean;
}

export interface AppStats {
  pagesRead: number;
  versesMemorized: number;
  sessionsCount: number;
  listenedMinutes: number;
  tasbeehCount: number;
  streakDays: number;
  lastActiveDate: number;
  weeklyMinutes: number[];   // 7 قيم
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'guest' | 'student' | 'teacher' | 'child' | 'elder';
  avatarSeed: string;
  /** 🆕 صورة الملف الشخصي - data URI أو local file URI. اختياري. */
  avatarUri?: string;
  joinedAt: number;
}

// ============== Quiz / اختبارات ==============

export type QuizLevel = 'beginner' | 'intermediate' | 'advanced';

/** أنواع الأسئلة المدعومة - شاملة وتغطّي الجزء بالكامل. */
export type QuizQuestionKind =
  // ───── تعريف السورة/الموضع ─────
  | 'whichSurah'        // عرض نص آية، اختيار السورة من 4
  | 'whichJuz'          // عرض آية، اختيار الجزء من 4
  | 'isFromSurah'       // صح/خطأ: هل هذه الآية من سورة X؟
  | 'ayahPosition'      // الآية رقم كم في السورة؟

  // ───── التسلسل (Sequence) ─────
  | 'nextAyah'          // ما الآية التي تأتي بعد هذه؟
  | 'previousAyah'      // ما الآية التي تأتي قبل هذه؟
  | 'firstWordOfNext'   // ما أول كلمة في الآية التالية؟

  // ───── أجزاء الآية ─────
  | 'completeVerse'     // النصف الأول → اختيار الثاني
  | 'verseBeginning'    // النصف الأخير → اختيار الأول
  | 'ayahEnding'        // 4 خيارات لنهاية آية (آخر الآية)
  | 'typeNextWord'      // اكتب الكلمة التالية في الآية
  | 'fillBlank'         // ملء فراغ في وسط الآية (typing)

  // ───── معلومات السورة ─────
  | 'meccanMedinan'     // مكية أم مدنية؟
  | 'verseCount'        // كم عدد آيات السورة؟
  | 'surahBefore'       // أي سورة قبل سورة X؟
  | 'surahAfter'        // أي سورة بعد سورة X؟
  | 'firstAyahOfSurah'  // ما أول آية في سورة X؟
  | 'lastAyahOfSurah'   // ما آخر آية في سورة X؟

  // ───── أسئلة جديدة على غرار اختبارات حفظ القرآن ─────
  | 'surahOrder'        // ما ترتيب سورة X في المصحف؟ (1-114)
  | 'whichPage'         // في أي صفحة تقع هذه الآية؟
  | 'wordCountAyah'     // كم عدد كلمات هذه الآية؟
  | 'arrangeAyahs'      // رتّب الآيات الثلاث بترتيبها الصحيح
  | 'muqattaat'         // هل سورة X مبدوءة بحروف مقطّعة؟
  | 'longestSurah'      // أيّ السور هي الأطول/الأقصر بين هذه؟
  | 'pageCountSurah'    // كم صفحة تشغل سورة X في المصحف؟

  // ───── أسئلة منسَّقة يدوياً (curated) - من امتحانات حفظ معتمدة ─────
  | 'curated';          // سؤال جاهز مع 5 خيارات و explanation

/** سؤال اختبار: قد يكون اختيار من متعدّد أو صح/خطأ أو إدخال نصّي. */
export interface QuizQuestion {
  id: string;
  kind: QuizQuestionKind;
  type: 'mcq' | 'truefalse' | 'typing';
  /** نص السؤال الظاهر للمستخدم (مثلاً: "من أي سورة هذه الآية؟"). */
  prompt: string;
  /** السياق - عادة نص الآية المعروضة. */
  context?: string;
  /** خيارات MCQ (4 عناصر) أو true/false (2 عناصر). */
  options?: string[];
  /** فهرس الإجابة الصحيحة في options. */
  correctIndex?: number;
  /** الإجابة الصحيحة كنصّ - تُستخدم للأسئلة من نوع typing. */
  correctAnswer?: string;
  /** نقاط الإجابة الصحيحة. */
  points: number;
  /** معلومة إضافية تظهر بعد الإجابة (مثلاً: مرجع الآية). */
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  correct: boolean;
  /** الإجابة التي اختارها المستخدم (فهرس أو نصّ). */
  userAnswer?: string | number;
  /** الوقت الذي استغرقه (مللي ثانية) - للتحدّيات السريعة. */
  timeMs?: number;
}

export interface QuizSession {
  id: string;
  startedAt: number;
  finishedAt?: number;
  level: QuizLevel;
  juzs: number[];                  // الأجزاء المختارة 1..30
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  totalPoints: number;
  correctCount: number;
  bestStreakInSession: number;
}

export interface QuizHistoryEntry {
  id: string;
  startedAt: number;
  finishedAt: number;
  level: QuizLevel;
  juzs: number[];
  correctCount: number;
  totalQuestions: number;
  points: number;
}
