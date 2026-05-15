/**
 * مزامنة الصوت مع الآيات.
 *
 * نموذج بسيط: نقسّم مدّة الـ MP3 على عدد الآيات بنسبة طول كل آية.
 * (الحل المثالي بـ timing data من AlQuran.cloud لكل قارئ، لكن البسيط
 * يعطي تظليلاً منطقياً ٩٠% من الحالات لكل القرّاء).
 */
import { Ayah } from '@/types/index';

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
): number | null {
  if (!ayahs.length || durationMs <= 0 || positionMs <= 0) return null;

  // مدة كل آية بالـ حروف (تقريبي)
  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0);
  if (totalChars === 0) return null;

  // عد المللي ثانية لكل حرف
  const msPerChar = durationMs / totalChars;

  // بحث linear عن الآية الحالية
  let accumulated = 0;
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
 * يحسب نسبة التقدّم داخل الآية الحالية (0-1).
 */
export function getProgressInAyah(
  positionMs: number,
  durationMs: number,
  ayahs: Ayah[],
  currentAyahNumber: number,
): number {
  if (!ayahs.length || durationMs <= 0) return 0;
  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0);
  if (totalChars === 0) return 0;

  const msPerChar = durationMs / totalChars;
  let accumulated = 0;
  for (const ayah of ayahs) {
    if (ayah.number === currentAyahNumber) {
      const ayahDur = ayah.text.length * msPerChar;
      return Math.max(0, Math.min(1, (positionMs - accumulated) / ayahDur));
    }
    accumulated += ayah.text.length * msPerChar;
  }
  return 0;
}
