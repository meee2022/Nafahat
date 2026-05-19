/**
 * 🎨 Tajweed Rules — قواعد التجويد + ألوان التظليل.
 *
 * هذه القواعد تُلوّن أحرف معيّنة في القرآن لتوضيح أحكام التجويد.
 * مرجع الألوان: المصاحف الملوّنة بالتجويد المتداولة (مجمع الملك فهد).
 *
 * كل قاعدة لها:
 *  - id: مُعرّف فريد
 *  - nameAr / nameEn: اسم القاعدة
 *  - color: لون التظليل (HEX) - نختار ألوان متناسقة مع identity Nafahat
 *           حيث أمكن (تدرّجات أخضر/ذهب/زمرد)
 *  - description: شرح مختصر
 *  - examples: 3-5 آيات كأمثلة (sura:ayah)
 *
 * تطبيق التظليل: يتم على مستوى الكلمات في QPC page عبر detecting characters
 *  أو patterns. القواعد المعقدة (إخفاء، إقلاب، إلخ) تحتاج text analysis.
 */

export interface TajweedRule {
  id: string;
  nameAr: string;
  nameEn: string;
  /** لون التظليل بصيغة HEX (يطبّق opacity 30-50% للقراءة المريحة). */
  color: string;
  description: string;
  /** أمثلة للقاعدة */
  examples: { surahId: number; ayah: number; note?: string }[];
}

export const TAJWEED_RULES: TajweedRule[] = [
  {
    id: 'ghunnah',
    nameAr: 'الغُنّة',
    nameEn: 'Ghunnah',
    color: '#0F4A41', // زمرد عميق
    description: 'صوت يخرج من الأنف عند النون المشدّدة والميم المشدّدة (٢ حركة).',
    examples: [
      { surahId: 2, ayah: 6, note: 'الَّذِينَ كَفَرُوا (تشديد)' },
      { surahId: 1, ayah: 6, note: 'الصِّرَاطَ' },
    ],
  },
  {
    id: 'idgham-no-ghunnah',
    nameAr: 'الإدغام بغير غُنّة',
    nameEn: 'Idgham without Ghunnah',
    color: '#B8923B', // ذهبي داكن
    description: 'إدغام النون الساكنة أو التنوين في اللام والراء بدون غنّة.',
    examples: [
      { surahId: 110, ayah: 2 },
      { surahId: 1, ayah: 7 },
    ],
  },
  {
    id: 'idgham-with-ghunnah',
    nameAr: 'الإدغام بغُنّة',
    nameEn: 'Idgham with Ghunnah',
    color: '#1A5C4F', // زمرد متوسط
    description: 'إدغام النون الساكنة أو التنوين في حروف (ي و م ن) مع غنّة.',
    examples: [
      { surahId: 2, ayah: 5 },
      { surahId: 112, ayah: 4, note: 'كُفُوًا أَحَدٌ' },
    ],
  },
  {
    id: 'ikhfa',
    nameAr: 'الإخفاء الحقيقي',
    nameEn: 'Ikhfa',
    color: '#9C7A2D', // ذهبي بنّي
    description: 'إخفاء النون الساكنة أو التنوين عند ١٥ حرفاً مع غنّة بمقدار حركتين.',
    examples: [
      { surahId: 2, ayah: 3, note: 'مِمَّا رَزَقْنَاهُمْ يُنفِقُونَ' },
      { surahId: 102, ayah: 3 },
    ],
  },
  {
    id: 'iqlab',
    nameAr: 'الإقلاب',
    nameEn: 'Iqlab',
    color: '#C77B2F', // برتقالي زعفراني
    description: 'قلب النون الساكنة أو التنوين ميماً عند الباء مع إخفاء وغنّة.',
    examples: [
      { surahId: 2, ayah: 27 },
      { surahId: 96, ayah: 15, note: 'لَنَسْفَعًا بِالنَّاصِيَةِ' },
    ],
  },
  {
    id: 'qalqalah-sughra',
    nameAr: 'القلقلة الصُّغرى',
    nameEn: 'Qalqalah (small)',
    color: '#3F8B8B', // فيروز
    description: 'اهتزاز خفيف عند أحرف القلقلة (قطب جد) ساكنة في وسط الكلمة.',
    examples: [
      { surahId: 113, ayah: 5, note: 'حَاسِدٍ إِذَا حَسَدَ' },
      { surahId: 1, ayah: 4, note: 'يَوْمِ الدِّينِ' },
    ],
  },
  {
    id: 'qalqalah-kubra',
    nameAr: 'القلقلة الكُبرى',
    nameEn: 'Qalqalah (large)',
    color: '#2D6868', // فيروز عميق
    description: 'اهتزاز قوي عند أحرف القلقلة ساكنة في آخر الكلمة وقفاً.',
    examples: [
      { surahId: 113, ayah: 1, note: 'بِرَبِّ الْفَلَقِ' },
      { surahId: 112, ayah: 1, note: 'هُوَ اللَّهُ أَحَدٌ' },
    ],
  },
  {
    id: 'madd-2',
    nameAr: 'المدّ الطبيعي',
    nameEn: 'Natural Madd (2 counts)',
    color: '#5B9F8E', // زمرد فاتح
    description: 'مدّ بمقدار حركتين عند حروف المدّ الثلاثة (ا و ي).',
    examples: [
      { surahId: 1, ayah: 1, note: 'الرَّحْمَٰنِ الرَّحِيمِ' },
      { surahId: 112, ayah: 1, note: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
    ],
  },
  {
    id: 'madd-4-5',
    nameAr: 'المدّ المتّصل/المنفصل',
    nameEn: 'Connected/Separated Madd (4-5)',
    color: '#3F8F6E', // زمرد ساطع
    description: 'مدّ بمقدار ٤-٥ حركات حين تأتي همزة بعد حرف المدّ.',
    examples: [
      { surahId: 1, ayah: 5, note: 'إِيَّاكَ نَعْبُدُ' },
      { surahId: 2, ayah: 3, note: 'وَمِمَّا رَزَقْنَاهُمْ' },
    ],
  },
  {
    id: 'madd-6',
    nameAr: 'المدّ اللازم',
    nameEn: 'Necessary Madd (6 counts)',
    color: '#062825', // زمرد أعمق
    description: 'مدّ بمقدار ٦ حركات وجوباً عند حرف مدّ يليه سكون أصلي أو شدّة.',
    examples: [
      { surahId: 1, ayah: 7, note: 'الضَّالِّينَ' },
      { surahId: 2, ayah: 1, note: 'الم (في حروف فواتح السور)' },
    ],
  },
  {
    id: 'tafkheem',
    nameAr: 'التفخيم',
    nameEn: 'Tafkheem (heavy)',
    color: '#3A2D11', // ذهبي بنّي عميق
    description: 'نُطق ثقيل (مُفخّم) لحروف الاستعلاء: خ ص ض ط ظ غ ق + الراء/اللام في حالات.',
    examples: [
      { surahId: 1, ayah: 1, note: 'اللَّهِ (لفظ الجلالة بعد فتح/ضم)' },
    ],
  },
  {
    id: 'tarqeeq',
    nameAr: 'الترقيق',
    nameEn: 'Tarqeeq (light)',
    color: '#D4B570', // ذهب فاتح
    description: 'نُطق خفيف (مُرقّق) - الأصل في معظم الحروف.',
    examples: [
      { surahId: 1, ayah: 2, note: 'الْحَمْدُ لِلَّهِ (لفظ الجلالة بعد كسر)' },
    ],
  },
];

/**
 * legend mini للعرض في الـ Mushaf reader لما tajweed mode ON.
 * نختار 5 قواعد رئيسية للوضوح.
 */
export const TAJWEED_LEGEND_KEY = [
  'ghunnah', 'ikhfa', 'qalqalah-kubra', 'madd-4-5', 'madd-6',
];

/**
 * يجلب قاعدة بـ id.
 */
export function getRuleById(id: string): TajweedRule | undefined {
  return TAJWEED_RULES.find((r) => r.id === id);
}
