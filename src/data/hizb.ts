/**
 * 📜 بيانات الحزب والربع للمصحف الكامل.
 *
 * المصحف فيه:
 *  - 30 جزء
 *  - 60 حزب (كل جزء = حزبين)
 *  - 240 ربع (كل حزب = 4 أرباع: ربع/نصف/ثلاثة أرباع/الحزب التالي)
 *
 * البيانات: مواضع بداية كل ربع في الـ Madinah Mushaf (مرجعي مع مصحف المدينة 604 صفحة).
 *
 * المصدر: مرجع شائع لتقسيم الحزب والربع المعتمد. كل ربع له:
 *  - hizbNumber (1-60)
 *  - quarter (1, 2, 3, 4) → الربع، النصف، الثلاثة أرباع، الحزب التالي
 *  - page (1-604)
 *  - surahId + ayahNumber (تقريبي - أول آية في الربع)
 */

export interface RubMarker {
  hizbNumber: number; // 1-60
  quarter: 1 | 2 | 3 | 4; // 1=ربع، 2=نصف، 3=ثلاثة أرباع، 4=بداية الحزب التالي
  page: number;
  surahId: number;
  ayahNumber: number;
}

/**
 * مواضع الأحزاب الستين في مصحف المدينة المنورة (start of each Hizb).
 * Hizb N يبدأ في الصفحة المُحدّدة.
 */
export const HIZB_PAGE_STARTS: number[] = [
  // Juz 1
  1, 11, // hizb 1, 2
  // Juz 2
  22, 32,
  // Juz 3
  42, 52,
  // Juz 4
  62, 72,
  // Juz 5
  82, 92,
  // Juz 6
  102, 112,
  // Juz 7
  122, 132,
  // Juz 8
  142, 152,
  // Juz 9
  162, 172,
  // Juz 10
  182, 192,
  // Juz 11
  201, 212,
  // Juz 12
  222, 232,
  // Juz 13
  242, 252,
  // Juz 14
  262, 272,
  // Juz 15
  282, 292,
  // Juz 16
  302, 312,
  // Juz 17
  322, 332,
  // Juz 18
  342, 352,
  // Juz 19
  362, 372,
  // Juz 20
  382, 392,
  // Juz 21
  402, 412,
  // Juz 22
  422, 432,
  // Juz 23
  442, 452,
  // Juz 24
  462, 472,
  // Juz 25
  482, 492,
  // Juz 26
  502, 512,
  // Juz 27
  522, 532,
  // Juz 28
  542, 552,
  // Juz 29
  562, 572,
  // Juz 30
  582, 592,
];

/**
 * يحسب رقم الحزب الحالي بناءً على رقم الصفحة.
 * يرجع 0 لو الصفحة قبل بداية الحزب الأول (نظرياً غير ممكن).
 */
export function getHizbForPage(page: number): number {
  let hizb = 0;
  for (let i = 0; i < HIZB_PAGE_STARTS.length; i++) {
    if (HIZB_PAGE_STARTS[i] <= page) hizb = i + 1;
    else break;
  }
  return hizb;
}

/**
 * يرجع تقدّم الصفحة داخل الحزب الحالي (0-1).
 * نحسبه من فرق الصفحة الحالية وبداية الحزب التالي.
 */
export function getProgressInHizb(page: number): number {
  const hizb = getHizbForPage(page);
  if (hizb === 0) return 0;
  const start = HIZB_PAGE_STARTS[hizb - 1];
  const end = hizb < 60 ? HIZB_PAGE_STARTS[hizb] : 605;
  const span = end - start;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (page - start) / span));
}

/**
 * يصف موقع الصفحة داخل الحزب: ربع/نصف/ثلاثة أرباع/قرب النهاية.
 */
export function describeHizbProgress(page: number): string {
  const hizb = getHizbForPage(page);
  if (hizb === 0) return '';
  const p = getProgressInHizb(page);
  if (p < 0.125) return `الحزب ${hizb} · البداية`;
  if (p < 0.375) return `الحزب ${hizb} · الربع الأول`;
  if (p < 0.625) return `الحزب ${hizb} · النصف`;
  if (p < 0.875) return `الحزب ${hizb} · ثلاثة أرباع`;
  return `الحزب ${hizb} · قرب النهاية`;
}

/**
 * أرقام عربية للحزب (للعرض).
 */
export function hizbNameAr(n: number): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  return String(n).split('').map((d) => arabicDigits[parseInt(d, 10)]).join('');
}
