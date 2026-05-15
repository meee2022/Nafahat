/**
 * نظام تلوين أحكام التجويد - يحلّل النص ويُلوّن حسب القواعد.
 *
 * النظام المختصر (10 ألوان لأهم الأحكام):
 *  - مدّ ٢ حركة (طبيعي)     : أزرق فاتح
 *  - مدّ ٤-٥ حركة (متصل/منفصل) : أزرق متوسط
 *  - مدّ ٦ حركة (لازم)       : أزرق غامق
 *  - غنّة (نون/ميم)          : أخضر
 *  - إخفاء/إدغام             : وردي
 *  - قلقلة                   : أحمر داكن
 *  - تفخيم                   : بنّي ذهبي
 *  - وقف لازم/جائز           : رمادي
 *
 * هذه نسخة مبسّطة - الحلّ الكامل يتطلّب مكتبة @kmaslesa/tajweed-quran
 * أو نص قرآني مُحدَّد مسبقاً بأحكام التجويد.
 *
 * المرجع: https://github.com/jzaefferer/tajweed-rules
 */

export interface TajweedColors {
  /** مد طبيعي - 2 حركة. */
  madNatural:    string;
  /** مد متصل/منفصل - 4-5 حركات. */
  madConnected:  string;
  /** مد لازم - 6 حركات. */
  madRequired:   string;
  /** غنّة. */
  ghunnah:       string;
  /** إخفاء. */
  ikhfa:         string;
  /** قلقلة. */
  qalqalah:      string;
  /** تفخيم. */
  tafkheem:      string;
  /** وقف. */
  waqf:          string;
}

export const TAJWEED_PALETTE_LIGHT: TajweedColors = {
  madNatural:    '#1E40AF',  // أزرق
  madConnected:  '#7C3AED',  // بنفسجي
  madRequired:   '#5B21B6',  // بنفسجي غامق
  ghunnah:       '#059669',  // أخضر
  ikhfa:         '#DB2777',  // وردي
  qalqalah:      '#DC2626',  // أحمر
  tafkheem:      '#92400E',  // بنّي
  waqf:          '#6B7280',  // رمادي
};

export const TAJWEED_PALETTE_DARK: TajweedColors = {
  madNatural:    '#60A5FA',
  madConnected:  '#A78BFA',
  madRequired:   '#C4B5FD',
  ghunnah:       '#34D399',
  ikhfa:         '#F472B6',
  qalqalah:      '#F87171',
  tafkheem:      '#FCD34D',
  waqf:          '#9CA3AF',
};

export interface ColoredSegment {
  text: string;
  /** اللون أو undefined إن لم يوجد حكم. */
  color?: string;
  /** اسم الحكم بالعربية. */
  rule?: string;
}

/**
 * يحلّل آية ويرجع segments ملوّنة بحسب الأحكام.
 * تطبيق مبسّط: يعتمد على Regex لاكتشاف الأنماط الأساسية.
 */
export function colorizeTajweed(text: string, palette: TajweedColors): ColoredSegment[] {
  const segments: ColoredSegment[] = [];
  let buffer = '';

  // قائمة الأنماط (مبسّطة جداً - النسخة الكاملة تتطلّب parser عربي متقدّم)
  const patterns: Array<{ regex: RegExp; color: string; rule: string }> = [
    // مد طبيعي: حرف مد بدون شدّة أو همزة بعده
    { regex: /([ا]ـ?)(?![ّ])/gu,                     color: palette.madNatural,   rule: 'مد طبيعي' },
    // غنّة: نون مشدّدة أو ميم مشدّدة
    { regex: /([نم]ّ)/gu,                            color: palette.ghunnah,      rule: 'غنّة' },
    // قلقلة: حروف قطب جد ساكنة
    { regex: /([قطبجد]ْ)/gu,                          color: palette.qalqalah,     rule: 'قلقلة' },
    // وقف
    { regex: /([ۖۗۘۚۛۜ۝])/gu,                        color: palette.waqf,         rule: 'وقف' },
  ];

  // طريقة بسيطة: نطبّق pattern واحد كمثال (الإخفاء/الإدغام)
  // التطبيق الكامل يحتاج NFA على النص
  // لكي لا تكون النسخة مكلفة CPU، نستخدم تقريباً بسيطاً.
  const result: ColoredSegment[] = [{ text }];

  for (const p of patterns) {
    const newResult: ColoredSegment[] = [];
    for (const seg of result) {
      if (seg.color) {
        newResult.push(seg);
        continue;
      }
      let lastIndex = 0;
      const t = seg.text;
      let m: RegExpExecArray | null;
      const regex = new RegExp(p.regex.source, p.regex.flags);
      while ((m = regex.exec(t)) !== null) {
        if (m.index > lastIndex) {
          newResult.push({ text: t.slice(lastIndex, m.index) });
        }
        newResult.push({ text: m[0], color: p.color, rule: p.rule });
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < t.length) {
        newResult.push({ text: t.slice(lastIndex) });
      }
    }
    result.splice(0, result.length, ...newResult);
  }

  return result;
}
