import React, { useState } from 'react';
import { View, ViewProps, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@theme/index';

interface Props extends ViewProps {
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number;
  radius?: number;
  /** خط حدّ رفيع جداً - مناسب للبطاقات الراقية. */
  bordered?: boolean;
  /** حدّ ذهبي رقيق - للبطاقات المميزة. */
  goldBordered?: boolean;
  /** يُفعّل تأثير hover/scale على الـ web/iOS. */
  interactive?: boolean;
  onPress?: () => void;
  background?: string;
  /** ظل ملوّن (يستخدم accent تلقائياً أو لون مخصّص). */
  glow?: string | boolean;
  /** Accessibility - يقرأ بقارئ الشاشة. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * بطاقة معاد تصميمها لرؤية "Editorial Sanctuary":
 * - زوايا أنعم (lg افتراضياً)
 * - حدّ رفيع جداً (hairline) بدل من حد عريض
 * - ظل ناعم متعدد الطبقات
 * - تفاعل scale/opacity أنيق عند الضغط
 * - دعم glow للبطاقات المميّزة
 */
export const Card: React.FC<Props> = ({
  elevation = 'sm',
  padding,
  radius,
  bordered,
  goldBordered,
  interactive,
  onPress,
  background,
  glow,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  const borderColor = goldBordered ? t.colors.borderGold : t.colors.border;
  const borderWidth = goldBordered ? 1 : (bordered ? StyleSheet.hairlineWidth : 0);

  const shadowBase = elevation !== 'none' ? t.shadows[elevation] : null;
  const glowStyle = glow
    ? {
        shadowColor: typeof glow === 'string' ? glow : t.colors.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
        elevation: 10,
      }
    : null;

  const cardStyle = [
    {
      backgroundColor: background ?? t.colors.surface,
      borderRadius: radius ?? t.radius.lg,
      padding: padding ?? t.spacing.lg,
      borderWidth,
      borderColor,
    },
    shadowBase && !glowStyle ? { ...shadowBase, shadowColor: t.colors.shadowColor } : null,
    glowStyle,
    style,
  ];

  const isPressable = !!onPress || interactive;

  if (isPressable) {
    return (
      <Pressable
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        android_ripple={{ color: t.colors.primarySoft, borderless: false }}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={({ pressed }) => [
          cardStyle,
          hovered && Platform.OS === 'web' ? {
            transform: [{ translateY: -2 }],
            shadowOpacity: (glowStyle?.shadowOpacity ?? shadowBase?.shadowOpacity ?? 0) * 1.6,
          } : null,
          pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
};
