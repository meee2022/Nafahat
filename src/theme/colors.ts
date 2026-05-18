/**
 * نظام الألوان - هوية "Royal Manuscript"
 * عاج ورقي + ذهب عتيق + زمرد ملكي + فيروزي + حبر مخطوط
 */

const palette = {
  // البرشمنت - خلفية المخطوط (تبقى كما هي - الكريمي الدافئ)
  parchment50:  '#FBF7EA',
  parchment100: '#F5EFE0',
  parchment200: '#EBE3D0',
  parchment300: '#D9D0BA',
  parchment400: '#BFB497',

  // الذهب العتيق - زخارف وإضاءة (يبقى كما هو)
  gold50:  '#FBF6E7',
  gold100: '#F5EAC4',
  gold300: '#D4B570',
  gold500: '#B8923B',
  gold600: '#9C7A2D',
  gold700: '#6F571F',
  gold900: '#3A2D11',

  // 🆕 الفيروزي - لون ثانوي للأيقونات والأرقام
  teal50:   '#E0F2F2',
  teal100:  '#B2DFDF',
  teal300:  '#5BB5B5',
  teal500:  '#3F8B8B',
  teal600:  '#2D6868',
  teal700:  '#1F4848',

  // الزمرد الملكي - الهوية الأساسية للتطبيق
  emerald50:  '#E7F3EF',
  emerald100: '#C2E4DC',
  emerald300: '#5B9F8E',
  emerald500: '#0F4A41',
  emerald600: '#0A3D38',
  emerald700: '#0A3D38',
  emerald800: '#062825',
  emerald900: '#031816',

  // (alias قديم للكحلي - مش مستخدم حالياً، الهوية رجعت زمرد)
  navy50:   '#E7F3EF',
  navy100:  '#C2E4DC',
  navy200:  '#9AC9BD',
  navy300:  '#5B9F8E',
  navy500:  '#0F4A41',
  navy600:  '#0A3D38',
  navy700:  '#0A3D38',
  navy800:  '#062825',
  navy900:  '#031816',

  // الحبر - نص المخطوط
  ink900: '#1A1815',
  ink800: '#2E2A22',
  ink700: '#3F3A30',
  ink600: '#5A5246',
  ink500: '#8B8270',
  ink400: '#AFA68F',
  ink300: '#C9C0A8',
  ink200: '#DDD3B9',

  // الليل العميق - بدرجات الزمرد الداكن (Royal Manuscript Night)
  midnight900: '#070F0D',
  midnight800: '#0A1815',
  midnight700: '#143229',
  midnight600: '#1B4039',
  midnight500: '#1F4A40',

  // حالات بنفس الإلهام
  success: '#3F8F6E',
  successLight: 'rgba(63, 143, 110, 0.14)',
  warning: '#C77B2F',
  warningLight: 'rgba(199, 123, 47, 0.14)',
  error: '#B84A3E',
  errorLight: 'rgba(184, 74, 62, 0.14)',
  info: '#3F6F8F',
  infoLight: 'rgba(63, 111, 143, 0.14)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  onPrimary: string;

  accent: string;             // الذهب
  accentSoft: string;
  accentDeep: string;
  onAccent: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceAlt: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnDark: string;

  border: string;
  borderStrong: string;
  borderGold: string;         // حدود ذهبية للزخارف
  divider: string;

  shadowColor: string;
  overlay: string;
  ornamentLow: string;        // لون الزخارف الباهتة على الخلفية
  ornamentHigh: string;

  success: string; successSurface: string;
  warning: string; warningSurface: string;
  error: string;   errorSurface: string;
  info: string;    infoSurface: string;

  // ألوان الأقسام (مستوحاة من ألوان طبيعية في المخطوطات)
  featureEmerald: string;
  featureGold: string;
  featureCarmine: string;     // قرمزي مخطوط
  featureLapis: string;       // لازوردي
  featureSaffron: string;     // زعفراني
  featureMoss: string;        // طحلبي
  featureSepia: string;
  featureTerracotta: string;
};

export const lightColors: ThemeColors = {
  primary: palette.emerald700,
  primaryDark: palette.emerald800,
  primaryLight: palette.emerald500,
  primarySoft: palette.emerald50,
  onPrimary: palette.parchment50,

  accent: palette.gold500,
  accentSoft: palette.gold50,
  accentDeep: palette.gold700,
  onAccent: palette.ink900,

  background: palette.parchment100,
  surface: palette.parchment50,
  surfaceElevated: '#FFFFFF',
  surfaceAlt: palette.parchment200,

  textPrimary: palette.ink900,
  textSecondary: palette.ink600,
  textTertiary: palette.ink500,
  textInverse: palette.parchment50,
  textOnDark: palette.parchment100,

  // ✨ حدود بلمسة زمردية خفيفة - لربط الهوية بصرياً
  border: palette.parchment300,
  borderStrong: 'rgba(10, 61, 56, 0.20)',           // زمردي خافت بدل البيج الميت
  borderGold: 'rgba(184, 146, 59, 0.32)',
  divider: 'rgba(10, 61, 56, 0.10)',                // فاصل زمردي خفيف جداً

  // 🌿 الظلال بتدرّج زمردي - تعطي عمقاً يطابق هوية التطبيق بدل الأسود الميت
  shadowColor: palette.emerald800,                  // ظل زمردي عميق
  overlay: 'rgba(10, 61, 56, 0.55)',                // overlay زمردي
  ornamentLow:  'rgba(10, 61, 56, 0.06)',           // ✨ زخارف ناعمة زمردية في الخلفيات
  ornamentHigh: 'rgba(10, 61, 56, 0.14)',

  success: palette.success,
  successSurface: palette.successLight,
  warning: palette.warning,
  warningSurface: palette.warningLight,
  error: palette.error,
  errorSurface: palette.errorLight,
  info: palette.info,
  infoSurface: palette.infoLight,

  featureEmerald:    '#0A3D38', // زمرد ملكي - القرآن
  featureGold:       '#B8923B', // ذهب داكن - الأذكار
  featureCarmine:    '#0F4A41', // زمرد عميق - التجويد
  featureLapis:      '#1A5C4F', // زمرد متوسط - الحفظ
  featureSaffron:    '#B8923B', // ذهب - المواقيت
  featureMoss:       '#0A3D38', // زمرد - القبلة
  featureSepia:      '#9C7A2D', // ذهب عتيق - الأدعية
  featureTerracotta: '#D4B570', // ذهب فاتح - الإحصاءات
};

export const darkColors: ThemeColors = {
  primary: palette.gold300,
  primaryDark: palette.gold500,
  primaryLight: palette.gold100,
  primarySoft: 'rgba(212, 181, 112, 0.10)',
  onPrimary: palette.emerald900,

  accent: palette.gold300,
  accentSoft: 'rgba(212, 181, 112, 0.10)',
  accentDeep: palette.gold500,
  onAccent: palette.emerald900,

  // 🌿 الخلفيات: زمردي عميق (هوية التطبيق) بدل الأسود الحالك
  background:      palette.emerald900,    // #031816 - أعمق زمردي للخلفية الرئيسية
  surface:         palette.midnight800,   // #0A1815 - layer أعلى قليلاً
  surfaceElevated: palette.midnight700,   // #143229 - cards مرتفعة
  surfaceAlt:      palette.emerald800,    // #062825 - alternate surfaces

  textPrimary: palette.parchment100,
  textSecondary: palette.ink300,
  textTertiary: palette.ink400,
  textInverse: palette.emerald900,
  textOnDark: palette.parchment100,

  border: 'rgba(212, 181, 112, 0.14)',
  borderStrong: 'rgba(212, 181, 112, 0.28)',
  borderGold: 'rgba(212, 181, 112, 0.42)',
  divider: 'rgba(212, 181, 112, 0.10)',

  shadowColor: '#000000',
  overlay: 'rgba(3, 24, 22, 0.75)',          // overlay بتدرج زمردي بدل أسود
  ornamentLow: 'rgba(212, 181, 112, 0.06)',
  ornamentHigh: 'rgba(212, 181, 112, 0.16)',

  success: '#7BC2A0',
  successSurface: 'rgba(123, 194, 160, 0.12)',
  warning: '#E0A057',
  warningSurface: 'rgba(224, 160, 87, 0.12)',
  error: '#D97560',
  errorSurface: 'rgba(217, 117, 96, 0.12)',
  info: '#7AB0D9',
  infoSurface: 'rgba(122, 176, 217, 0.12)',

  featureEmerald:    '#5B9F8E', // زمرد فاتح للوضع الداكن
  featureGold:       '#D4B570', // ذهب
  featureCarmine:    '#3F8B80', // زمرد متوسط
  featureLapis:      '#6BB5A8', // زمرد فاتح
  featureSaffron:    '#D4B570', // ذهب
  featureMoss:       '#5B9F8E', // زمرد
  featureSepia:      '#C9A84C', // ذهب أمبر
  featureTerracotta: '#E8C97A', // ذهب فاتح
};

export { palette };
