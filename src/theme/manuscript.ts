/**
 * نظام تصميم "Illuminated Manuscript" - مستوحى من المخطوطات الإسلامية النادرة.
 * خضرة غابة عميقة + ذهب عتيق + عاج دافئ. لكل بطاقة حضور وحرفية.
 *
 * هذه التوكنز تُستخدم مباشرة (بدون useTheme hook) لتسريع التطوير ولضمان
 * الالتزام بالـ palette الموحّد عبر التطبيق.
 */

import { TextStyle } from 'react-native';

// ============== الألوان ==============

export const mColors = {
  bg: {
    base:     '#0A1612',  // أعمق خلفية
    surface:  '#0F1E18',  // سطح البطاقات
    elevated: '#162B21',  // البطاقات المرتفعة
    overlay:  '#1C3628',  // حالة pressed/active
  },
  gold: {
    primary: '#C9A84C',   // ذهبي أساسي
    light:   '#E8C96A',   // إضاءات
    dim:     '#8A6B28',   // حدود وخطوط
    glow:    '#C9A84C22', // وهج خفيف
  },
  green: {
    primary: '#2D6A4F',
    light:   '#52B788',   // active/success
    dim:     '#1B4332',
  },
  text: {
    primary:   '#F0EAD6', // عاج دافئ
    secondary: '#A89B7A', // ذهبي-بنّي خافت
    muted:     '#5A5240', // تلميحات
    inverse:   '#0A1612', // نص فوق ذهب
  },
  ruby: '#7B1D1D',        // الوقف/التوقّف
  flame: {
    primary: '#F97316',
    deep:    '#9A3412',
    bg1:     '#2A1205',
    bg2:     '#1A0C03',
  },
} as const;

// ============== المسافات والزوايا ==============

export const mSpacing = {
  screenPadding: 20,
  cardRadius:    20,
  pillRadius:    100,
  gap:           12,
  // مقاييس مساعدة
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

// ============== الخطوط ==============
// تُحمَّل عبر @expo-google-fonts في app/_layout.tsx — موحَّدة عبر iOS/Android/Web.

export const mFonts = {
  // النص القرآني - Amiri Quran (مصمَّم خصيصاً لرسم المصحف)
  quran:        'AmiriQuran_400Regular',
  // عناوين عربية UI - IBM Plex Sans Arabic Bold
  naskhBold:    'IBMPlexSansArabic_700Bold',
  // نص عربي UI - IBM Plex Sans Arabic Regular
  naskhRegular: 'IBMPlexSansArabic_400Regular',
  // SemiBold لعناوين بحجم متوسط
  naskhSemi:    'IBMPlexSansArabic_600SemiBold',
  // أرقام/إضافات بـ Amiri Quran (نفس عائلة القرآن)
  amiri:        'AmiriQuran_400Regular',
} as const;

// أنماط نصّية جاهزة
export const mText: Record<string, TextStyle> = {
  // عناوين كبيرة
  hero:         { fontFamily: mFonts.naskhBold, fontSize: 34, lineHeight: 42, color: mColors.gold.light, fontWeight: '700' },
  h1:           { fontFamily: mFonts.naskhBold, fontSize: 28, lineHeight: 36, color: mColors.text.primary, fontWeight: '700' },
  h2:           { fontFamily: mFonts.naskhBold, fontSize: 22, lineHeight: 30, color: mColors.text.primary, fontWeight: '700' },
  h3:           { fontFamily: mFonts.naskhBold, fontSize: 18, lineHeight: 26, color: mColors.text.primary, fontWeight: '700' },

  // نصوص body
  body:         { fontFamily: mFonts.naskhRegular, fontSize: 15, lineHeight: 24, color: mColors.text.primary },
  bodySm:       { fontFamily: mFonts.naskhRegular, fontSize: 13, lineHeight: 20, color: mColors.text.secondary },
  caption:      { fontFamily: mFonts.naskhRegular, fontSize: 12, lineHeight: 18, color: mColors.text.secondary },
  hint:         { fontFamily: mFonts.naskhRegular, fontSize: 11, lineHeight: 16, color: mColors.text.muted },

  // أرقام (آيات، صفحات، تواريخ هجرية)
  amiriLg:      { fontFamily: mFonts.amiri, fontSize: 22, color: mColors.gold.light, letterSpacing: 0.5 },
  amiriMd:      { fontFamily: mFonts.amiri, fontSize: 16, color: mColors.text.primary },

  // نص قرآني
  quranLg:      { fontFamily: mFonts.quran, fontSize: 26, lineHeight: 56, color: mColors.text.primary, fontWeight: '500' },
  quranMd:      { fontFamily: mFonts.quran, fontSize: 22, lineHeight: 48, color: mColors.text.primary, fontWeight: '500' },
  quranSm:      { fontFamily: mFonts.quran, fontSize: 18, lineHeight: 38, color: mColors.text.primary, fontWeight: '500' },

  // eyebrow / labels صغيرة بـ tracking
  eyebrow:      { fontFamily: mFonts.naskhBold, fontSize: 11, letterSpacing: 3, color: mColors.gold.primary, fontWeight: '700' },
  label:        { fontFamily: mFonts.naskhBold, fontSize: 13, color: mColors.text.primary, fontWeight: '700' },

  // أزرار
  button:       { fontFamily: mFonts.naskhBold, fontSize: 15, color: mColors.text.inverse, fontWeight: '700' },
  buttonGold:   { fontFamily: mFonts.naskhBold, fontSize: 15, color: mColors.text.inverse, fontWeight: '700' },
};

// ============== الظلال ==============

export const mShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
  goldGlow: {
    shadowColor: mColors.gold.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  flameGlow: {
    shadowColor: mColors.flame.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

// ============== Helpers ==============

/** يرجع أسلوب نصّي مع إمكانية الـ override. */
export function txt(variant: keyof typeof mText, override?: TextStyle): TextStyle {
  return { ...mText[variant], ...(override ?? {}) };
}
