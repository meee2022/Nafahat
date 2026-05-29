import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme, TypographyVariant } from '@theme/index';

interface Props extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
}

export const Text: React.FC<Props> = ({
  variant = 'body',
  color,
  weight,
  align = 'right',
  style,
  ...rest
}) => {
  const t = useTheme();
  const v = t.typography[variant];

  // 🩹 إصلاح قصّ النص العربي: لو الـ style مرّر fontSize مخصّص بدون lineHeight،
  //    كان يبقى lineHeight بتاع الـ variant (صغير) فتُقَصّ الحروف الطويلة والتشكيل.
  //    نحسب lineHeight كافياً نسبةً للحجم النهائي. الخطوط العربية (خصوصاً Amiri Quran)
  //    طويلة فنستخدم معامل ١.٤٥.
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  // 🩹 إصلاح تفكّك الحروف العربية: letterSpacing يفصل الحروف المتّصلة في العربية
  //    (تظهر «التقويم» كـ «ا ل ت ق و ي م»). نصفّره تلقائياً لو المحتوى عربي.
  const childText = typeof rest.children === 'string' ? rest.children
    : Array.isArray(rest.children) ? rest.children.filter((c) => typeof c === 'string').join('')
    : '';
  const isArabic = /[؀-ۿ]/.test(childText);

  const baseFontSize = (v.fontSize ?? 14) * t.fontScale;
  const hasCustomFont = flat.fontSize != null;
  const finalFontSize = hasCustomFont ? (flat.fontSize as number) : baseFontSize;
  const finalLineHeight =
    flat.lineHeight != null
      ? flat.lineHeight
      : hasCustomFont
        ? Math.round(finalFontSize * 1.45)
        : (v.lineHeight ?? 20) * t.fontScale;

  return (
    <RNText
      allowFontScaling
      {...rest}
      style={[
        {
          ...v,
          color: color ?? t.colors.textPrimary,
          textAlign: align,
          writingDirection: 'rtl' as const,
        },
        weight ? { fontWeight: weight } : null,
        style,
        // يُطبَّق أخيراً لضمان تناسق الحجم/الارتفاع وتفادي القصّ:
        { fontSize: finalFontSize, lineHeight: finalLineHeight },
        // تصفير letterSpacing للعربية لمنع تفكّك الحروف:
        isArabic ? { letterSpacing: 0 } : null,
      ]}
    />
  );
};
