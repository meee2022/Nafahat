/**
 * مزامنة الصوت مع الآيات.
 *
 * استراتيجية متدرّجة:
 *  ١. لو توقيتات دقيقة متاحة من Quran Foundation API → استخدمها (دقّة ms).
 *  ٢. وإلا → فالـ fallback: نقسّم مدّة الـ MP3 على عدد الآيات بنسبة طول كل آية.
 *
 * انظر `audioTimings.ts` للمسار الدقيق.
 */
import { Ayah } from '@/types/index';
import {
  findVerseAtTime,
  getVerseStartMs as getVerseStartMsFromTimings,
  type SurahTimings,
} from './audioTimings';

/**
 * يحسب الآية المُشغّلة حالياً بناءً على الوقت الحالي ومدّة الـ MP3.
 *
 * @param positionMs الوقت الحالي بالمللي ثانية
 * @param durationMs مدّة الـ MP3 الكلّية
 * @param ayahs قائمة الآيات بنصوصها
 * @returns رقم الآية الحالية (1-indexed) أو null إذا لم يبدأ التشغيل
 */
export function getCurrentAyah(
  positionMs: number,
  durationMs: number,
  ayahs: Ayah[],
  surahId?: number,
  /** توقيتات دقيقة لو متوفرة - تتجاوز الـ char-count heuristic. */
  timings?: SurahTimings | null,
): number | null {
  if (!ayahs.length || durationMs <= 0 || positionMs <= 0) return null;

  // 🎯 المسار الدقيق: استخدم التوقيتات المرجعية
  if (timings && timings.verses.length > 0) {
    const v = findVerseAtTime(positionMs, durationMs, timings);
    if (v !== null) return v;
  }

  let bismillahOffset = 0;
  if (surahId && surahId !== 1 && surahId !== 9) {
    bismillahOffset = 22; // "بسم الله الرحمن الرحيم"
  }

  // مدة كل آية بالـ حروف (تقريبي)
  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0) + bismillahOffset;
  if (totalChars === 0) return null;

  // عد المللي ثانية لكل حرف
  const msPerChar = durationMs / totalChars;

  let accumulated = bismillahOffset * msPerChar;
  if (positionMs <= accumulated && surahId && surahId !== 1 && surahId !== 9) {
    return ayahs[0].number; // لو بيقرأ البسملة، نحدد الآية الأولى
  }

  // بحث linear عن الآية الحالية
  for (const ayah of ayahs) {
    const ayahDuration = ayah.text.length * msPerChar;
    if (positionMs <= accumulated + ayahDuration) {
      return ayah.number;
    }
    accumulated += ayahDuration;
  }

  // وصلنا للنهاية
  return ayahs[ayahs.length - 1].number;
}

/**
 * يحسب الوقت التقريبي لبداية آية معيّنة في الـ MP3.
 *
 * @param ayahNumber رقم الآية المطلوبة
 * @param durationMs مدّة الـ MP3 الكلّية
 * @param ayahs قائمة الآيات بنصوصها (يكفي number + text)
 * @returns الوقت بالـ milliseconds (0 لو ما لقاهاش)
 */
export function getAyahStartTimeMs(
  ayahNumber: number,
  durationMs: number,
  ayahs: Array<{ number: number; text: string }>,
  surahId?: number,
  /** توقيتات دقيقة لو متوفرة. */
  timings?: SurahTimings | null,
): number {
  if (!ayahs.length || durationMs <= 0) return 0;

  // 🎯 المسار الدقيق
  if (timings && timings.verses.length > 0) {
    const start = getVerseStartMsFromTimings(ayahNumber, durationMs, timings);
    // ✅ نقبل القيمة حتى لو كانت 0 (الآية 1 = بداية الـ MP3)
    if (timings.verses.some((v) => v.verseNumber === ayahNumber)) return start;
  }

  let bismillahOffset = 0;
  if (surahId && surahId !== 1 && surahId !== 9) {
    bismillahOffset = 22;
  }

  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0) + bismillahOffset;
  if (totalChars === 0) return 0;
  
  const msPerChar = durationMs / totalChars;
  
  let accumulated = bismillahOffset * msPerChar;
  
  for (const ayah of ayahs) {
    if (ayah.number === ayahNumber) {
      if (ayahNumber === 1 && surahId !== 1 && surahId !== 9) {
        return 0; // ارجع لبداية البسملة لو طلب الآية الأولى
      }
      return Math.floor(accumulated);
    }
    accumulated += ayah.text.length * msPerChar;
  }
  return 0;
}

/**
 * يحسب نسبة التقدّم داخل الآية الحالية (0-1).
 */
export function getProgressInAyah(
  positionMs: number,
  durationMs: number,
  ayahs: Ayah[],
  currentAyahNumber: number,
  surahId?: number,
): number {
  if (!ayahs.length || durationMs <= 0) return 0;

  let bismillahOffset = 0;
  if (surahId && surahId !== 1 && surahId !== 9) {
    bismillahOffset = 22;
  }

  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0) + bismillahOffset;
  if (totalChars === 0) return 0;

  const msPerChar = durationMs / totalChars;
  
  let accumulated = bismillahOffset * msPerChar;
  
  // لو بيقرأ البسملة حالياً
  if (positionMs <= accumulated && currentAyahNumber === 1 && surahId && surahId !== 1 && surahId !== 9) {
    return Math.max(0, Math.min(1, positionMs / accumulated));
  }

  for (const ayah of ayahs) {
    if (ayah.number === currentAyahNumber) {
      const ayahDur = ayah.text.length * msPerChar;
      return Math.max(0, Math.min(1, (positionMs - accumulated) / ayahDur));
    }
    accumulated += ayah.text.length * msPerChar;
  }
  return 0;
}
