/**
 * نظام الخطوط - مُحدّث لرؤية "Editorial Sanctuary".
 *
 * يستخدم الخطوط التالية (مُحمَّلة عبر @expo-google-fonts في app/_layout.tsx):
 *  - IBM Plex Sans Arabic : واجهة المستخدم (يدعم العربي + اللاتيني)
 *  - Amiri Quran          : النص القرآني بالرسم العثماني
 *  - Inter                : احتياط لاتيني نقي
 *
 * مع custom fonts في React Native، اسم العائلة يحمل الوزن. لا نعتمد على fontWeight
 * — نختار العائلة الصحيحة لكل متغيّر.
 */

import { TextStyle } from 'react-native';

export const fontFamilies = {
  sansRegular:  'IBMPlexSansArabic_400Regular',
  sansMedium:   'IBMPlexSansArabic_500Medium',
  sansSemiBold: 'IBMPlexSansArabic_600SemiBold',
  sansBold:     'IBMPlexSansArabic_700Bold',

  latinRegular:  'Inter_400Regular',
  latinMedium:   'Inter_500Medium',
  latinSemiBold: 'Inter_600SemiBold',
  latinBold:     'Inter_700Bold',

  arabicQuran:   'AmiriQuran_400Regular',
  arabicDisplay: 'IBMPlexSansArabic_700Bold',
} as const;

type TextVariant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight'>;

export const typography: Record<string, TextVariant> = {
  hero:     { fontFamily: fontFamilies.sansBold,     fontSize: 42, lineHeight: 50, fontWeight: '800', letterSpacing: -1.2 },
  display:  { fontFamily: fontFamilies.sansBold,     fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8 },
  h1:       { fontFamily: fontFamilies.sansBold,     fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  h2:       { fontFamily: fontFamilies.sansBold,     fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  h3:       { fontFamily: fontFamilies.sansBold,     fontSize: 18, lineHeight: 26, fontWeight: '700', letterSpacing: -0.1 },
  subtitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body:     { fontFamily: fontFamilies.sansRegular,  fontSize: 15, lineHeight: 24, fontWeight: '400' },
  bodySm:   { fontFamily: fontFamilies.sansRegular,  fontSize: 13, lineHeight: 20, fontWeight: '400' },
  caption:  { fontFamily: fontFamilies.sansMedium,   fontSize: 12, lineHeight: 18, fontWeight: '500' },
  label:    { fontFamily: fontFamilies.sansSemiBold, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  button:   { fontFamily: fontFamilies.sansBold,     fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: 0.2 },
  eyebrow:  { fontFamily: fontFamilies.sansBold,     fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 3 },
  chip:     { fontFamily: fontFamilies.sansBold,     fontSize: 12, lineHeight: 16, fontWeight: '700' },

  // نص قرآني - مقاييس مُريحة للقراءة الطويلة
  quranLg:  { fontFamily: fontFamilies.arabicQuran, fontSize: 30, lineHeight: 60, fontWeight: '500' },
  quranMd:  { fontFamily: fontFamilies.arabicQuran, fontSize: 24, lineHeight: 50, fontWeight: '500' },
  quranSm:  { fontFamily: fontFamilies.arabicQuran, fontSize: 20, lineHeight: 42, fontWeight: '500' },
  arabicDisplay: { fontFamily: fontFamilies.arabicDisplay, fontSize: 36, lineHeight: 46, fontWeight: '700' },
};

export type TypographyVariant = keyof typeof typography;
