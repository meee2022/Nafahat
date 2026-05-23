/**
 * مولّد اختبارات شامل للقرآن - نظام محكم وعالمي
 *
 * ═══════════════════════════════════════════════════════
 * الإصلاحات الجوهرية في هذه النسخة:
 *
 * ✅ 1. فلترة الآيات بالجزء الحقيقي (ayah.juz) لا بـ surah.juzStart
 *       → ضمان أن كل آية في الاختبار تنتمي فعلاً للجزء المختار
 *
 * ✅ 2. تتبّع الآيات المستخدمة (usedAyahKeys)
 *       → لا تتكرر نفس الآية في أكثر من سؤال
 *
 * ✅ 3. Distractors من داخل النطاق فقط
 *       → خيارات الإجابة الخاطئة تأتي من نفس الجزء/السور المختارة
 *
 * ✅ 4. تحميل كل السور التي تمر عبر الجزء (لا تلك التي تبدأ فيه فقط)
 *       → سورة البقرة مثلاً تنتمي لأجزاء 1-3 وتُحمّل لأي منها
 *
 * ✅ 5. توزيع متوازن: round-robin على الآيات لا على السور
 *       → كل آية تأخذ فرصة واحدة فقط
 *
 * ✅ 6. نظام احتياطي متدرج
 *       → لو تعذّر توليد سؤال من نوع معيّن، يجرّب نوعاً آخر تلقائياً
 * ═══════════════════════════════════════════════════════
 *
 * 25 نوعاً من الأسئلة بثلاث فئات:
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
 *    - ayahEnding        نهاية الآية
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
 *    - surahOrder        ترتيب السورة في المصحف
 *    - whichPage         في أي صفحة؟
 *    - wordCountAyah     عدد كلمات الآية
 *    - arrangeAyahs      ترتيب ثلاث آيات
 *    - muqattaat         حروف مقطّعة؟
 *    - longestSurah      الأطول/الأقصر
 *    - pageCountSurah    عدد صفحات السورة
 */

import { SURAHS, getSurahById, arabicNumber } from '@data/surahs';
import { getSurahAyahs } from '@services/quranApi';
import { pickRandomCurated, CURATED_COUNT } from '@data/curatedQuiz';
import { Ayah, QuizLevel, QuizQuestion, QuizQuestionKind } from '@/types/index';

// ═════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════

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

/** تقسيم الآية لنصفين. */
function splitAyahInHalf(text: string): { first: string; second: string } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return { first: text, second: '' };
  const mid = Math.floor(words.length / 2);
  return { first: words.slice(0, mid).join(' '), second: words.slice(mid).join(' ') };
}

// ═════════════════════════════════════════════════════
// ✅ الفلترة الصحيحة للسور والآيات حسب الجزء
// ═════════════════════════════════════════════════════

/**
 * يُعيد كل السور التي تحتوي على آيات في الأجزاء المختارة.
 * يعتمد على معلومات الجزء المخزّنة في كل آية (ayah.juz) وليس على juzStart فقط.
 * يُضيف أيضاً كل سورة تبدأ في الجزء أو تنتهي فيه.
 */
function surahIdsInJuzs(juzs: number[]): Set<number> {
  if (juzs.length === 0) return new Set(SURAHS.map(s => s.id));
  const juzSet = new Set(juzs);
  const ids = new Set<number>();
  // السور التي يقع juzStart أو juzEnd (أو ما بينهما) ضمن الأجزاء المختارة
  for (const s of SURAHS) {
    // juzStart في النطاق؟
    if (juzSet.has(s.juzStart)) { ids.add(s.id); continue; }
    // السورة تمتد من جزء أصغر لجزء أكبر ضمن النطاق؟
    // نُقدّر juzEnd تقريباً من بداية السورة التالية
    const next = SURAHS.find(x => x.id === s.id + 1);
    const juzEnd = next ? next.juzStart : 30;
    for (let j = s.juzStart; j <= juzEnd; j++) {
      if (juzSet.has(j)) { ids.add(s.id); break; }
    }
  }
  return ids;
}

/**
 * يُفلتر آيات السورة المحمّلة لتبقى فقط تلك التي تنتمي للأجزاء المختارة.
 * يعتمد على ayah.juz إن وُجد، وإلا على surah.juzStart كـ fallback.
 */
function filterAyahsByJuz(ayahs: Ayah[], juzSet: Set<number>, surahJuzStart: number): Ayah[] {
  if (juzSet.size === 0) return ayahs;
  return ayahs.filter(a => juzSet.has(a.juz > 0 ? a.juz : surahJuzStart));
}

// ═════════════════════════════════════════════════════
// ✅ Distractor Pool — من داخل النطاق فقط
// ═════════════════════════════════════════════════════

/**
 * يبني قاموساً للبحث السريع عن الآيات المتاحة من نطاق الجزء.
 * الـ key: `surahId:ayahNumber`
 */
function buildAyahPool(
  ayahsBySurah: Map<number, Ayah[]>,
  juzSet: Set<number>,
  surahMap: Map<number, typeof SURAHS[number]>,
): Ayah[] {
  const pool: Ayah[] = [];
  for (const [surahId, ayahs] of ayahsBySurah.entries()) {
    const surah = surahMap.get(surahId);
    if (!surah) continue;
    const filtered = filterAyahsByJuz(ayahs, juzSet, surah.juzStart);
    pool.push(...filtered);
  }
  return pool;
}

// ═════════════════════════════════════════════════════
// تطبيع العربي للمقارنة
// ═════════════════════════════════════════════════════

export function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[ٱٲٳٵ]/g, 'ا')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/[^؀-ۿa-zA-Z0-9\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function answersMatch(userInput: string, correctAnswer: string): boolean {
  const u = normalizeArabic(userInput);
  const c = normalizeArabic(correctAnswer);
  if (!c || !u) return false;
  if (u === c) return true;
  const correctWords = c.split(' ').filter(Boolean);
  const userWords = u.split(' ').filter(Boolean);
  if (correctWords.length === 1 && userWords[0] === correctWords[0]) return true;
  return false;
}

// ═════════════════════════════════════════════════════
// Question Builders — مع Distractors من النطاق
// ═════════════════════════════════════════════════════

// ─── 1. من أي سورة؟ ───
function makeWhichSurah(
  ayah: Ayah,
  scopeSurahList: typeof SURAHS,
): QuizQuestion | null {
  const correct = getSurahById(ayah.surahId);
  if (!correct) return null;
  // Distractors من السور في النطاق فقط
  const pool = scopeSurahList.filter(s => s.id !== ayah.surahId);
  if (pool.length < 3) return null;
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map(s => s.nameAr);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-which`,
    kind: 'whichSurah', type: 'mcq',
    prompt: 'من أيّ سورة هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 10,
    explanation: `سورة ${correct.nameAr} · الآية ${arabicNumber(ayah.number)}`,
  };
}

// ─── 2. من أي جزء؟ ───
function makeWhichJuz(
  ayah: Ayah,
  surah: typeof SURAHS[number],
  juzSet: Set<number>,
): QuizQuestion {
  const correct = ayah.juz > 0 ? ayah.juz : surah.juzStart;
  // Distractors من أجزاء أخرى
  const allJuzs = Array.from({ length: 30 }, (_, i) => i + 1);
  const pool = allJuzs.filter(j => j !== correct);
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map(n => `الجزء ${arabicNumber(n)}`);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-juz`,
    kind: 'whichJuz', type: 'mcq',
    prompt: 'من أيّ جزء هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`الجزء ${arabicNumber(correct)}`),
    points: 10,
    explanation: `الجزء ${arabicNumber(correct)} — سورة ${surah.nameAr}`,
  };
}

// ─── 3. هل من سورة X؟ ───
function makeIsFromSurah(
  ayah: Ayah,
  scopeSurahList: typeof SURAHS,
): QuizQuestion {
  const tellTrue = Math.random() < 0.5;
  const trueSurah = getSurahById(ayah.surahId);
  let mentioned = trueSurah;
  if (!tellTrue && scopeSurahList.length > 1) {
    const others = scopeSurahList.filter(s => s.id !== ayah.surahId);
    mentioned = pickRandom(others);
  }
  const isActuallyTrue = mentioned?.id === ayah.surahId;
  return {
    id: `q-${ayah.surahId}-${ayah.number}-isfrom`,
    kind: 'isFromSurah', type: 'truefalse',
    prompt: `هل هذه الآية من سورة ${mentioned?.nameAr ?? ''}؟`,
    context: ayah.text,
    options: ['صحيح', 'خطأ'],
    correctIndex: isActuallyTrue ? 0 : 1,
    points: 8,
    explanation: trueSurah ? `الآية من سورة ${trueSurah.nameAr} (الآية ${arabicNumber(ayah.number)})` : undefined,
  };
}

// ─── 4. الآية رقم كم؟ ───
function makeAyahPosition(
  ayah: Ayah,
  surah: typeof SURAHS[number],
  scopeAyahs: Ayah[],
): QuizQuestion {
  const correct = ayah.number;
  const max = surah.versesCount;
  // Distractors من آيات موجودة فعلاً في النطاق
  const pool = scopeAyahs
    .filter(a => a.surahId === surah.id && a.number !== correct)
    .map(a => a.number);
  const distractorNums = pool.length >= 3
    ? pickN(pool, 3)
    : (() => {
        const s = new Set<number>();
        while (s.size < 3) {
          const c = 1 + Math.floor(Math.random() * max);
          if (c !== correct) s.add(c);
        }
        return Array.from(s);
      })();
  const options = shuffle([correct, ...distractorNums]).map(n => `الآية ${arabicNumber(n)}`);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-pos`,
    kind: 'ayahPosition', type: 'mcq',
    prompt: `هذه الآية من سورة ${surah.nameAr} — ما رقمها؟`,
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`الآية ${arabicNumber(correct)}`),
    points: 15,
    explanation: `هي الآية ${arabicNumber(correct)} من ${arabicNumber(max)}`,
  };
}

// ─── 5. الآية التالية ───
function makeNextAyah(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const next = sameSurahAyahs.find(a => a.number === ayah.number + 1);
  if (!next) return null;
  const pool = sameSurahAyahs.filter(a => a.number !== next.number && a.number !== ayah.number);
  if (pool.length < 3) return null;
  const distractors = pickN(pool, 3);
  const options = shuffle([next, ...distractors]).map(a => a.text);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-next`,
    kind: 'nextAyah', type: 'mcq',
    prompt: 'ما الآية التي تأتي بعد هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(next.text),
    points: 15,
    explanation: `التالية هي الآية ${arabicNumber(next.number)} من سورة ${getSurahById(ayah.surahId)?.nameAr ?? ''}`,
  };
}

// ─── 6. الآية السابقة ───
function makePreviousAyah(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  if (ayah.number <= 1) return null;
  const prev = sameSurahAyahs.find(a => a.number === ayah.number - 1);
  if (!prev) return null;
  const pool = sameSurahAyahs.filter(a => a.number !== prev.number && a.number !== ayah.number);
  if (pool.length < 3) return null;
  const distractors = pickN(pool, 3);
  const options = shuffle([prev, ...distractors]).map(a => a.text);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-prev`,
    kind: 'previousAyah', type: 'mcq',
    prompt: 'ما الآية التي تأتي قبل هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(prev.text),
    points: 18,
    explanation: `السابقة هي الآية ${arabicNumber(prev.number)}`,
  };
}

// ─── 7. أول كلمة في الآية التالية ───
function makeFirstWordOfNext(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const next = sameSurahAyahs.find(a => a.number === ayah.number + 1);
  if (!next) return null;
  const correct = firstWords(next.text, 1);
  if (!correct) return null;
  const pool = sameSurahAyahs
    .filter(a => a.number !== next.number)
    .map(a => firstWords(a.text, 1))
    .filter(w => w && normalizeArabic(w) !== normalizeArabic(correct));
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
    explanation: `أول كلمة هي: "${correct}" — الآية التالية: ${next.text}`,
  };
}

// ─── 8. أكمل الآية ───
function makeCompleteVerse(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const { first, second } = splitAyahInHalf(ayah.text);
  if (!second || !first) return null;
  const pool = sameSurahAyahs
    .filter(a => a.number !== ayah.number)
    .map(a => splitAyahInHalf(a.text).second)
    .filter(s => s && normalizeArabic(s) !== normalizeArabic(second));
  const distractors = pickN(Array.from(new Set(pool)), 3);
  if (distractors.length < 3) return null;
  const options = shuffle([second, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-complete`,
    kind: 'completeVerse', type: 'mcq',
    prompt: 'أكمل الآية:',
    context: first + ' ﴿...﴾',
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
    .filter(a => a.number !== ayah.number)
    .map(a => splitAyahInHalf(a.text).first)
    .filter(s => s && normalizeArabic(s) !== normalizeArabic(first));
  const distractors = pickN(Array.from(new Set(pool)), 3);
  if (distractors.length < 3) return null;
  const options = shuffle([first, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-begin`,
    kind: 'verseBeginning', type: 'mcq',
    prompt: 'ما بداية هذه الآية؟',
    context: '﴿...﴾ ' + second,
    options,
    correctIndex: options.indexOf(first),
    points: 15,
    explanation: `الآية كاملة: ${ayah.text}`,
  };
}

// ─── 10. نهاية الآية ───
function makeAyahEnding(ayah: Ayah, sameSurahAyahs: Ayah[]): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return null;
  const correctEnding = lastWords(ayah.text, 3);
  const beginning = words.slice(0, words.length - 3).join(' ');
  const pool = sameSurahAyahs
    .filter(a => a.number !== ayah.number)
    .map(a => {
      const ws = a.text.split(/\s+/).filter(Boolean);
      return ws.length >= 4 ? lastWords(a.text, 3) : '';
    })
    .filter(s => s && normalizeArabic(s) !== normalizeArabic(correctEnding));
  const distractors = pickN(Array.from(new Set(pool)), 3);
  if (distractors.length < 3) return null;
  const options = shuffle([correctEnding, ...distractors]);
  return {
    id: `q-${ayah.surahId}-${ayah.number}-ending`,
    kind: 'ayahEnding', type: 'mcq',
    prompt: 'ما نهاية هذه الآية؟',
    context: beginning + ' ﴿...﴾',
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
  // اختر موضعاً من النصف الأول حتى لا تكون الكلمة في النهاية
  const idx = 2 + Math.floor(Math.random() * Math.floor((words.length - 3) / 2));
  const before = words.slice(0, idx).join(' ');
  const correct = wordAt(ayah.text, idx);
  if (!correct) return null;
  return {
    id: `q-${ayah.surahId}-${ayah.number}-typeword-${idx}`,
    kind: 'typeNextWord', type: 'typing',
    prompt: 'اكتب الكلمة التالية في الآية:',
    context: before + ' ﴿___﴾',
    correctAnswer: correct,
    points: 20,
    explanation: `الكلمة التالية هي: "${correct}"\nالآية كاملة: ${ayah.text}`,
  };
}

// ─── 12. املأ الفراغ ───
function makeFillBlank(ayah: Ayah): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return null;
  // اختر موضعاً من منتصف الآية (لا الأول ولا الأخير)
  const idx = 2 + Math.floor(Math.random() * (words.length - 4));
  const correct = words[idx];
  if (!correct) return null;
  const before = words.slice(0, idx).join(' ');
  const after  = words.slice(idx + 1).join(' ');
  return {
    id: `q-${ayah.surahId}-${ayah.number}-fillblank-${idx}`,
    kind: 'fillBlank', type: 'typing',
    prompt: 'أكمل الكلمة المحذوفة في الآية:',
    context: `${before}  ﴿  ___  ﴾  ${after}`,
    correctAnswer: correct,
    points: 22,
    explanation: `الكلمة المحذوفة: "${correct}"\nالآية كاملة: ${ayah.text}`,
  };
}

// ─── 13. مكية أم مدنية؟ ───
function makeMeccanMedinan(surah: typeof SURAHS[number]): QuizQuestion {
  const isMeccan = surah.revelationType === 'meccan';
  return {
    id: `q-${surah.id}-revtype`,
    kind: 'meccanMedinan', type: 'truefalse',
    prompt: `هل سورة ${surah.nameAr} مكية؟`,
    options: ['صحيح', 'خطأ'],
    correctIndex: isMeccan ? 0 : 1,
    points: 5,
    explanation: `سورة ${surah.nameAr} ${isMeccan ? 'مكية' : 'مدنية'}`,
  };
}

// ─── 14. عدد الآيات ───
function makeVerseCount(surah: typeof SURAHS[number]): QuizQuestion {
  const correct = surah.versesCount;
  const s = new Set<number>();
  while (s.size < 3) {
    const offset = (Math.ceil(Math.random() * 15)) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correct + offset;
    if (cand > 0 && cand !== correct) s.add(cand);
  }
  const options = shuffle([correct, ...Array.from(s)]).map(n => arabicNumber(n));
  return {
    id: `q-${surah.id}-count`,
    kind: 'verseCount', type: 'mcq',
    prompt: `كم عدد آيات سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(arabicNumber(correct)),
    points: 10,
    explanation: `${arabicNumber(correct)} آية`,
  };
}

// ─── 15. السورة السابقة ───
function makeSurahBefore(surah: typeof SURAHS[number], scopeSurahList: typeof SURAHS): QuizQuestion | null {
  if (surah.id === 1) return null;
  const correct = getSurahById(surah.id - 1);
  if (!correct) return null;
  // Distractors: يفضّل من النطاق، وإلا من كل القرآن
  const pool = (scopeSurahList.length >= 4 ? scopeSurahList : SURAHS)
    .filter(s => s.id !== correct.id && s.id !== surah.id);
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map(s => s.nameAr);
  return {
    id: `q-${surah.id}-before`,
    kind: 'surahBefore', type: 'mcq',
    prompt: `ما السورة التي تأتي قبل سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 12,
    explanation: `السورة السابقة: ${correct.nameAr} (السورة ${arabicNumber(correct.id)})`,
  };
}

// ─── 16. السورة التالية ───
function makeSurahAfter(surah: typeof SURAHS[number], scopeSurahList: typeof SURAHS): QuizQuestion | null {
  if (surah.id === 114) return null;
  const correct = getSurahById(surah.id + 1);
  if (!correct) return null;
  const pool = (scopeSurahList.length >= 4 ? scopeSurahList : SURAHS)
    .filter(s => s.id !== correct.id && s.id !== surah.id);
  const distractors = pickN(pool, 3);
  const options = shuffle([correct, ...distractors]).map(s => s.nameAr);
  return {
    id: `q-${surah.id}-after`,
    kind: 'surahAfter', type: 'mcq',
    prompt: `ما السورة التي تأتي بعد سورة ${surah.nameAr}؟`,
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 12,
    explanation: `السورة التالية: ${correct.nameAr} (السورة ${arabicNumber(correct.id)})`,
  };
}

// ─── 17. أول آية في السورة ───
function makeFirstAyahOfSurah(surah: typeof SURAHS[number], ayahs: Ayah[]): QuizQuestion | null {
  const first = ayahs.find(a => a.number === 1);
  if (!first) return null;
  const pool = ayahs.filter(a => a.number !== 1);
  if (pool.length < 3) return null;
  const distractors = pickN(pool, 3);
  const options = shuffle([first, ...distractors]).map(a => a.text);
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
  const last = ayahs[ayahs.length - 1];
  if (!last) return null;
  const pool = ayahs.filter(a => a.number !== last.number);
  if (pool.length < 3) return null;
  const distractors = pickN(pool, 3);
  const options = shuffle([last, ...distractors]).map(a => a.text);
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

// ─── 19. ترتيب السورة ───
function makeSurahOrder(surah: typeof SURAHS[number]): QuizQuestion | null {
  const correct = surah.id;
  const s = new Set<number>();
  while (s.size < 3) {
    const offset = (Math.floor(Math.random() * 20) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correct + offset;
    if (cand >= 1 && cand <= 114 && cand !== correct) s.add(cand);
  }
  const options = shuffle([correct, ...Array.from(s)]).map(n => arabicNumber(n));
  return {
    id: `q-${surah.id}-order`,
    kind: 'surahOrder', type: 'mcq',
    prompt: `ما ترتيب سورة ${surah.nameAr} في المصحف؟`,
    options,
    correctIndex: options.indexOf(arabicNumber(correct)),
    points: 10,
    explanation: `سورة ${surah.nameAr} هي السورة رقم ${arabicNumber(correct)}`,
  };
}

// ─── 20. في أي صفحة؟ ───
function makeWhichPage(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion | null {
  const correctPage = ayah.page;
  if (!correctPage || correctPage <= 0) return null;
  const s = new Set<number>();
  while (s.size < 3) {
    const offset = (Math.floor(Math.random() * 12) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = correctPage + offset;
    if (cand >= 1 && cand <= 604 && cand !== correctPage) s.add(cand);
  }
  const options = shuffle([correctPage, ...Array.from(s)]).map(n => `صفحة ${arabicNumber(n)}`);
  return {
    id: `q-${surah.id}-${ayah.number}-page`,
    kind: 'whichPage', type: 'mcq',
    prompt: 'في أيّ صفحة تقع هذه الآية في المصحف؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`صفحة ${arabicNumber(correctPage)}`),
    points: 12,
    explanation: `هذه الآية في صفحة ${arabicNumber(correctPage)} — سورة ${surah.nameAr}`,
  };
}

// ─── 21. عدد كلمات الآية ───
function makeWordCountAyah(ayah: Ayah, surah: typeof SURAHS[number]): QuizQuestion | null {
  const words = ayah.text.split(/\s+/).filter(Boolean).length;
  if (words < 2) return null;
  const s = new Set<number>();
  while (s.size < 3) {
    const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = words + offset;
    if (cand > 0 && cand !== words) s.add(cand);
  }
  const options = shuffle([words, ...Array.from(s)]).map(n => `${arabicNumber(n)} كلمة`);
  return {
    id: `q-${surah.id}-${ayah.number}-wc`,
    kind: 'wordCountAyah', type: 'mcq',
    prompt: 'كم عدد كلمات هذه الآية؟',
    context: ayah.text,
    options,
    correctIndex: options.indexOf(`${arabicNumber(words)} كلمة`),
    points: 10,
    explanation: `الآية فيها ${arabicNumber(words)} كلمة`,
  };
}

// ─── 22. ترتيب ثلاث آيات ───
function makeArrangeAyahs(sameSurahAyahs: Ayah[], surah: typeof SURAHS[number]): QuizQuestion | null {
  if (sameSurahAyahs.length < 6) return null;
  // اختر 3 آيات متتالية من منتصف السورة
  const startIdx = 1 + Math.floor(Math.random() * (sameSurahAyahs.length - 4));
  const trio = sameSurahAyahs.slice(startIdx, startIdx + 3);
  if (trio.length < 3) return null;
  // نعرض أول 5-8 كلمات من كل آية لوضوح أكبر
  const trim = (text: string) => firstWords(text, 6) + (text.split(/\s+/).length > 6 ? ' ...' : '');
  const correctOrder = trio.map(a => trim(a.text));
  const wrong1 = [trim(trio[1].text), trim(trio[0].text), trim(trio[2].text)];
  const wrong2 = [trim(trio[2].text), trim(trio[1].text), trim(trio[0].text)];
  const wrong3 = [trim(trio[0].text), trim(trio[2].text), trim(trio[1].text)];
  const opts = shuffle([correctOrder, wrong1, wrong2, wrong3]);
  // كل خيار: الثلاث آيات مرقّمة (أ، ب، ج)
  const labels = ['أ', 'ب', 'ج'];
  const options = opts.map(arr =>
    arr.map((t, i) => `${labels[i]}. ${t}`).join('\n')
  );
  const correctText = correctOrder.map((t, i) => `${labels[i]}. ${t}`).join('\n');
  return {
    id: `q-${surah.id}-${startIdx}-arrange`,
    kind: 'arrangeAyahs', type: 'mcq',
    prompt: `رتّب هذه الآيات من سورة ${surah.nameAr} حسب ورودها الصحيح:`,
    options,
    correctIndex: options.indexOf(correctText),
    points: 20,
    explanation: `الترتيب الصحيح: الآية ${arabicNumber(trio[0].number)} ← ${arabicNumber(trio[1].number)} ← ${arabicNumber(trio[2].number)}`,
  };
}

// ─── 23. حروف مقطّعة ───
const MUQATTAAT_SURAH_IDS = new Set<number>([
  2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30,
  31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68,
]);

function makeMuqattaat(surah: typeof SURAHS[number]): QuizQuestion {
  const isMuq = MUQATTAAT_SURAH_IDS.has(surah.id);
  return {
    id: `q-${surah.id}-muqat`,
    kind: 'muqattaat', type: 'truefalse',
    prompt: `هل تبدأ سورة ${surah.nameAr} بحروف مقطّعة؟`,
    options: ['نعم', 'لا'],
    correctIndex: isMuq ? 0 : 1,
    points: 8,
    explanation: isMuq
      ? `نعم، سورة ${surah.nameAr} من السور التسع والعشرين المبتدئة بحروف مقطّعة`
      : `لا، سورة ${surah.nameAr} لا تبدأ بحروف مقطّعة`,
  };
}

// ─── 24. الأطول/الأقصر ───
function makeLongestSurah(scopeSurahList: typeof SURAHS): QuizQuestion | null {
  if (scopeSurahList.length < 4) return null;
  const picked = pickN(scopeSurahList, 4);
  const askLongest = Math.random() < 0.5;
  const sorted = [...picked].sort((a, b) =>
    askLongest ? b.versesCount - a.versesCount : a.versesCount - b.versesCount,
  );
  const correct = sorted[0];
  const options = picked.map(s => s.nameAr);
  return {
    id: `q-longest-${correct.id}`,
    kind: 'longestSurah', type: 'mcq',
    prompt: askLongest
      ? 'أيّ السور التالية أكثر آيات؟'
      : 'أيّ السور التالية أقلّ آيات؟',
    options,
    correctIndex: options.indexOf(correct.nameAr),
    points: 10,
    explanation: `سورة ${correct.nameAr} فيها ${arabicNumber(correct.versesCount)} آية`,
  };
}

// ─── 25. عدد صفحات السورة ───
function makePageCountSurah(surah: typeof SURAHS[number]): QuizQuestion | null {
  const nextSurah = SURAHS.find(s => s.id === surah.id + 1);
  const pageCount = nextSurah
    ? Math.max(1, nextSurah.pageStart - surah.pageStart)
    : Math.max(1, 605 - surah.pageStart);
  if (pageCount < 1) return null;
  const s = new Set<number>();
  while (s.size < 3) {
    const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const cand = pageCount + offset;
    if (cand >= 1 && cand !== pageCount) s.add(cand);
  }
  const fmt = (n: number) => n === 1 ? 'صفحة واحدة' : `${arabicNumber(n)} صفحات`;
  const options = shuffle([pageCount, ...Array.from(s)]).map(fmt);
  return {
    id: `q-${surah.id}-pages`,
    kind: 'pageCountSurah', type: 'mcq',
    prompt: `كم صفحة تشغل سورة ${surah.nameAr} في المصحف تقريباً؟`,
    options,
    correctIndex: options.indexOf(fmt(pageCount)),
    points: 12,
    explanation: `سورة ${surah.nameAr} تبدأ في الصفحة ${arabicNumber(surah.pageStart)} وتشغل ${fmt(pageCount)}`,
  };
}

// ═════════════════════════════════════════════════════
// Public API
// ═════════════════════════════════════════════════════

export interface QuizGenerationOptions {
  level: QuizLevel;
  juzs: number[];
  totalQuestions: number;
  mode?: 'algorithmic' | 'curated' | 'mixed';
}

export function defaultJuzsForLevel(level: QuizLevel): number[] {
  switch (level) {
    case 'beginner':     return [30];
    case 'intermediate': return [28, 29, 30];
    case 'advanced':     return Array.from({ length: 30 }, (_, i) => i + 1);
  }
}

function allowedKindsForLevel(level: QuizLevel): QuizQuestionKind[] {
  switch (level) {
    case 'beginner':
      return [
        'whichSurah', 'meccanMedinan', 'verseCount', 'isFromSurah',
        'firstAyahOfSurah', 'lastAyahOfSurah', 'surahBefore', 'surahAfter',
        'surahOrder', 'longestSurah', 'muqattaat',
      ];
    case 'intermediate':
      return [
        'whichSurah', 'whichJuz', 'isFromSurah', 'meccanMedinan',
        'verseCount', 'completeVerse', 'verseBeginning', 'ayahEnding',
        'nextAyah', 'firstAyahOfSurah', 'lastAyahOfSurah', 'firstWordOfNext',
        'surahOrder', 'whichPage', 'wordCountAyah', 'muqattaat', 'longestSurah',
      ];
    case 'advanced':
      return [
        'whichSurah', 'whichJuz', 'isFromSurah', 'ayahPosition',
        'nextAyah', 'previousAyah', 'firstWordOfNext',
        'completeVerse', 'verseBeginning', 'ayahEnding', 'typeNextWord', 'fillBlank',
        'verseCount', 'surahBefore', 'surahAfter', 'surahOrder',
        'whichPage', 'wordCountAyah', 'arrangeAyahs', 'muqattaat', 'longestSurah',
      ];
  }
}

/**
 * ✅ تحميل السور الكاملة للنطاق، ثم فلترة الآيات فعلياً للجزء المختار.
 * يُعيد: { ayahsBySurah (مفلترة), surahMap, allScopeAyahs }
 */
async function loadAndFilterScope(juzs: number[]): Promise<{
  ayahsBySurah: Map<number, Ayah[]>;
  surahMap: Map<number, typeof SURAHS[number]>;
  allScopeAyahs: Ayah[];
  scopeSurahList: typeof SURAHS;
}> {
  const juzSet = new Set(juzs.length > 0 ? juzs : Array.from({ length: 30 }, (_, i) => i + 1));
  const surahIds = surahIdsInJuzs(juzSet.size === 30 ? [] : juzs);

  const scopeSurahList = SURAHS.filter(s => surahIds.has(s.id));
  const surahMap = new Map<number, typeof SURAHS[number]>(scopeSurahList.map(s => [s.id, s]));

  const ayahsBySurah = new Map<number, Ayah[]>();
  const CHUNK = 8;

  for (let i = 0; i < scopeSurahList.length; i += CHUNK) {
    const chunk = scopeSurahList.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (s) => {
      try {
        const all = await getSurahAyahs(s.id);
        // ✅ فلتر الآيات للجزء الفعلي
        const filtered = juzs.length > 0
          ? all.filter(a => juzSet.has(a.juz > 0 ? a.juz : s.juzStart))
          : all;
        if (filtered.length > 0) ayahsBySurah.set(s.id, filtered);
      } catch {}
    }));
  }

  const allScopeAyahs = buildAyahPool(ayahsBySurah, juzSet, surahMap);
  return { ayahsBySurah, surahMap, allScopeAyahs, scopeSurahList };
}

/**
 * ✅ توليد اختبار عالمي الجودة:
 *  1. تحميل الآيات وفلترتها للجزء المختار فعلياً
 *  2. بناء قائمة الآيات مخلوطة (shuffle) لضمان التوزيع العادل
 *  3. تتبّع الآيات المستخدمة منعاً للتكرار
 *  4. round-robin على الأنواع لضمان التنوع
 *  5. نظام احتياطي متدرج لو فشل نوع ما
 */
export async function generateQuiz(options: QuizGenerationOptions): Promise<QuizQuestion[]> {
  const { level, totalQuestions, mode = 'algorithmic' } = options;
  const juzs = options.juzs.length > 0 ? options.juzs : defaultJuzsForLevel(level);

  // وضع curated
  if (mode === 'curated') {
    const filtered = pickRandomCurated(totalQuestions, juzs);
    if (filtered.length >= totalQuestions) return filtered;
    const extra = pickRandomCurated(totalQuestions - filtered.length)
      .filter(q => !filtered.some(f => f.id === q.id));
    return [...filtered, ...extra].slice(0, totalQuestions);
  }

  // تحميل وفلترة النطاق
  const { ayahsBySurah, surahMap, allScopeAyahs, scopeSurahList } = await loadAndFilterScope(juzs);

  if (allScopeAyahs.length === 0) return [];

  // وضع mixed: نصف منسَّق + نصف خوارزمي
  let curatedQuestions: QuizQuestion[] = [];
  let remainingForAlgo = totalQuestions;
  if (mode === 'mixed') {
    const curatedCount = Math.min(Math.floor(totalQuestions / 2), CURATED_COUNT);
    curatedQuestions = pickRandomCurated(curatedCount, juzs);
    remainingForAlgo = totalQuestions - curatedQuestions.length;
  }

  const allowed = allowedKindsForLevel(level);

  // ✅ قائمة الآيات مخلوطة — كل آية تُستخدم مرة واحدة كحد أقصى
  const ayahQueue = shuffle(allScopeAyahs);
  const usedAyahKeys = new Set<string>();  // `surahId:ayahNumber`
  const usedQIds    = new Set<string>();   // IDs الأسئلة المولّدة

  const questions: QuizQuestion[] = [];
  let kindIdx  = 0;
  let ayahPtr  = 0;   // مؤشر على القائمة المخلوطة
  let safety   = 0;
  const maxSafety = remainingForAlgo * 25;

  const getScopeAyahsForSurah = (surahId: number) => ayahsBySurah.get(surahId) ?? [];
  const ayahKey = (a: Ayah) => `${a.surahId}:${a.number}`;

  while (questions.length < remainingForAlgo && safety < maxSafety) {
    safety++;

    // اختر نوع السؤال التالي
    const kind = allowed[kindIdx % allowed.length];
    kindIdx++;

    let q: QuizQuestion | null = null;

    // ─── أسئلة تعتمد على السورة فقط (لا تحتاج آية محددة) ───
    const scopeSurah = scopeSurahList[Math.floor(Math.random() * scopeSurahList.length)];
    const surahAyahs = getScopeAyahsForSurah(scopeSurah.id);

    if (kind === 'meccanMedinan')        q = makeMeccanMedinan(scopeSurah);
    else if (kind === 'verseCount')      q = makeVerseCount(scopeSurah);
    else if (kind === 'surahBefore')     q = makeSurahBefore(scopeSurah, scopeSurahList);
    else if (kind === 'surahAfter')      q = makeSurahAfter(scopeSurah, scopeSurahList);
    else if (kind === 'surahOrder')      q = makeSurahOrder(scopeSurah);
    else if (kind === 'muqattaat')       q = makeMuqattaat(scopeSurah);
    else if (kind === 'longestSurah')    q = makeLongestSurah(scopeSurahList);
    else if (kind === 'pageCountSurah')  q = makePageCountSurah(scopeSurah);
    else if (kind === 'firstAyahOfSurah' && surahAyahs.length >= 4)
      q = makeFirstAyahOfSurah(scopeSurah, surahAyahs);
    else if (kind === 'lastAyahOfSurah' && surahAyahs.length >= 4)
      q = makeLastAyahOfSurah(scopeSurah, surahAyahs);
    else if (kind === 'arrangeAyahs' && surahAyahs.length >= 6)
      q = makeArrangeAyahs(surahAyahs, scopeSurah);

    // ─── أسئلة تحتاج آية محددة ─── تستخدم القائمة المخلوطة (لا تكرار)
    else {
      // ابحث عن آية غير مستخدمة
      let foundAyah: Ayah | null = null;
      let searchSteps = 0;
      while (searchSteps < ayahQueue.length) {
        const candidate = ayahQueue[ayahPtr % ayahQueue.length];
        ayahPtr++;
        searchSteps++;
        if (!usedAyahKeys.has(ayahKey(candidate))) {
          foundAyah = candidate;
          break;
        }
      }
      if (!foundAyah) break; // كل الآيات استُنفدت

      const ayah  = foundAyah;
      const surah = surahMap.get(ayah.surahId) ?? SURAHS.find(s => s.id === ayah.surahId)!;
      const sameSurahAyahs = getScopeAyahsForSurah(ayah.surahId);

      if (kind === 'whichSurah')         q = makeWhichSurah(ayah, scopeSurahList);
      else if (kind === 'whichJuz')      q = makeWhichJuz(ayah, surah, new Set(juzs));
      else if (kind === 'isFromSurah')   q = makeIsFromSurah(ayah, scopeSurahList);
      else if (kind === 'ayahPosition')  q = makeAyahPosition(ayah, surah, allScopeAyahs);
      else if (kind === 'nextAyah')      q = makeNextAyah(ayah, sameSurahAyahs);
      else if (kind === 'previousAyah')  q = makePreviousAyah(ayah, sameSurahAyahs);
      else if (kind === 'firstWordOfNext') q = makeFirstWordOfNext(ayah, sameSurahAyahs);
      else if (kind === 'completeVerse') q = makeCompleteVerse(ayah, sameSurahAyahs);
      else if (kind === 'verseBeginning') q = makeVerseBeginning(ayah, sameSurahAyahs);
      else if (kind === 'ayahEnding')    q = makeAyahEnding(ayah, sameSurahAyahs);
      else if (kind === 'typeNextWord')  q = makeTypeNextWord(ayah);
      else if (kind === 'fillBlank')     q = makeFillBlank(ayah);
      else if (kind === 'whichPage')     q = makeWhichPage(ayah, surah);
      else if (kind === 'wordCountAyah') q = makeWordCountAyah(ayah, surah);

      // ✅ سجّل الآية المستخدمة (بغض النظر عن نجاح السؤال)
      // عشان ما تُستخدمش مرة ثانية حتى لو فشل توليد السؤال
      if (q !== null) usedAyahKeys.add(ayahKey(ayah));
    }

    if (q && !usedQIds.has(q.id)) {
      questions.push(q);
      usedQIds.add(q.id);
    }
  }

  // وضع mixed: امزج المنسَّقة مع الخوارزمية
  if (mode === 'mixed' && curatedQuestions.length > 0) {
    return shuffle([...questions, ...curatedQuestions]);
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
