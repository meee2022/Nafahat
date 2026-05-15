/**
 * مولّد أسئلة اختبارات القرآن بنمط Duolingo.
 *
 * يولّد أسئلة ديناميكية من بيانات السور + نصوص الآيات من AlQuran.cloud (المخزّنة في الكاش).
 *
 * أنواع الأسئلة:
 *  1. whichSurah     - عرض نص آية + اختيار سورتها من 4
 *  2. nextAyah       - عرض آية + اختيار النص الذي يليها
 *  3. meccanMedinan  - سورة كذا: مكية أم مدنية؟
 *  4. verseCount     - كم عدد آيات سورة كذا؟
 *  5. completeVerse  - النصف الأول من الآية + اختيار النصف الثاني
 *  6. isFromSurah    - صح/خطأ: هل هذه الآية من سورة X؟
 *  7. typeNextWord   - اكتب الكلمة التالية في الآية
 */

import { SURAHS, getSurahById } from '@data/surahs';
import { getSurahAyahs } from '@services/quranApi';
import { Ayah, QuizLevel, QuizQuestion, QuizQuestionKind } from '@/types/index';

// =========== Helpers ============

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

/** يحوّل قائمة أجزاء (1..30) إلى قائمة سور تبدأ في تلك الأجزاء. */
function surahsInJuzs(juzs: number[]): typeof SURAHS {
  if (juzs.length === 0) return SURAHS;
  const set = new Set(juzs);
  return SURAHS.filter((s) => set.has(s.juzStart));
}

/** يقسّم نصّ آية إلى نصفين متقاربين (بعدد الكلمات). */
function splitAyahInHalf(text: string): { first: string; second: string } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return { first: text, second: '' };
  const mid = Math.floor(words.length / 2);
  return { first: words.slice(0, mid).join(' '), second: words.slice(mid).join(' ') };
}

/** يأخذ أول N كلمات من الآية. */
function firstWords(text: string, n: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, n).join(' ');
}

/** يأخذ الكلمة رقم index (مع تنظيف علامات الترقيم البسيطة). */
function wordAt(text: string, index: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const w = words[index];
  if (!w) return '';
  // إزالة علامات التشكيل لمقارنة أبسط
  return w.trim();
}

/** يقارن نصّين مع تجاهل التشكيل والمسافات. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // إزالة التشكيل
    .replace(/[إأآا]/g, 'ا')                              // توحيد الألف
    .replace(/ة/g, 'ه')                                    // التاء المربوطة → هاء
    .replace(/ى/g, 'ي')                                    // الألف المقصورة → ياء
    .replace(/[^؀-ۿa-zA-Z0-9]+/g, '')           // إزالة كل ما ليس عربياً أو رقماً
    .trim();
}

export function answersMatch(a: string, b: string): boolean {
  return normalizeArabic(a) === normalizeArabic(b);
}

// =========== Question Builders ============

function makeWhichSurah(ayah: Ayah, allSurahs: typeof SURAHS): QuizQuestion | null {
  const correct = getSurahById(ayah.surahId);
  if (!correct) return null;

  const distractorPool = allSurahs.filter((s) => s.id !== ayah.surahId);
  const distractors = pickN(distractorPool, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]).map((s) => s.nameAr);
  const correctIndex = options.indexOf(correct.nameAr);

  return {
    id: `q-${ayah.surahId}-${ayah.number}-which`,
    kind: 'whichSurah',
    type: 'mcq',
    prompt: 'من أيّ سورة هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex,
    points: 10,
    explanation: `سورة ${correct.nameAr}، الآية ${ayah.number}`,
  };
}

function makeNextAyah(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  // ابحث عن الآية التي تليها في نفس السورة
  const nextIndex = sameSurahAyahs.findIndex((a) => a.number === ayah.number + 1);
  if (nextIndex === -1) return null;
  const next = sameSurahAyahs[nextIndex];

  const distractorPool = sameSurahAyahs.filter((a) => a.number !== next.number && a.number !== ayah.number);
  const distractors = pickN(distractorPool, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([next, ...distractors]).map((a) => a.text);
  const correctIndex = options.indexOf(next.text);

  const surah = getSurahById(ayah.surahId);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-next`,
    kind: 'nextAyah',
    type: 'mcq',
    prompt: 'ما الآية التي تأتي بعد هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex,
    points: 15,
    explanation: surah ? `سورة ${surah.nameAr}` : undefined,
  };
}

function makeMeccanMedinan(surah: typeof SURAHS[number]): QuizQuestion {
  const correct = surah.revelationType === 'meccan' ? 'مكية' : 'مدنية';
  return {
    id: `q-${surah.id}-revtype`,
    kind: 'meccanMedinan',
    type: 'truefalse',
    prompt: `هل سورة ${surah.nameAr} مكية؟`,
    options: ['صحيح', 'خطأ'],
    correctIndex: surah.revelationType === 'meccan' ? 0 : 1,
    points: 5,
    explanation: `سورة ${surah.nameAr} ${correct}`,
  };
}

function makeVerseCount(surah: typeof SURAHS[number]): QuizQuestion {
  const correct = surah.versesCount;
  // ولّد 3 أرقام مغايرة قريبة
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = Math.ceil(Math.random() * 15) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = correct + offset;
    if (candidate > 0 && candidate !== correct) distractors.add(candidate);
  }
  const options = shuffle([correct, ...distractors]).map((n) => `${n}`);
  return {
    id: `q-${surah.id}-count`,
    kind: 'verseCount',
    type: 'mcq',
    prompt: `كم عدد آيات سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(`${correct}`),
    points: 10,
    explanation: `${correct} آية`,
  };
}

function makeCompleteVerse(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const { first, second } = splitAyahInHalf(ayah.text);
  if (!second) return null;

  // اختر 3 distractors من نفس السورة (نصف ثانٍ من آيات أخرى)
  const distractorPool = sameSurahAyahs
    .filter((a) => a.number !== ayah.number)
    .map((a) => splitAyahInHalf(a.text).second)
    .filter(Boolean);
  const distractors = pickN(distractorPool, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([second, ...distractors]);
  const correctIndex = options.indexOf(second);

  return {
    id: `q-${ayah.surahId}-${ayah.number}-complete`,
    kind: 'completeVerse',
    type: 'mcq',
    prompt: 'أكمل الآية:',
    context: first + ' ...',
    options,
    correctIndex,
    points: 15,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

function makeIsFromSurah(ayah: Ayah, allSurahs: typeof SURAHS): QuizQuestion {
  // 50% احتمال أن نقول السورة الصحيحة، 50% نقول سورة خاطئة
  const tellTrue = Math.random() < 0.5;
  const trueSurah = getSurahById(ayah.surahId);
  let mentionedSurah = trueSurah;
  if (!tellTrue) {
    const others = allSurahs.filter((s) => s.id !== ayah.surahId);
    mentionedSurah = pickRandom(others);
  }
  const isActuallyTrue = mentionedSurah?.id === ayah.surahId;

  return {
    id: `q-${ayah.surahId}-${ayah.number}-isfrom-${tellTrue ? 't' : 'f'}`,
    kind: 'isFromSurah',
    type: 'truefalse',
    prompt: `هل هذه الآية من سورة ${mentionedSurah?.nameAr ?? ''}؟`,
    context: ayah.text,
    options: ['صحيح', 'خطأ'],
    correctIndex: isActuallyTrue ? 0 : 1,
    points: 10,
    explanation: trueSurah ? `الآية من سورة ${trueSurah.nameAr}` : undefined,
  };
}

function makeTypeNextWord(ayah: Ayah): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 5) return null;
  // اختر موقعاً بين الكلمة الثانية والكلمة قبل الأخيرة
  const idx = 2 + Math.floor(Math.random() * (words.length - 3));
  const before = words.slice(0, idx).join(' ');
  const correct = wordAt(ayah.text, idx);
  if (!correct) return null;

  return {
    id: `q-${ayah.surahId}-${ayah.number}-typeword-${idx}`,
    kind: 'typeNextWord',
    type: 'typing',
    prompt: 'اكتب الكلمة التالية في الآية:',
    context: before + ' ...',
    correctAnswer: correct,
    points: 20,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// =========== Public API ============

export interface QuizGenerationOptions {
  level: QuizLevel;
  juzs: number[];           // إذا فارغة، استخدم النطاق الافتراضي للمستوى
  totalQuestions: number;
}

/** الأجزاء الافتراضية لكل مستوى. */
export function defaultJuzsForLevel(level: QuizLevel): number[] {
  switch (level) {
    case 'beginner':    return [30];
    case 'intermediate': return [28, 29, 30];
    case 'advanced':    return Array.from({ length: 30 }, (_, i) => i + 1);
  }
}

/** أنواع الأسئلة المسموحة لكل مستوى. */
function allowedKindsForLevel(level: QuizLevel): QuizQuestionKind[] {
  switch (level) {
    case 'beginner':
      return ['whichSurah', 'meccanMedinan', 'verseCount', 'isFromSurah'];
    case 'intermediate':
      return ['whichSurah', 'meccanMedinan', 'verseCount', 'isFromSurah', 'completeVerse', 'nextAyah'];
    case 'advanced':
      return ['whichSurah', 'nextAyah', 'completeVerse', 'isFromSurah', 'typeNextWord', 'verseCount'];
  }
}

/**
 * يجلب نصوص السور المطلوبة (يستخدم الكاش الموجود في quranApi).
 */
async function loadAyahsForScope(juzs: number[]): Promise<Map<number, Ayah[]>> {
  const surahs = surahsInJuzs(juzs);
  const map = new Map<number, Ayah[]>();
  // حدّ بـ 12 سورة فقط حتى لا نُحمّل API بإفراط
  const toLoad = pickN(surahs, 12);
  await Promise.all(
    toLoad.map(async (s) => {
      try {
        const ayahs = await getSurahAyahs(s.id);
        map.set(s.id, ayahs);
      } catch {
        // تجاهل - نستخدم السور الأخرى
      }
    }),
  );
  return map;
}

/**
 * المولّد الرئيسي: يجلب البيانات + يولّد N سؤالاً متنوعة.
 */
export async function generateQuiz(options: QuizGenerationOptions): Promise<QuizQuestion[]> {
  const { level, totalQuestions } = options;
  const juzs = options.juzs.length > 0 ? options.juzs : defaultJuzsForLevel(level);
  const allowed = allowedKindsForLevel(level);
  const scopeSurahs = surahsInJuzs(juzs);
  if (scopeSurahs.length === 0) return [];

  const ayahsBySurah = await loadAyahsForScope(juzs);

  const questions: QuizQuestion[] = [];
  let safety = 0;

  while (questions.length < totalQuestions && safety < totalQuestions * 6) {
    safety++;
    const kind = pickRandom(allowed);
    let q: QuizQuestion | null = null;

    // الأسئلة المستندة إلى بيانات السورة فقط (لا تحتاج نصوص)
    if (kind === 'meccanMedinan') {
      q = makeMeccanMedinan(pickRandom(scopeSurahs));
    } else if (kind === 'verseCount') {
      q = makeVerseCount(pickRandom(scopeSurahs));
    } else {
      // أسئلة تحتاج نصّ الآية
      const surahsWithAyahs = scopeSurahs.filter((s) => ayahsBySurah.has(s.id));
      if (surahsWithAyahs.length === 0) continue;

      const surah = pickRandom(surahsWithAyahs);
      const ayahs = ayahsBySurah.get(surah.id) ?? [];
      if (ayahs.length === 0) continue;

      const ayah = pickRandom(ayahs);

      if (kind === 'whichSurah') {
        q = makeWhichSurah(ayah, scopeSurahs);
      } else if (kind === 'nextAyah') {
        q = makeNextAyah(ayah, ayahs);
      } else if (kind === 'completeVerse') {
        q = makeCompleteVerse(ayah, ayahs);
      } else if (kind === 'isFromSurah') {
        q = makeIsFromSurah(ayah, scopeSurahs);
      } else if (kind === 'typeNextWord') {
        q = makeTypeNextWord(ayah);
      }
    }

    // تجنّب تكرار نفس السؤال
    if (q && !questions.some((x) => x.id === q!.id)) {
      questions.push(q);
    }
  }

  return questions;
}

/** يحسب نقاط الجلسة + سلسلة الإجابات الصحيحة المتتالية. */
export function computeSessionStats(answers: { correct: boolean; questionPoints: number }[]): {
  totalPoints: number;
  correctCount: number;
  bestStreak: number;
} {
  let totalPoints = 0;
  let correctCount = 0;
  let bestStreak = 0;
  let currentStreak = 0;
  for (const a of answers) {
    if (a.correct) {
      correctCount++;
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
      // مكافأة سلسلة: +2 نقاط لكل خطوة بعد 3 إجابات صحيحة متتالية
      const streakBonus = currentStreak >= 3 ? 2 : 0;
      totalPoints += a.questionPoints + streakBonus;
    } else {
      currentStreak = 0;
    }
  }
  return { totalPoints, correctCount, bestStreak };
}
