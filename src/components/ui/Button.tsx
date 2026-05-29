import React, { useState } from 'react';
import { Pressable, View, ActivityIndicator, ViewStyle, StyleSheet, Platform } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@theme/index';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  /** عند true يستخدم الـ accent بدل الـ primary للون. */
  accent?: boolean;
  /** Accessibility label - يقرأها قارئ الشاشة. الافتراضي: label نفسه. */
  accessibilityLabel?: string;
  /** تلميح يفسّر ما سيحدث عند الضغط. */
  accessibilityHint?: string;
}

/**
 * زر معاد تصميمه:
 * - ارتفاعات أكبر (المس مريح)
 * - زاوية lg ناعمة
 * - ظل ناعم خفيف للأزرار الأساسية
 * - تأثير hover على Web (translateY + ظل أعمق)
 * - استجابة scale أنيقة عند الضغط
 */
export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
  accent,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  const sizes = {
    sm: { h: 40, px: 16, fontSize: 13 },
    md: { h: 52, px: 22, fontSize: 15 },
    lg: { h: 60, px: 28, fontSize: 16 },
  }[size];

  const primaryColor = accent ? t.colors.accent : t.colors.primary;
  const onPrimary = accent ? t.colors.onAccent : t.colors.onPrimary;

  const variants: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary:   { bg: primaryColor,         fg: onPrimary },
    secondary: { bg: t.colors.accent,      fg: t.colors.onAccent },
    soft:      { bg: t.colors.primarySoft, fg: t.colors.primary },
    outline:   { bg: 'transparent',        fg: primaryColor, border: primaryColor },
    ghost:     { bg: 'transparent',        fg: primaryColor },
  };

  const v = variants[variant];
  const hasShadow = variant === 'primary' || variant === 'secondary';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        {
          height: sizes.h,
          paddingHorizontal: sizes.px,
          borderRadius: t.radius.lg,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.4 : 1,
          transform: [
            { scale: pressed ? 0.97 : (hovered && Platform.OS === 'web' ? 1.01 : 1) },
            { translateY: hovered && Platform.OS === 'web' && !pressed ? -1 : 0 },
          ],
        },
        hasShadow && !disabled
          ? {
              shadowColor: variant === 'secondary' ? t.colors.accent : t.colors.primary,
              shadowOffset: { width: 0, height: hovered ? 8 : 4 },
              shadowOpacity: hovered ? 0.32 : 0.20,
              shadowRadius: hovered ? 16 : 10,
              elevation: 4,
            }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {iconLeft ? <View>{iconLeft}</View> : null}
          {/* flexShrink + adjustsFontSizeToFit يمنعان قصّ النص العربي الطويل
              عند حافة الأزرار الضيّقة (مثل زرّين متجاورين). */}
          <Text
            variant="button"
            color={v.fg}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{ fontSize: sizes.fontSize, flexShrink: 1, textAlign: 'center' }}
          >
            {label}
          </Text>
          {iconRight ? <View>{iconRight}</View> : null}
        </>
      )}
    </Pressable>
  );
};
