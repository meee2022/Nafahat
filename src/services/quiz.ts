/**
 * مولّد اختبارات شامل للقرآن - متعدّد الأنواع ومستوحى من تطبيقات الحفظ الكبرى
 * (Tarteel, Memorize, Imaan).
 *
 * 18 نوعاً من الأسئلة بثلاث فئات:
 *
 *  📍 تعريف السورة/الموضع:
 *    - whichSurah        من أي سورة؟
 *    - whichJuz          من أي جزء؟
 *    - isFromSurah       هل من سورة X؟ (صح/خطأ)
 *    - ayahPosition      الآية رقم كم؟
 *
 *  🔗 التسلسل:
 *    - nextAyah          الآية التالية
 *    - previousAyah      الآية السابقة
 *    - firstWordOfNext   أول كلمة في التالية
 *
 *  ✏️ أجزاء الآية:
 *    - completeVerse     أكمل الآية
 *    - verseBeginning    بداية الآية
 *    - ayahEnding        نهاية الآية (آخر الآية) ⭐
 *    - typeNextWord      اكتب الكلمة التالية
 *    - fillBlank         املأ الفراغ
 *
 *  📚 معلومات السورة:
 *    - meccanMedinan     مكية أم مدنية؟
 *    - verseCount        عدد الآيات
 *    - surahBefore       السورة السابقة
 *    - surahAfter        السورة التالية
 *    - firstAyahOfSurah  أول آية
 *    - lastAyahOfSurah   آخر آية
 *
 * 🎯 ضمان تغطية شاملة:
 *   - تحميل كل سور الجزء المختار (مش 12 بس)
 *   - توزيع الأسئلة بنظام round-robin على السور
 *   - تنوّع في الأنواع بنسبة متوازنة
 */

import { SURAHS, getSurahById, arabicNumber } from '@data/surahs';
import { getSurahAyahs } from '@services/quranApi';
import { Ayah, QuizLevel, QuizQuestion, QuizQuestionKind } from '@/types/index';

// ═════════════ Helpers ═════════════

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

/** سور تبدأ في الأجزاء المختارة (أو كل السور لو فاضي). */
function surahsInJuzs(juzs: number[]): typeof SURAHS {
  if (juzs.length === 0) return SURAHS;
  const set = new Set(juzs);
  return SURAHS.filter((s) => set.has(s.juzStart));
}

/** الجزء اللي بتبدأ فيه آية معيّنة. */
function ayahJuz(ayah: Ayah, surah: typeof SURAHS[number]): number {
  return ayah.juz ?? surah.juzStart;
}

/** تقسيم الآية لنصفين متوازنين. */
function splitAyahInHalf(text: string): { first: string; second: string } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return { first: text, second: '' };
  const mid = Math.floor(words.length / 2);
  return { first: words.slice(0, mid).join(' '), second: words.slice(mid).join(' ') };
}

/** آخر N كلمات من الآية. */
function lastWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(Math.max(0, words.length - n)).join(' ');
}

/** أول N كلمات من الآية. */
function firstWords(text: string, n: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, n).join(' ');
}

/** الكلمة في موضع معيّن. */
function wordAt(text: string, index: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words[index]?.trim() ?? '';
}

/**
 * تطبيع النص العربي للمقارنة:
 *   - يشيل كل التشكيل (الفتحة، الكسرة، الضمة، السكون، الشدّة، التنوينات)
 *   - يشيل العلامات القرآنية الصغيرة (الوقف، السجاوند، إلخ)
 *   - يشيل الكاشيدا (ـ) والـ alif wasla (ٱ) ويرجعها لـ ا
 *   - يوحّد صور الألف والياء والهاء والواو
 *   - يحافظ على المسافات بين الكلمات (لا يحذفها) عشان نقدر نقارن كلمة-بكلمة
 */
export function normalizeArabic(text: string): string {
  return text
    // كل التشكيل + المدد القرآنية (U+064B إلى U+065F) + U+0670 الألف الصغيرة + علامات الوقف (U+06D6 إلى U+06ED)
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')                  // الكاشيدا
    .replace(/[ٱٲٳٵ]/g, 'ا') // ٱ وأخواتها → ا
    .replace(/[إأآا]/g, 'ا')                  // كل الألفات → ا عادية
    .replace(/[ىئ]/g, 'ي')                    // ى ئ → ي
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')                       // التاء المربوطة → هاء
    .replace(/ـ/g, '')                        // كاشيدا أخرى
    .replace(/[^؀-ۿa-zA-Z0-9\s]+/g, '') // شيل أي رموز غير عربية/لاتينية/أرقام، مع الحفاظ على المسافات
    .replace(/\s+/g, ' ')                     // اختصر المسافات المتعددة لمسافة واحدة
    .trim()
    .toLowerCase();
}

/**
 * مقارنة إجابة المستخدم مع الإجابة الصحيحة، تطبّع الحركات والصور المختلفة.
 *
 * استراتيجية المقارنة:
 *   1) لو الاثنين متطابقين بعد التطبيع → صح.
 *   2) لو الإجابة الصحيحة كلمة واحدة (سؤال "الكلمة التالية")، نقبل لو المستخدم
 *      كتب الكلمة الصحيحة في البداية حتى لو زاد كلمات بعدها.
 *      مثال: "رب العالمين" تتطابق مع "رَبَّ" لأن أول كلمة من المستخدم = الصحيحة.
 */
export function answersMatch(userInput: string, correctAnswer: string): boolean {
  const u = normalizeArabic(userInput);
  const c = normalizeArabic(correctAnswer);
  if (!c) return false;
  if (!u) return false;
  if (u === c) return true;

  // لو الإجابة الصحيحة كلمة واحدة، اقبل لو أول كلمة من المستخدم تطابقها.
  const correctWords = c.split(' ').filter(Boolean);
  const userWords = u.split(' ').filter(Boolean);
  if (correctWords.length === 1 && userWords[0] === correctWords[0]) {
    return true;
  }
  // كذلك العكس: لو المستخدم كتب كلمة وحدة والإجابة الصح هي كلمة وحدة وأطول
  // (مثل المستخدم "رب" والصحيح "ربك") - نسيب dl البات match اللي فوق
  return false;
}

// ═════════════ Question Builders ═════════════

// ─── 1. من أي سورة؟ ───
function makeWhichSurah(ayah: Ayah, allSurahs: typeof SURAHS): QuizQuestion | null {
  const correct = getSurahById(ayah.surahId);
  if (!correct) return null;
  const distractors = pickN(allSurahs.filter((s) => s.id !== ayah.surahId), 3);
  if (distractors.length < 3) return null;
  const options = shuffle([correct, ...distractors]).map((s) => s.nameAr);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-which`,
    kind: 'whichSurah', type: 'mcq',
    prompt: 'من أيّ سورة هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 10,
    explanation: `سورة ${correct.nameAr}، الآية ${ayah.number}`,
  };
}

// ─── 2. من أي جزء؟ ───
function makeWhichJuz(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion {
  const correct = ayahJuz(ayah, surah);
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const cand = 1 + Math.floor(Math.random() * 30);
    if (cand !== correct) distractors.add(cand);
  }
  const options = shuffle([correct, ...distractors]).map((n) => `الجزء ${n}`);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-juz`,
    kind: 'whichJuz', type: 'mcq',
    prompt: 'من أي جزء هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`الجزء ${correct}`),
    points: 10,
    explanation: `الجزء ${correct} - سورة ${surah.nameAr}`,
  };
}

// ─── 3. هل من سورة X؟ ───
function makeIsFromSurah(ayah: Ayah, allSurahs: typeof SURAHS): QuizQuestion {
  const tellTrue = Math.random() < 0.5;
  const trueSurah = getSurahById(ayah.surahId);
  let mentioned = trueSurah;
  if (!tellTrue) {
    const others = allSurahs.filter((s) => s.id !== ayah.surahId);
    mentioned = pickRandom(others);
  }
  const isActuallyTrue = mentioned?.id === ayah.surahId;
  return {
    id: `q-${ayah.surahId}-${ayah.number}-isfrom-${tellTrue ? 't' : 'f'}-${Math.random()}`,
    kind: 'isFromSurah', type: 'truefalse',
    prompt: `هل هذه الآية من سورة ${mentioned?.nameAr ?? ''}؟`,
    context: ayah.text,
    options: ['صحيح', 'خطأ'],
    correctIndex: isActuallyTrue ? 0 : 1,
    points: 10,
    explanation: trueSurah ? `الآية من سورة ${trueSurah.nameAr} (الآية ${ayah.number})` : undefined,
  };
}

// ─── 4. الآية رقم كم؟ ───
function makeAyahPosition(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion {
  const correct = ayah.number;
  const max = surah.versesCount;
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = Math.ceil(Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correct + offset;
    if (cand > 0 && cand <= max && cand !== correct) distractors.add(cand);
  }
  // لو السورة قصيرة جداً وما قدرناش نلاقي 3
  while (distractors.size < 3) {
    const cand = 1 + Math.floor(Math.random() * max);
    if (cand !== correct) distractors.add(cand);
  }
  const options = shuffle([correct, ...distractors]).map((n) => `الآية ${n}`);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-pos`,
    kind: 'ayahPosition', type: 'mcq',
    prompt: `هذه الآية من سورة ${surah.nameAr}. ما رقمها؟`,
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`الآية ${correct}`),
    points: 15,
    explanation: `هي الآية ${correct} من ${max}`,
  };
}

// ─── 5. الآية التالية ───
function makeNextAyah(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const nextIdx = sameSurahAyahs.findIndex((a) => a.number === ayah.number + 1);
  if (nextIdx === -1) return null;
  const next = sameSurahAyahs[nextIdx];
  const pool = sameSurahAyahs.filter((a) => a.number !== next.number && a.number !== ayah.number);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([next, ...distractors]).map((a) => a.text);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-next`,
    kind: 'nextAyah', type: 'mcq',
    prompt: 'ما الآية التي تأتي بعد هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(next.text),
    points: 15,
    explanation: `سورة ${getSurahById(ayah.surahId)?.nameAr ?? ''} - الآية ${next.number}`,
  };
}

// ─── 6. الآية السابقة ───
function makePreviousAyah(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const prevIdx = sameSurahAyahs.findIndex((a) => a.number === ayah.number - 1);
  if (prevIdx === -1) return null;
  const prev = sameSurahAyahs[prevIdx];
  const pool = sameSurahAyahs.filter((a) => a.number !== prev.number && a.number !== ayah.number);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([prev, ...distractors]).map((a) => a.text);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-prev`,
    kind: 'previousAyah', type: 'mcq',
    prompt: 'ما الآية التي تأتي قبل هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(prev.text),
    points: 18,
    explanation: `الآية السابقة هي رقم ${prev.number}`,
  };
}

// ─── 7. أول كلمة في الآية التالية ───
function makeFirstWordOfNext(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const nextIdx = sameSurahAyahs.findIndex((a) => a.number === ayah.number + 1);
  if (nextIdx === -1) return null;
  const next = sameSurahAyahs[nextIdx];
  const correct = firstWords(next.text, 1);
  if (!correct) return null;

  // distractors: أول كلمة من آيات أخرى في نفس السورة
  const pool = sameSurahAyahs
    .filter((a) => a.number !== next.number)
    .map((a) => firstWords(a.text, 1))
    .filter((w) => w && w !== correct);
  const distractors = pickN(Array.from(new Set(pool)), 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-firstword`,
    kind: 'firstWordOfNext', type: 'mcq',
    prompt: 'ما أول كلمة في الآية التي تأتي بعد هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(correct),
    points: 18,
    explanation: `الآية التالية: ${next.text}`,
  };
}

// ─── 8. أكمل الآية ───
function makeCompleteVerse(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const { first, second } = splitAyahInHalf(ayah.text);
  if (!second) return null;
  const pool = sameSurahAyahs
    .filter((a) => a.number !== ayah.number)
    .map((a) => splitAyahInHalf(a.text).second)
    .filter(Boolean);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([second, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-complete`,
    kind: 'completeVerse', type: 'mcq',
    prompt: 'أكمل الآية:',
    context: first + ' ...',
    options,
    correctIndex: options.indexOf(second),
    points: 15,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 9. بداية الآية ───
function makeVerseBeginning(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const { first, second } = splitAyahInHalf(ayah.text);
  if (!first || !second) return null;
  const pool = sameSurahAyahs
    .filter((a) => a.number !== ayah.number)
    .map((a) => splitAyahInHalf(a.text).first)
    .filter(Boolean);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([first, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-begin`,
    kind: 'verseBeginning', type: 'mcq',
    prompt: 'ما بداية هذه الآية؟',
    context: '... ' + second,
    options,
    correctIndex: options.indexOf(first),
    points: 15,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 10. ⭐ آخر الآية (نهاية الآية) - السؤال اللي طلبه المستخدم ───
function makeAyahEnding(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return null;

  // آخر 3 كلمات
  const correctEnding = lastWords(ayah.text, 3);
  if (!correctEnding) return null;

  // أوّل الآية = كل الآية بدون الـ 3 كلمات الأخيرة
  const beginning = words.slice(0, words.length - 3).join(' ');

  // distractors: آخر 3 كلمات من آيات أخرى في نفس السورة
  const pool = sameSurahAyahs
    .filter((a) => a.number !== ayah.number)
    .map((a) => {
      const ws = a.text.split(/\s+/).filter(Boolean);
      return ws.length >= 4 ? lastWords(a.text, 3) : '';
    })
    .filter((s) => s && s !== correctEnding);

  const distractors = pickN(Array.from(new Set(pool)), 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correctEnding, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-ending`,
    kind: 'ayahEnding', type: 'mcq',
    prompt: 'ما نهاية هذه الآية؟',
    context: beginning + ' ...',
    options,
    correctIndex: options.indexOf(correctEnding),
    points: 18,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 11. اكتب الكلمة التالية ───
function makeTypeNextWord(ayah: Ayah): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 5) return null;
  const idx = 2 + Math.floor(Math.random() * (words.length - 3));
  const before = words.slice(0, idx).join(' ');
  const correct = wordAt(ayah.text, idx);
  if (!correct) return null;
  return {
    id: `q-${ayah.surahId}-${ayah.number}-typeword-${idx}`,
    kind: 'typeNextWord', type: 'typing',
    prompt: 'اكتب الكلمة التالية في الآية:',
    context: before + ' ...',
    correctAnswer: correct,
    points: 20,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 12. املأ الفراغ ───
function makeFillBlank(ayah: Ayah): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return null;
  const idx = 2 + Math.floor(Math.random() * (words.length - 4));
  const correct = words[idx];
  if (!correct) return null;
  const before = words.slice(0, idx).join(' ');
  const after = words.slice(idx + 1).join(' ');
  return {
    id: `q-${ayah.surahId}-${ayah.number}-fillblank-${idx}`,
    kind: 'fillBlank', type: 'typing',
    prompt: 'املأ الفراغ في الآية:',
    context: `${before}  ﴿  ___  ﴾  ${after}`,
    correctAnswer: correct,
    points: 22,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 13. مكية أم مدنية؟ ───
function makeMeccanMedinan(surah: typeof SURAHS[number]): QuizQuestion {
  const correct = surah.revelationType === 'meccan' ? 'مكية' : 'مدنية';
  return {
    id: `q-${surah.id}-revtype`,
    kind: 'meccanMedinan', type: 'truefalse',
    prompt: `هل سورة ${surah.nameAr} مكية؟`,
    options: ['صحيح', 'خطأ'],
    correctIndex: surah.revelationType === 'meccan' ? 0 : 1,
    points: 5,
    explanation: `سورة ${surah.nameAr} ${correct}`,
  };
}

// ─── 14. عدد الآيات ───
function makeVerseCount(surah: typeof SURAHS[number]): QuizQuestion {
  const correct = surah.versesCount;
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = Math.ceil(Math.random() * 15) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correct + offset;
    if (cand > 0 && cand !== correct) distractors.add(cand);
  }
  const options = shuffle([correct, ...distractors]).map((n) => `${n}`);
  return {
    id: `q-${surah.id}-count`,
    kind: 'verseCount', type: 'mcq',
    prompt: `كم عدد آيات سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(`${correct}`),
    points: 10,
    explanation: `${correct} آية`,
  };
}

// ─── 15. السورة السابقة ───
function makeSurahBefore(surah: typeof SURAHS[number]): QuizQuestion | null {
  if (surah.id === 1) return null;
  const correct = getSurahById(surah.id - 1);
  if (!correct) return null;
  const pool = SURAHS.filter((s) => s.id !== correct.id && s.id !== surah.id);
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map((s) => s.nameAr);
  return {
    id: `q-${surah.id}-before`,
    kind: 'surahBefore', type: 'mcq',
    prompt: `ما السورة التي تأتي قبل سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 12,
    explanation: `السورة ${correct.id} (${correct.nameAr})`,
  };
}

// ─── 16. السورة التالية ───
function makeSurahAfter(surah: typeof SURAHS[number]): QuizQuestion | null {
  if (surah.id === 114) return null;
  const correct = getSurahById(surah.id + 1);
  if (!correct) return null;
  const pool = SURAHS.filter((s) => s.id !== correct.id && s.id !== surah.id);
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map((s) => s.nameAr);
  return {
    id: `q-${surah.id}-after`,
    kind: 'surahAfter', type: 'mcq',
    prompt: `ما السورة التي تأتي بعد سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 12,
    explanation: `السورة ${correct.id} (${correct.nameAr})`,
  };
}

// ─── 17. أول آية في السورة ───
function makeFirstAyahOfSurah(surah: typeof SURAHS[number], ayahs: Ayah[]): QuizQuestion | null {
  if (ayahs.length === 0) return null;
  const first = ayahs.find((a) => a.number === 1);
  if (!first) return null;
  // distractors من آيات أخرى في السورة
  const pool = ayahs.filter((a) => a.number !== 1);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([first, ...distractors]).map((a) => a.text);
  return {
    id: `q-${surah.id}-first`,
    kind: 'firstAyahOfSurah', type: 'mcq',
    prompt: `ما أول آية في سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(first.text),
    points: 15,
    explanation: `أول آية: ${first.text}`,
  };
}

// ─── 18. آخر آية في السورة ───
function makeLastAyahOfSurah(surah: typeof SURAHS[number], ayahs: Ayah[]): QuizQuestion | null {
  if (ayahs.length === 0) return null;
  const last = ayahs[ayahs.length - 1];
  if (!last) return null;
  const pool = ayahs.filter((a) => a.number !== last.number);
  const distractors = pickN(pool, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([last, ...distractors]).map((a) => a.text);
  return {
    id: `q-${surah.id}-last`,
    kind: 'lastAyahOfSurah', type: 'mcq',
    prompt: `ما آخر آية في سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(last.text),
    points: 15,
    explanation: `آخر آية: ${last.text}`,
  };
}

// ─── 19. ترتيب السورة في المصحف ───
function makeSurahOrder(surah: typeof SURAHS[number], allSurahs: typeof SURAHS): QuizQuestion | null {
  const correct = surah.id;
  // 3 distractors قريبة من الرقم الصحيح
  const distractorSet = new Set<number>();
  while (distractorSet.size < 3) {
    const offset = (Math.floor(Math.random() * 20) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correct + offset;
    if (cand >= 1 && cand <= 114 && cand !== correct) distractorSet.add(cand);
  }
  const options = shuffle([correct, ...Array.from(distractorSet)]).map((n) => arabicNumber(n));
  return {
    id: `q-${surah.id}-order-${Date.now()}`,
    kind: 'surahOrder', type: 'mcq',
    prompt: `ما ترتيب سورة ${surah.nameAr} في المصحف؟`,
    options,
    correctIndex: options.indexOf(arabicNumber(correct)),
    points: 10,
    explanation: `سورة ${surah.nameAr} هي السورة رقم ${arabicNumber(correct)} في المصحف`,
  };
}

// ─── 20. في أي صفحة تقع الآية ───
function makeWhichPage(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion | null {
  const correctPage = ayah.page;
  if (!correctPage) return null;
  const distractorSet = new Set<number>();
  while (distractorSet.size < 3) {
    const offset = (Math.floor(Math.random() * 15) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correctPage + offset;
    if (cand >= 1 && cand <= 604 && cand !== correctPage) distractorSet.add(cand);
  }
  const options = shuffle([correctPage, ...Array.from(distractorSet)]).map((n) => `صفحة ${arabicNumber(n)}`);
  return {
    id: `q-${surah.id}-${ayah.number}-page-${Date.now()}`,
    kind: 'whichPage', type: 'mcq',
    prompt: 'في أي صفحة تقع هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`صفحة ${arabicNumber(correctPage)}`),
    points: 12,
    explanation: `هذه الآية في صفحة ${arabicNumber(correctPage)} من سورة ${surah.nameAr}`,
  };
}

// ─── 21. عدد كلمات الآية ───
function makeWordCountAyah(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean).length;
  if (words < 2) return null;
  const distractorSet = new Set<number>();
  while (distractorSet.size < 3) {
    const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = words + offset;
    if (cand > 0 && cand !== words) distractorSet.add(cand);
  }
  const options = shuffle([words, ...Array.from(distractorSet)]).map((n) => `${arabicNumber(n)} كلمة`);
  return {
    id: `q-${surah.id}-${ayah.number}-wc-${Date.now()}`,
    kind: 'wordCountAyah', type: 'mcq',
    prompt: 'كم عدد كلمات هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`${arabicNumber(words)} كلمة`),
    points: 10,
    explanation: `الآية فيها ${arabicNumber(words)} كلمة`,
  };
}

// ─── 22. ترتيب الآيات الثلاث ───
function makeArrangeAyahs(sameSurahAyahs: Ayah[], surah: typeof SURAHS[number]): QuizQuestion | null {
  if (sameSurahAyahs.length < 5) return null;
  // اختر 3 آيات متتالية
  const startIdx = Math.floor(Math.random() * (sameSurahAyahs.length - 3));
  const trio = sameSurahAyahs.slice(startIdx, startIdx + 3);
  const correctOrder = trio.map((a) => a.text);
  // 4 ترتيبات: واحد صحيح + 3 خطأ
  const wrong1 = [trio[1].text, trio[0].text, trio[2].text];
  const wrong2 = [trio[2].text, trio[1].text, trio[0].text];
  const wrong3 = [trio[0].text, trio[2].text, trio[1].text];
  const opts = shuffle([correctOrder, wrong1, wrong2, wrong3]);
  const options = opts.map((arr) =>
    arr.map((t) => t.length > 25 ? t.slice(0, 25) + '...' : t).join('  →  '),
  );
  const correctText = correctOrder.map((t) => t.length > 25 ? t.slice(0, 25) + '...' : t).join('  →  ');
  return {
    id: `q-${surah.id}-${startIdx}-arrange-${Date.now()}`,
    kind: 'arrangeAyahs', type: 'mcq',
    prompt: 'رتّب الآيات حسب ورودها الصحيح في السورة:',
    context: `سورة ${surah.nameAr}`,
    options,
    correctIndex: options.indexOf(correctText),
    points: 18,
    explanation: `الترتيب الصحيح: من الآية ${arabicNumber(trio[0].number)} إلى ${arabicNumber(trio[2].number)}`,
  };
}

/** قائمة السور التي تبدأ بحروف مقطّعة (29 سورة). */
const MUQATTAAT_SURAH_IDS = new Set<number>([
  2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30,
  31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68,
]);

// ─── 23. حروف مقطّعة (صح/خطأ) ───
function makeMuqattaat(surah: typeof SURAHS[number]): QuizQuestion {
  const isActuallyMuqattaat = MUQATTAAT_SURAH_IDS.has(surah.id);
  // تساوي احتمالية السؤال الصحيح والخطأ
  const askTruthy = Math.random() < 0.5;
  // لو askTruthy، نسأل عن المقطّعة (الإجابة الصحيحة لو is muqattaat)
  // لو ! askTruthy، نسأل بالعكس
  const correctIndex = askTruthy
    ? (isActuallyMuqattaat ? 0 : 1)  // 0 = نعم، 1 = لا
    : (isActuallyMuqattaat ? 1 : 0);
  return {
    id: `q-${surah.id}-muqat-${Date.now()}`,
    kind: 'muqattaat', type: 'truefalse',
    prompt: askTruthy
      ? `هل تبدأ سورة ${surah.nameAr} بحروف مقطّعة؟`
      : `هل سورة ${surah.nameAr} ليست من السور المبتدئة بحروف مقطّعة؟`,
    options: ['نعم', 'لا'],
    correctIndex,
    points: 8,
    explanation: isActuallyMuqattaat
      ? `نعم، سورة ${surah.nameAr} من السور التسع والعشرين المبتدئة بحروف مقطّعة`
      : `سورة ${surah.nameAr} لا تبدأ بحروف مقطّعة`,
  };
}

// ─── 24. السورة الأطول/الأقصر ───
function makeLongestSurah(allSurahs: typeof SURAHS): QuizQuestion | null {
  // اختر 4 سور عشوائية
  const picked = pickN(allSurahs, 4);
  if (picked.length < 4) return null;
  const askLongest = Math.random() < 0.5;
  const sorted = [...picked].sort((a, b) => askLongest
    ? b.versesCount - a.versesCount
    : a.versesCount - b.versesCount,
  );
  const correct = sorted[0];
  const options = picked.map((s) => `سورة ${s.nameAr}`);
  return {
    id: `q-longest-${correct.id}-${Date.now()}`,
    kind: 'longestSurah', type: 'mcq',
    prompt: askLongest
      ? 'أيّ السور التالية هي الأطول (أكثر آيات)؟'
      : 'أيّ السور التالية هي الأقصر (أقلّ آيات)؟',
    options,
    correctIndex: options.indexOf(`سورة ${correct.nameAr}`),
    points: 10,
    explanation: `سورة ${correct.nameAr} فيها ${arabicNumber(correct.versesCount)} آية`,
  };
}

// ─── 25. عدد صفحات السورة ───
function makePageCountSurah(surah: typeof SURAHS[number], allSurahs: typeof SURAHS): QuizQuestion | null {
  // احسب عدد الصفحات: السورة التالية pageStart - السورة الحالية pageStart
  const nextSurah = allSurahs.find((s) => s.id === surah.id + 1);
  const pageCount = nextSurah
    ? Math.max(1, nextSurah.pageStart - surah.pageStart)
    : Math.max(1, 605 - surah.pageStart); // الناس آخر سورة
  if (pageCount < 1) return null;
  const distractorSet = new Set<number>();
  while (distractorSet.size < 3) {
    const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = pageCount + offset;
    if (cand >= 1 && cand !== pageCount) distractorSet.add(cand);
  }
  const options = shuffle([pageCount, ...Array.from(distractorSet)]).map((n) =>
    n === 1 ? 'صفحة واحدة' : `${arabicNumber(n)} صفحات`,
  );
  const correctLabel = pageCount === 1 ? 'صفحة واحدة' : `${arabicNumber(pageCount)} صفحات`;
  return {
    id: `q-${surah.id}-pages-${Date.now()}`,
    kind: 'pageCountSurah', type: 'mcq',
    prompt: `كم صفحة تقريباً تشغل سورة ${surah.nameAr} في المصحف؟`,
    options,
    correctIndex: options.indexOf(correctLabel),
    points: 12,
    explanation: `سورة ${surah.nameAr} تبدأ في الصفحة ${arabicNumber(surah.pageStart)} وتشغل ${correctLabel}`,
  };
}

// ═════════════ Public API ═════════════

export interface QuizGenerationOptions {
  level: QuizLevel;
  juzs: number[];
  totalQuestions: number;
}

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
      return [
        'whichSurah', 'meccanMedinan', 'verseCount', 'isFromSurah',
        'firstAyahOfSurah', 'lastAyahOfSurah', 'surahBefore', 'surahAfter',
        // أسئلة سهلة جديدة
        'surahOrder', 'longestSurah', 'muqattaat',
      ];
    case 'intermediate':
      return [
        'whichSurah', 'whichJuz', 'isFromSurah', 'meccanMedinan',
        'verseCount', 'completeVerse', 'verseBeginning', 'ayahEnding',
        'nextAyah', 'firstAyahOfSurah', 'lastAyahOfSurah', 'firstWordOfNext',
        // أسئلة متوسّطة جديدة
        'surahOrder', 'whichPage', 'wordCountAyah', 'muqattaat',
        'longestSurah', 'pageCountSurah',
      ];
    case 'advanced':
      return [
        'whichSurah', 'whichJuz', 'isFromSurah', 'ayahPosition',
        'nextAyah', 'previousAyah', 'firstWordOfNext',
        'completeVerse', 'verseBeginning', 'ayahEnding', 'typeNextWord', 'fillBlank',
        'verseCount', 'surahBefore', 'surahAfter',
        // أسئلة متقدّمة جديدة - تحدّي حقيقي للحفّاظ
        'surahOrder', 'whichPage', 'wordCountAyah', 'arrangeAyahs',
        'muqattaat', 'longestSurah', 'pageCountSurah',
      ];
  }
}

/** يحمّل نصوص كل السور في النطاق (مش 12 بس). */
async function loadAyahsForScope(juzs: number[]): Promise<Map<number, Ayah[]>> {
  const surahs = surahsInJuzs(juzs);
  const map = new Map<number, Ayah[]>();
  // حمّل بالـ chunks عشان مانضغطش على الـ API
  const CHUNK = 8;
  for (let i = 0; i < surahs.length; i += CHUNK) {
    const chunk = surahs.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(async (s) => {
        try {
          const ayahs = await getSurahAyahs(s.id);
          map.set(s.id, ayahs);
        } catch {}
      }),
    );
  }
  return map;
}

/**
 * توليد أسئلة الاختبار بشكل شامل.
 * يضمن تغطية كل سور الجزء المختار + تنوّع في الأنواع.
 */
export async function generateQuiz(options: QuizGenerationOptions): Promise<QuizQuestion[]> {
  const { level, totalQuestions } = options;
  const juzs = options.juzs.length > 0 ? options.juzs : defaultJuzsForLevel(level);
  const allowed = allowedKindsForLevel(level);
  const scopeSurahs = surahsInJuzs(juzs);
  if (scopeSurahs.length === 0) return [];

  const ayahsBySurah = await loadAyahsForScope(juzs);
  const surahsWithText = scopeSurahs.filter((s) => (ayahsBySurah.get(s.id)?.length ?? 0) > 0);

  // 🎯 توزيع round-robin: نمر على كل سورة بالدور لضمان التغطية
  const questions: QuizQuestion[] = [];
  const usedIds = new Set<string>();
  let surahIdx = 0;
  let kindIdx = 0;
  let safety = 0;
  const maxSafety = totalQuestions * 10;

  while (questions.length < totalQuestions && safety < maxSafety) {
    safety++;

    // اختر السورة التالية في الدور
    const surah = scopeSurahs[surahIdx % scopeSurahs.length];
    surahIdx++;

    // اختر نوع السؤال التالي في الدور (لضمان التنوع)
    const kind = allowed[kindIdx % allowed.length];
    kindIdx++;

    let q: QuizQuestion | null = null;

    // أسئلة تعتمد على السورة فقط
    if (kind === 'meccanMedinan')        q = makeMeccanMedinan(surah);
    else if (kind === 'verseCount')      q = makeVerseCount(surah);
    else if (kind === 'surahBefore')     q = makeSurahBefore(surah);
    else if (kind === 'surahAfter')      q = makeSurahAfter(surah);
    else if (kind === 'surahOrder')      q = makeSurahOrder(surah, scopeSurahs);
    else if (kind === 'muqattaat')       q = makeMuqattaat(surah);
    else if (kind === 'longestSurah')    q = makeLongestSurah(scopeSurahs);
    else if (kind === 'pageCountSurah')  q = makePageCountSurah(surah, scopeSurahs);
    else if (kind === 'firstAyahOfSurah') {
      const ayahs = ayahsBySurah.get(surah.id) ?? [];
      if (ayahs.length > 0) q = makeFirstAyahOfSurah(surah, ayahs);
    }
    else if (kind === 'lastAyahOfSurah') {
      const ayahs = ayahsBySurah.get(surah.id) ?? [];
      if (ayahs.length > 0) q = makeLastAyahOfSurah(surah, ayahs);
    }
    else if (kind === 'arrangeAyahs') {
      const ayahs = ayahsBySurah.get(surah.id) ?? [];
      if (ayahs.length >= 5) q = makeArrangeAyahs(ayahs, surah);
    }
    // أسئلة تحتاج آية محددة من السورة
    else {
      const ayahs = ayahsBySurah.get(surah.id) ?? [];
      if (ayahs.length === 0) continue;
      const ayah = pickRandom(ayahs);

      if (kind === 'whichSurah')         q = makeWhichSurah(ayah, scopeSurahs);
      else if (kind === 'whichJuz')      q = makeWhichJuz(ayah, surah);
      else if (kind === 'isFromSurah')   q = makeIsFromSurah(ayah, scopeSurahs);
      else if (kind === 'ayahPosition')  q = makeAyahPosition(ayah, surah);
      else if (kind === 'nextAyah')      q = makeNextAyah(ayah, ayahs);
      else if (kind === 'previousAyah')  q = makePreviousAyah(ayah, ayahs);
      else if (kind === 'firstWordOfNext') q = makeFirstWordOfNext(ayah, ayahs);
      else if (kind === 'completeVerse') q = makeCompleteVerse(ayah, ayahs);
      else if (kind === 'verseBeginning') q = makeVerseBeginning(ayah, ayahs);
      else if (kind === 'ayahEnding')    q = makeAyahEnding(ayah, ayahs);
      else if (kind === 'typeNextWord')  q = makeTypeNextWord(ayah);
      else if (kind === 'fillBlank')     q = makeFillBlank(ayah);
      else if (kind === 'whichPage')     q = makeWhichPage(ayah, surah);
      else if (kind === 'wordCountAyah') q = makeWordCountAyah(ayah, surah);
    }

    if (q && !usedIds.has(q.id)) {
      questions.push(q);
      usedIds.add(q.id);
    }
  }

  return questions;
}

/** حساب نقاط الجلسة + سلسلة الإجابات الصحيحة. */
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
      const streakBonus = currentStreak >= 3 ? 2 : 0;
      totalPoints += a.questionPoints + streakBonus;
    } else {
      currentStreak = 0;
    }
  }
  return { totalPoints, correctCount, bestStreak };
}
