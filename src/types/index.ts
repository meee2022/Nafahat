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
}

export interface Bookmark {
  id: string;
  surahId: number;
  ayahNumber: number;
  page: number;
  note?: string;
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

export interface DhikrItem {
  id: string;
  category: 'morning' | 'evening' | 'after-prayer' | 'sleep' | 'wake' | 'general';
  title: string;
  body: string;
  count: number;
  source?: string;
  benefit?: string;
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
  joinedAt: number;
}

// ============== Quiz / اختبارات ==============

export type QuizLevel = 'beginner' | 'intermediate' | 'advanced';

/** أنواع الأسئلة المدعومة. */
export type QuizQuestionKind =
  | 'whichSurah'      // عرض نص آية، اختيار السورة من 4
  | 'nextAyah'        // عرض آية، اختيار النص التالي من 4
  | 'meccanMedinan'   // سورة كذا: مكية أم مدنية؟
  | 'verseCount'      // كم عدد آيات سورة كذا؟
  | 'completeVerse'   // إكمال الجزء الثاني من الآية
  | 'isFromSurah'     // صح/خطأ: هل هذه الآية من سورة X؟
  | 'typeNextWord';   // اكتب الكلمة التالية في الآية

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
